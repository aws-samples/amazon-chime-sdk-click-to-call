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
exports.handler = async (event, context) => {
  const body = JSON.parse(event.body);
  console.info('Body: ' + JSON.stringify(body));
  const meetingId = body.meetingId;

  const deleteRequest = {
    MeetingId: meetingId,
  };
  await chime.deleteMeeting(deleteRequest).promise();

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json',
    },
  };
  return response;
};
