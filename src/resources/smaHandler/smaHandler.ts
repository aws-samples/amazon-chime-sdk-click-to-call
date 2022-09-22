/*eslint import/no-unresolved: 0 */
import {
  ChimeSDKMeetingsClient,
  DeleteMeetingCommand,
} from '@aws-sdk/client-chime-sdk-meetings';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import {
  ActionTypes,
  HangupAction,
  InvocationEventType,
  JoinChimeMeetingAction,
  SchemaVersion,
  SipMediaApplicationEvent,
  SipMediaApplicationResponse,
  SendDigitsAction,
} from './sip-media-application';

const chimeSDKMeetingClient = new ChimeSDKMeetingsClient({
  region: 'us-east-1',
});

export const ddbClient = new DynamoDBClient({ region: 'us-east-1' });

const marshallOptions = {
  convertEmptyValues: false,
  removeUndefinedValues: false,
  convertClassInstanceToMap: false,
};
const unmarshallOptions = {
  wrapNumbers: false,
};

const translateConfig = { marshallOptions, unmarshallOptions };

const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);

var callInfoTable = process.env.MEETINGS_TABLE_NAME;

export const lambdaHandler = async (
  event: SipMediaApplicationEvent,
): Promise<SipMediaApplicationResponse> => {
  console.log('Lambda is invoked with calldetails:' + JSON.stringify(event));
  let actions;

  switch (event.InvocationEventType) {
    case InvocationEventType.NEW_OUTBOUND_CALL:
      console.log('OUTBOUND CALL');
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
        event.CallDetails.Participants[0].CallId;
      sendDigitsAction.Parameters.Digits =
        event.ActionData?.Parameters.Arguments.digit!;
      actions = [sendDigitsAction];
      break;
    case InvocationEventType.HANGUP:
      console.log('HANGUP ACTION');
      var currentCall = await getCaller(event.CallDetails.TransactionId);
      if (currentCall) {
        await chimeSDKMeetingClient.send(
          new DeleteMeetingCommand({ MeetingId: currentCall.meetingId }),
        );
      }
      if (event.CallDetails.Participants[1]) {
        hangupAction.Parameters.CallId =
          event.CallDetails.Participants[1].CallId;
        actions = [hangupAction];
      }
      break;
    case InvocationEventType.CALL_ANSWERED:
      console.log('CALL ANSWERED');
      var currentCall = await getCaller(event.CallDetails.TransactionId);
      if (currentCall) {
        joinChimeMeeting.Parameters.CallId =
          event.CallDetails.Participants[0].CallId;
        joinChimeMeeting.Parameters.MeetingId = currentCall.meetingId;
        joinChimeMeeting.Parameters.JoinToken =
          currentCall.AttendeeInfo[1].JoinToken;
        actions = [joinChimeMeeting];
        break;
      } else {
        break;
      }
    default:
      console.log('FAILED ACTION');
      actions = [];
  }

  const response = {
    SchemaVersion: SchemaVersion.VERSION_1_0,
    Actions: actions,
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

var joinChimeMeeting: JoinChimeMeetingAction = {
  Type: ActionTypes.JOIN_CHIME_MEETING,
  Parameters: {
    JoinToken: '',
    CallId: '',
    MeetingId: '',
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
async function getCaller(transactionId: string) {
  try {
    const results = await ddbDocClient.send(
      new GetCommand({
        TableName: callInfoTable,
        Key: { transactionId: transactionId },
      }),
    );
    console.log(results.Item);
    return results.Item;
  } catch (err) {
    console.log(err);
    console.log('No phone found');
    return false;
  }
}
