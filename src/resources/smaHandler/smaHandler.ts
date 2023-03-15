/*eslint import/no-unresolved: 0 */
import {
  ChimeSDKMeetingsClient,
  DeleteMeetingCommand,
} from '@aws-sdk/client-chime-sdk-meetings';

import {
  ActionTypes,
  HangupAction,
  InvocationEventType,
  SchemaVersion,
  SipMediaApplicationEvent,
  SipMediaApplicationResponse,
  SendDigitsAction,
  CallAndBridgeAction,
  BridgeEndpointType,
} from './sip-media-application';

const chimeSDKMeetingClient = new ChimeSDKMeetingsClient({
  region: 'us-east-1',
});

var fromNumber = process.env.FROM_NUMBER;

export const lambdaHandler = async (
  event: SipMediaApplicationEvent,
): Promise<SipMediaApplicationResponse> => {
  console.log('Lambda is invoked with calldetails:' + JSON.stringify(event));
  let actions;
  let transactionAttributes;

  if (event.CallDetails.TransactionAttributes) {
    transactionAttributes = event.CallDetails.TransactionAttributes;
  } else {
    transactionAttributes = {
      RequestedVCArn: '',
      RequestedDialNumber: '',
      RequestorEmail: '',
      DialVC: '',
      MeetingId: '',
    };
  }

  switch (event.InvocationEventType) {
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
    case InvocationEventType.RINGING:
      console.log('RINGING');
      actions = [];
      break;
    case InvocationEventType.ACTION_SUCCESSFUL:
      console.log('ACTION SUCCESSFUL');
      actions = [];
      break;
    case InvocationEventType.CALL_UPDATE_REQUESTED:
      console.log('CALL_UPDATE_REQUESTED');
      sendDigitsAction.Parameters.CallId =
        event.CallDetails.Participants[1].CallId;
      sendDigitsAction.Parameters.Digits =
        event.ActionData?.Parameters.Arguments.digit!;
      actions = [sendDigitsAction];
      break;
    case InvocationEventType.HANGUP:
      console.log('HANGUP ACTION');
      await chimeSDKMeetingClient.send(
        new DeleteMeetingCommand({
          MeetingId: transactionAttributes.MeetingId,
        }),
      );

      if (event.CallDetails.Participants[1]) {
        hangupAction.Parameters.CallId =
          event.CallDetails.Participants[1].CallId;
        actions = [hangupAction];
      }
      break;
    case InvocationEventType.CALL_ANSWERED:
      console.log('CALL ANSWERED');
      console.log(
        `Transaction Attributes: ${JSON.stringify(transactionAttributes)}`,
      );
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
        callAndBridgeVC.Parameters.SipHeaders!['X-RequestorEmail'] =
          transactionAttributes.RequestorEmail;
        callAndBridgePSTN.Parameters.Endpoints[0].Uri =
          transactionAttributes.RequestedDialNumber;
        actions = [callAndBridgePSTN];
      }
      break;
    default:
      console.log('FAILED ACTION');
      actions = [];
  }

  const response: SipMediaApplicationResponse = {
    SchemaVersion: SchemaVersion.VERSION_1_0,
    Actions: actions,
    TransactionAttributes: transactionAttributes,
  };

  console.log('Sending response:' + JSON.stringify(response));
  return response;
};

var hangupAction: HangupAction = {
  Type: ActionTypes.HANGUP,
  Parameters: {
    SipResponseCode: '0',
    CallId: '',
  },
};

var sendDigitsAction: SendDigitsAction = {
  Type: ActionTypes.SEND_DIGITS,
  Parameters: {
    CallId: '',
    Digits: '',
    ToneDurationInMilliseconds: 100,
  },
};

var callAndBridgeVC: CallAndBridgeAction = {
  Type: ActionTypes.CALL_AND_BRIDGE,
  Parameters: {
    CallTimeoutSeconds: 30,
    CallerIdNumber: fromNumber!,
    Endpoints: [
      {
        BridgeEndpointType: BridgeEndpointType.AWS,
        Uri: '',
        Arn: '',
      },
    ],
    SipHeaders: {
      'X-RequestorEmail': '',
    },
  },
};
var callAndBridgePSTN: CallAndBridgeAction = {
  Type: ActionTypes.CALL_AND_BRIDGE,
  Parameters: {
    CallTimeoutSeconds: 30,
    CallerIdNumber: fromNumber!,
    Endpoints: [
      {
        BridgeEndpointType: BridgeEndpointType.PSTN,
        Uri: '',
      },
    ],
    SipHeaders: {
      'X-RequestorEmail': '',
    },
  },
};
