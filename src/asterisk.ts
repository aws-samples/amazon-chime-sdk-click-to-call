import { Duration, Stack } from 'aws-cdk-lib';
import {
  SecurityGroup,
  Peer,
  Port,
  SubnetType,
  CfnEIP,
  InitConfig,
  InitFile,
  InitCommand,
  CfnEIPAssociation,
  CloudFormationInit,
  Instance,
  InstanceType,
  InstanceSize,
  InstanceClass,
  Vpc,
  AmazonLinuxCpuType,
  AmazonLinuxImage,
  AmazonLinuxGeneration,
} from 'aws-cdk-lib/aws-ec2';
import { ServicePrincipal, Role, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import {
  ChimeVoiceConnector,
  ChimePhoneNumber,
  PhoneCountry,
  PhoneProductType,
  PhoneNumberType,
  Protocol,
} from 'cdk-amazon-chime-resources';
import { Construct } from 'constructs';

export class Asterisk extends Construct {
  public readonly voiceConnectorArn: string;
  public readonly voiceConnectorPhone: string;
  public readonly instanceId: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const vpc = new Vpc(this, 'VPC', {
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'AsteriskPublic',
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });

    const securityGroup = new SecurityGroup(this, 'AsteriskSecurityGroup', {
      vpc,
      description: 'Security Group for Asterisk Instance',
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(
      Peer.ipv4('3.80.16.0/23'),
      Port.udp(5060),
      'Allow Chime Voice Connector Signaling Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('3.80.16.0/23'),
      Port.tcpRange(5060, 5061),
      'Allow Chime Voice Connector Signaling Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('99.77.253.0/24'),
      Port.udp(5060),
      'Allow Chime Voice Connector Signaling Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('99.77.253.0/24'),
      Port.tcpRange(5060, 5061),
      'Allow Chime Voice Connector Signaling Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('99.77.253.0/24'),
      Port.udpRange(5000, 65000),
      'Allow Chime Voice Connector Signaling Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('3.80.16.0/23'),
      Port.udpRange(5000, 65000),
      'Allow Chime Voice Connector Media Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('99.77.253.0/24'),
      Port.udpRange(5000, 65000),
      'Allow Chime Voice Connector Media Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('52.55.62.128/25'),
      Port.udpRange(1024, 65535),
      'Allow Chime Voice Connector Media Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('52.55.63.0/25'),
      Port.udpRange(1024, 65535),
      'Allow Chime Voice Connector Media Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('34.212.95.128/25'),
      Port.udpRange(1024, 65535),
      'Allow Chime Voice Connector Media Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('34.223.21.0/25'),
      Port.udpRange(1024, 65535),
      'Allow Chime Voice Connector Media Access',
    );

    const asteriskEc2Role = new Role(this, 'asteriskEc2Role', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    const asteriskEip = new CfnEIP(this, 'asteriskEip');

    const phoneNumber = new ChimePhoneNumber(
      this,
      'voiceConnectorPhoneNumber',
      {
        phoneState: 'CA',
        phoneCountry: PhoneCountry.US,
        phoneProductType: PhoneProductType.VC,
        phoneNumberType: PhoneNumberType.LOCAL,
      },
    );

    const voiceConnector = new ChimeVoiceConnector(this, 'voiceConnector', {
      termination: {
        terminationCidrs: [`${asteriskEip.ref}/32`],
        callingRegions: ['US'],
      },
      origination: [
        {
          host: asteriskEip.ref,
          port: 5060,
          protocol: Protocol.UDP,
          priority: 1,
          weight: 1,
        },
      ],
      encryption: false,
    });

    phoneNumber.associateWithVoiceConnector(voiceConnector);

    const ami = new AmazonLinuxImage({
      generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: AmazonLinuxCpuType.ARM_64,
    });

    const ec2Instance = new Instance(this, 'Instance', {
      vpc,
      instanceType: InstanceType.of(InstanceClass.C6G, InstanceSize.MEDIUM),
      machineImage: ami,
      init: CloudFormationInit.fromConfigSets({
        configSets: {
          default: ['install', 'config'],
        },
        configs: {
          install: new InitConfig([
            InitFile.fromObject('/etc/config.json', {
              PhoneNumber: phoneNumber.phoneNumber,
              OutboundHostName: `${voiceConnector.voiceConnectorId}.voiceconnector.chime.aws`,
              IP: asteriskEip.ref,
              REGION: Stack.of(this).region,
            }),
            InitFile.fromFileInline(
              '/etc/install.sh',
              './src/resources/asteriskConfig/install.sh',
            ),
            InitCommand.shellCommand('chmod +x /etc/install.sh'),
            InitCommand.shellCommand('cd /tmp'),
            InitCommand.shellCommand(
              '/etc/install.sh 2>&1 | tee /var/log/asterisk_install.log',
            ),
          ]),
          config: new InitConfig([
            InitFile.fromFileInline(
              '/etc/asterisk/pjsip.conf',
              './src/resources/asteriskConfig/pjsip.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/asterisk.conf',
              './src/resources/asteriskConfig/asterisk.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/logger.conf',
              './src/resources/asteriskConfig/logger.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/extensions.conf',
              './src/resources/asteriskConfig/extensions.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/modules.conf',
              './src/resources/asteriskConfig/modules.conf',
            ),
            InitFile.fromFileInline(
              '/etc/config_asterisk.sh',
              './src/resources/asteriskConfig/config_asterisk.sh',
            ),
            InitCommand.shellCommand('chmod +x /etc/config_asterisk.sh'),
            InitCommand.shellCommand('/etc/config_asterisk.sh'),
          ]),
        },
      }),
      initOptions: {
        timeout: Duration.minutes(15),
        includeUrl: true,
        includeRole: true,
        printLog: true,
      },
      securityGroup: securityGroup,
      role: asteriskEc2Role,
    });

    new CfnEIPAssociation(this, 'EIP Association', {
      eip: asteriskEip.ref,
      instanceId: ec2Instance.instanceId,
    });

    this.voiceConnectorArn = `arn:aws:chime:${Stack.of(this).region}:${
      Stack.of(this).account
    }:vc/${voiceConnector.voiceConnectorId}`;
    this.voiceConnectorPhone = phoneNumber.phoneNumber;
    this.instanceId = ec2Instance.instanceId;
  }
}
