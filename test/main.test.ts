import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AmazonChimeSDKClickToCall } from '../src/amazon-chime-sdk-click-to-call';

test('Snapshot', () => {
  const app = new App();
  const stack = new AmazonChimeSDKClickToCall(app, 'test', { ...stackProps });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

const stackProps = {
  buildAsterisk: '',
  allowedDomain: '',
  logLevel: '',
  userPool: '',
  userPoolClient: '',
  userPoolRegion: '',
  identityPool: '',
};

test('SnapshotWithAsterisk', () => {
  const app = new App();
  const stack = new AmazonChimeSDKClickToCall(app, 'test', {
    ...stackProps,
    buildAsterisk: 'true',
  });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

test('SnapshotWithAsteriskAndCognito', () => {
  const app = new App();
  const stack = new AmazonChimeSDKClickToCall(app, 'test', {
    ...stackProps,
    buildAsterisk: 'true',
    userPool:
      'arn:aws:cognito-idp:us-east-1:104621577074:userpool/us-east-1_z8UDEjm17',
    userPoolClient: 'string',
    userPoolRegion: 'string',
  });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
