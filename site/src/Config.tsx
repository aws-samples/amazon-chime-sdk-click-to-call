console.log('Getting Config');
const config = await fetch('./config.json').then((response) => response.json());

import { Auth } from 'aws-amplify';

export const AmplifyConfig = {
    Auth: {
        region: config.userPoolRegion,
        userPoolId: config.userPoolId,
        userPoolWebClientId: config.userPoolClientId,
        identityPool: config.identityPoolId,
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
                endpoint: config.apiUrl,
                custom_header: async () => {
                    return { Authorization: `${(await Auth.currentSession()).getIdToken().getJwtToken()}` };
                },
            },
            {
                name: 'updateCallAPI',
                endpoint: config.apiUrl,
                custom_header: async () => {
                    return { Authorization: `${(await Auth.currentSession()).getIdToken().getJwtToken()}` };
                },
            },
        ],
    },
};
