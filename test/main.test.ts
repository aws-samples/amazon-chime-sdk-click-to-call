import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AmazonChimeSDKClickToCall } from '../src/amazon-chime-sdk-click-to-call';

test('Snapshot', () => {
  const app = new App();
  const stack = new AmazonChimeSDKClickToCall(app, 'test');

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

test('SnapshotWithAsterisk', () => {
  const app = new App({
    context: { AsteriskDeploy: 'y', AllowedDomain: 'example.com' },
  });
  const stack = new AmazonChimeSDKClickToCall(app, 'test');

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
