const https = require('https');

const options1 = {
  hostname: 'api.openf1.org',
  path: '/v1/location?session_key=9472&date%3E%3D=2024-03-02T15:00:00.000Z',
  method: 'GET',
};

const req1 = https.request(options1, (res) => {
  console.log(`URL Encoded STATUS: ${res.statusCode}`);
});
req1.end();

const options2 = {
  hostname: 'api.openf1.org',
  path: '/v1/location?session_key=9472&date>=2024-03-02T15:00:00.000Z',
  method: 'GET',
};

const req2 = https.request(options2, (res) => {
  console.log(`Unencoded STATUS: ${res.statusCode}`);
});
req2.end();
