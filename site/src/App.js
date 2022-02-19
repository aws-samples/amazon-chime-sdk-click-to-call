import React, { useState } from 'react';
import {
    useMeetingManager,
    FormField,
    Input,
    Dialer,
    Phone,
    ControlBar,
    ControlBarButton,
    Grid,
    Cell,
    AudioInputControl,
    AudioOutputControl,
} from 'amazon-chime-sdk-component-library-react';

import cdkExports from './cdk-outputs.json';
import axios from 'axios';

const API_URL = cdkExports.ClickToCall.apiUrl;
const API_KEY = cdkExports.ClickToCall.clickToCallApiKey;

const request = {
    url: '',
    method: 'POST',
    headers: {
        'Content-Type': 'applications/json',
        'x-api-key': API_KEY,
    },
    data: {
        toNumber: '',
    },
};

const App = () => {
    const meetingManager = new useMeetingManager();
    const [phoneNumber, setPhone] = useState('');
    const [meetingId, setMeetingId] = useState('');

    const DialButtonProps = {
        icon: <Dialer />,
        onClick: (event) => handleDialOut(event),
        label: 'Dial',
    };

    const EndButtonProps = {
        icon: <Phone />,
        onClick: (event) => handleUpdate(event),
        label: 'End',
    };

    const VALID_PHONE_NUMBER = /^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})\s*$/;

    const handlePhoneChange = (event) => setPhone(event.target.value);

    const handleDialOut = async (event) => {
        event.preventDefault();
        if (!VALID_PHONE_NUMBER.test(phoneNumber)) {
            console.log('Bad Phone Number');
        } else {
            request.url = API_URL + 'dial';
            request.data.toNumber = phoneNumber;
            console.info(`request: ${JSON.stringify(request)}`);
            try {
                const dialOutResponse = await axios(request);
                const joinInfo = {
                    meetingInfo: dialOutResponse.data.joinInfo.Meeting,
                    attendeeInfo: dialOutResponse.data.joinInfo.Attendee[0],
                };
                console.info(`joinInfo: ${JSON.stringify(joinInfo)}`);
                await meetingManager.join(joinInfo);
                await meetingManager.start();
                console.log('Meeting started');
                setMeetingId(joinInfo.meetingInfo.MeetingId);
            } catch (err) {
                console.log(err);
            }
        }
    };

    const handleUpdate = async (event) => {
        event.preventDefault();
        request.url = API_URL + 'update';
        request.data.update = 'end';
        request.data.meetingId = meetingId;
        console.info(`request: ${JSON.stringify(request)}`);
        try {
            const updateResponse = await axios(request);
            console.info(`updateResponse: ${JSON.stringfy(updateResponse)}`);
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className="controls-box">
            <Grid
                style={{ height: '30vh' }}
                gridGap=".25rem"
                css="padding: 150px"
                gridAutoFlow=""
                gridTemplateColumns="5fr 1fr 1fr 1fr 1fr"
                gridTemplateRows="auto"
                gridTemplateAreas='
                    "form button button button button"
                '
            >
                <ControlBar showLabels={true} responsive={true} layout="undocked-horizontal">
                    <Cell gridArea="form" css="width: 450px">
                        <FormField
                            field={Input}
                            label="Phone Number"
                            css="width: 350px; padding: 20px"
                            value={phoneNumber}
                            fieldProps={{ phoneNumber: 'phoneNumber', placeholder: 'Enter Phone Number to Dial' }}
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
            </Grid>
            <div id="video"></div>
        </div>
    );
};

export default App;
