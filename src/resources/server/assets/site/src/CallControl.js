import React from 'react';
import { SessionState } from 'sip.js';
import { Button, SpaceBetween } from '@cloudscape-design/components';

const CallControl = ({ incomingCall, sessionState, isRegistered, acceptCall, rejectCall, makeCall, hangUp }) => {
    return (
        <SpaceBetween size="s" direction="horizontal">
            {incomingCall && (
                <>
                    <Button variant="primary" onClick={acceptCall}>
                        Accept
                    </Button>
                    <Button variant="primary" onClick={rejectCall}>
                        Reject
                    </Button>
                </>
            )}
            {sessionState !== SessionState.Initial &&
                sessionState !== SessionState.Established &&
                sessionState !== SessionState.Establishing &&
                sessionState !== SessionState.Terminating &&
                !incomingCall &&
                isRegistered && <Button onClick={makeCall}>Call</Button>}
            {sessionState === SessionState.Established && <Button onClick={hangUp}>Hang Up</Button>}
        </SpaceBetween>
    );
};

export default CallControl;
