const https = require('https');
const querystring = require('querystring');

const clientId = process.env.SPOTIFY_CLIENT_ID || '52d6202d9f254a83bde2c45025ad8cfb';
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '22fde428b1c740699d276bb6b41c15ef';

console.log('Testing Spotify API with Node.js https module...');
console.log('Client ID:', clientId);
console.log('Client Secret exists:', !!clientSecret);

const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
const postData = querystring.stringify({
  'grant_type': 'client_credentials'
});

const options = {
  hostname: 'accounts.spotify.com',
  port: 443,
  path: '/api/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': postData.length,
    'Authorization': 'Basic ' + authString
  }
};

console.log('Making request to:', `https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers));

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', data);
    if (res.statusCode === 200) {
      const parsed = JSON.parse(data);
      console.log('SUCCESS! Access token:', parsed.access_token.substring(0, 20) + '...');
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.write(postData);
req.end();