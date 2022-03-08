import {
  NestedStack,
  NestedStackProps,
  RemovalPolicy,
  Duration,
  Names,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';

export interface CognitoStackProps extends NestedStackProps {
  readonly allowedDomain: string;
}

export class Cognito extends NestedStack {
  public readonly authenticatedRole: iam.IRole;
  public readonly identityPool: cognito.CfnIdentityPool;
  public readonly userPool: cognito.IUserPool;
  public readonly userPoolClient: cognito.IUserPoolClient;
  public readonly userPoolDomain: cognito.CfnUserPoolDomain;
  public readonly userPoolRegion: string;

  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const domainValidator = new NodejsFunction(this, 'domainValidator', {
      entry: 'src/cognitoDomain/domainValidator.js',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      runtime: Runtime.NODEJS_14_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(60),
      environment: {
        ALLOWED_DOMAIN: props.allowedDomain,
      },
    });

    //create a User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      removalPolicy: RemovalPolicy.DESTROY,
      selfSignUpEnabled: true,
      lambdaTriggers: {
        preSignUp: domainValidator,
      },
      signInAliases: {
        username: false,
        phone: false,
        email: true,
      },
      standardAttributes: {
        email: {
          required: true, //Cognito bug with federation - If you make a user pool with required email field then the second google login attempt fails (https://github.com/aws-amplify/amplify-js/issues/3526)
          mutable: true,
        },
      },
      userInvitation: {
        emailSubject: 'Your Click-To-Call web app temporary password',
        emailBody:
          'Your Click-To-Call web app username is {username} and temporary password is {####}',
      },
      userVerification: {
        emailSubject: 'Verify your new Click-To-Call web app account',
        emailBody:
          'The verification code to your new Click-To-Call web app account is {####}',
      },
    });

    //SAML Federation
    const urlDefs = ['https://localhost:8080', 'https://localhost:3000'];

    //create a User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: userPool,
      generateSecret: false,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
      authFlows: {
        userSrp: true,
        custom: true,
      },
      refreshTokenValidity: Duration.hours(1),
    });

    const userPoolDomain = new cognito.CfnUserPoolDomain(
      this,
      'cognitoUserPoolDomain',
      {
        domain: 'click-to-call-' + Names.uniqueId(this).toLowerCase().slice(-8),
        userPoolId: userPool.userPoolId,
      },
    );

    //create an Identity Pool
    const identityPool = new cognito.CfnIdentityPool(
      this,
      'cognitoIdentityPool',
      {
        identityPoolName: `cognitoIdentityPool`,
        allowUnauthenticatedIdentities: false,
        cognitoIdentityProviders: [
          {
            clientId: userPoolClient.userPoolClientId,
            providerName: userPool.userPoolProviderName,
          },
        ],
      },
    );

    //Cognito Identity Pool Roles
    const unauthenticatedRole = new iam.Role(
      this,
      'CognitoDefaultUnauthenticatedRole',
      {
        assumedBy: new iam.FederatedPrincipal(
          'cognito-identity.amazonaws.com',
          {
            StringEquals: {
              'cognito-identity.amazonaws.com:aud': identityPool.ref,
            },
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'unauthenticated',
            },
          },
          'sts:AssumeRoleWithWebIdentity',
        ),
      },
    );

    unauthenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['mobileanalytics:PutEvents', 'cognito-sync:*'],
        resources: ['*'],
      }),
    );

    const authenticatedRole = new iam.Role(
      this,
      'CognitoDefaultAuthenticatedRole',
      {
        assumedBy: new iam.FederatedPrincipal(
          'cognito-identity.amazonaws.com',
          {
            StringEquals: {
              'cognito-identity.amazonaws.com:aud': identityPool.ref,
            },
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'authenticated',
            },
          },
          'sts:AssumeRoleWithWebIdentity',
        ),
      },
    );

    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'mobileanalytics:PutEvents',
          'cognito-sync:*',
          'cognito-identity:*',
        ],
        resources: ['*'],
      }),
    );

    new cognito.CfnIdentityPoolRoleAttachment(this, 'DefaultValid', {
      identityPoolId: identityPool.ref,
      roles: {
        unauthenticated: unauthenticatedRole.roleArn,
        authenticated: authenticatedRole.roleArn,
      },
    });

    this.authenticatedRole = authenticatedRole;

    /**************************************************************************************************************
     * Stack Outputs *
     **************************************************************************************************************/

    this.identityPool = identityPool;
    this.userPool = userPool;
    this.userPoolClient = userPoolClient;
    this.userPoolDomain = userPoolDomain;
    this.userPoolRegion = this.region;
  }
}
