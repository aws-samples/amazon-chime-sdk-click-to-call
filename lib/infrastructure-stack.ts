import { Construct } from 'constructs';
import { Duration, NestedStackProps, NestedStack } from 'aws-cdk-lib';
import {
  RestApi,
  LambdaIntegration,
  EndpointType,
  MethodLoggingLevel,
  CognitoUserPoolsAuthorizer,
  AuthorizationType,
} from 'aws-cdk-lib/aws-apigateway';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';

interface InfrastructureProps extends NestedStackProps {
  readonly fromPhoneNumber: string;
  readonly smaId: string;
  readonly meetingsTable: dynamodb.Table;
  readonly userPool: cognito.IUserPool;
}

export class Infrastructure extends NestedStack {
  public readonly apiUrl: string;
  public readonly clickToCallApiKeyValue: string;

  constructor(scope: Construct, id: string, props: InfrastructureProps) {
    super(scope, id, props);

    const infrastructureRole = new iam.Role(this, 'infrastructureRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        ['chimePolicy']: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: ['*'],
              actions: ['chime:*'],
            }),
          ],
        }),
      },
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
    });

    const callControlLambda = new NodejsFunction(this, 'callControlLambda', {
      entry: 'src/callControl/callControl.js',
      depsLockFilePath: 'src/callControl/package-lock.json',
      bundling: {
        externalModules: ['aws-sdk'],
        nodeModules: ['uuid'],
      },
      runtime: Runtime.NODEJS_14_X,
      architecture: Architecture.ARM_64,
      role: infrastructureRole,
      timeout: Duration.seconds(60),
      environment: {
        SMA_ID: props.smaId,
        FROM_NUMBER: props.fromPhoneNumber,
        MEETINGS_TABLE_NAME: props.meetingsTable.tableName,
      },
    });

    props.meetingsTable.grantReadWriteData(callControlLambda);

    const updateCallLambda = new NodejsFunction(this, 'updateCallLambda', {
      entry: 'src/updateCall/updateCall.js',
      depsLockFilePath: 'src/updateCall/package-lock.json',
      bundling: {
        externalModules: ['aws-sdk'],
        nodeModules: ['uuid'],
      },
      runtime: Runtime.NODEJS_14_X,
      architecture: Architecture.ARM_64,
      role: infrastructureRole,
      timeout: Duration.seconds(60),
      environment: {
        SMA_ID: props.smaId,
        FROM_NUMBER: props.fromPhoneNumber,
        MEETINGS_TABLE_NAME: props.meetingsTable.tableName,
      },
    });

    props.meetingsTable.grantReadWriteData(updateCallLambda);

    const api = new RestApi(this, 'clickToCallApi', {
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: ['OPTIONS', 'POST'],
        allowCredentials: true,
        allowOrigins: ['*'],
      },
      deployOptions: {
        loggingLevel: MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
    });

    const auth = new CognitoUserPoolsAuthorizer(this, 'auth', {
      cognitoUserPools: [props.userPool],
    });

    const dial = api.root.addResource('dial');
    const update = api.root.addResource('update');

    const callControlIntegration = new LambdaIntegration(callControlLambda);
    const updateCallIntegration = new LambdaIntegration(updateCallLambda);

    dial.addMethod('POST', callControlIntegration, {
      authorizer: auth,
      authorizationType: AuthorizationType.COGNITO,
    });
    update.addMethod('POST', updateCallIntegration, {
      authorizer: auth,
      authorizationType: AuthorizationType.COGNITO,
    });

    this.apiUrl = api.url;
  }
}
