import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Asterisk, Chime, Database, Infrastructure, Cognito, Site } from './';

export class AmazonChimeSDKClickToCall extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const asteriskDeploy = this.node.tryGetContext('AsteriskDeploy');
    if (asteriskDeploy == 'y') {
      const asterisk = new Asterisk(this, 'Asterisk');
      new CfnOutput(this, 'instanceId', { value: asterisk.instanceId });
      new CfnOutput(this, 'ssmCommand', {
        value: `aws ssm start-session --target ${asterisk.instanceId}`,
      });
      new CfnOutput(this, 'voiceConnectorPhone', {
        value: asterisk.voiceConnectorPhone,
      });
    }

    const database = new Database(this, 'Database');

    const allowedDomain = this.node.tryGetContext('AllowedDomain');
    const cognito = new Cognito(this, 'Cognito', {
      allowedDomain: allowedDomain,
    });

    const chime = new Chime(this, 'Chime', {
      meetingsTable: database.meetingsTable,
    });

    const infrastructure = new Infrastructure(this, 'Infrastructure', {
      fromPhoneNumber: chime.fromNumber,
      smaId: chime.smaId,
      meetingsTable: database.meetingsTable,
      userPool: cognito.userPool,
    });

    const site = new Site(this, 'Site', {
      apiUrl: infrastructure.apiUrl,
      userPool: cognito.userPool,
      userPoolClient: cognito.userPoolClient,
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
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new AmazonChimeSDKClickToCall(app, 'AmazonChimeSDKClickToCall', {
  env: devEnv,
});

app.synth();
