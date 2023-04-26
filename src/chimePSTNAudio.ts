import { Duration, Stack } from 'aws-cdk-lib';
import {
  ServicePrincipal,
  Role,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
} from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  ChimeSipMediaApp,
  ChimePhoneNumber,
  PhoneProductType,
  PhoneNumberType,
} from 'cdk-amazon-chime-resources';
import { Construct } from 'constructs';

export class Chime extends Construct {
  public readonly fromNumber: string;
  public readonly smaId: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const phoneNumber = new ChimePhoneNumber(this, 'phoneNumber', {
      phoneState: 'IL',
      phoneNumberType: PhoneNumberType.LOCAL,
      phoneProductType: PhoneProductType.SMA,
    });

    const smaHandlerRole = new Role(this, 'smaHandlerRole', {
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

    const smaHandlerLambda = new NodejsFunction(this, 'smaHandlerLambda', {
      bundling: {
        nodeModules: ['@aws-sdk/client-chime-sdk-meetings'],
      },
      entry: 'src/resources/smaHandler/smaHandler.ts',
      handler: 'lambdaHandler',
      runtime: Runtime.NODEJS_18_X,
      role: smaHandlerRole,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(60),
      environment: {
        FROM_NUMBER: phoneNumber.phoneNumber,
      },
    });

    const sipMediaApp = new ChimeSipMediaApp(this, 'sipMediaApp', {
      region: Stack.of(this).region,
      endpoint: smaHandlerLambda.functionArn,
    });

    this.fromNumber = phoneNumber.phoneNumber;
    this.smaId = sipMediaApp.sipMediaAppId;
  }
}
