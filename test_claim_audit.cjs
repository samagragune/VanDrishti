const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.join(__dirname, '.env');
const content = fs.readFileSync(envPath, 'utf8');
const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
const apiKey = match[1].trim();

const sampleClaim = {
  id: "CLM-MP-DIN-1018",
  applicant: "Somaru Baiga",
  category: "PVTG",
  tribe: "Baiga",
  claimType: "IFR",
  landAreaHa: 5.85,
  state: "Madhya Pradesh",
  district: "Dindori",
  gramSabha: "Samnapur",
  surveyNo: "FS-402/B",
  forestCompartment: "COMP-24",
  coordinates: [22.92, 81.12],
  daysInPipeline: 245,
  status: "SDLC Review",
  rejectionReason: null
};

const systemInstruction = "You are the automated Chief Compliance and Geospatial Intelligence Engine for India's Ministry of Tribal Affairs (MoTA). You evaluate Forest Rights Act 2006 (FRA) claims against statutory rules: Section 4(6) 4.0 Ha limit, Section 2(o) OTFD 75-year rule, Section 6 multi-tier committees, Rule 12A speaking order mandates, and SLA limits (180 days). Output a concise structured report with: 1. Risk Score (0-100) and Severity Tier, 2. Specific Statutory Violations, 3. Collector / DLC Recommended Directive.";

const userPrompt = `
Audit this active FRA claim for statutory anomalies:
- Claim ID: ${sampleClaim.id}
- Applicant: ${sampleClaim.applicant} (${sampleClaim.category} - Tribe: ${sampleClaim.tribe})
- Claim Type: ${sampleClaim.claimType}
- Claimed Forest Area: ${sampleClaim.landAreaHa} Hectares
- Location: Gram Sabha ${sampleClaim.gramSabha}, District ${sampleClaim.district}, State ${sampleClaim.state}
- Khasra/Survey: ${sampleClaim.surveyNo}, Compartment ${sampleClaim.forestCompartment}
- Coordinates: [${sampleClaim.coordinates.join(', ')}]
- Days in pipeline: ${sampleClaim.daysInPipeline} days (Stage: ${sampleClaim.status})
`;

const payload = JSON.stringify({
  systemInstruction: { parts: [{ text: systemInstruction }] },
  contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('Sending live anomaly audit request to Gemini 3.6 Flash...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('\n================ LIVE GEMINI ANOMALY AUDIT RESULT ================');
    console.log(result.candidates?.[0]?.content?.parts?.[0]?.text);
    console.log('==================================================================');
  });
});

req.on('error', e => console.error(e));
req.write(payload);
req.end();
