import {
  ChimeSDKMeetingsClient,
  DeleteMeetingCommand,
} from '@aws-sdk/client-chime-sdk-meetings';
import {
  ChimeSDKVoiceClient,
  UpdateSipMediaApplicationCallCommand,
} from '@aws-sdk/client-chime-sdk-voice';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const AWS_REGION = process.env.AWS_REGION;
const config = {
  region: AWS_REGION,
};

const chimeSdkMeetingsClient = new ChimeSDKMeetingsClient(config);
const chimeSdkVoiceClient = new ChimeSDKVoiceClient(config);

const smaId = process.env.SMA_ID || '';

const response: APIGatewayProxyResult = {
  body: '',
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  _context: any, // Replace with your context type
): Promise<APIGatewayProxyResult> => {
  console.log(JSON.stringify(event));
  const body = JSON.parse(event.body || '{}');

  switch (body.update) {
    case 'end':
      return endRequest(body);
    case 'digit':
      return digitRequest(body);
    default:
      return {
        statusCode: 400,
        body: JSON.stringify('Invalid request'),
        headers: response.headers,
      };
  }
};

async function endRequest(body: any): Promise<APIGatewayProxyResult> {
  console.info('Body: ' + JSON.stringify(body));
  const meetingId = body.meetingId;

  if (await deleteMeeting(meetingId)) {
    console.info('Meeting Deleted');
    response.body = JSON.stringify('Meeting deleted');
    response.statusCode = 200;
    return response;
  } else {
    response.body = JSON.stringify('Error deleting meeting');
    response.statusCode = 503;
    return response;
  }
}

async function digitRequest(body: any): Promise<APIGatewayProxyResult> {
  const digit = body.digit;
  const transactionId = body.transactionId;

  const updateRequest = {
    Arguments: {
      digit: digit,
    },
    SipMediaApplicationId: smaId,
    TransactionId: transactionId,
  };
  console.log(updateRequest);
  if (await updateMeeting(updateRequest)) {
    response.body = JSON.stringify('Meeting updated');
    response.statusCode = 200;
    return response;
  } else {
    response.body = JSON.stringify('Error updating meeting');
    response.statusCode = 503;
    return response;
  }
}

async function deleteMeeting(meetingId: string): Promise<boolean> {
  try {
    await chimeSdkMeetingsClient.send(
      new DeleteMeetingCommand({
        MeetingId: meetingId,
      }),
    );
    return true;
  } catch (err) {
    console.info(`${err}`);
    return false;
  }
}

async function updateMeeting(updateRequest: any): Promise<boolean> {
  try {
    await chimeSdkVoiceClient.send(
      new UpdateSipMediaApplicationCallCommand(updateRequest),
    );
    return true;
  } catch (err) {
    console.info(`${err}`);
    return false;
  }
}
