import React, { useEffect, useState, useRef, useCallback } from 'react';
import { UserAgent, Registerer, Inviter, SessionState, Session } from 'sip.js';
import CallControl from './CallControl';
import MediaContainer from './MediaContainer';

import {
    Container,
    ContentLayout,
    SpaceBetween,
    AppLayout,
    TopNavigation,
    Header,
} from '@cloudscape-design/components';

const SIP_URI = process.env.SIP_URI || '';
const SIP_PASSWORD = process.env.SIP_PASSWORD || '';
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || '';
const VOICE_CONNECTOR_PHONE = process.env.VOICE_CONNECTOR_PHONE || '';
const SERVER_IP = process.env.SERVER_IP || '';

const uri = UserAgent.makeURI(SIP_URI);

const transportOptions = {
    server: WEBSOCKET_URL,
    keepAliveInterval: 30,
};

const SipProvider = ({ children }) => {
    const [userAgent, setUserAgent] = useState(null);
    const [session, setSession] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [sessionState, setSessionState] = useState(null);
    const [customHeaders, setCustomHeaders] = useState([]);
    const [isRegistered, setIsRegistered] = useState(false);
    const [registerer, setRegisterer] = useState(null); // Add this line to declare the registerer state
    const [remoteIdentity, setRemoteIdentity] = useState(null);

    const mediaElementRef = useRef(null);

    const setupRemoteMedia = (session) => {
        const remoteStream = new MediaStream();
        session.sessionDescriptionHandler.peerConnection.getReceivers().forEach((receiver) => {
            if (receiver.track) {
                remoteStream.addTrack(receiver.track);
            }
        });
        mediaElementRef.current.srcObject = remoteStream;
        mediaElementRef.current.play();
    };

    const cleanupMedia = () => {
        mediaElementRef.current.pause();
        mediaElementRef.current.srcObject = null;
    };

    const onInvite = useCallback((invitation) => {
        console.log('Received INVITE: ', invitation);
        setIncomingCall(invitation);

        const headers = invitation.request.headers;
        let incomingHeaders = [];

        for (let header in headers) {
            if (header.toLowerCase().startsWith('x-')) {
                headers[header].forEach((headerValue) => {
                    let headerObject = {};
                    headerObject[header] = headerValue.raw;
                    incomingHeaders.push(headerObject);
                });
            }
        }

        setCustomHeaders(incomingHeaders);
        console.log('Incoming Headers: ', JSON.stringify(incomingHeaders, null, 2));

        invitation.stateChange.addListener((newState) => {
            setSessionState(newState);
            switch (newState) {
                case SessionState.Established:
                    console.log('Inbound Call Established');
                    console.log('Invitation: ', invitation);
                    setRemoteIdentity(invitation.incomingInviteRequest.message.from.uri.normal.user);
                    setupRemoteMedia(invitation);
                    setSession(invitation);
                    break;
                case SessionState.Terminated:
                    console.log('Inbound Call Terminated');
                    setIncomingCall(null);
                    setSession(null);
                    cleanupMedia();
                    break;
                default:
                    break;
            }
        });
    }, []);

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
        const reg = new Registerer(ua);
        setRegisterer(reg);

        try {
            ua.start().then(() => {
                reg.register();
                setIsRegistered(true);
            });
        } catch (err) {
            console.log(err);
        }
    }, []);

    useEffect(() => {
        let timeoutId;
        if (sessionState === SessionState.Terminated) {
            timeoutId = setTimeout(() => {
                setSessionState(null);
            }, 5000); // 5000 milliseconds = 5 seconds
        }

        return () => clearTimeout(timeoutId); // cleanup function to clear the timeout if component unmounts
    }, [sessionState]);

    const acceptCall = () => {
        if (incomingCall) {
            if (sessionState != SessionState.Establishing) {
                incomingCall.accept();
                setSession(incomingCall);
                setIncomingCall(null);
            }
        }
    };

    const rejectCall = () => {
        if (incomingCall) {
            if (sessionState != SessionState.Establishing) {
                incomingCall.reject();
                setIncomingCall(null);
            }
        }
    };

    const makeCall = () => {
        console.log('Making Call');
        if (userAgent && phoneNumber) {
            const target = UserAgent.makeURI(`sip:${phoneNumber}@${SERVER_IP}`);
            console.log('WEBSOCKET_URL: ', WEBSOCKET_URL);
            console.log('VOICE_CONNECTOR_PHONE: ', VOICE_CONNECTOR_PHONE);
            console.log('Target: ', target);
            if (target) {
                const inviter = new Inviter(userAgent, target);
                inviter.invite();
                const outgoingSession = inviter;
                outgoingSession.stateChange.addListener((newState) => {
                    setSessionState(newState);
                    switch (newState) {
                        case SessionState.Established:
                            console.log('Outbound Call Established');
                            setupRemoteMedia(outgoingSession);
                            setSession(outgoingSession);
                            console.log('OutgoingSession: ', outgoingSession);
                            break;
                        case SessionState.Terminated:
                            console.log('Outbound Call Terminated');
                            cleanupMedia();
                            setSession(null);
                            break;
                        default:
                            break;
                    }
                });

                console.log('Outgoing Session: ', outgoingSession);
                setRemoteIdentity(outgoingSession.remoteIdentity.uri.normal.user);
                setSession(outgoingSession);
            }
        }
    };

    // Some function to end the call
    const hangUp = () => {
        if (session) {
            if (sessionState != SessionState.Established) {
                console.log('Session already Terminated');
            } else {
                console.log('Hanging Up');
                console.log('Current Session: ', session);
                session.bye();
                setSession(null);
                setSessionState(SessionState.Terminated);
            }
        }
    };

    const unregister = () => {
        console.log('Unregistering');
        if (registerer) {
            registerer.unregister({ all: true });
            setIsRegistered(false);
        }
    };

    const register = () => {
        console.log('Registering');
        if (registerer) {
            const response = registerer.register();
            console.log(response);
            setIsRegistered(true);
        }
    };

    if (!userAgent) {
        return null;
    }

    return (
        <>
            <TopNavigation
                identity={{
                    href: '#',
                    title: VOICE_CONNECTOR_PHONE,
                }}
                utilities={[
                    {
                        type: 'button',
                        text: incomingCall
                            ? `Incoming call from ${incomingCall.remoteIdentity.uri.user}`
                            : sessionState === SessionState.Establishing
                            ? 'Establishing session...'
                            : sessionState === SessionState.Terminated
                            ? 'Session Terminated'
                            : sessionState === SessionState.Established
                            ? `Session established with ${remoteIdentity}`
                            : '',
                    },
                    {
                        type: 'button',
                        iconName: isRegistered ? 'status-positive' : 'status-negative',
                        ariaLabel: 'Status',
                        badge: false,
                        disableUtilityCollapse: true,
                    },
                    {
                        type: 'menu-dropdown',
                        iconName: 'settings',
                        ariaLabel: 'Registration',
                        title: 'Registration',
                        onItemClick: () => {
                            isRegistered ? unregister() : register();
                        },
                        items: [
                            {
                                id: 'register',
                                text: isRegistered ? 'Unregister' : 'Register',
                            },
                        ],
                    },
                ]}
            />
            <AppLayout
                content={
                    <ContentLayout header={<Header variant="h1">Demo Phone</Header>}>
                        <SpaceBetween size="xl" direction="vertical">
                            {children}
                            <Container
                                header={
                                    <Header
                                        variant="h2"
                                        actions={
                                            <SpaceBetween size="xs" direction="horizontal">
                                                <CallControl
                                                    incomingCall={incomingCall}
                                                    sessionState={sessionState}
                                                    isRegistered={isRegistered}
                                                    acceptCall={acceptCall}
                                                    rejectCall={rejectCall}
                                                    makeCall={makeCall}
                                                    hangUp={hangUp}
                                                />
                                            </SpaceBetween>
                                        }
                                    >
                                        Call Control
                                    </Header>
                                }
                            >
                                <MediaContainer
                                    sessionState={sessionState}
                                    onInvite={onInvite}
                                    setUserAgent={setUserAgent}
                                    isRegistered={isRegistered}
                                    phoneNumber={phoneNumber}
                                    setPhoneNumber={setPhoneNumber}
                                    mediaElementRef={mediaElementRef}
                                    incomingCall={incomingCall}
                                />
                            </Container>
                        </SpaceBetween>
                    </ContentLayout>
                }
                navigationHide={true}
                toolsHide={true}
            />
        </>
    );
};

export default SipProvider;
