import React from 'react';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

const PhoneNumberInput = ({ isRegistered, phoneNumber, setPhoneNumber }) => {
    if (!isRegistered) {
        return null;
    }

    return (
        <PhoneInput
            style={{ maxWidth: '300px', paddingTop: '20px' }}
            defaultCountry="US"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={setPhoneNumber}
        />
    );
};

export default PhoneNumberInput;
