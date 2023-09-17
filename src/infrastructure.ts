import { Duration, Stack } from 'aws-cdk-lib';
import {
  RestApi,
  LambdaIntegration,
  EndpointType,
  MethodLoggingLevel,
  CognitoUserPoolsAuthorizer,
  AuthorizationType,
} from 'aws-cdk-lib/aws-apigateway';
import { IUserPool } from 'aws-cdk-lib/aws-cognito';
import {
  ManagedPolicy,
  Role,
  PolicyStatement,
  PolicyDocument,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

interface InfrastructureProps {
  readonly fromPhoneNumber: string;
  readonly smaId: string;
  readonly userPool: IUserPool;
  readonly voiceConnectorPhone?: string;
  readonly voiceConnectorArn?: string;
}

export class Infrastructure extends Construct {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: InfrastructureProps) {
    super(scope, id);

    const infrastructureRole = new Role(this, 'infrastructureRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        ['chimePolicy']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: ['*'],
              actions: ['chime:*'],
            }),
          ],
        }),
      },
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
    });
    const callControlLambda = new NodejsFunction(this, 'callControlLambda', {
      entry: 'src/resources/callControl/callControl.js',
      bundling: {
        nodeModules: [
          '@aws-sdk/client-chime-sdk-meetings',
          '@aws-sdk/client-chime-sdk-voice',
        ],
      },
      runtime: Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      role: infrastructureRole,
      timeout: Duration.seconds(60),
      environment: {
        SMA_ID: props.smaId,
        FROM_NUMBER: props.fromPhoneNumber,
        MEETING_CONTROL: 'us-east-1',
        PSTN_CONTROL: Stack.of(this).region,
        MEETING_BYPASS_NUMBER: '+17035550122',
        VOICE_CONNECTOR_PHONE: props.voiceConnectorPhone || '',
        VOICE_CONNECTOR_ARN: props.voiceConnectorArn || '',
      },
    });

    const updateCallLambda = new NodejsFunction(this, 'updateCallLambda', {
      entry: 'src/resources/updateCall/updateCall.js',
      bundling: {
        nodeModules: [
          '@aws-sdk/client-chime-sdk-meetings',
          '@aws-sdk/client-chime-sdk-voice',
        ],
      },
      runtime: Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      role: infrastructureRole,
      timeout: Duration.seconds(60),
      environment: {
        SMA_ID: props.smaId,
        FROM_NUMBER: props.fromPhoneNumber,
        MEETING_CONTROL: 'us-east-1',
        PSTN_CONTROL: Stack.of(this).region,
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
