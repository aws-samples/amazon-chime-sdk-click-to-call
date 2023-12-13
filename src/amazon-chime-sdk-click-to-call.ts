/* eslint-disable import/no-unresolved */
import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { config } from 'dotenv';
import {
  SMAResources,
  Infrastructure,
  Cognito,
  Site,
  VPCResources,
  ServerResources,
  VoiceConnectorResources,
  DistributionResources,
} from './';

config();

interface AmazonChimeSDKClickToCallProps extends StackProps {
  buildAsterisk: string;
  logLevel: string;
  allowedDomain: string;
  sshPubKey: string;
}

export class AmazonChimeSDKClickToCall extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: AmazonChimeSDKClickToCallProps,
  ) {
    super(scope, id, props);

    const smaResources = new SMAResources(this, 'SMAResources');
    const cognitoResources = new Cognito(this, 'Cognito', {
      allowedDomain: props.allowedDomain,
    });

    let voiceConnectorResources;

    if (props.buildAsterisk == 'true') {
      const vpcResources = new VPCResources(this, 'VPC');

      const distributionResources = new DistributionResources(
        this,
        'DistributionResources',
        {
          applicationLoadBalancer: vpcResources.applicationLoadBalancer,
        },
      );

      voiceConnectorResources = new VoiceConnectorResources(
        this,
        'VoiceConnector',
        {
          asteriskEip: vpcResources.serverEip,
        },
      );

      const serverResources = new ServerResources(this, 'Asterisk', {
        serverEip: vpcResources.serverEip,
        voiceConnector: voiceConnectorResources.voiceConnector,
        phoneNumber: voiceConnectorResources.phoneNumber,
        vpc: vpcResources.vpc,
        voiceSecurityGroup: vpcResources.voiceSecurityGroup,
        albSecurityGroup: vpcResources.albSecurityGroup,
        sshSecurityGroup: vpcResources.sshSecurityGroup,
        logLevel: props.logLevel,
        sshPubKey: props.sshPubKey,
        applicationLoadBalancer: vpcResources.applicationLoadBalancer,
        distribution: distributionResources.distribution,
        userPool: cognitoResources.userPool,
        userPoolClient: cognitoResources.userPoolClient,
        userPoolRegion: cognitoResources.userPoolRegion,
        identityPool: cognitoResources.identityPool,
      });
      new CfnOutput(this, 'instanceId', { value: serverResources.instanceId });
      new CfnOutput(this, 'ssmCommand', {
        value: `aws ssm start-session --target ${serverResources.instanceId}`,
      });
      new CfnOutput(this, 'sshCommand', {
        value: `ssh ubuntu@${vpcResources.serverEip.ref}`,
      });
      new CfnOutput(this, 'voiceConnectorPhone', {
        value: voiceConnectorResources.phoneNumber.phoneNumber,
      });
      new CfnOutput(this, 'asteriskSite', {
        value: distributionResources.distribution.distributionDomainName,
      });
    }

    const infrastructure = new Infrastructure(this, 'Infrastructure', {
      fromPhoneNumber: smaResources.fromNumber,
      smaId: smaResources.smaId,
      userPool: cognitoResources.userPool,
      ...(voiceConnectorResources?.phoneNumber && {
        voiceConnectorPhone: voiceConnectorResources.phoneNumber,
      }),
      ...(voiceConnectorResources?.voiceConnector && {
        voiceConnector: voiceConnectorResources.voiceConnector,
      }),
    });

    const site = new Site(this, 'Site', {
      apiUrl: infrastructure.apiUrl,
      userPool: cognitoResources.userPool,
      userPoolClient: cognitoResources.userPoolClient,
      userPoolRegion: cognitoResources.userPoolRegion,
      identityPool: cognitoResources.identityPool,
    });

    new CfnOutput(this, 'smaNumber', { value: smaResources.fromNumber });
    new CfnOutput(this, 'siteBucket', { value: site.siteBucket.bucketName });
    new CfnOutput(this, 'clickToCallSite', {
      value: site.distribution.distributionDomainName,
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

const stackProps = {
  sshPubKey: process.env.SSH_PUB_KEY || '',
  allowedDomain: process.env.ALLOWED_DOMAIN || '',
  logLevel: process.env.LOG_LEVEL || 'INFO',
  buildAsterisk: process.env.BUILD_ASTERISK || 'false',
};

const app = new App();

new AmazonChimeSDKClickToCall(app, 'AmazonChimeSDKClickToCall', {
  ...stackProps,
  env: devEnv,
});

app.synth();
