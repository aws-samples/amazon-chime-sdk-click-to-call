import React from 'react';
import { SessionState } from 'sip.js';
import SipUserAgent from './SipUserAgent';
import PhoneNumberInput from './PhoneNumberInput';

const MediaContainer = ({
    setUserAgent,
    onInvite,
    sessionState,
    isRegistered,
    phoneNumber,
    setPhoneNumber,
    mediaElementRef,
    incomingCall,
}) => {
    return (
        <>
            <SipUserAgent setUserAgent={setUserAgent} onInvite={onInvite} />
            {sessionState !== SessionState.Initial &&
                sessionState !== SessionState.Established &&
                sessionState !== SessionState.Establishing &&
                sessionState !== SessionState.Terminating &&
                !incomingCall &&
                isRegistered && (
                    <PhoneNumberInput
                        isRegistered={isRegistered}
                        phoneNumber={phoneNumber}
                        setPhoneNumber={setPhoneNumber}
                    />
                )}
            <video ref={mediaElementRef} autoPlay />
        </>
    );
};

export default MediaContainer;
