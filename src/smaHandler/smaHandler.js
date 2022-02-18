// src/smaHandler/smaHandler.js
var AWS = require('aws-sdk');
var chime = new AWS.Chime({
  region: 'us-east-1',
  endpoint: 'service.chime.aws.amazon.com',
});
var callInfoTable = process.env['MEETINGS_TABLE_NAME'];
var voiceConnectorArn = process.env['VOICE_CONNECTOR_ARN'];
var documentClient = new AWS.DynamoDB.DocumentClient();
exports.handler = async (event, context, callback) => {
  console.log('Lambda is invoked with calldetails:' + JSON.stringify(event));
  let actions;
  switch (event.InvocationEventType) {
    case 'NEW_OUTBOUND_CALL':
      console.log('OUTBOUND CALL');
      actions = [];
      break;
    case 'RINGING':
      console.log('RINGING');
      actions = [];
      break;
    case 'ACTION_SUCCESSFUL':
      console.log('ACTION SUCCESSFUL');
      actions = [];
      break;
    case 'HANGUP':
      console.log('HANGUP ACTION');
      if (event.CallDetails.Participants[1]) {
        hangupAction.Parameters.CallId =
          event.CallDetails.Participants[1].CallId;
        actions = [hangupAction];
      }

      break;
    case 'CALL_ANSWERED':
      console.log('CALL ANSWERED');
      var currentCall = await getCaller(event.CallDetails.TransactionId);
      joinChimeMeeting.Parameters.CallId =
        event.CallDetails.Participants[0].CallId;
      joinChimeMeeting.Parameters.MeetingId = currentCall.meetingId;
      joinChimeMeeting.Parameters.JoinToken =
        currentCall.AttendeeInfo[1].JoinToken;
      actions = [joinChimeMeeting];
      break;
    default:
      console.log('FAILED ACTION');
      actions = [];
  }
  const response = {
    SchemaVersion: '1.0',
    Actions: actions,
  };
  console.log('Sending response:' + JSON.stringify(response));
  callback(null, response);
};
var hangupAction = {
  Type: 'Hangup',
  Parameters: {
    SipResponseCode: '0',
    ParticipantTag: '',
  },
};
var joinChimeMeeting = {
  Type: 'JoinChimeMeeting',
  Parameters: {
    JoinToken: '',
    CallId: '',
    MeetingId: '',
  },
};
async function getCaller(transactionId) {
  var params = {
    TableName: callInfoTable,
    Key: { transactionId },
  };
  console.log(params);
  try {
    const results = await documentClient.get(params).promise();
    console.log(results.Item);
    return results.Item;
  } catch (err) {
    console.log(err);
    console.log('No phone found');
    return false;
  }
}
