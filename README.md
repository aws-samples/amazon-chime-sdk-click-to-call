# Amazon Chime Click-To-Call Starter Project

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=460755170&machine=basicLinux32gb&location=EastUs)

## Overview

![Overview](images/ClickToCallOverview.png)

This starter project combines three Amazon Chime SDK components to create a demo to connect a customer using Amazon Chime SDK Meetings with an agent using a standard SIP based PBX. Everything required to use this demo is included in the AWS Cloud Development Kit (AWS CDK) deployment.

## Updates

Several pieces of this have been updated to use a new technique of connecting the WebRTC client to the telephony client. These changes are primarily in the `callControl.js` and `smaHandler.ts` files.

## Prerequisites

Basic understanding of:

- Amazon Chime SDK Meetings
- Amazon Chime PSTN Audio
- Amazon Chime Voice Connector
- AWS Serverless
- VoIP Telephony

## Components

### Amazon Chime SDK Meetings

This demo uses a simple React based web client to create an Amazon Chime SDK meeting. This client can be found in the [site](site/) directory and will use an Amazon API Gateway with AWS Amplify to make AWS SDK API calls to create the meeting, create attendees, and create the SIP media application call.

### Amazon Chime PSTN Audio

Once the meeting has been created, the AWS Lambda will create an outbound call from the SIP media application to the requested phone number. This SIP media action will control the outbound call and can be enhanced with additional [actions](https://docs.aws.amazon.com/chime/latest/dg/specify-actions.html). For the purpose of this demo, it is simply connecting the Amazon Chime SDK Meeting to a phone number.

### Optional - Amazon Chime Voice Connector

Optionally, you can include a configured Amazon Chime Voice Connector and Asterisk PBX along with an associated phone number. If this phone number is dialed from the React client, a call will be made to the Asterisk PBX where it will be answered and audio echoed back. Alternatively, a phone can be registered to this PBX and used to answer the call.

## How It Works

### Request from Client

#### [App.js](site/src/App.js)

```javascript
const dialOutResponse = await API.post('callControlAPI', 'dial', {
  body: {
    toNumber: phoneNumber,
  },
});
```

When the Dial button is pressed, a request is made from the client towards the AWS API Gateway with the phone number to dial presented in the `toNumber` field. This request is made using AWS Amplify and configured using the output from the CDK deployment.

#### [App.js](site/src/App.js):

```javascript
import { AmplifyConfig } from './Config';
import { Amplify, API } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(AmplifyConfig);
API.configure(AmplifyConfig);
Amplify.Logger.LOG_LEVEL = 'DEBUG';
```

#### [Config.js](site/src/Config.js):

```javascript
    API: {
        endpoints: [
            {
                name: 'callControlAPI',
                endpoint: configData.APIURL,
                custom_header: async () => {
                    return { Authorization: `${(await Auth.currentSession()).getIdToken().getJwtToken()}` };
                },
            },
            {
                name: 'updateCallAPI',
                endpoint: configData.APIURL,
                custom_header: async () => {
                    return { Authorization: `${(await Auth.currentSession()).getIdToken().getJwtToken()}` };
                },
            },
        ],
    },
```

### Processing on CallControl Lambda

This request will be processed on the CallControl Lambda that is triggered by the API Gateway. After scrubbing the input phone number, the following actions will execute:

- An Amazon Chime SDK Meeting will be created
- Two Attendees will be created in the created meeting
- An outbound call is made to a special [SIP integration number](https://docs.aws.amazon.com/chime-sdk/latest/dg/mtgs-sdk-cvc.html)
- The meetingInfo and attendeeInfo is returned to the client
- Once this call is answered, the SIP media application is connected to the meeting
- A new [CallAndBridge](https://docs.aws.amazon.com/chime-sdk/latest/dg/call-and-bridge.html) action is started to join that meeting to the called number

#### [callControl.js](src/resources/callControl/callControl.js)

```javascript
    const meetingInfo = await createMeeting((0, import_crypto.randomUUID)());
    if (meetingInfo) {
      const clientAttendeeInfo = await createAttendee(
        meetingInfo.Meeting.MeetingId,
        'client-user',
      );
      if (clientAttendeeInfo) {
        const responseInfo = {
          Meeting: meetingInfo.Meeting,
          Attendee: clientAttendeeInfo.Attendee,
        };
        const phoneAttendeeInfo = await createAttendee(
          meetingInfo.Meeting.MeetingId,
          'phone-user',
        );
        const dialInfo = await executeDial(
          event,
          meetingInfo,
          phoneAttendeeInfo,
          toNumber,
        );
        console.info('joinInfo: ' + JSON.stringify({ responseInfo, dialInfo }));
        response.body = JSON.stringify({ responseInfo, dialInfo });
        response.statusCode = 200;
        return response;
      } else {
        response.body = JSON.stringify('Error creating attendee');
        response.statusCode = 503;
        return response;
      }
    } else {
      response.body = JSON.stringify('Error creating meeting');
      response.statusCode = 503;
      return response;
    }
  }
```

### Response from CallControl Lambda

Once the request has been processed by the CallControl Lambda, the meeting information will be returned to the client. This information will be used to join the client to the Amazon Chime SDK Meeting:

[App.js](/site/src/App.js)

```javascript
const dialOutResponse = await API.post('callControlAPI', 'dial', {
  body: {
    toNumber: phoneNumber,
  },
});
const meetingSessionConfiguration = new MeetingSessionConfiguration(
  dialOutResponse.responseInfo.Meeting,
  dialOutResponse.responseInfo.Attendee,
);
await meetingManager.join(meetingSessionConfiguration);
await meetingManager.start();
```

There is now audio being delivered to and from the client and the Amazon Chime SDK Media services.

### Completion of Outbound Call through Amazon Chime PSTN Audio

In parallel to the response being returned to the client, a call is made through Amazon Chime PSTN Audio. This will cause the SIP media application to invoke the Lambda associated with the SIP media application with a `NEW_OUTBOUND_CALL`:

[callControl.js](/src/resources/callControl/callControl.js)

```javascript
var params = {
  FromPhoneNumber: fromNumber,
  SipMediaApplicationId: smaId,
  ToPhoneNumber: '+17035550122',
  SipHeaders: {
    'X-chime-join-token': phoneAttendeeInfo.Attendee.JoinToken,
    'X-chime-meeting-id': meetingInfo.Meeting.MeetingId,
  },
  ArgumentsMap: {
    MeetingId: meetingInfo.Meeting.MeetingId,
    RequestedDialNumber: toNumber,
    RequestedVCArn: voiceConnectorArn,
    RequestorEmail: event.requestContext.authorizer.claims.email,
    DialVC: dialVC,
  },
};
console.info('Dial Params: ' + JSON.stringify(params));
try {
  const dialInfo = await chimeSdkVoiceClient.send(
    new import_client_chime_sdk_voice.CreateSipMediaApplicationCallCommand(
      params,
    ),
  );
  return dialInfo;
} catch (err) {
  console.info(`Error: ${err}`);
  return false;
}
```

This call will be sent out to the specific number that is used to integrate an Amazon Chime SDK meeting with Amazon Chime PSTN Audio - `+17035550122`. To join this call to the meeting, the `X-chime-join-token` and `X-chime-meeting-id` SIP headers must be included. However, these headers will not be passed to the SIP media application itself. In order to pass information from the `callControl.js` AWS Lambda function to the SIP media application, we will use the `ArgumentsMap` parameter in [`CreateSipMediaApplicationCallCommand`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-chime-sdk-voice/classes/createsipmediaapplicationcommand.html).

When the `NEW_OUTBOUND_CALL` invocations is received on the SMA, it will include the `Arguments` that were sent in the `CreateSipMediaApplicationCallCommand`.

```json
{
  "SchemaVersion": "1.0",
  "Sequence": 1,
  "InvocationEventType": "NEW_OUTBOUND_CALL",
  "ActionData": {
    "Type": "CallCreateRequest",
    "Parameters": {
      "Arguments": {
        "DialVC": "true",
        "RequestedVCArn": "arn:aws:chime:us-east-1:112233445566:vc/b3tedvkmr4jwayvmwxxq6z",
        "MeetingId": "fedc8fa0-364b-4fbf-b6b7-3be410492713",
        "RequestorEmail": "email@example.com",
        "RequestedDialNumber": "+16265551212"
      }
    }
  }
}
```

### Transaction Attributes

In order to use these arguments in future SIP media application actions, we must store them as [`TransactionAttributes`](https://docs.aws.amazon.com/chime-sdk/latest/dg/transaction-attributes.html). We will do that here:

```typescript
    case InvocationEventType.NEW_OUTBOUND_CALL:
      console.log('OUTBOUND CALL');
      transactionAttributes.RequestedVCArn =
        event.ActionData?.Parameters.Arguments.RequestedVCArn || '';

      transactionAttributes.RequestedDialNumber =
        event.ActionData?.Parameters.Arguments.RequestedDialNumber || '';

      transactionAttributes.RequestorEmail =
        event.ActionData?.Parameters.Arguments.RequestorEmail || '';

      transactionAttributes.DialVC =
        event.ActionData?.Parameters.Arguments.DialVC || '';

      transactionAttributes.MeetingId =
        event.ActionData?.Parameters.Arguments.MeetingId || '';

      actions = [];
      break;

  const response: SipMediaApplicationResponse = {
    SchemaVersion: SchemaVersion.VERSION_1_0,
    Actions: actions,
    TransactionAttributes: transactionAttributes,
  };

  return response;
```

Now, when the call is answered by the Amazon Chime SDK Meeting and the SIP media application is invoked with a `CALL_ANSWERED` Event Type, it will include the previously stored Transaction Attributes in the `CallDetails`:

```json
{
  "SchemaVersion": "1.0",
  "Sequence": 3,
  "InvocationEventType": "CALL_ANSWERED",
  "CallDetails": {
    "TransactionId": "8c9372d0-e766-4890-823a-32ca8403201a",
    "TransactionAttributes": {
      "RequestedVCArn": "arn:aws:chime:us-east-1:112233445566:vc/b3tedvkmr4jwayvmwxxq6z",
      "DialVC": "true",
      "MeetingId": "fedc8fa0-364b-4fbf-b6b7-3be410492713",
      "RequestorEmail": "email@example.com",
      "RequestedDialNumber": "+16265551212"
    }
  }
}
```

Additionally, we will store this information so that every future invocation includes this.

```typescript
if (event.CallDetails.TransactionAttributes) {
  transactionAttributes = event.CallDetails.TransactionAttributes;
}
```

### Call and Bridge

We will use this information when returning a `CallAndBridge` action to the SIP media application.

```typescript
    case InvocationEventType.CALL_ANSWERED:
      console.log('CALL ANSWERED');
      if (transactionAttributes.DialVC == 'true') {
        console.log('Bridging to VC');
        callAndBridgeVC.Parameters.Endpoints[0].Arn =
          transactionAttributes.RequestedVCArn;
        callAndBridgeVC.Parameters.Endpoints[0].Uri =
          transactionAttributes.RequestedDialNumber;
        callAndBridgeVC.Parameters.SipHeaders!['X-RequestorEmail'] =
          transactionAttributes.RequestorEmail;
        actions = [callAndBridgeVC];
      } else {
        console.log('Bridging to PSTN');
        callAndBridgePSTN.Parameters.Endpoints[0].Uri =
          transactionAttributes.RequestedDialNumber;
        actions = [callAndBridgePSTN];
      }
      break;
```

Here we will use `DialVC` to determine if the call should be placed to an Amazon Chime Voice Connector or to the PSTN. If the call is going to an Amazon Chime Voice Connector, we can add additional fields as SIP headers to the INVITE being sent to the Amazon Chime Voice Connector.

### Sending DTMF

Additionally, this demo allows you to send dual tone multi-frequency (DTMF) tones to the telephony side of the call. When a button is pressed in the client, a request is made to `updateCall.js` AWS Lambda function that will use [`UpdateSipMediaApplicationCallCommand`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-chime-sdk-voice/classes/updatesipmediaapplicationcallcommand.html) to pass this request to the SIP media application. This will invoke the SIP media application handler with an EventType of `CALL_UPDATE_REQUESTED`.

```json
{
  "SchemaVersion": "1.0",
  "Sequence": 7,
  "InvocationEventType": "CALL_UPDATE_REQUESTED",
  "ActionData": {
    "Type": "CallUpdateRequest",
    "Parameters": {
      "Arguments": {
        "digit": "3"
      }
    }
  }
}
```

We will then return an action to SIP media application to `SendDigits` towards the PSTN/SIP leg of the call.

```json
{
  "SchemaVersion": "1.0",
  "Actions": [
    {
      "Type": "SendDigits",
      "Parameters": {
        "CallId": "3c85496f-1ef3-4534-a906-cb4730cab5e7",
        "Digits": "3",
        "ToneDurationInMilliseconds": 100
      }
    }
  ]
}
```

### Optional - Connecting to a SIP PBX

As part of the deployment, an Asterisk PBX can be created along with an Amazon Chime Voice Connector. If the number dialed from the client is on an Amazon Chime Voice Connector, this call can be delivered with additional information included. In this demo, an Asterisk PBX is optionally deployed to EC2 and configured with an Amazon Chime Voice Connector and associated phone number.

<pre>
INVITE sip:+12245554385@XX.XX.XX.XX:5060;transport=UDP SIP/2.0
Record-Route: <sip:3.80.16.122;lr;ftag=rvt4v2gjcp5ag;did=1e41.0531;nat=yes>
Via: SIP/2.0/UDP 3.80.16.122:5060;branch=z9hG4bKfe89.113361e8ae54ec0a2e2aced87cc980ad.0
Via: SIP/2.0/UDP 10.0.160.204;received=10.0.160.204;rport=5060;branch=z9hG4bKpgBcNHF8F9Hrc
From: "" <sip:+12245554410@10.0.160.204:5060>;tag=rvt4v2gjcp5ag
To: <sip:+12245554385@XX.XX.XX.XX:5060>;transport=UDP
Call-ID: 0ca47221-1aa4-4e67-af5a-70ed3222a8fd
Contact: <sip:10.0.160.204:5060;alias=10.0.160.204~5060~1>
X-VoiceConnector-ID: dn0pcxvetmicgerjqmze5c
<mark>X-RequestorEmail: "email@example.com"</mark>
</pre>

## To Use

### Configure Deployment

Options for configuration are available in the .env file.

To deploy with the optional Asterisk server:

```bash
BUILD_ASTERISK='true'
```

This will configure the Asterisk test server for deployment.

To restrict allowed domains for Cognito signup:

```bash
ALLOWED_DOMAIN='example.com'
```

If a domain is entered, only email addresses with the chosen domain will be allowed to register an account with Cognito. If no domain is entered, any email address can be used. Domain should be entered as `example.com`.

> **_NOTE:_** Defaults will be no Asterisk deployment and no domain restriction.

### Deploy CDK

```bash
yarn launch
```

### Use Client

```bash
cd site
yarn
yarn run start
```

![Cognito](images/Cognito.png)

This will launch a local client that can be used to place outbound calls. This client uses Amazon Cognito for authentication and will present a Sign In and Create Account dialog box. When using this for the first time, you must create an account with a `Username` of an email address that is part of the domain allowed during the deployment. A confirmation email will be sent to that email address for verification. Once completed, you will be able to use that email address to log in to the client.

![Client](images/client.png)

#### Connect to Asterisk

```bash
aws ssm start-session --target INSTANCE_ID
```

## Components Created

- callControl Lambda
- updateCall Lambda
- smaHandler Lambda
- Amazon API Gateway
- Amazon Chime SIP media application
- Amazon Chime SIP media application rule
- Optional
  - EC2 Instance
    - Public Amazon Virtual Private Cloud (Amazon VPC)
    - Elastic IP
  - Amazon Chime Voice Connector
  - Amazon Chime Phone Number

## Clean Up

`yarn cdk destroy`

This will remove all created components. Charges can be incurred as part of this demo. To avoid excess charges, please destroy components when you are finished.
