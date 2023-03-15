import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AmazonChimeSDKClickToCall } from '../src/amazon-chime-sdk-click-to-call';

test('Snapshot', () => {
  const app = new App();
  const stack = new AmazonChimeSDKClickToCall(app, 'test', {});

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

test('SnapshotWithAsterisk', () => {
  const app = new App({
    context: { AsteriskDeploy: 'y', AllowedDomain: 'example.com' },
  });
  const stack = new AmazonChimeSDKClickToCall(app, 'test', {});

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

test('SnapshotWithAsteriskAndCognito', () => {
  const app = new App({
    context: { AsteriskDeploy: 'y', AllowedDomain: 'example.com' },
  });
  const stack = new AmazonChimeSDKClickToCall(app, 'test', {
    userPool:
      'arn:aws:cognito-idp:us-east-1:104621577074:userpool/us-east-1_z8UDEjm17',
    userPoolClient: 'string',
    userPoolRegion: 'string',
  });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
