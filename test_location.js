const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/telemetry/location?session_key=9472&date%3E%3D=2024-03-02T15:00:00.000Z&date%3C=2024-03-02T15:01:00.000Z',
  method: 'GET',
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`BODY PREFIX: ${data.substring(0, 300)}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
