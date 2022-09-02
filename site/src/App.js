import React, { useState } from 'react';
import {
    useMeetingManager,
    MeetingProvider,
    FormField,
    Input,
    Dialer,
    Phone,
    ControlBar,
    ControlBarButton,
    Grid,
    Cell,
    Navbar,
    LeaveMeeting,
    NavbarItem,
    Flex,
    AudioInputControl,
    AudioOutputControl,
    Button,
} from 'amazon-chime-sdk-component-library-react';
import { MeetingSessionConfiguration } from 'amazon-chime-sdk-js';
import { AmplifyConfig } from './Config';
import { Amplify, API, Auth } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(AmplifyConfig);
API.configure(AmplifyConfig);
Amplify.Logger.LOG_LEVEL = 'DEBUG';

const App = () => {
    const meetingManager = useMeetingManager();
    const [phoneNumber, setPhone] = useState('');
    const [meetingId, setMeetingId] = useState('');
    const [transactionId, setTransactionId] = useState('');

    const DialButtonProps = {
        icon: <Dialer />,
        onClick: (event) => handleDialOut(event),
        label: 'Dial',
    };

    const EndButtonProps = {
        icon: <Phone />,
        onClick: (event) => handleEnd(event),
        label: 'End',
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
        <div>
            <MeetingProvider>
                <div className="controls-box">
                    <Grid
                        style={{ height: '30vh' }}
                        gridGap=".25rem"
                        css="padding: 0px"
                        gridAutoFlow=""
                        gridTemplateColumns="5fr 1fr 1fr 1fr 1fr"
                        gridTemplateRows="1fr 1fr"
                        gridTemplateAreas='
              "blank blank blank blank header"
              "form button button button button"
          '
                    >
                        <Cell gridArea="header" css="height: 75px">
                            <Flex layout="fill-space">
                                <Navbar flexDirection="row" container height="100%">
                                    <Flex marginTop="auto">
                                        <NavbarItem
                                            icon={<LeaveMeeting />}
                                            onClick={signOut}
                                            label="Sign Out"
                                            showLabel="true"
                                        />
                                    </Flex>
                                </Navbar>
                            </Flex>
                        </Cell>
                        <ControlBar
                            showLabels={true}
                            responsive={true}
                            layout="undocked-horizontal"
                            css="margin: 100px"
                        >
                            <Cell gridArea="form" css="width: 450px">
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
                            </Cell>
                            <Cell gridArea="button">
                                <ControlBarButton {...DialButtonProps} />
                            </Cell>
                            <Cell gridArea="button">
                                <ControlBarButton {...EndButtonProps} />
                            </Cell>
                            <Cell gridArea="button">
                                <AudioInputControl />
                            </Cell>
                            <Cell gridArea="button">
                                <AudioOutputControl />
                            </Cell>
                        </ControlBar>
                        <Grid
                            gridTemplateColumns="1fr 1fr 1fr"
                            gridTemplateRows="1fr 1fr 1fr 1fr"
                            style={{ height: '10vh' }}
                            gridGap=".25rem"
                            css="padding: 0px"
                        >
                            <Button label="1" onClick={() => handleSendDigit('1')}></Button>
                            <Button label="2" onClick={() => handleSendDigit('2')}></Button>
                            <Button label="3" onClick={() => handleSendDigit('3')}></Button>
                            <Button label="4" onClick={() => handleSendDigit('4')}></Button>
                            <Button label="5" onClick={() => handleSendDigit('5')}></Button>
                            <Button label="6" onClick={() => handleSendDigit('6')}></Button>
                            <Button label="7" onClick={() => handleSendDigit('7')}></Button>
                            <Button label="8" onClick={() => handleSendDigit('8')}></Button>
                            <Button label="9" onClick={() => handleSendDigit('9')}></Button>
                            <Button label="*" onClick={() => handleSendDigit('*')}></Button>
                            <Button label="0" onClick={() => handleSendDigit('0')}></Button>
                            <Button label="#" onClick={() => handleSendDigit('#')}></Button>
                        </Grid>
                    </Grid>
                    <div id="video"></div>
                </div>
            </MeetingProvider>
        </div>
    );
};

export default withAuthenticator(App);
