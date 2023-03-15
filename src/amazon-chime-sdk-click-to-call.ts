import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import {
  IUserPool,
  IUserPoolClient,
  UserPool,
  UserPoolClient,
} from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { Asterisk, Chime, Infrastructure, Cognito, Site } from './';

interface AmazonChimeSDKClickToCallProps extends StackProps {
  userPool?: string;
  userPoolClient?: string;
  userPoolRegion?: string;
}

interface CognitoOutput {
  userPool: IUserPool;
  userPoolClient: IUserPoolClient;
  userPoolRegion: string;
}

export class AmazonChimeSDKClickToCall extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: AmazonChimeSDKClickToCallProps,
  ) {
    super(scope, id, props);

    const allowedDomain = this.node.tryGetContext('AllowedDomain');
    let cognito: CognitoOutput;

    const chime = new Chime(this, 'Chime');
    if (props.userPoolRegion && props.userPool && props.userPoolClient) {
      cognito = {
        userPoolRegion: props.userPoolRegion,
        userPool: UserPool.fromUserPoolArn(this, 'userPoolId', props.userPool),
        userPoolClient: UserPoolClient.fromUserPoolClientId(
          this,
          'userPoolClientId',
          props.userPoolClient,
        ),
      };
    } else {
      cognito = new Cognito(this, 'Cognito', {
        allowedDomain: allowedDomain,
      });
    }

    let infrastructure;
    const asteriskDeploy = this.node.tryGetContext('AsteriskDeploy');
    if (asteriskDeploy == 'y') {
      const asterisk = new Asterisk(this, 'Asterisk');
      infrastructure = new Infrastructure(this, 'Infrastructure', {
        fromPhoneNumber: chime.fromNumber,
        smaId: chime.smaId,
        userPool: cognito.userPool,
        voiceConnectorPhone: asterisk.voiceConnectorPhone,
        voiceConnectorArn: asterisk.voiceConnectorArn,
      });
      new CfnOutput(this, 'instanceId', { value: asterisk.instanceId });
      new CfnOutput(this, 'ssmCommand', {
        value: `aws ssm start-session --target ${asterisk.instanceId}`,
      });
      new CfnOutput(this, 'voiceConnectorPhone', {
        value: asterisk.voiceConnectorPhone,
      });
    } else {
      infrastructure = new Infrastructure(this, 'Infrastructure', {
        fromPhoneNumber: chime.fromNumber,
        smaId: chime.smaId,
        userPool: cognito.userPool,
      });
    }

    const site = new Site(this, 'Site', {
      apiUrl: infrastructure.apiUrl,
      userPool: cognito.userPool,
      userPoolClient: cognito.userPoolClient,
      userPoolRegion: cognito.userPoolRegion,
    });

    new CfnOutput(this, 'API_URL', { value: infrastructure.apiUrl });
    new CfnOutput(this, 'USER_POOL_REGION', { value: cognito.userPoolRegion });
    new CfnOutput(this, 'USER_POOL_ID', { value: cognito.userPool.userPoolId });
    new CfnOutput(this, 'USER_POOL_CLIENT', {
      value: cognito.userPoolClient.userPoolClientId,
    });
    new CfnOutput(this, 'siteBucket', { value: site.siteBucket.bucketName });
    new CfnOutput(this, 'site', {
      value: site.distribution.distributionDomainName,
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

const stackProps = {
  userPool: process.env.USER_POOL || '',
  userPoolClient: process.env.USER_POOL_CLIENT || '',
  userPoolRegion: process.env.USER_POOL_REGION || '',
};

const app = new App();

new AmazonChimeSDKClickToCall(app, 'AmazonChimeSDKClickToCall', {
  ...stackProps,
  env: devEnv,
});

app.synth();
