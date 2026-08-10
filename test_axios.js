const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('https://api.openf1.org/v1/location', {
      params: { session_key: 9472, 'date>=': '2024-03-02T15:00:00Z', 'date<': '2024-03-02T15:01:00Z' }
    });
    console.log('STATUS:', res.status);
    console.log('DATA PREFIX:', JSON.stringify(res.data).substring(0, 100));
  } catch (err) {
    console.error('ERROR:', err.response ? err.response.status : err.message);
    if (err.response) {
      console.error('RESPONSE BODY:', err.response.data);
    }
    console.error('URL THAT WAS HIT:', err.request.res ? err.request.res.responseUrl : 'unknown');
  }
}

test();
