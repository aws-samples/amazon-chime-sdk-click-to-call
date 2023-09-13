var import_crypto = require('crypto');
var import_client_chime_sdk_meetings = require('@aws-sdk/client-chime-sdk-meetings');
var import_client_chime_sdk_voice = require('@aws-sdk/client-chime-sdk-voice');

var fromNumber = process.env['FROM_NUMBER'];
var meetingControlRegion = process.env['MEETING_CONTROL'];
var pstnControlRegion = process.env['PSTN_CONTROL'];
var voiceConnectorPhone = process.env['VOICE_CONNECTOR_PHONE'];
var voiceConnectorArn = process.env['VOICE_CONNECTOR_ARN'];
var smaId = process.env['SMA_ID'];
var numberToCall = process.env['NUMBER_TO_CALL'];
var meetingBypassNumber = process.env['MEETING_BYPASS_NUMBER'];
var mediaRegion = process.env.AWS_REGION;

var voiceConfig = {
  region: pstnControlRegion,
};
var meetingConfig = {
  region: meetingControlRegion,
};
var chimeSdkVoiceClient = new import_client_chime_sdk_voice.ChimeSDKVoiceClient(
  voiceConfig,
);
var chimeSdkMeetingsClient =
  new import_client_chime_sdk_meetings.ChimeSDKMeetingsClient(meetingConfig);

var response = {
  statusCode: 200,
  body: '',
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  },
};
var EXCLUDE_DIAL_TO =
  /^\+((1900)|(1976)|(1268)|(1284)|(1473)|(1649)|(1664)|(1767)|(1809)|(1829)|(1849)|(1876))(\d{7})$/;
var INCLUDE_DIAL_TO = /^\+1[2-9]\d{2}[2-9]\d{6}$/;
exports.handler = async (event, context) => {
  console.info(`Event: ${JSON.stringify(event)}`);
  console.info(`Context: ${JSON.stringify(context)}`);
  const body = JSON.parse(event.body);
  console.info('Body: ' + JSON.stringify(body));
  let toNumber = '';
  if (body.toNumber) {
    toNumber = body.toNumber;
  } else {
    if (process.env.hasOwnProperty('NUMBER_TO_CALL')) {
      toNumber = numberToCall;
    } else {
      response.statusCode = 503;
      response.body = 'Missing Number';
      return response;
    }
  }
  toNumber = toNumber.replace(/\s+/g, '');
  toNumber = toNumber.replace('(', '');
  toNumber = toNumber.replace(')', '');
  toNumber = toNumber.replace('-', '');
  if (toNumber.charAt(0) != '+') {
    if (toNumber.length == 10) {
      toNumber = '+1' + toNumber;
    } else {
      toNumber = '+' + toNumber;
    }
  }
  if (
    !EXCLUDE_DIAL_TO.test(toNumber) ||
    INCLUDE_DIAL_TO.test(toNumber) ||
    toNumber == ''
  ) {
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
};

async function executeDial(event, meetingInfo, phoneAttendeeInfo, toNumber) {
  let dialVC;
  if (toNumber == voiceConnectorPhone) {
    dialVC = 'true';
  } else {
    dialVC = 'false';
  }
  var params = {
    FromPhoneNumber: fromNumber, //needs to be phone number from inventory
    SipMediaApplicationId: smaId,
    ToPhoneNumber: meetingBypassNumber,
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
}
async function createMeeting(requestId) {
  console.log(`Creating Meeting for Request ID: ${requestId}`);
  try {
    const meetingInfo = await chimeSdkMeetingsClient.send(
      new import_client_chime_sdk_meetings.CreateMeetingCommand({
        ClientRequestToken: requestId,
        MediaRegion: mediaRegion,
        ExternalMeetingId: (0, import_crypto.randomUUID)(),
      }),
    );
    return meetingInfo;
  } catch (err) {
    console.info(`Error: ${err}`);
    return false;
  }
}
async function createAttendee(meetingId, externalUserId) {
  console.log(`Creating Attendee for Meeting: ${meetingId}`);
  try {
    const attendeeInfo2 = await chimeSdkMeetingsClient.send(
      new import_client_chime_sdk_meetings.CreateAttendeeCommand({
        MeetingId: meetingId,
        ExternalUserId: externalUserId,
      }),
    );
    return attendeeInfo2;
  } catch (err) {
    console.info(`${err}`);
    return false;
  }
}
