const allowedDomain = process.env['ALLOWED_DOMAIN'];

exports.handler = async (event, context, callback) => {
  const userEmailDomain = event.request.userAttributes.email.split('@')[1];

  if (userEmailDomain === allowedDomain) {
    callback(null, event);
  } else {
    const error = new Error(
      'Cannot authenticate users from domains different from ' + allowedDomain,
    );
    callback(error, event);
  }
};
