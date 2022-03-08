import cdkExports from './cdk-outputs.json';
const configData = cdkExports.ClickToCall;
import { Auth } from 'aws-amplify';

export const AmplifyConfig = {
    Auth: {
        region: configData.USERPOOLREGION,
        userPoolId: configData.USERPOOLID,
        userPoolWebClientId: configData.USERPOOLCLIENT,
        mandatorySignIn: true,
        cookieStorage: {
            domain: `${window.location.hostname}`,
            path: '/',
            expires: 365,
            secure: true,
        },
    },
    Analytics: {
        disabled: true,
    },
    API: {
        endpoints: [
            {
                name: 'callControlAPI',
                endpoint: configData.APIURL,
                custom_header: async () => {
                    return { Authorization: `${(await Auth.currentSession()).getIdToken().getJwtToken()}` };
                },
            },
            {
                name: 'updateCallAPI',
                endpoint: configData.APIURL,
                custom_header: async () => {
                    return { Authorization: `${(await Auth.currentSession()).getIdToken().getJwtToken()}` };
                },
            },
        ],
    },
};
