import { Duration } from 'aws-cdk-lib';
import {
  RestApi,
  LambdaIntegration,
  EndpointType,
  MethodLoggingLevel,
  CognitoUserPoolsAuthorizer,
  AuthorizationType,
} from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
// import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

interface InfrastructureProps {
  readonly fromPhoneNumber: string;
  readonly smaId: string;
  // readonly meetingsTable: dynamodb.Table;
  readonly userPool: cognito.IUserPool;
  readonly voiceConnectorPhone?: string;
  readonly voiceConnectorArn?: string;
}

export class Infrastructure extends Construct {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: InfrastructureProps) {
    super(scope, id);

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
      entry: 'src/resources/callControl/callControl.js',
      bundling: {
        nodeModules: [
          '@aws-sdk/client-chime-sdk-voice',
          '@aws-sdk/client-chime-sdk-meetings',
        ],
      },
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      role: infrastructureRole,
      timeout: Duration.seconds(60),
      environment: {
        SMA_ID: props.smaId,
        FROM_NUMBER: props.fromPhoneNumber,
        VOICE_CONNECTOR_PHONE: props.voiceConnectorPhone || '',
        VOICE_CONNECTOR_ARN: props.voiceConnectorArn || '',
      },
    });

    const updateCallLambda = new NodejsFunction(this, 'updateCallLambda', {
      entry: 'src/resources/updateCall/updateCall.js',
      depsLockFilePath: 'src/resources/updateCall/yarn.lock',
      bundling: {
        nodeModules: [
          '@aws-sdk/client-chime-sdk-voice',
          '@aws-sdk/client-chime-sdk-meetings',
        ],
      },
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      role: infrastructureRole,
      timeout: Duration.seconds(60),
      environment: {
        SMA_ID: props.smaId,
        FROM_NUMBER: props.fromPhoneNumber,
        VOICE_CONNECTOR_PHONE: props.voiceConnectorPhone || '',
        VOICE_CONNECTOR_ARN: props.voiceConnectorArn || '',
      },
    });

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
