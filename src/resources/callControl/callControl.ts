import { randomUUID } from 'crypto';
import {
  ChimeSDKMeetingsClient,
  CreateMeetingCommand,
  CreateAttendeeCommand,
} from '@aws-sdk/client-chime-sdk-meetings';
import {
  ChimeSDKVoiceClient,
  CreateSipMediaApplicationCallCommand,
} from '@aws-sdk/client-chime-sdk-voice';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const EXCLUDE_DIAL_TO =
  /^\+((1900)|(1976)|(1268)|(1284)|(1473)|(1649)|(1664)|(1767)|(1809)|(1829)|(1849)|(1876))(\d{7})$/;
const INCLUDE_DIAL_TO = /^\+1[2-9]\d{2}[2-9]\d{6}$/;

const AWS_REGION = process.env.AWS_REGION;
const config = {
  region: AWS_REGION,
};

const chimeSdkVoiceClient = new ChimeSDKVoiceClient(config);
const chimeSdkMeetingsClient = new ChimeSDKMeetingsClient(config);

const fromNumber = process.env.FROM_NUMBER || '';
const voiceConnectorPhone = process.env.VOICE_CONNECTOR_PHONE || '';
const voiceConnectorArn = process.env.VOICE_CONNECTOR_ARN || '';
const smaId = process.env.SMA_ID || '';
const numberToCall = process.env.NUMBER_TO_CALL || '';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.info(`Event: ${JSON.stringify(event)}`);

  const body = JSON.parse(event.body || '{}');
  console.info('Body: ' + JSON.stringify(body));

  let toNumber = body.toNumber || numberToCall;

  if (!toNumber) {
    return {
      statusCode: 503,
      body: 'Missing Number',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
      },
    };
  }

  toNumber = toNumber.replace(/\s+/g, '').replace(/[\(\)\-]/g, '');

  if (!toNumber.startsWith('+')) {
    toNumber = toNumber.length === 10 ? `+1${toNumber}` : `+${toNumber}`;
  }

  if (
    !EXCLUDE_DIAL_TO.test(toNumber) ||
    INCLUDE_DIAL_TO.test(toNumber) ||
    toNumber === ''
  ) {
    const meetingInfo = await createMeeting(randomUUID());

    if (meetingInfo) {
      const clientAttendeeInfo = await createAttendee(
        meetingInfo.Meeting!.MeetingId!,
        'client-user',
      );

      if (clientAttendeeInfo) {
        const responseInfo = {
          Meeting: meetingInfo.Meeting,
          Attendee: clientAttendeeInfo.Attendee,
        };

        const phoneAttendeeInfo = await createAttendee(
          meetingInfo.Meeting!.MeetingId!,
          'phone-user',
        );
        const dialInfo = await executeDial(
          event,
          meetingInfo,
          phoneAttendeeInfo,
          toNumber,
        );

        console.info('joinInfo: ' + JSON.stringify({ responseInfo, dialInfo }));

        return {
          statusCode: 200,
          body: JSON.stringify({ responseInfo, dialInfo }),
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Content-Type': 'application/json',
          },
        };
      } else {
        return {
          statusCode: 503,
          body: 'Error creating attendee',
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Content-Type': 'application/json',
          },
        };
      }
    } else {
      return {
        statusCode: 503,
        body: 'Error creating meeting',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json',
        },
      };
    }
  } else {
    return {
      statusCode: 503,
      body: 'Bad Number',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
      },
    };
  }
};

async function executeDial(
  event: APIGatewayProxyEvent,
  meetingInfo: any,
  phoneAttendeeInfo: any,
  toNumber: string,
) {
  const dialVC = toNumber === voiceConnectorPhone ? 'true' : 'false';

  const params = {
    FromPhoneNumber: fromNumber,
    SipMediaApplicationId: smaId,
    ToPhoneNumber: '+17035550122', // Replace with your desired phone number
    SipHeaders: {
      'X-chime-join-token': phoneAttendeeInfo.Attendee.JoinToken,
      'X-chime-meeting-id': meetingInfo.Meeting.MeetingId,
    },
    ArgumentsMap: {
      MeetingId: meetingInfo.Meeting.MeetingId,
      RequestedDialNumber: toNumber,
      RequestedVCArn: voiceConnectorArn,
      RequestorEmail: event.requestContext.authorizer?.claims?.email || '',
      DialVC: dialVC,
    },
  };

  console.info('Dial Params: ' + JSON.stringify(params));

  try {
    const dialInfo = await chimeSdkVoiceClient.send(
      new CreateSipMediaApplicationCallCommand(params),
    );
    return dialInfo;
  } catch (err) {
    console.info(`Error: ${err}`);
    return false;
  }
}

async function createMeeting(requestId: string) {
  console.log(`Creating Meeting for Request ID: ${requestId}`);

  try {
    const meetingInfo = await chimeSdkMeetingsClient.send(
      new CreateMeetingCommand({
        ClientRequestToken: requestId,
        MediaRegion: 'us-east-1',
        ExternalMeetingId: randomUUID(),
      }),
    );

    return meetingInfo;
  } catch (err) {
    console.info(`Error: ${err}`);
    return false;
  }
}

async function createAttendee(meetingId: string, externalUserId: string) {
  console.log(`Creating Attendee for Meeting: ${meetingId}`);

  try {
    const attendeeInfo = await chimeSdkMeetingsClient.send(
      new CreateAttendeeCommand({
        MeetingId: meetingId,
        ExternalUserId: externalUserId,
      }),
    );

    return attendeeInfo;
  } catch (err) {
    console.info(`${err}`);
    return false;
  }
}
