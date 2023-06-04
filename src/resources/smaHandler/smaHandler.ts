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
  Actions,
} from './sip-media-application';

const chimeSDKMeetingClient = new ChimeSDKMeetingsClient({
  region: 'us-east-1',
});

var fromNumber = process.env.FROM_NUMBER;

export const lambdaHandler = async (
  event: SipMediaApplicationEvent,
): Promise<SipMediaApplicationResponse> => {
  console.log('Lambda is invoked with call details:' + JSON.stringify(event));
  let actions: Actions[];
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
      CallIdLegA: '',
      CallIdLegB: '',
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
      const legAParticipant = event.CallDetails.Participants.find(
        (participant) => participant.ParticipantTag === 'LEG-A',
      );
      const legBParticipant = event.CallDetails.Participants.find(
        (participant) => participant.ParticipantTag === 'LEG-B',
      );

      transactionAttributes.CallIdLegA = legAParticipant
        ? legAParticipant.CallId
        : '';
      transactionAttributes.CallIdLegB = legBParticipant
        ? legBParticipant.CallId
        : '';
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

      if (event.ActionData?.Parameters.ParticipantTag === 'LEG-A') {
        console.log('Hangup from Leg A - Hangup Leg B');
        hangupAction.Parameters.CallId = transactionAttributes.CallIdLegB;
        actions = [hangupAction];
      } else {
        actions = [];
      }
      await chimeSDKMeetingClient.send(
        new DeleteMeetingCommand({
          MeetingId: transactionAttributes.MeetingId,
        }),
      );

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
  },
};
