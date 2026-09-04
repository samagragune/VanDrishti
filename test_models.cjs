const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.join(__dirname, '.env');
const content = fs.readFileSync(envPath, 'utf8');
const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
const apiKey = match[1].trim();

const prompt = {
  contents: [
    {
      role: 'user',
      parts: [
        {
          text: 'Explain Section 4(6) of FRA 2006 in one concise sentence for a Forest Nodal Officer.'
        }
      ]
    }
  ]
};

const payload = JSON.stringify(prompt);

function testModel(modelName) {
  return new Promise((resolve) => {
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
          resolve({ model: modelName, status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ model: modelName, status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => resolve({ model: modelName, error: err.message }));
    req.write(payload);
    req.end();
  });
}

async function run() {
  const models = ['gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-2.5-flash'];
  for (const m of models) {
    console.log(`\nTesting ${m}...`);
    const res = await testModel(m);
    console.log('Status:', res.status);
    if (res.status === 200) {
      console.log('Success! Response:\n', res.body.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      console.log('Error:', JSON.stringify(res.body?.error || res.body || res.raw));
    }
  }
}

run();
