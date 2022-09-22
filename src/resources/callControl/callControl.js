'use strict';

// callControl.js
var { v4: uuidv4 } = require('uuid');
var AWS = require('aws-sdk');
var chime = new AWS.Chime({ region: 'us-east-1' });
chime.endpoint = new AWS.Endpoint(
  'https://service.chime.aws.amazon.com/console',
);
var docClient = new AWS.DynamoDB.DocumentClient();
var fromNumber = process.env['FROM_NUMBER'];
var smaId = process.env['SMA_ID'];
var callInfoTable = process.env['MEETINGS_TABLE_NAME'];
var numberToCall = process.env['NUMBER_TO_CALL'];
var region = 'us-east-1';
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
    const joinInfo = await createMeeting();
    const dialInfo = await executeDial(event, joinInfo, toNumber);
    await putInfo(joinInfo, dialInfo);
    const responseInfo = JSON.stringify({ joinInfo, dialInfo });
    console.info('Repsonse to Client: ' + responseInfo);
    response.statusCode = 200;
    response.body = responseInfo;
    return response;
  } else {
    console.log('Bad Area Code');
    response.statusCode = 503;
    response.body = 'Invalid Called Number';
    return response;
  }
};
async function createMeeting() {
  const meetingRequest = {
    ClientRequestToken: uuidv4(),
    MediaRegion: region,
    ExternalMeetingId: uuidv4(),
  };
  console.info(
    'Creating new meeting before joining: ' + JSON.stringify(meetingRequest),
  );
  const meetingInfo = await chime.createMeeting(meetingRequest).promise();
  console.info('Meeting Info: ' + JSON.stringify(meetingInfo));
  const clientAttendeeRequest = {
    MeetingId: meetingInfo.Meeting.MeetingId,
    ExternalUserId: 'Client-User',
  };
  console.info(
    'Creating new attendee: ' + JSON.stringify(clientAttendeeRequest),
  );
  const clientAttendeeInfo = await chime
    .createAttendee(clientAttendeeRequest)
    .promise();
  console.info('Client Attendee Info: ' + JSON.stringify(clientAttendeeInfo));
  const phoneAttendeeRequest = {
    MeetingId: meetingInfo.Meeting.MeetingId,
    ExternalUserId: 'Phone-User',
  };
  console.info(
    'Creating new attendee: ' + JSON.stringify(phoneAttendeeRequest),
  );
  const phoneAttendeeInfo = await chime
    .createAttendee(phoneAttendeeRequest)
    .promise();
  console.info('Client Attendee Info: ' + JSON.stringify(phoneAttendeeInfo));
  const joinInfo = {
    Meeting: meetingInfo.Meeting,
    Attendee: [clientAttendeeInfo.Attendee, phoneAttendeeInfo.Attendee],
  };
  console.info('joinInfo: ' + JSON.stringify(joinInfo));
  return joinInfo;
}
async function executeDial(event, joinInfo, toNumber) {
  var params = {
    FromPhoneNumber: fromNumber,
    SipMediaApplicationId: smaId,
    ToPhoneNumber: toNumber,
    SipHeaders: {
      'User-to-User': joinInfo.Meeting.MeetingId,
      // 'User-to-User': event.requestContext.authorizer.claims.email,
    },
  };
  console.info('Dial Params: ' + JSON.stringify(params));
  try {
    const dialInfo = await chime
      .createSipMediaApplicationCall(params)
      .promise();
    console.info('Dial Info: ' + JSON.stringify(dialInfo));
    return dialInfo;
  } catch (err) {
    console.log(err);
    return err;
  }
}
async function putInfo(joinInfo, dialInfo) {
  var params = {
    TableName: callInfoTable,
    Key: {
      transactionId: dialInfo.SipMediaApplicationCall.TransactionId,
    },
    UpdateExpression:
      'SET #mi = :mi, #mId = :mId, #ai = list_append(if_not_exists(#ai, :empty), :ai)',
    ExpressionAttributeNames: {
      '#mi': 'MeetingInfo',
      '#mId': 'meetingId',
      '#ai': 'AttendeeInfo',
    },
    ExpressionAttributeValues: {
      ':mi': joinInfo.Meeting,
      ':mId': joinInfo.Meeting.MeetingId,
      ':ai': joinInfo.Attendee,
      ':empty': [],
    },
  };
  console.log(params);
  try {
    await docClient.update(params).promise();
  } catch (err) {
    console.log(err);
    return err;
  }
}
