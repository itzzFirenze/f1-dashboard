const https = require('https');

const options = {
  hostname: 'api.openf1.org',
  path: '/v1/location?session_key=9472&date%3E%3D=2024-03-02T15:03:42.000Z&date%3C=2024-03-02T15:03:52.000Z',
  method: 'GET',
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`BODY PREFIX: ${data.substring(0, 300)}`);
  });
});
req.end();
