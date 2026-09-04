const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env file
const envPath = path.join(__dirname, '.env');
let apiKey = '';
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
  if (match) {
    apiKey = match[1].trim();
  }
}

console.log('Testing Gemini API with key:', apiKey.substring(0, 10) + '...');

const prompt = {
  contents: [
    {
      role: 'user',
      parts: [
        {
          text: 'You are an AI for Forest Rights Act (FRA 2006) monitoring. In 2 sentences, explain how Section 4(6) prevents illegal deforestation.'
        }
      ]
    }
  ]
};

const payload = JSON.stringify(prompt);

function testModel(modelName) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('\n--- 1. Testing gemini-2.5-flash ---');
  try {
    const res1 = await testModel('gemini-2.5-flash');
    console.log('Status Code:', res1.status);
    if (res1.status === 200) {
      console.log('Gemini 2.5 Flash Response:\n', res1.body.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      console.log('Response Error:', JSON.stringify(res1.body || res1.raw));
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  console.log('\n--- 2. Testing gemini-1.5-flash ---');
  try {
    const res2 = await testModel('gemini-1.5-flash');
    console.log('Status Code:', res2.status);
    if (res2.status === 200) {
      console.log('Gemini 1.5 Flash Response:\n', res2.body.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      console.log('Response Error:', JSON.stringify(res2.body || res2.raw));
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

runTests();
