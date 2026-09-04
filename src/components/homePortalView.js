// Government Portal Homepage & Nationwide MoTA Registry Component
// Official Forest Rights Act (FRA 2006) WebGIS & Decision Support Portal

import { NATIONWIDE_FRA_DATA, NATIONWIDE_SUMMARY } from '../data/nationwideData.js';

export class HomePortalView {
  constructor(containerId, onNavigateCallback, onSelectDistrictCallback) {
    this.containerId = containerId;
    this.onNavigate = onNavigateCallback;
    this.onSelectDistrict = onSelectDistrictCallback;
    this.activeSlide = 0;
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="portal-home-container clean-central-mode">
        
        <!-- Central Minimalist Hero Section -->
        <div class="central-hero-wrap">
          <div class="central-brand-emblem">
            <img src="/vandrishti-logo.png" alt="VanDrishti Emblem" class="central-logo-img" />
          </div>

          <h1 class="central-title">VanDrishti</h1>
          <p class="central-subtitle">
            Forest Rights Act (FRA 2006) Geospatial Cadastral Intelligence & AI Statutory Decision Platform
          </p>

          <!-- 3 Distanced Action Buttons -->
          <div class="central-action-row">
            <button class="btn btn-central-primary" data-nav="map-view">
              <i class="fa-solid fa-map-location-dot"></i>
              <span>Launch WebGIS Satellite Map</span>
            </button>
            <button class="btn btn-central-secondary" data-nav="dashboard-view">
              <i class="fa-solid fa-chart-line"></i>
              <span>Executive Analytics</span>
            </button>
            <button class="btn btn-central-accent" data-nav="anomaly-view">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>Anomaly Triage Queue</span>
            </button>
          </div>

          <!-- Minimal Live Stat Strip -->
          <div class="central-stats-strip">
            <div class="central-stat-pill">
              <span class="val">${(NATIONWIDE_SUMMARY.totalClaimsReceived / 100000).toFixed(2)} Lakh</span>
              <span class="lbl">Claims Processed</span>
            </div>
            <div class="central-stat-pill success">
              <span class="val">${(NATIONWIDE_SUMMARY.totalTitlesConferred / 100000).toFixed(2)} Lakh</span>
              <span class="lbl">Titles Conferred</span>
            </div>
            <div class="central-stat-pill info">
              <span class="val">${(NATIONWIDE_SUMMARY.totalExtentDistributedHa / 100000).toFixed(2)} Lakh Ha</span>
              <span class="lbl">Forest Land Titled</span>
            </div>
            <div class="central-stat-pill accent">
              <span class="val">${NATIONWIDE_SUMMARY.allIndiaRecognitionRate}%</span>
              <span class="lbl">Recognition Rate</span>
            </div>
          </div>
        </div>

        <!-- Clean Distanced Options & Modules List (MP Bhulekh / Bhuvan Style Services Matrix) -->
        <div class="central-modules-section" id="portal-services">
          <div class="modules-header">
            <h3><i class="fa-solid fa-grid-2-plus"></i> Official Portal Services & Cadastral Decision Modules</h3>
            <span class="modules-hint">Click any service card to open its dedicated workspace</span>
          </div>

          <div class="central-cards-grid">
            <!-- 1. Claims Master Registry -->
            <div class="central-card" data-nav="claims-table-view">
              <div class="card-icon"><i class="fa-solid fa-file-signature"></i></div>
              <div class="card-info">
                <h4>Land Records & Claims Registry</h4>
                <p>Browse, filter, and inspect Individual (IFR) & Community (CFR) claims dossiers and land records.</p>
              </div>
              <div class="card-arrow"><i class="fa-solid fa-arrow-right"></i></div>
            </div>

            <!-- 2. Cadastral Spatial Map -->
            <div class="central-card" data-nav="map-view">
              <div class="card-icon"><i class="fa-solid fa-map-location-dot"></i></div>
              <div class="card-info">
                <h4>Cadastral Parcel & GIS Map</h4>
                <p>Interactive high-resolution satellite map with district boundaries, forest reserves, and cadastral plots.</p>
              </div>
              <div class="card-arrow"><i class="fa-solid fa-arrow-right"></i></div>
            </div>

            <!-- 3. Executive Analytics & Reporting -->
            <div class="central-card" data-nav="dashboard-view">
              <div class="card-icon"><i class="fa-solid fa-chart-line"></i></div>
              <div class="card-info">
                <h4>Executive Dashboard & Reports</h4>
                <p>Real-time analytics on title conferment rates, disposal velocities, and district-level performance KPIs.</p>
              </div>
              <div class="card-arrow"><i class="fa-solid fa-arrow-right"></i></div>
            </div>

            <!-- 4. Statutory Anomaly Detection -->
            <div class="central-card warning-tint" data-nav="anomaly-view">
              <div class="card-icon"><i class="fa-solid fa-shield-halved"></i></div>
              <div class="card-info">
                <h4>Statutory Anomaly Triage</h4>
                <p>Automated detection of SLA breaches (>180d), Rule 12A violations, and 4 Ha statutory ceiling breaches.</p>
              </div>
              <div class="card-arrow"><i class="fa-solid fa-arrow-right"></i></div>
            </div>

            <!-- 5. AI Legal Assistant -->
            <div class="central-card ai-tint" data-nav="ai-assistant-view">
              <div class="card-icon"><i class="fa-solid fa-brain"></i></div>
              <div class="card-info">
                <h4>AI Legal Copilot & Case Law RAG</h4>
                <p>Ask legal questions grounded in FRA 2006 statutes, High Court precedents, and MoTA operational guidelines.</p>
              </div>
              <div class="card-arrow"><i class="fa-solid fa-arrow-right"></i></div>
            </div>

            <!-- 6. Nationwide Implementation Matrix -->
            <div class="central-card" data-action="open-nationwide-section">
              <div class="card-icon"><i class="fa-solid fa-earth-asia"></i></div>
              <div class="card-info">
                <h4>All-India MoTA Progress Matrix</h4>
                <p>Comprehensive state-wise official registry tracking progress across all 28 Indian states & union territories.</p>
              </div>
              <div class="card-arrow"><i class="fa-solid fa-arrow-right"></i></div>
            </div>
          </div>
        </div>

        <!-- Nationwide State-wise Progress Table Section -->
        <div class="portal-nationwide-section" id="nationwide-progress-block">
          <div class="section-heading-bar">
            <div class="heading-title">
              <i class="fa-solid fa-earth-asia"></i>
              <h2>All-India State-wise Forest Rights Act Implementation Progress</h2>
            </div>
            <span class="heading-tag">Official MoTA Government Dataset</span>
          </div>

          <div class="nationwide-table-card">
            <div class="table-controls-bar">
              <div class="search-input-wrap">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="nationwide-search" class="form-control" placeholder="Search state, region, or PVTG group..." />
              </div>
              <div class="data-source-tag">
                <i class="fa-solid fa-circle-check text-emerald"></i>
                <span>Data Source: Ministry of Tribal Affairs (MoTA) & data.gov.in Official Monthly Progress Reports</span>
              </div>
            </div>

            <div class="table-responsive">
              <table class="table custom-table" id="nationwide-progress-table">
                <thead>
                  <tr>
                    <th>State</th>
                    <th>Region</th>
                    <th>Total Claims Received</th>
                    <th>Titles Conferred</th>
                    <th>Claims Rejected</th>
                    <th>Pending Claims</th>
                    <th>Forest Land Titled (Ha)</th>
                    <th>Recognition Rate</th>
                    <th>Risk Tier</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody id="nationwide-table-body">
                  ${this.renderNationwideRows(NATIONWIDE_FRA_DATA)}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Floating AI Assistant Bubble (Virtual Assistant) -->
        <div class="floating-ai-bubble" id="btn-floating-ai-assistant" title="FRA AI Copilot & Legal Assistant">
          <div class="ai-bubble-avatar">
            <i class="fa-solid fa-comment-dots"></i>
          </div>
          <div class="ai-bubble-tooltip">
            <span>Ask FRA Assistant: <strong>AI Legal Copilot</strong></span>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  renderNationwideRows(data) {
    return data.map((st) => {
      let riskBadge = `<span class="badge badge-success">LOW RISK</span>`;
      if (st.riskCategory === "CRITICAL") riskBadge = `<span class="badge badge-danger">CRITICAL</span>`;
      else if (st.riskCategory === "HIGH") riskBadge = `<span class="badge badge-warning">HIGH ALERT</span>`;
      else if (st.riskCategory === "MODERATE") riskBadge = `<span class="badge badge-primary">MODERATE</span>`;

      const rateClass = st.recognitionRate >= 60 ? 'text-emerald' : (st.recognitionRate >= 40 ? 'text-amber' : 'text-rose');

      return `
        <tr>
          <td>
            <strong>${st.state}</strong>
            <div class="table-subtext">Focus: ${st.focusDistricts.slice(0, 2).join(', ')}</div>
          </td>
          <td>${st.region}</td>
          <td><strong>${st.claimsReceived.toLocaleString()}</strong></td>
          <td class="text-emerald"><strong>${st.titlesConferred.toLocaleString()}</strong></td>
          <td class="text-rose">${st.claimsRejected.toLocaleString()}</td>
          <td class="text-amber">${st.claimsPending.toLocaleString()}</td>
          <td><strong>${st.extentDistributedHa.toLocaleString()} Ha</strong></td>
          <td>
            <div class="rate-cell">
              <strong class="${rateClass}">${st.recognitionRate}%</strong>
              <div class="progress-bar-micro">
                <div class="fill" style="width: ${st.recognitionRate}%; background: ${st.recognitionRate >= 60 ? 'var(--emerald-500)' : (st.recognitionRate >= 40 ? 'var(--amber-500)' : 'var(--rose-500)')}"></div>
              </div>
            </div>
          </td>
          <td>${riskBadge}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary btn-drilldown-state" data-state="${st.state}">
              <i class="fa-solid fa-magnifying-glass-location"></i> View GIS
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  attachEventListeners() {
    // Navigation buttons
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetView = btn.getAttribute('data-nav');
        if (this.onNavigate) this.onNavigate(targetView);
      });
    });

    // Drilldown state button in nationwide table
    document.querySelectorAll('.btn-drilldown-state').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stateName = btn.getAttribute('data-state');
        if (this.onNavigate) {
          this.onNavigate('map-view', stateName);
        }
      });
    });

    // Search filter in nationwide table
    const searchInput = document.getElementById('nationwide-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        const filtered = NATIONWIDE_FRA_DATA.filter(st => 
          st.state.toLowerCase().includes(q) || 
          st.region.toLowerCase().includes(q) || 
          st.focusDistricts.some(d => d.toLowerCase().includes(q)) ||
          st.keyPVTGs.some(p => p.toLowerCase().includes(q))
        );
        const tbody = document.getElementById('nationwide-table-body');
        if (tbody) tbody.innerHTML = this.renderNationwideRows(filtered);
      });
    }

    // Floating AI bot click
    const aiBubble = document.getElementById('btn-floating-ai-assistant');
    if (aiBubble) {
      aiBubble.addEventListener('click', () => {
        if (this.onNavigate) this.onNavigate('ai-assistant-view');
      });
    }

    // Specific quick action buttons
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action === 'open-thane-focus') {
          if (this.onSelectDistrict) this.onSelectDistrict('Thane', 'Maharashtra');
          if (this.onNavigate) this.onNavigate('map-view');
        } else if (action === 'open-nationwide-section') {
          const section = document.getElementById('nationwide-progress-block');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        } else if (action === 'focus-thane-otfd') {
          if (this.onSelectDistrict) this.onSelectDistrict('Thane', 'Maharashtra');
          if (this.onNavigate) this.onNavigate('anomaly-view');
        } else if (action === 'focus-thane-sla') {
          if (this.onSelectDistrict) this.onSelectDistrict('Thane', 'Maharashtra');
          if (this.onNavigate) this.onNavigate('anomaly-view');
        } else if (action === 'generate-brief') {
          const briefBtn = document.getElementById('btn-toggle-ai-brief');
          if (briefBtn) briefBtn.click();
        } else if (action === 'open-data-modal') {
          const exportBtn = document.getElementById('btn-export-report');
          if (exportBtn) exportBtn.click();
        }
      });
    });

    // Demo Shortcuts
    document.querySelectorAll('[data-demo]').forEach(btn => {
      btn.addEventListener('click', () => {
        const demoType = btn.getAttribute('data-demo');
        if (demoType === 'otfd-rejection') {
          if (this.onSelectDistrict) this.onSelectDistrict('Thane', 'Maharashtra');
          if (this.onNavigate) this.onNavigate('anomaly-view');
        } else if (demoType === 'sla-breach') {
          if (this.onSelectDistrict) this.onSelectDistrict('Thane', 'Maharashtra');
          if (this.onNavigate) this.onNavigate('dashboard-view');
        } else if (demoType === 'reserve-overlap') {
          if (this.onSelectDistrict) this.onSelectDistrict('Mayurbhanj', 'Odisha');
          if (this.onNavigate) this.onNavigate('map-view');
        } else if (demoType === 'area-violation') {
          if (this.onSelectDistrict) this.onSelectDistrict('Bastar', 'Chhattisgarh');
          if (this.onNavigate) this.onNavigate('anomaly-view');
        }
      });
    });
  }
}
