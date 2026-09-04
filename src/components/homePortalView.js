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
      <div class="portal-home-container">
        <!-- Top Gov Utility Bar (Official Portal Header) -->
        <div class="portal-utility-bar">
          <div class="util-left">
            <span><i class="fa-solid fa-phone"></i> Toll-Free Helpline: <strong>1800-11-8888</strong> (09:45 AM - 06:15 PM IST)</span>
            <span class="util-sep">|</span>
            <span><i class="fa-solid fa-envelope"></i> Support Email: <strong>support.fra-dss@tribal.gov.in</strong></span>
          </div>
          <div class="util-right">
            <a href="#portal-services" class="util-link">Skip to Main Content</a>
            <span class="util-sep">|</span>
            <div class="lang-switch-badge">
              <i class="fa-solid fa-circle-check text-emerald"></i>
              <span>English (Official)</span>
            </div>
            <span class="util-sep">|</span>
            <div class="a11y-controls">
              <button class="a11y-btn" title="Decrease Font">A-</button>
              <button class="a11y-btn active" title="Default Font">A</button>
              <button class="a11y-btn" title="Increase Font">A+</button>
            </div>
          </div>
        </div>

        <!-- Gov Portal Hero Banner (MoTA Official Identity) -->
        <div class="portal-hero-banner">
          <div class="hero-carousel-track">
            <div class="hero-slide active">
              <div class="hero-bg-overlay"></div>
              <div class="hero-content">
                <div class="gov-emblem-badge">
                  <i class="fa-solid fa-landmark"></i>
                  <span>Ministry of Tribal Affairs | Government of India</span>
                </div>
                <h1 class="hero-title">National Forest Rights Act (FRA 2006) Decision Support & WebGIS Cadastral Portal</h1>
                <p class="hero-subtitle">
                  AI-Powered Geospatial Monitoring, Statutory Anomaly Detection & Executive Decision Support for Gram Sabhas, SDLCs, DLCs, and State Nodal Agencies
                </p>
                <div class="hero-cta-group">
                  <button class="btn btn-hero-primary" data-nav="map-view">
                    <i class="fa-solid fa-map-location-dot"></i>
                    <span>Launch WebGIS Map</span>
                  </button>
                  <button class="btn btn-hero-secondary" data-nav="dashboard-view">
                    <i class="fa-solid fa-chart-line"></i>
                    <span>Executive Analytics</span>
                  </button>
                  <button class="btn btn-hero-accent" data-nav="anomaly-view">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span>Anomaly Triage Queue</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Hero Ticker Stats (National MoTA Aggregate) -->
          <div class="hero-live-stats-bar">
            <div class="hero-stat-box">
              <span class="stat-num">${(NATIONWIDE_SUMMARY.totalClaimsReceived / 100000).toFixed(2)} Lakh</span>
              <span class="stat-lbl"><i class="fa-solid fa-folder-open"></i> Total Claims Received</span>
            </div>
            <div class="hero-stat-box success">
              <span class="stat-num">${(NATIONWIDE_SUMMARY.totalTitlesConferred / 100000).toFixed(2)} Lakh</span>
              <span class="stat-lbl"><i class="fa-solid fa-certificate"></i> Titles Conferred</span>
            </div>
            <div class="hero-stat-box warning">
              <span class="stat-num">${(NATIONWIDE_SUMMARY.totalExtentDistributedHa / 100000).toFixed(2)} Lakh Ha</span>
              <span class="stat-lbl"><i class="fa-solid fa-mountain-sun"></i> Forest Land Titled</span>
            </div>
            <div class="hero-stat-box info">
              <span class="stat-num">${NATIONWIDE_SUMMARY.allIndiaRecognitionRate}%</span>
              <span class="stat-lbl"><i class="fa-solid fa-percent"></i> All-India Recognition Rate</span>
            </div>
          </div>
        </div>

        <!-- Main Section: Grid Services (Left) + Announcements Board (Right) -->
        <div class="portal-main-layout" id="portal-services">
          <!-- Left: 12 Pill-shaped Service Tiles (Official Portal Service Grid) -->
          <div class="services-column">
            <div class="section-heading-bar">
              <div class="heading-title">
                <i class="fa-solid fa-grip"></i>
                <h2>Key Citizen & Administrative Services (Portal Modules)</h2>
              </div>
              <span class="heading-tag">12 Active Services</span>
            </div>

            <div class="bhulekh-pill-grid">
              <button class="bhulekh-pill-btn" data-nav="claims-table-view">
                <div class="pill-icon"><i class="fa-solid fa-file-lines"></i></div>
                <div class="pill-text">
                  <strong>Claims Registry & Verification</strong>
                  <span>Search, verify, and track claim dossiers</span>
                </div>
              </button>

              <button class="bhulekh-pill-btn highlight" data-nav="map-view">
                <div class="pill-icon"><i class="fa-solid fa-map"></i></div>
                <div class="pill-text">
                  <strong>WebGIS Cadastral Map View</strong>
                  <span>Interactive parcels, layers & boundaries</span>
                </div>
              </button>

              <button class="bhulekh-pill-btn" data-nav="dashboard-view">
                <div class="pill-icon"><i class="fa-solid fa-chart-pie"></i></div>
                <div class="pill-text">
                  <strong>Executive Analytics & Reports</strong>
                  <span>State & district comparative charts</span>
                </div>
              </button>

              <button class="bhulekh-pill-btn warning" data-nav="anomaly-view">
                <div class="pill-icon"><i class="fa-solid fa-shield-halved"></i></div>
                <div class="pill-text">
                  <strong>Statutory Anomaly Triage Queue</strong>
                  <span>Rule 12A, SLA & 4 Ha ceiling engine</span>
                </div>
              </button>

              <button class="bhulekh-pill-btn ai-special" data-nav="ai-assistant-view">
                <div class="pill-icon"><i class="fa-solid fa-brain"></i></div>
                <div class="pill-text">
                  <strong>Gemini AI Legal Copilot</strong>
                  <span>Grounded legal RAG & compliance audits</span>
                </div>
              </button>

              <button class="bhulekh-pill-btn" data-action="open-thane-focus">
                <div class="pill-icon"><i class="fa-solid fa-location-crosshairs"></i></div>
                <div class="pill-text">
                  <strong>Thane District Official Hub</strong>
                  <span>18,528 verified government claims</span>
                </div>
              </button>

              <button class="bhulekh-pill-btn" data-action="open-nationwide-section">
                <div class="pill-icon"><i class="fa-solid fa-flag"></i></div>
                <div class="pill-text">
                  <strong>Nationwide MoTA Progress</strong>
                  <span>14+ States All-India registry table</span>
                </div>
              </button>

              <button class="bhulekh-pill-btn" data-action="open-data-modal">
                <div class="pill-icon"><i class="fa-solid fa-download"></i></div>
                <div class="pill-text">
                  <strong>Open Government Data</strong>
                  <span>Download official CSVs & GeoJSON</span>
                </div>
              </button>

              <button class="bhulekh-pill-btn" data-action="generate-brief">
                <div class="pill-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
                <div class="pill-text">
                  <strong>AI Executive Intelligence Brief</strong>
                  <span>One-click ministerial dossier generator</span>
                </div>
              </button>

              <button class="bhulekh-pill-btn" data-action="show-knowledge-base">
                <div class="pill-icon"><i class="fa-solid fa-book-scale"></i></div>
                <div class="pill-text">
                  <strong>Statutory Rules & Guidelines</strong>
                  <span>FRA 2006 legal clauses & precedents</span>
                </div>
              </button>

              <button class="bhulekh-pill-btn" data-nav="map-view" data-layer="reserves">
                <div class="pill-icon"><i class="fa-solid fa-tree"></i></div>
                <div class="pill-text">
                  <strong>Tiger Reserves & Protected Zones</strong>
                  <span>Critical habitat & core buffer layers</span>
                </div>
              </button>

              <button class="bhulekh-pill-btn" data-action="open-helpdesk">
                <div class="pill-icon"><i class="fa-solid fa-headset"></i></div>
                <div class="pill-text">
                  <strong>Grievance Redressal & Helpdesk</strong>
                  <span>Dispute escalation & Nodal support</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Right: Notice & Announcements Board (Official Live Circulars) -->
          <div class="announcements-column">
            <div class="announcement-card">
              <div class="announcement-header">
                <div class="ann-title">
                  <i class="fa-solid fa-newspaper"></i>
                  <h3>Official Announcements & Live Circulars</h3>
                </div>
                <span class="live-pulse-dot"></span>
              </div>

              <div class="announcement-list">
                <div class="ann-item critical" data-action="focus-thane-otfd">
                  <div class="ann-badge-bar">
                    <span class="badge badge-danger">Critical Anomaly Alert</span>
                    <span class="ann-date">04 Sep 2026</span>
                  </div>
                  <h4 class="ann-headline">Thane District: 90.7% Rejection Rate on OTFD Claims</h4>
                  <p class="ann-snippet">
                    5,045 claims rejected across Ulhasnagar (100%), Kalyan (98.7%), and Bhiwandi (86.8%). Flagged for lack of mandatory Section 12A speaking orders.
                  </p>
                  <a href="javascript:void(0)" class="ann-action-link"><i class="fa-solid fa-arrow-right"></i> Inspect Anomaly in Triage Queue</a>
                </div>

                <div class="ann-item warning" data-action="focus-thane-sla">
                  <div class="ann-badge-bar">
                    <span class="badge badge-warning">SLA Timeline Breach</span>
                    <span class="ann-date">02 Sep 2026</span>
                  </div>
                  <h4 class="ann-headline">Bhiwandi & Thane SDLCs: 2,437 Claims Pending > 180 Days</h4>
                  <p class="ann-snippet">
                    Statutory resolution benchmark exceeded at the Sub-Divisional level. System has prepared expedited Rule 12A procedural notices.
                  </p>
                  <a href="javascript:void(0)" class="ann-action-link"><i class="fa-solid fa-arrow-right"></i> Review Draft Notice</a>
                </div>

                <div class="ann-item info" data-action="open-nationwide-section">
                  <div class="ann-badge-bar">
                    <span class="badge badge-primary">MoTA Nationwide Update</span>
                    <span class="ann-date">28 Aug 2026</span>
                  </div>
                  <h4 class="ann-headline">23.86 Lakh Titles Conferred Across All Indian States</h4>
                  <p class="ann-snippet">
                    Odisha leads with a 71.7% recognition rate; Madhya Pradesh and Chhattisgarh continue large-scale digitization of community forest rights.
                  </p>
                  <a href="javascript:void(0)" class="ann-action-link"><i class="fa-solid fa-arrow-right"></i> View Nationwide State Table</a>
                </div>

                <div class="ann-item success">
                  <div class="ann-badge-bar">
                    <span class="badge badge-success">AI Engine Status</span>
                    <span class="ann-date">15 Aug 2026</span>
                  </div>
                  <h4 class="ann-headline">Gemini 3.6 Flash Legal AI Engine Active & Grounded</h4>
                  <p class="ann-snippet">
                    Live verification against FRA 2006 statutory rules, Section 4(6) 4 Ha ceiling compliance, and Gram Sabha resolution quorum checks.
                  </p>
                </div>
              </div>

              <!-- Quick Demo Shortcuts for Hackathon Judges -->
              <div class="demo-shortcuts-box">
                <h5><i class="fa-solid fa-bolt"></i> Guided Demo Scenarios (For Judges):</h5>
                <div class="demo-buttons">
                  <button class="btn btn-sm btn-outline-warning" data-demo="otfd-rejection">1. Thane OTFD Rejection Anomaly (90.7%)</button>
                  <button class="btn btn-sm btn-outline-danger" data-demo="sla-breach">2. Bhiwandi 180-Day SLA Delay</button>
                  <button class="btn btn-sm btn-outline-primary" data-demo="reserve-overlap">3. Similipal Wildlife Sanctuary Overlap</button>
                  <button class="btn btn-sm btn-outline-cyan" data-demo="area-violation">4. Section 4(6) 4 Ha Ceiling Violation</button>
                </div>
              </div>
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
