import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Asterisk } from './asterisk-stack';
import { Chime } from './chime-stack';
import { Infrastructure } from './infrastructure-stack';
import { Database } from './database-stack';

export class ClickToCall extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const asterisk = new Asterisk(this, 'Asterisk', {});

    const database = new Database(this, 'Database', {});

    const chime = new Chime(this, 'Chime', {
      meetingsTable: database.meetingsTable,
      voiceConnectorArn: asterisk.voiceConnectorArn,
      voiceConnectorPhone: asterisk.voiceConnectorPhone,
    });

    const infrastructure = new Infrastructure(this, 'Infrastructure', {
      fromPhoneNumber: chime.fromNumber,
      smaId: chime.smaId,
      meetingsTable: database.meetingsTable,
      voiceConnectorPhone: asterisk.voiceConnectorPhone,
    });

    new CfnOutput(this, 'apiUrl', { value: infrastructure.apiUrl });
    new CfnOutput(this, 'instanceId', { value: asterisk.instanceId });
    new CfnOutput(this, 'ssmCommand', {
      value: `aws ssm start-session --target ${asterisk.instanceId}`,
    });
    new CfnOutput(this, 'voiceConnectorPhone', {
      value: asterisk.voiceConnectorPhone,
    });
    new CfnOutput(this, 'clickToCallApiKey', {
      value: infrastructure.clickToCallApiKeyValue,
    });
  }
}
