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
var region = 'us-east-1';

const response = {
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  },
};

exports.handler = async (event, context) => {
  console.log(JSON.stringify(event));
  const body = JSON.parse(event.body);

  switch (body.update) {
    case 'end':
      return endRequest(body);
    case 'digit':
      return digitRequest(body);
  }
};

async function endRequest(body) {
  console.info('Body: ' + JSON.stringify(body));
  const meetingId = body.meetingId;

  const deleteRequest = {
    MeetingId: meetingId,
  };
  try {
    const deleteResponse = await chime.deleteMeeting(deleteRequest).promise();
    console.log(deleteResponse);
  } catch (error) {
    console.log(error);
  }
  console.log(response);
  return response;
}

async function digitRequest(body) {
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
  try {
    const updateResponse = await chime
      .updateSipMediaApplicationCall(updateRequest)
      .promise();
    console.log(updateResponse);
    console.log(response);
    return response;
  } catch (error) {
    console.log(error);
  }
}
