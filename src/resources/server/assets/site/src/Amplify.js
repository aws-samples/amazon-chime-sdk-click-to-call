const USER_POOL_REGION = process.env.USER_POOL_REGION || '';
const USER_POOL_ID = process.env.USER_POOL_ID || '';
const WEB_CLIENT_ID = process.env.WEB_CLIENT_ID || '';
const IDENTITY_POOL = process.env.IDENTITY_POOL_ID || '';

export const AmplifyConfig = {
    Auth: {
        region: USER_POOL_REGION,
        userPoolId: USER_POOL_ID,
        userPoolWebClientId: WEB_CLIENT_ID,
        identityPool: IDENTITY_POOL,
        mandatorySignIn: true,
        cookieStorage: {
            domain: `${window.location.hostname}`,
            path: '/',
            expires: 365,
            secure: true,
        },
    },
};
