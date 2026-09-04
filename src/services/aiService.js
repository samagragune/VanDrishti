// AI Decision Support & Copilot Engine for FRA Monitoring
// Integrated with Google Gemini REST API & local deterministic fallback

import { FRA_LEGAL_KNOWLEDGE } from '../data/knowledgeBase.js';

export class FRAAIService {
  constructor() {
    this.knowledgeBase = FRA_LEGAL_KNOWLEDGE;
    this.apiKey = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) ? import.meta.env.VITE_GEMINI_API_KEY : "";
    this.geminiModel = "gemini-3.6-flash"; // Current Gemini Flash model (verified reachable with live key)
  }

  hasLiveApiKey() {
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }

  /**
   * Calls Google Gemini API with fallback to local intelligence
   */
  async callGemini(prompt, systemInstruction = "") {
    if (!this.hasLiveApiKey()) {
      return null;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        console.warn("Gemini API error, falling back to local engine:", err);
        return null;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || null;
    } catch (e) {
      console.warn("Gemini network call failed, using local engine:", e);
      return null;
    }
  }

  /**
   * Deep AI Anomaly Scanner powered by Gemini
   */
  async scanClaimWithGemini(claim) {
    if (!this.hasLiveApiKey()) return null;

    const systemPrompt = `You are the chief legal and geospatial compliance engine for India's Ministry of Tribal Affairs (MoTA). You evaluate Forest Rights Act 2006 (FRA) claims against statutory rules: Section 4(6) 4.0 Ha ceiling, Section 2(o) OTFD 75-year rule, Section 6 multi-tier committees, Rule 12A speaking order mandates, and SLA limits (180 days). Output a concise markdown assessment with Risk Score (0-100), Anomaly Type, Finding, and Recommended Action.`;

    const userPrompt = `
Evaluate this FRA claim:
- Claim ID: ${claim.id}
- Applicant: ${claim.applicant} (${claim.category} - Tribe: ${claim.tribe || "ST"})
- Type: ${claim.claimType}
- Claimed Area: ${claim.landAreaHa} Hectares
- Location: Gram Sabha ${claim.gramSabha}, District ${claim.district}, State ${claim.state}
- Khasra/Survey: ${claim.surveyNo}, Compartment ${claim.forestCompartment}
- Coordinates: Lat ${claim.coordinates[0]}, Lng ${claim.coordinates[1]}
- Days in pipeline: ${claim.daysInPipeline} days (Current Stage: ${claim.status})
- Rejection reason if any: ${claim.rejectionReason || "N/A"}

Please perform a thorough audit and return:
1. Risk Score (0-100) & Severity (LOW, MODERATE, CRITICAL)
2. Specific FRA 2006 statutory sections violated (if any)
3. Actionable directive for District Collector / DLC.
    `;

    return await this.callGemini(userPrompt, systemPrompt);
  }

  /**
   * Generates Executive Decision Briefing for Nodal Officers and Ministry
   */
  async generateExecutiveBrief(districtAnalytics, claims, selectedDistrict = "ALL", selectedState = "ALL") {
    let relevantDistricts = districtAnalytics;
    let relevantClaims = claims;

    if (selectedState !== "ALL") {
      relevantDistricts = relevantDistricts.filter((d) => d.state === selectedState);
      relevantClaims = relevantClaims.filter((c) => c.state === selectedState);
    }
    if (selectedDistrict !== "ALL") {
      relevantDistricts = relevantDistricts.filter((d) => d.name === selectedDistrict);
      relevantClaims = relevantClaims.filter((c) => c.district === selectedDistrict);
    }

    const totalClaims = relevantClaims.length;
    const totalTitles = relevantClaims.filter((c) => c.status === "Title Conferred").length;
    const totalRejected = relevantClaims.filter((c) => c.status === "Rejected").length;
    const landTitled = relevantClaims
      .filter((c) => c.status === "Title Conferred")
      .reduce((acc, c) => acc + c.landAreaHa, 0)
      .toFixed(1);

    const anomalousClaims = relevantClaims.filter((c) => c.hasAnomaly);
    const slaBreaches = relevantClaims.filter((c) => c.anomalies.some((a) => a.type === "SLA_DELAY")).length;
    const spatialOverlaps = relevantClaims.filter((c) => c.anomalies.some((a) => a.type === "SPATIAL_OVERLAP")).length;
    const areaViolations = relevantClaims.filter((c) => c.anomalies.some((a) => a.type === "AREA_EXCEEDED")).length;

    // Rank most critical districts
    const sortedDistricts = [...relevantDistricts].sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);
    const topVulnerable = sortedDistricts.slice(0, 3);

    // Check if live Gemini API is configured
    if (this.hasLiveApiKey()) {
      const geminiPrompt = `
Generate an official executive decision brief for the District Magistrate / Ministry of Tribal Affairs:
State: ${selectedState}, District: ${selectedDistrict}
Total Claims: ${totalClaims}, Titles Conferred: ${totalTitles} (${landTitled} Ha), Rejected: ${totalRejected}, Active Anomalies: ${anomalousClaims.length}
SLA Breaches (>180d): ${slaBreaches}, Spatial Overlaps: ${spatialOverlaps}, Area >4 Ha Violations: ${areaViolations}
Top Vulnerable Districts: ${topVulnerable.map((d) => `${d.name} (Vulnerability: ${d.vulnerabilityScore}/100, ${d.pending} pending, avg delay ${d.avgDaysStuck} days)`).join(", ")}

Format output in clean HTML with sections:
1. Strategic Executive Summary
2. High-Vulnerability District Hotspots
3. Key AI Compliance Findings & Legal Risks (Section 4(6), Rule 12A(3))
4. 3-Point Action Plan for District Level Committee (DLC)
      `;

      const liveResponse = await this.callGemini(geminiPrompt, "You are the AI Chief Technical Advisor for Forest Rights Act governance. Output clean semantic HTML.");
      if (liveResponse) {
        return `<div class="live-ai-badge" style="margin-bottom: 12px; font-size: 0.75rem; color: var(--purple-ai); font-weight: 600;"><i class="fa-solid fa-bolt"></i> Live Gemini Flash Grounded Response</div>` + liveResponse;
      }
    }

    // Default fast local synthesis
    const recognitionEfficiency = totalClaims > 0 ? ((totalTitles / totalClaims) * 100).toFixed(1) : 0;
    return `
      <div class="brief-section">
        <h4><i class="fa-solid fa-tower-broadcast"></i> Strategic Executive Summary</h4>
        <p>Across the evaluated operational area (<strong>${selectedState === "ALL" ? "National Focus States" : selectedState} ${selectedDistrict !== "ALL" ? `- ${selectedDistrict}` : ""}</strong>), digital surveillance indicates a total volume of <strong>${totalClaims}</strong> FRA claims under monitoring, with <strong>${totalTitles}</strong> titles successfully conferred (${recognitionEfficiency}% overall recognition velocity) over <strong>${landTitled} Hectares</strong> of forest land.</p>
        
        <div class="brief-card-grid">
          <div class="brief-mini-card">
            <span class="text-muted">Total Forest Land Titled</span>
            <strong class="text-cyan">${landTitled} Ha</strong>
          </div>
          <div class="brief-mini-card">
            <span class="text-muted">Critical Anomalies Active</span>
            <strong class="text-amber">${anomalousClaims.length} Claims</strong>
          </div>
          <div class="brief-mini-card">
            <span class="text-muted">SLA Bottlenecks (>180d)</span>
            <strong class="text-rose">${slaBreaches} Cases</strong>
          </div>
        </div>
      </div>

      <div class="brief-section">
        <h4><i class="fa-solid fa-triangle-exclamation text-rose"></i> High-Vulnerability District Hotspots</h4>
        <p>The AI Decision Engine has flagged the following administrative clusters exhibiting acute systemic friction, high rejection outliers, or severe SLA stagnation:</p>
        <ul>
          ${topVulnerable
            .map(
              (d) => `
            <li>
              <strong>${d.name} (${d.state}):</strong> Vulnerability Index <strong>${d.vulnerabilityScore}/100 [${d.riskTier}]</strong>.
              ${d.pending} claims pending adjudication (avg. delay ${d.avgDaysStuck} days). Gross rejection rate: ${d.rejectionRate}%.
            </li>`
            )
            .join("")}
        </ul>
      </div>

      <div class="brief-section">
        <h4><i class="fa-solid fa-shield-halved text-purple"></i> Key AI Compliance Findings & Legal Risks</h4>
        <ul>
          <li><strong>Statutory Area Violations (Section 4(6)):</strong> <strong>${areaViolations} claims</strong> exceed the 4.0 Hectare statutory ceiling. Recommend immediate issuance of curtailment notices to Sub-Divisional Committees.</li>
          <li><strong>Spatial Boundary Overlaps:</strong> <strong>${spatialOverlaps} claims</strong> have overlapping GPS radius vectors in dense forest compartments. High risk of inter-community boundary disputes unless joint GPS DGPS re-surveys are conducted.</li>
          <li><strong>Rule 12A(3) Compliance Deficit:</strong> <strong>${totalRejected} rejected claims</strong> require automated audit to verify if written speaking orders in the vernacular were officially delivered to Gram Sabhas.</li>
        </ul>
      </div>

      <div class="brief-section">
        <h4><i class="fa-solid fa-list-check text-emerald"></i> Recommended Ministerial Action Directives</h4>
        <ol style="margin-left: 20px; line-height: 1.6;">
          <li><strong>Convene Special DLC Fast-Track Adalat:</strong> Mobilize District Collectors in ${topVulnerable.map((d) => d.name).join(", ")} to clear ${slaBreaches} SLA-breached petitions within 30 days.</li>
          <li><strong>Deploy Joint Revenue-Forest Drone / DGPS Units:</strong> Target the ${spatialOverlaps} identified boundary conflict coordinates before title finalization.</li>
          <li><strong>Harmonize OTFD Evidentiary Verification:</strong> Issue standardized guidance clarifying that 75-year residence can be established via secondary elder oral statements under Rule 13(a).</li>
        </ol>
      </div>
    `;
  }

  /**
   * Responds intelligently to user inquiries within the AI Decision Copilot
   */
  async processCopilotQuery(query, activeContext) {
    const q = query.toLowerCase();
    const { claims, districts, currentDistrict, currentState } = activeContext;

    // Check live Gemini
    if (this.hasLiveApiKey()) {
      const prompt = `
Context: Forest Rights Act 2006 (FRA) Decision Support System.
Active State Filter: ${currentState}, District Filter: ${currentDistrict}
Total claims under review: ${claims.length}. Titles conferred: ${claims.filter((c) => c.status === "Title Conferred").length}. Flagged anomalies: ${claims.filter((c) => c.hasAnomaly).length}.

User query: "${query}"

Provide an authoritative, legally grounded response formatted with HTML headers (<h4>), bullet points (<ul>), and bold text. Address specific FRA sections (e.g. Sec 3, 4(6), 2(o), Rule 12A) and offer clear administrative guidance for Nodal Officers.
      `;

      const liveResponse = await this.callGemini(prompt, "You are the FRA Legal & Decision Support AI Copilot for India's Ministry of Tribal Affairs.");
      if (liveResponse) {
        return `<div class="live-ai-badge" style="margin-bottom: 8px; font-size: 0.725rem; color: var(--purple-ai); font-weight: 600;"><i class="fa-solid fa-bolt"></i> Live Gemini Response</div>` + liveResponse;
      }
    }

    // Deterministic rule-based local RAG
    await new Promise((res) => setTimeout(res, 200));

    if (q.includes("brief") || q.includes("executive") || q.includes("summary") || q.includes("bottleneck")) {
      return `
        <h4>Executive Briefing & Strategic Overview</h4>
        <p>Operational assessment for <strong>${currentState === "ALL" ? "All Focus States" : currentState}</strong>:</p>
        <ul>
          <li><strong>Total Claim Registry:</strong> ${claims.length} registered claims.</li>
          <li><strong>Titles Conferred:</strong> ${claims.filter((c) => c.status === "Title Conferred").length} (${(
        (claims.filter((c) => c.status === "Title Conferred").length / claims.length) *
        100
      ).toFixed(1)}% recognition rate).</li>
          <li><strong>Active AI Anomalies:</strong> ${claims.filter((c) => c.hasAnomaly).length} flagged cases requiring administrative triage.</li>
          <li><strong>Pending SDLC/DLC Queue:</strong> ${claims.filter((c) => c.status === "SDLC Review" || c.status === "DLC Approval").length} claims.</li>
        </ul>
        <p><strong>Primary Recommended Directive:</strong> Target Sub-Divisional Committees in high-vulnerability districts with an expedited 14-day clearance mandate for undisputed IFR claims.</p>
      `;
    }

    if (q.includes("4 ha") || q.includes("4.0") || q.includes("area") || q.includes("ceiling") || q.includes("4(6)")) {
      const areaViolations = claims.filter((c) => c.anomalies.some((a) => a.type === "AREA_EXCEEDED"));
      return `
        <h4>Statutory Area Ceiling (Section 4(6) of FRA 2006)</h4>
        <p>Under <strong>Section 4(6) of the Forest Rights Act</strong>, individual forest rights are strictly restricted to actual occupation up to a maximum of <strong>4.0 Hectares (approx. 9.88 acres)</strong>.</p>
        <p><strong>Current Findings:</strong> Flagged <strong>${areaViolations.length} active claims</strong> exceeding this limit. The District Level Committee (DLC) must issue modification orders curtailing the Patta to the verified 4.0 Ha parcel.</p>
      `;
    }

    if (q.includes("otfd") || q.includes("75") || q.includes("generation") || q.includes("2(o)")) {
      return `
        <h4>Other Traditional Forest Dwellers (OTFD) - Section 2(o)</h4>
        <p>Under <strong>Section 2(o) of FRA 2006</strong>, OTFD qualification requires continuous residence for at least <strong>three generations (75 years)</strong> prior to <strong>13th December 2005</strong> (pre-1930 residency).</p>
        <p><strong>Evidence under Rule 13:</strong> Census lists, receipts, or elder statements recorded by Gram Sabha. Lack of revenue records alone is NOT a ground for rejection.</p>
      `;
    }

    if (q.includes("draft") || q.includes("notice") || q.includes("directive") || q.includes("order")) {
      return `
        <h4>Draft Administrative Directive: SLA Expedite Order</h4>
        <div style="background: var(--bg-surface-elevated); padding: 14px; border-radius: 8px; border: 1px solid var(--border-medium); font-family: var(--font-mono); font-size: 0.8rem; line-height: 1.6;">
          <strong>MEMORANDUM / PROCEEDINGS OF THE DISTRICT LEVEL COMMITTEE</strong><br/>
          <strong>Ref No:</strong> MOTA/FRA/EXP-2026/SLA-09<br/>
          <strong>To:</strong> Sub-Divisional Magistrates & SDLC Chairpersons, ${currentDistrict === "ALL" ? "Focus Districts" : currentDistrict}<br/><br/>
          <strong>Subject:</strong> 14-Day Fast-Track Clearance of Pending FRA Claims under Rule 12A.<br/><br/>
          SDLCs are hereby directed to convene extraordinary adjudication sessions within 10 working days to dispose of all undisputed claims exceeding 180-day SLA.<br/><br/>
          <em>By Order of the District Collector</em>
        </div>
      `;
    }

    return `
      <h4>FRA Decision Intelligence Response</h4>
      <p>Regarding your query: "<em>${query}</em>"</p>
      <p>Active dataset contains <strong>${claims.length} claims</strong> across <strong>${districts.length} tribal districts</strong> with <strong>${claims.filter((c) => c.hasAnomaly).length} flagged anomalies</strong>.</p>
      <p>Configure your Gemini API key in the top header settings to enable full contextual generative intelligence.</p>
    `;
  }
}

