import React, { useEffect } from 'react';
import { UserAgent, Registerer } from 'sip.js';

const SIP_URI = process.env.SIP_URI || '';
const SIP_PASSWORD = process.env.SIP_PASSWORD || '';
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || '';
const VOICE_CONNECTOR_PHONE = process.env.VOICE_CONNECTOR_PHONE || '';

const uri = UserAgent.makeURI(SIP_URI);

const transportOptions = {
    server: WEBSOCKET_URL,
    keepAliveInterval: 30,
};

const SipUserAgent = ({ setUserAgent, onInvite }) => {
    useEffect(() => {
        const userAgentOptions = {
            authorizationPassword: SIP_PASSWORD,
            authorizationUsername: VOICE_CONNECTOR_PHONE,
            transportOptions,
            uri,
            delegate: { onInvite },
        };

        const ua = new UserAgent(userAgentOptions);
        setUserAgent(ua);
        const registerer = new Registerer(ua);

        ua.start().then(() => {
            registerer.register();
        });
    }, []);

    return null; // Nothing to render
};

export default SipUserAgent;
