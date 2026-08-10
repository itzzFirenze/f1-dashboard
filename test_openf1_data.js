const https = require('https');

// Check when the first location data point actually appears for session 9472 (Bahrain 2024)
const options = {
  hostname: 'api.openf1.org',
  path: '/v1/location?session_key=9472',
  method: 'GET',
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const locations = JSON.parse(data);
      if (locations.length > 0) {
        // Find the earliest date
        const earliest = locations.reduce((min, loc) => new Date(loc.date) < new Date(min.date) ? loc : min, locations[0]);
        console.log(`Total data points: ${locations.length}`);
        console.log(`Earliest data point: ${earliest.date}`);
      } else {
        console.log('No data points returned');
      }
    } catch (e) {
      console.log('Error parsing JSON:', data.substring(0, 100));
    }
  });
});
req.end();
