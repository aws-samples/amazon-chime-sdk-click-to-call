import React, { useState, useEffect } from 'react';
import {
    useMeetingManager,
    FormField,
    Input,
    Dialer,
    Phone,
    ControlBar,
    ControlBarButton,
    MeetingStatus,
    AudioInputControl,
    useMeetingStatus,
    AudioOutputControl,
} from 'amazon-chime-sdk-component-library-react';
import { MeetingSessionConfiguration } from 'amazon-chime-sdk-js';
import { AmplifyConfig } from './Config';
import { Amplify, API, Auth } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import ContentLayout from '@cloudscape-design/components/content-layout';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Grid from '@cloudscape-design/components/grid';
import Box from '@cloudscape-design/components/box';
import Modal from '@cloudscape-design/components/modal';
import '@cloudscape-design/global-styles/index.css';

Amplify.configure(AmplifyConfig);
API.configure(AmplifyConfig);
Amplify.Logger.LOG_LEVEL = 'DEBUG';

const App = () => {
    const meetingManager = useMeetingManager();
    const meetingStatus = useMeetingStatus();
    const [phoneNumber, setPhone] = useState('');
    const [meetingId, setMeetingId] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [visible, setVisible] = useState(false);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (meetingStatus === MeetingStatus.Succeeded) {
            setIsActive(true);
        } else {
            setIsActive(false);
        }
    }, [meetingStatus]);

    const DialButtonProps = {
        icon: <Phone />,
        onClick: (event) => handleDialOut(event),
        label: 'Dial',
    };

    const EndButtonProps = {
        icon: <Phone />,
        onClick: (event) => handleEnd(event),
        label: 'End',
    };

    const DTMFButtonProps = {
        icon: <Dialer />,
        onClick: () => setVisible(true),
        label: 'Dial Pad',
    };

    const VALID_PHONE_NUMBER = /^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})\s*$/;

    const handlePhoneChange = (event) => setPhone(event.target.value);

    async function signOut() {
        console.log('Signing Out');
        try {
            await Auth.signOut();
        } catch (error) {
            console.log('error signing out: ', error);
        }
    }

    const handleDialOut = async (event) => {
        event.preventDefault();
        if (VALID_PHONE_NUMBER.test(phoneNumber) || phoneNumber == '') {
            try {
                const dialOutResponse = await API.post('callControlAPI', 'dial', {
                    body: {
                        toNumber: phoneNumber,
                    },
                });
                console.log(dialOutResponse);
                const meetingSessionConfiguration = new MeetingSessionConfiguration(
                    dialOutResponse.joinInfo.Meeting,
                    dialOutResponse.joinInfo.Attendee[0],
                );
                await meetingManager.join(meetingSessionConfiguration);
                await meetingManager.start();
                console.log('Meeting started');
                console.log(dialOutResponse);
                setMeetingId(dialOutResponse.joinInfo.Meeting.MeetingId);
                setTransactionId(dialOutResponse.dialInfo.SipMediaApplicationCall.TransactionId);
            } catch (err) {
                console.log(err);
            }
        } else {
            console.log('Bad Phone Number');
        }
    };

    const handleEnd = async (event) => {
        event.preventDefault();
        try {
            const updateResponse = await API.post('updateCallAPI', 'update', {
                body: {
                    update: 'end',
                    meetingId: meetingId,
                },
            });
            console.info(`updateResponse: ${JSON.stringify(updateResponse)}`);
        } catch (err) {
            console.log(err);
        }
    };

    const handleSendDigit = async (digit) => {
        event.preventDefault();
        try {
            const updateResponse = await API.post('updateCallAPI', 'update', {
                body: {
                    update: 'digit',
                    digit: digit,
                    transactionId: transactionId,
                },
            });
            console.info(`updateResponse: ${JSON.stringify(updateResponse)}`);
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <ContentLayout
            header={
                <SpaceBetween size="m">
                    <Header variant="h1" actions={<Button onClick={signOut}>Sign Out</Button>}>
                        Amazon Chime SDK Click to Call
                    </Header>
                </SpaceBetween>
            }
        >
            <Container>
                <ControlBar
                    showLabels={true}
                    responsive={true}
                    layout="undocked-horizontal"
                    css="margin: 10px;  background-color: rgba(0,0,0,.0); box-shadow: 0px 0px;"
                >
                    <FormField
                        field={Input}
                        label="Phone Number"
                        css="width: 400px; padding: 20px"
                        value={phoneNumber}
                        fieldProps={{
                            phoneNumber: 'phoneNumber',
                            placeholder: 'Enter Phone Number to Dial',
                        }}
                        onChange={handlePhoneChange}
                        layout="horizontal"
                        className="phone-form"
                    />
                    {isActive ? <ControlBarButton {...EndButtonProps} /> : <ControlBarButton {...DialButtonProps} />}
                    <ControlBarButton {...DTMFButtonProps} />
                    <AudioInputControl />
                    <AudioOutputControl />
                    <Modal
                        onDismiss={() => setVisible(false)}
                        size={'small'}
                        visible={visible}
                        closeAriaLabel="Close modal"
                        footer={
                            <Box float="right">
                                <Grid
                                    gridDefinition={[
                                        { colspan: 4 },
                                        { colspan: 4 },
                                        { colspan: 4 },
                                        { colspan: 4 },
                                        { colspan: 4 },
                                        { colspan: 4 },
                                        { colspan: 4 },
                                        { colspan: 4 },
                                        { colspan: 4 },
                                        { colspan: 4 },
                                        { colspan: 4 },
                                        { colspan: 4 },
                                    ]}
                                >
                                    <div>
                                        <Button label="1" onClick={() => handleSendDigit('1')}>
                                            1
                                        </Button>
                                    </div>
                                    <div>
                                        <Button label="2" onClick={() => handleSendDigit('2')}>
                                            2
                                        </Button>
                                    </div>
                                    <div>
                                        <Button label="3" onClick={() => handleSendDigit('3')}>
                                            3
                                        </Button>
                                    </div>
                                    <div>
                                        <Button label="4" onClick={() => handleSendDigit('4')}>
                                            4
                                        </Button>
                                    </div>
                                    <div>
                                        <Button label="5" onClick={() => handleSendDigit('5')}>
                                            5
                                        </Button>
                                    </div>
                                    <div>
                                        <Button label="6" onClick={() => handleSendDigit('6')}>
                                            6
                                        </Button>
                                    </div>
                                    <div>
                                        <Button label="7" onClick={() => handleSendDigit('7')}>
                                            7
                                        </Button>
                                    </div>
                                    <div>
                                        <Button label="8" onClick={() => handleSendDigit('8')}>
                                            8
                                        </Button>
                                    </div>
                                    <div>
                                        <Button label="9" onClick={() => handleSendDigit('9')}>
                                            9
                                        </Button>
                                    </div>
                                    <div>
                                        <Button label="*" onClick={() => handleSendDigit('*')}>
                                            *
                                        </Button>
                                    </div>
                                    <div>
                                        <Button label="0" onClick={() => handleSendDigit('0')}>
                                            0
                                        </Button>
                                    </div>
                                    <div>
                                        <Button label="#" onClick={() => handleSendDigit('#')}>
                                            #
                                        </Button>
                                    </div>
                                </Grid>
                            </Box>
                        }
                        header="Send Digits"
                    ></Modal>
                </ControlBar>
            </Container>
        </ContentLayout>
    );
};

export default withAuthenticator(App);
