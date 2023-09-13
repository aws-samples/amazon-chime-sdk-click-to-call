/* eslint-disable import/no-unresolved */
import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import {
  IUserPool,
  IUserPoolClient,
  UserPool,
  UserPoolClient,
} from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { config } from 'dotenv';
import { Asterisk, Chime, Infrastructure, Cognito, Site } from './';

config();

interface AmazonChimeSDKClickToCallProps extends StackProps {
  userPool?: string;
  userPoolClient?: string;
  userPoolRegion?: string;
  identityPool: string;
  buildAsterisk: string;
  logLevel: string;
  allowedDomain: string;
  meetingControl: string;
  pstnControl: string;
  meetingBypassNumber: string;
  cidrForSoftphone: string;
}

interface CognitoOutput {
  userPool: IUserPool;
  userPoolClient: IUserPoolClient;
  userPoolRegion: string;
  identityPool: string;
}

export class AmazonChimeSDKClickToCall extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: AmazonChimeSDKClickToCallProps,
  ) {
    super(scope, id, props);

    let cognito: CognitoOutput;

    const chime = new Chime(this, 'Chime');
    if (props.userPoolRegion && props.userPool && props.userPoolClient) {
      cognito = {
        userPoolRegion: props.userPoolRegion,
        userPool: UserPool.fromUserPoolArn(this, 'userPoolId', props.userPool),
        identityPool: props.identityPool,
        userPoolClient: UserPoolClient.fromUserPoolClientId(
          this,
          'userPoolClientId',
          props.userPoolClient,
        ),
      };
    } else {
      cognito = new Cognito(this, 'Cognito', {
        allowedDomain: props.allowedDomain,
      });
    }

    let infrastructure;

    if (props.buildAsterisk == 'true') {
      const asterisk = new Asterisk(this, 'Asterisk', {
        cidrForSoftphone: props.cidrForSoftphone,
      });
      infrastructure = new Infrastructure(this, 'Infrastructure', {
        fromPhoneNumber: chime.fromNumber,
        smaId: chime.smaId,
        userPool: cognito.userPool,
        meetingControl: props.meetingControl,
        pstnControl: props.pstnControl,
        meetingBypassNumber: props.meetingBypassNumber,
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
        meetingControl: props.meetingControl,
        pstnControl: props.pstnControl,
        meetingBypassNumber: props.meetingBypassNumber,
      });
    }

    const site = new Site(this, 'Site', {
      apiUrl: infrastructure.apiUrl,
      userPool: cognito.userPool,
      userPoolClient: cognito.userPoolClient,
      userPoolRegion: cognito.userPoolRegion,
      identityPool: cognito.identityPool,
    });

    // new CfnOutput(this, 'API_URL', { value: infrastructure.apiUrl });
    // new CfnOutput(this, 'USER_POOL_REGION', { value: cognito.userPoolRegion });
    // new CfnOutput(this, 'USER_POOL_ID', { value: cognito.userPool.userPoolId });
    // new CfnOutput(this, 'USER_POOL_CLIENT', {
    //   value: cognito.userPoolClient.userPoolClientId,
    // });
    new CfnOutput(this, 'fromNumber', { value: chime.fromNumber });
    new CfnOutput(this, 'siteBucket', { value: site.siteBucket.bucketName });
    new CfnOutput(this, 'site', {
      value: site.distribution.distributionDomainName,
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const stackProps = {
  userPool: process.env.USER_POOL || '',
  userPoolClient: process.env.USER_POOL_CLIENT || '',
  userPoolRegion: process.env.USER_POOL_REGION || '',
  identityPool: process.env.IDENTITY_POOL || '',
  allowedDomain: process.env.ALLOWED_DOMAIN || '',
  logLevel: process.env.LOG_LEVEL || 'INFO',
  buildAsterisk: process.env.BUILD_ASTERISK || 'false',
  meetingControl: process.env.MEETING_CONTROL || 'us-east-1',
  pstnControl: process.env.PSTN_CONTROL || 'us-east-1',
  meetingBypassNumber: process.env.MEETING_BYPASS_NUMBER || '+17035550122',
  cidrForSoftphone: process.env.CIDR_FOR_SOFTPHONE || '',
};

const app = new App();

new AmazonChimeSDKClickToCall(app, 'AmazonChimeSDKClickToCallJP3', {
  ...stackProps,
  env: devEnv,
});

app.synth();
