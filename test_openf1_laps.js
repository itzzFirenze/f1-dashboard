const https = require('https');

const options = {
  hostname: 'api.openf1.org',
  path: '/v1/laps?session_key=9472',
  method: 'GET',
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const laps = JSON.parse(data);
      if (laps.length > 0) {
        const earliest = laps.reduce((min, lap) => new Date(lap.date_start) < new Date(min.date_start) ? lap : min, laps[0]);
        console.log(`Earliest lap start: ${earliest.date_start}`);
      } else {
        console.log('No lap data');
      }
    } catch (e) {
      console.log('Error parsing JSON');
    }
  });
});
req.end();
