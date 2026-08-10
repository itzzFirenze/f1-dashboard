const https = require('https');

function test(path, label) {
  return new Promise((resolve) => {
    https.get('https://api.openf1.org' + path, (res) => {
      console.log(`${label}: ${res.statusCode}`);
      resolve();
    });
  });
}

async function run() {
  await test('/v1/location?session_key=9472&date%3E=2024-03-02T15:03:42.000Z', 'date> (encoded)');
  await test('/v1/location?session_key=9472&date%3E%3D=2024-03-02T15:03:42.000Z', 'date>= (encoded)');
  await test('/v1/location?session_key=9472&date%3C=2024-03-02T15:03:52.000Z', 'date< (encoded)');
  await test('/v1/location?session_key=9472&date%3C%3D=2024-03-02T15:03:52.000Z', 'date<= (encoded)');
}

run();
