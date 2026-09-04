const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.join(__dirname, '.env');
const content = fs.readFileSync(envPath, 'utf8');
const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
const token = match[1].trim();

const payload = JSON.stringify({
  contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
});

function testBearer(host, urlPath) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: host,
      path: urlPath,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(payload);
    req.end();
  });
}

async function test() {
  const r1 = await testBearer('generativelanguage.googleapis.com', '/v1beta/models/gemini-1.5-flash:generateContent');
  console.log('GenerativeLanguage with Bearer status:', r1.status, r1.data?.substring(0, 200));
}

test();
