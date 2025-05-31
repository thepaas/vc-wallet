import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

import { Page } from '@components';
import { handleGenerateTestValues } from './add.api';

const GenerateQr = () => {
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');

  const [data, setSetsetData] = useState('');

  const submit = async () => {
    if (!username || !dob) return alert('Fill your username and birthdate!');

    const res = await handleGenerateTestValues(username, dob);
    if (!res) throw new Error('Failed to generate credentials!');
    const { claimsInput, jwt } = res;

    const data = {
      jwt,
      claimsInput,
    };

    setSetsetData(JSON.stringify(data));
  };

  return (
    <Page>
      <div style={{ padding: '20px' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <span>Username</span>
          <input
            value={username}
            style={{
              padding: '10px 15px',
              border: '2px solid #ccc',
              borderRadius: '10px',
            }}
            type='text'
            placeholder=''
            onChange={(e) => setUsername(e.target.value)}
          />
          <span>Date of birth</span>
          <input
            style={{
              padding: '10px 15px',
              border: '2px solid #ccc',
              borderRadius: '10px',
            }}
            type='date'
            placeholder='Date of birth'
            onChange={(e) => setDob(e.target.value)}
          />

          <button
            style={{
              marginTop: 10,
              padding: '15px 25px',
              border: '2px solid #ccc',
              borderRadius: '10px',
              cursor: 'pointer',
              background: '#fbfbfb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              fontSize: '17px',
            }}
            onClick={submit}
          >
            Generate test credential
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 10,
            marginTop: '2rem',
          }}
        >
          {!!data && <QRCodeCanvas size={335} value={data} />}
        </div>
      </div>
    </Page>
  );
};

export default GenerateQr;
