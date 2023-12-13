import React, { useState, useEffect } from 'react';
import SipProvider from './SipProvider';
import { AmplifyConfig } from './Amplify';
import { Auth, Amplify, API } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
Amplify.configure(AmplifyConfig);
API.configure(AmplifyConfig);
Amplify.Logger.LOG_LEVEL = 'DEBUG';

const App = () => {
    const [currentCredentials, setCurrentCredentials] = useState({});
    const [currentSession, setCurrentSession] = useState({});
    useEffect(() => {
        async function getAuth() {
            try {
                const session = await Auth.currentSession();
                const credentials = await Auth.currentUserCredentials();
                setCurrentSession(session);
                setCurrentCredentials(credentials);
                console.log(`authState: ${JSON.stringify(session)}`);
                console.log(`currentCredentials: ${JSON.stringify(credentials)}`);
            } catch (error) {
                // Handle the error here, for example:
                console.error('Error fetching authentication information:', error);
                setCurrentSession(null); // Set to null or some default value
                setCurrentCredentials(null); // Set to null or some default value
            }
        }
        getAuth();
    }, []);
    const formFields = {
        signUp: {
            email: {
                order: 1,
                isRequired: true,
            },
            password: {
                order: 4,
            },
            confirm_password: {
                order: 5,
            },
        },
    };

    return (
        <Authenticator loginMechanisms={['email']} formFields={formFields}>
            {({ signOut, user }) => <SipProvider />}
        </Authenticator>
    );
};

export default App;
