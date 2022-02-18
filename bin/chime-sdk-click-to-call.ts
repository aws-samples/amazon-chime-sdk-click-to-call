#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ClickToCall } from '../lib/chime-sdk-click-to-call';

const app = new cdk.App();
new ClickToCall(app, 'ClickToCall', {});
