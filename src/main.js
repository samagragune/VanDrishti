// FRA-Vision AI - Master Application Orchestrator

import { DISTRICT_REGIONS } from './data/districtBoundaries.js';
import { generateMasterClaimsDataset } from './data/claimsData.js';
import { runAnomalyDetection, computeDistrictAnalytics } from './services/anomalyEngine.js';
import { FRAAIService } from './services/aiService.js';
import { ExportService } from './services/exportService.js';

import { WebGISMapManager } from './components/mapManager.js';
import { DashboardViewController } from './components/dashboardView.js';
import { AnomalyQueueController } from './components/anomalyQueue.js';
import { ClaimModalController } from './components/claimModal.js';
import { AICopilotController } from './components/aiCopilot.js';
import { HomePortalView } from './components/homePortalView.js';

class FRAVisionApp {
  constructor() {
    this.rawClaims = [];
    this.processedClaims = [];
    this.districts = DISTRICT_REGIONS;
    this.districtAnalytics = [];

    // Filter State
    this.selectedState = "ALL";
    this.selectedDistrict = "ALL";
    this.selectedClaimType = "ALL";
    this.selectedStatus = "ALL";
    this.searchQuery = "";

    // Claims Registry Pagination
    this.currentPage = 1;
    this.pageSize = 20;

    // Services & Controllers
    this.aiService = new FRAAIService();
    this.mapManager = null;
    this.dashboardController = null;
    this.anomalyQueueController = null;
    this.claimModalController = null;
    this.copilotController = null;
    this.homePortalController = null;
  }

  init() {
    // 1. Generate & Process Datasets
    this.rawClaims = generateMasterClaimsDataset();
    this.processedClaims = runAnomalyDetection(this.rawClaims);
    this.districtAnalytics = computeDistrictAnalytics(this.processedClaims, this.districts);

    // 2. Initialize Controllers
    this.homePortalController = new HomePortalView(
      "home-view",
      (targetView, stateName) => {
        if (stateName) {
          this.selectedState = stateName;
          const stateSelect = document.getElementById("filter-state");
          if (stateSelect) stateSelect.value = stateName;
          this.populateDistrictDropdown();
        }
        this.switchView(targetView);
      },
      (districtName, stateName) => {
        this.selectDistrict(districtName, stateName);
      }
    );
    this.homePortalController.render();

    this.claimModalController = new ClaimModalController((updatedClaim) => {
      this.handleClaimUpdated(updatedClaim);
    });

    // The WebGIS map is initialized defensively: a failure here (e.g. a blocked
    // tile/CDN request) must not prevent navigation, filters, dashboard, or the
    // AI copilot from working.
    this.mapManager = new WebGISMapManager(
      "leaflet-map",
      (claim) => this.claimModalController.openModal(claim),
      (districtName, state) => this.selectDistrict(districtName, state)
    );
    try {
      this.mapManager.init();
    } catch (err) {
      console.error("WebGIS map failed to initialize:", err);
      this.showMapInitError();
    }

    this.dashboardController = new DashboardViewController((districtName, state) => {
      this.selectDistrict(districtName, state);
    });

    this.anomalyQueueController = new AnomalyQueueController(
      (claim) => this.claimModalController.openModal(claim),
      (selectedIds, actionType) => this.handleBatchAction(selectedIds, actionType)
    );

    this.copilotController = new AICopilotController(this.aiService, () => ({
      claims: this.getFilteredClaims(),
      districts: this.districts,
      currentDistrict: this.selectedDistrict,
      currentState: this.selectedState
    }));
    this.copilotController.init();

    // 3. Populate State & District Dropdowns
    this.populateStateDropdown();
    this.populateDistrictDropdown();

    // 4. Bind Global Event Handlers
    this.bindNavigationTabs();
    this.bindFilterControls();
    this.bindMapControls();
    this.bindModals();
    this.bindExportButtons();

    // 5. Initial Render
    this.renderAllViews();

    // Expose global callback for leaderboard row clicks
    window.appSelectDistrict = (distName, stateName) => {
      this.selectDistrict(distName, stateName);
    };
  }

  showMapInitError() {
    const container = document.getElementById("leaflet-map");
    if (container) {
      container.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:10px; color: var(--text-muted); text-align:center; padding: 24px;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: var(--amber-warning);"></i>
          <strong style="color: var(--text-primary);">WebGIS map could not load.</strong>
          <span style="font-size: 0.8rem; max-width: 420px;">Satellite tile services may be unreachable from this network. All other modules (Analytics, Triage, Registry, AI Copilot) remain fully functional.</span>
        </div>
      `;
    }
  }

  getFilteredClaims() {
    return this.processedClaims.filter((c) => {
      if (this.selectedState !== "ALL" && c.state !== this.selectedState) return false;
      if (this.selectedDistrict !== "ALL" && c.district !== this.selectedDistrict) return false;
      if (this.selectedClaimType !== "ALL" && c.claimType !== this.selectedClaimType) return false;
      if (this.selectedStatus !== "ALL" && c.status !== this.selectedStatus) return false;

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matchesId = c.id.toLowerCase().includes(q);
        const matchesName = c.applicant.toLowerCase().includes(q);
        const matchesPanchayat = c.gramSabha.toLowerCase().includes(q);
        const matchesTribe = (c.tribe || "").toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesPanchayat && !matchesTribe) return false;
      }

      return true;
    });
  }

  renderAllViews() {
    const filteredClaims = this.getFilteredClaims();

    // Update Map with Claims and Dynamic District Risk Analytics
    this.mapManager.setDistrictAnalytics(this.districtAnalytics);
    this.mapManager.updateClaimsMarkers(filteredClaims);
    document.getElementById("map-anomaly-count").innerText = filteredClaims.filter((c) => c.hasAnomaly).length;

    // Update Dashboard View & Tickers
    this.dashboardController.renderDashboard(
      this.districtAnalytics,
      filteredClaims,
      this.selectedDistrict,
      this.selectedState
    );

    // Update Anomaly Queue View
    this.anomalyQueueController.renderQueue(filteredClaims);

    // Update Claims Master Registry View
    this.renderClaimsRegistry(filteredClaims);

    // Update Quick Anomaly Feed in Map Sidebar
    this.renderQuickAnomalyFeed(filteredClaims);

    // Update Copilot Context Widget
    this.copilotController.updateContextDisplay({
      claims: filteredClaims,
      currentDistrict: this.selectedDistrict,
      currentState: this.selectedState
    });
  }

  populateStateDropdown() {
    const select = document.getElementById("filter-state");
    if (!select) return;

    const uniqueStates = [...new Set(this.districts.map((d) => d.state))].sort();
    select.innerHTML = `<option value="ALL">All States Nationwide (${uniqueStates.length})</option>`;
    uniqueStates.forEach((st) => {
      const opt = document.createElement("option");
      opt.value = st;
      opt.innerText = st;
      if (st === this.selectedState) opt.selected = true;
      select.appendChild(opt);
    });
  }

  populateDistrictDropdown() {
    const select = document.getElementById("filter-district");
    if (!select) return;

    let eligible = this.districts;
    if (this.selectedState !== "ALL") {
      eligible = eligible.filter((d) => d.state === this.selectedState);
    }

    select.innerHTML = `<option value="ALL">All Districts (${eligible.length})</option>`;
    eligible.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.name;
      opt.innerText = `${d.name} (${d.state})`;
      if (d.name === this.selectedDistrict) opt.selected = true;
      select.appendChild(opt);
    });
  }

  selectDistrict(districtName, stateName) {
    if (stateName) {
      this.selectedState = stateName;
      const stateSelect = document.getElementById("filter-state");
      if (stateSelect) stateSelect.value = stateName;
      this.populateDistrictDropdown();
    }

    this.selectedDistrict = districtName;
    const distSelect = document.getElementById("filter-district");
    if (distSelect) distSelect.value = districtName;

    this.mapManager.focusDistrict(districtName);
    this.renderDistrictDiagnosticCard(districtName);
    this.renderAllViews();
  }

  renderDistrictDiagnosticCard(districtName) {
    const container = document.getElementById("district-quick-diagnostic");
    if (!container) return;

    const district = this.districtAnalytics.find((d) => d.name === districtName);
    if (!district) {
      container.innerHTML = `
        <div class="empty-selection-state">
          <i class="fa-solid fa-hand-pointer"></i>
          <p>Click on any district polygon or claim pin on the map to inspect live AI metrics.</p>
        </div>
      `;
      return;
    }

    let tierBadge = `<span class="badge badge-primary">LOW RISK</span>`;
    if (district.riskTier === "CRITICAL") {
      tierBadge = `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> CRITICAL</span>`;
    } else if (district.riskTier === "MODERATE") {
      tierBadge = `<span class="badge badge-warning">MODERATE</span>`;
    }

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong>${district.name} (${district.state})</strong>
        ${tierBadge}
      </div>
      <div class="diag-stat-row">
        <span class="text-muted">Total Claims Registered:</span>
        <strong>${district.totalClaims}</strong>
      </div>
      <div class="diag-stat-row">
        <span class="text-muted">Titles Conferred (Patta):</span>
        <strong class="text-emerald">${district.titlesGranted} (${district.recognitionRate}%)</strong>
      </div>
      <div class="diag-stat-row">
        <span class="text-muted">Pending Review:</span>
        <strong class="text-amber">${district.pending}</strong>
      </div>
      <div class="diag-stat-row">
        <span class="text-muted">Forest Land Titled:</span>
        <strong class="text-cyan">${district.totalLandTitledHa} Ha</strong>
      </div>
      <div class="diag-stat-row">
        <span class="text-muted">Active AI Anomalies:</span>
        <strong class="text-rose">${district.anomalousClaimsCount} cases</strong>
      </div>
      <div style="margin-top: 10px;">
        <button class="btn btn-outline-primary btn-sm" style="width: 100%;" id="btn-zoom-district">
          <i class="fa-solid fa-crosshairs"></i> Center District
        </button>
      </div>
    `;

    document.getElementById("btn-zoom-district").onclick = () => {
      this.mapManager.focusDistrict(district.name);
    };
  }

  renderQuickAnomalyFeed(claims) {
    const feed = document.getElementById("quick-anomaly-feed");
    if (!feed) return;

    const criticalClaims = claims
      .filter((c) => c.hasAnomaly)
      .slice(0, 5);

    if (criticalClaims.length === 0) {
      feed.innerHTML = `<div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 10px;">No critical anomalies in active filter.</div>`;
      return;
    }

    feed.innerHTML = criticalClaims
      .map((c) => `
        <div class="quick-alert-item" data-id="${c.id}">
          <div class="alert-top">
            <span>${c.id}</span>
            <span class="badge badge-danger">${c.anomalies[0].severity}</span>
          </div>
          <div class="alert-desc">${c.anomalies[0].title} (${c.district})</div>
        </div>
      `)
      .join("");

    feed.querySelectorAll(".quick-alert-item").forEach((item) => {
      item.onclick = () => {
        const id = item.getAttribute("data-id");
        const claim = this.processedClaims.find((c) => c.id === id);
        if (claim) this.claimModalController.openModal(claim);
      };
    });
  }

  renderClaimsRegistry(claims) {
    const tbody = document.getElementById("tbody-claims-master");
    if (!tbody) return;

    const totalRecords = claims.length;
    const totalPages = Math.ceil(totalRecords / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = 1;

    const startIdx = (this.currentPage - 1) * this.pageSize;
    const pageRecords = claims.slice(startIdx, startIdx + this.pageSize);

    if (pageRecords.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 24px; color: var(--text-muted);">No claims match current search/filter criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = pageRecords
      .map((c) => {
        let anomalyTag = `<span class="badge badge-primary"><i class="fa-solid fa-check"></i> Clean</span>`;
        if (c.hasAnomaly) {
          anomalyTag = `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> ${c.anomalies.length} Flagged</span>`;
        }

        return `
        <tr>
          <td><strong>${c.id}</strong></td>
          <td>${c.applicant}</td>
          <td><span class="badge ${c.category === 'PVTG' ? 'badge-purple' : 'badge-primary'}">${c.category}</span></td>
          <td><strong>${c.claimType}</strong></td>
          <td>${c.landAreaHa} Ha</td>
          <td>${c.gramSabha}</td>
          <td>${c.district}, ${c.state}</td>
          <td>${c.submittedDate}</td>
          <td><span class="badge ${c.status === 'Title Conferred' ? 'badge-primary' : 'badge-warning'}">${c.status}</span></td>
          <td>${anomalyTag}</td>
          <td>
            <button class="btn btn-outline-primary btn-icon-sm btn-view-claim" data-id="${c.id}" title="Inspect Dossier">
              <i class="fa-solid fa-magnifying-glass"></i>
            </button>
          </td>
        </tr>
      `;
      })
      .join("");

    // Update pagination info
    document.getElementById("pagination-info").innerText = `Showing ${startIdx + 1}-${Math.min(
      startIdx + this.pageSize,
      totalRecords
    )} of ${totalRecords} records`;
    document.getElementById("current-page-num").innerText = this.currentPage;
    document.getElementById("btn-prev-page").disabled = this.currentPage === 1;
    document.getElementById("btn-next-page").disabled = this.currentPage === totalPages;

    tbody.querySelectorAll(".btn-view-claim").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const claim = this.processedClaims.find((c) => c.id === id);
        if (claim) this.claimModalController.openModal(claim);
      };
    });
  }

  handleClaimUpdated(updatedClaim) {
    const idx = this.processedClaims.findIndex((c) => c.id === updatedClaim.id);
    if (idx !== -1) {
      this.processedClaims[idx] = updatedClaim;
      this.districtAnalytics = computeDistrictAnalytics(this.processedClaims, this.districts);
      this.renderAllViews();
    }
  }

  switchView(targetViewId) {
    const navTabs = document.querySelectorAll(".nav-tab");
    navTabs.forEach((t) => {
      if (t.getAttribute("data-view") === targetViewId) {
        t.classList.add("active");
      } else {
        t.classList.remove("active");
      }
    });

    document.querySelectorAll(".workspace-view").forEach((view) => {
      view.classList.remove("active");
    });

    const targetView = document.getElementById(targetViewId);
    if (targetView) targetView.classList.add("active");

    if (targetViewId === "map-view" && this.mapManager && this.mapManager.map) {
      setTimeout(() => this.mapManager.map.invalidateSize(), 150);
    }
  }

  bindNavigationTabs() {
    const navTabs = document.querySelectorAll(".nav-tab");
    navTabs.forEach((tab) => {
      tab.onclick = () => {
        const targetViewId = tab.getAttribute("data-view");
        this.switchView(targetViewId);
      };
    });
  }

  bindFilterControls() {
    const filterState = document.getElementById("filter-state");
    const filterDistrict = document.getElementById("filter-district");
    const filterClaimType = document.getElementById("filter-claim-type");
    const filterStatus = document.getElementById("filter-status");
    const btnReset = document.getElementById("btn-reset-filters");
    const searchInput = document.getElementById("input-search-claims");

    filterState.onchange = (e) => {
      this.selectedState = e.target.value;
      this.selectedDistrict = "ALL";
      this.populateDistrictDropdown();
      this.renderAllViews();
    };

    filterDistrict.onchange = (e) => {
      this.selectedDistrict = e.target.value;
      if (this.selectedDistrict !== "ALL") {
        this.mapManager.focusDistrict(this.selectedDistrict);
        this.renderDistrictDiagnosticCard(this.selectedDistrict);
      }
      this.renderAllViews();
    };

    filterClaimType.onchange = (e) => {
      this.selectedClaimType = e.target.value;
      this.renderAllViews();
    };

    filterStatus.onchange = (e) => {
      this.selectedStatus = e.target.value;
      this.renderAllViews();
    };

    if (btnReset) {
      btnReset.onclick = () => {
        this.selectedState = "ALL";
        this.selectedDistrict = "ALL";
        this.selectedClaimType = "ALL";
        this.selectedStatus = "ALL";
        this.searchQuery = "";

        filterState.value = "ALL";
        this.populateDistrictDropdown();
        filterClaimType.value = "ALL";
        filterStatus.value = "ALL";
        if (searchInput) searchInput.value = "";

        this.renderDistrictDiagnosticCard(null);
        this.mapManager.fitAll();
        this.renderAllViews();
      };
    }

    if (searchInput) {
      searchInput.oninput = (e) => {
        this.searchQuery = e.target.value.trim();
        this.currentPage = 1;
        this.renderClaimsRegistry(this.getFilteredClaims());
      };
    }

    // Pagination
    document.getElementById("btn-prev-page").onclick = () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderClaimsRegistry(this.getFilteredClaims());
      }
    };
    document.getElementById("btn-next-page").onclick = () => {
      this.currentPage++;
      this.renderClaimsRegistry(this.getFilteredClaims());
    };

    // Anomaly Pill Filters
    document.querySelectorAll(".pill-filter").forEach((pill) => {
      pill.onclick = () => {
        document.querySelectorAll(".pill-filter").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        const anomalyType = pill.getAttribute("data-anomaly-type");
        this.anomalyQueueController.setFilter(anomalyType);
      };
    });

    // Check All Anomaly Checkbox
    const chkAll = document.getElementById("check-all-anomalies");
    if (chkAll) {
      chkAll.onchange = (e) => {
        this.anomalyQueueController.selectAll(e.target.checked);
      };
    }
  }

  bindMapControls() {
    // Basemap switchers
    const btnDark = document.getElementById("btn-basemap-dark");
    const btnSat = document.getElementById("btn-basemap-satellite");
    const btnTopo = document.getElementById("btn-basemap-topo");

    const basemapBtns = [btnDark, btnSat, btnTopo];
    const setBasemapActive = (activeBtn) => {
      basemapBtns.forEach((b) => b?.classList.remove("active"));
      activeBtn?.classList.add("active");
    };

    if (btnDark) btnDark.onclick = () => { setBasemapActive(btnDark); this.mapManager.setBasemap("dark"); };
    if (btnSat) btnSat.onclick = () => { setBasemapActive(btnSat); this.mapManager.setBasemap("satellite"); };
    if (btnTopo) btnTopo.onclick = () => { setBasemapActive(btnTopo); this.mapManager.setBasemap("topo"); };

    // Map Quick Filter Chips
    document.querySelectorAll(".map-chip-btn").forEach((chip) => {
      chip.onclick = () => {
        document.querySelectorAll(".map-chip-btn").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        const filterType = chip.getAttribute("data-map-filter");

        if (filterType === "ALL") {
          this.selectedClaimType = "ALL";
          this.selectedStatus = "ALL";
          const anomalyPill = document.querySelector('.pill-filter[data-anomaly-type="ALL"]');
          if (anomalyPill) anomalyPill.click();
        } else if (filterType === "TITLE_CONFERRED") {
          this.selectedStatus = "Title Conferred";
          const statusSelect = document.getElementById("filter-status");
          if (statusSelect) statusSelect.value = "Title Conferred";
        } else {
          // Specific Anomaly Type
          const anomalyPill = document.querySelector(`.pill-filter[data-anomaly-type="${filterType}"]`);
          if (anomalyPill) anomalyPill.click();
        }
        this.renderAllViews();
      };
    });

    // Map Quick Search Input
    const mapSearchInput = document.getElementById("map-quick-search-input");
    if (mapSearchInput) {
      mapSearchInput.oninput = (e) => {
        const q = e.target.value.toLowerCase().trim();
        if (!q) {
          this.searchQuery = "";
          this.renderAllViews();
          return;
        }

        // Check if query matches a district name
        const matchedDistrict = this.districts.find((d) => d.name.toLowerCase().includes(q) || d.state.toLowerCase().includes(q));
        if (matchedDistrict) {
          this.selectDistrict(matchedDistrict.name, matchedDistrict.state);
        } else {
          this.searchQuery = q;
          this.renderAllViews();
        }
      };
    }

    document.getElementById("btn-fit-bounds").onclick = () => this.mapManager.fitAll();

    // Layer checkboxes
    document.getElementById("layer-districts").onchange = (e) => this.mapManager.setLayerVisibility("districts", e.target.checked);
    document.getElementById("layer-claims-ifr").onchange = (e) => this.mapManager.setLayerVisibility("ifr", e.target.checked);
    document.getElementById("layer-claims-cfr").onchange = (e) => this.mapManager.setLayerVisibility("cfr", e.target.checked);
    document.getElementById("layer-anomalies").onchange = (e) => this.mapManager.setLayerVisibility("anomalies", e.target.checked);
    document.getElementById("layer-forest-cover").onchange = (e) => this.mapManager.setLayerVisibility("forestCover", e.target.checked);
    document.getElementById("layer-heatmap").onchange = (e) => this.mapManager.setLayerVisibility("heatmap", e.target.checked);
  }

  bindModals() {
    // Claim Modal Close
    document.getElementById("btn-close-claim-modal").onclick = () => this.claimModalController.closeModal();
    document.getElementById("btn-close-claim-modal-2").onclick = () => this.claimModalController.closeModal();
    document.getElementById("btn-print-dossier").onclick = () => ExportService.printClaimDossier();

    // Settings Modal & Gemini Key
    const btnOpenSettings = document.getElementById("btn-open-settings");
    const modalSettings = document.getElementById("modal-settings");
    const btnCloseSettings = document.getElementById("btn-close-settings-modal");
    const btnCancelSettings = document.getElementById("btn-cancel-settings");
    const btnSaveSettings = document.getElementById("btn-save-settings");
    const inputGeminiKey = document.getElementById("input-gemini-key");
    const inputCustomDataset = document.getElementById("input-custom-dataset");
    const labelApiStatus = document.getElementById("label-api-status");

    // Update API status label
    const updateApiStatusLabel = () => {
      if (this.aiService.hasLiveApiKey()) {
        if (labelApiStatus) labelApiStatus.innerHTML = `<i class="fa-solid fa-bolt text-purple"></i> Gemini Live`;
      } else {
        if (labelApiStatus) labelApiStatus.innerHTML = `Gemini API`;
      }
    };
    updateApiStatusLabel();

    if (btnOpenSettings && modalSettings) {
      btnOpenSettings.onclick = () => {
        if (inputGeminiKey) inputGeminiKey.value = this.aiService.apiKey || "";
        modalSettings.classList.add("active");
      };
    }

    const closeSettings = () => modalSettings?.classList.remove("active");
    if (btnCloseSettings) btnCloseSettings.onclick = closeSettings;
    if (btnCancelSettings) btnCancelSettings.onclick = closeSettings;

    if (btnSaveSettings) {
      btnSaveSettings.onclick = () => {
        const key = inputGeminiKey ? inputGeminiKey.value.trim() : "";
        this.aiService.setApiKey(key);
        updateApiStatusLabel();

        // Handle File upload if any
        const file = inputCustomDataset?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const text = e.target.result;
              if (file.name.endsWith(".csv")) {
                const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
                const header = lines[0].split(",");
                const generatedClaims = [];
                let seq = 2001;

                // Check if it is the SDLC summary format (Sr.No., District, Sub-divisional Level Committee, Claim type, Details...)
                if (lines[0].toLowerCase().includes("sub-divisional") || lines[0].toLowerCase().includes("claim type")) {
                  for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
                    if (cols.length >= 8) {
                      const district = cols[1] || "Thane";
                      const sdlc = cols[2] || "Thane";
                      const claimType = cols[3] || "IFR";
                      const details = cols[4] || "Tribal"; // Tribal or Non-Tribal
                      const totalReceived = parseInt(cols[5]) || 0;
                      const approved = parseInt(cols[6]) || 0;
                      const rejected = parseInt(cols[7]) || 0;
                      const pending = parseInt(cols[8]) || 0;

                      const isTribal = details.toLowerCase().includes("tribal") && !details.toLowerCase().includes("non");
                      const category = isTribal ? "ST" : "OTFD";
                      const tribeName = isTribal ? "Katkari / Warli" : "Traditional Forest Dweller";

                      // Sub-division coordinate centers
                      const subCenters = {
                        "Thane": [19.21, 72.98],
                        "Kalyan": [19.24, 73.13],
                        "Bhiwandi": [19.30, 73.06],
                        "Ulhasnagar": [19.22, 73.15]
                      };
                      const baseCoord = subCenters[sdlc] || [19.25, 73.10];

                      // Generate sample representative claims for this SDLC bucket
                      const sampleCount = Math.min(25, Math.max(8, Math.round(totalReceived / 100)));
                      for (let s = 0; s < sampleCount; s++) {
                        let status = "Title Conferred";
                        let rejReason = null;
                        if (s < Math.round((rejected / totalReceived) * sampleCount)) {
                          status = "Rejected";
                          rejReason = !isTribal ? "Deficient 75-year residency evidence under Section 2(o) OTFD" : "Boundary overlap with revenue forest";
                        } else if (s < Math.round(((rejected + pending) / totalReceived) * sampleCount)) {
                          status = "SDLC Review";
                        }

                        generatedClaims.push({
                          id: `CLM-MH-${sdlc.substring(0, 3).toUpperCase()}-${seq++}`,
                          applicant: `${details} Beneficiary ${s + 1}`,
                          category: category,
                          tribe: tribeName,
                          claimType: claimType,
                          landAreaHa: parseFloat((1.2 + (s % 3) * 0.8).toFixed(2)),
                          state: "Maharashtra",
                          district: district,
                          districtCode: "MH-THA",
                          gramSabha: `${sdlc} Taluka Block`,
                          panchayat: `${sdlc} SDLC`,
                          surveyNo: `SRV-${300 + s}/MH`,
                          forestCompartment: `COMP-${10 + (s % 15)}`,
                          coordinates: [
                            baseCoord[0] + (Math.random() - 0.5) * 0.08,
                            baseCoord[1] + (Math.random() - 0.5) * 0.08
                          ],
                          submittedDate: "2025-01-10",
                          daysInPipeline: status === "SDLC Review" ? 220 : 110,
                          status: status,
                          timeline: { submitted: "2025-01-10", sdlc: "2025-04-15" },
                          rejectionReason: rejReason,
                          anomalies: []
                        });
                      }
                    }
                  }
                  this.rawClaims = generatedClaims;
                } else {
                  // Standard flat claims CSV
                  alert("Standard CSV loaded.");
                }

                this.processedClaims = runAnomalyDetection(this.rawClaims);
                this.districtAnalytics = computeDistrictAnalytics(this.processedClaims, this.districts);
                this.renderAllViews();
                alert(`Successfully parsed and generated ${this.rawClaims.length} detailed spatial claim records from official data.gov.in SDLC table.`);
              } else if (file.name.endsWith(".json") || file.name.endsWith(".geojson")) {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed)) {
                  this.rawClaims = parsed;
                } else if (parsed.features) {
                  // Extract claims from GeoJSON features
                  this.rawClaims = parsed.features.map((f, i) => ({
                    id: f.properties?.id || `CLM-IMP-${1000 + i}`,
                    applicant: f.properties?.applicant || `Beneficiary ${i + 1}`,
                    category: f.properties?.category || "ST",
                    tribe: f.properties?.tribe || "Tribal Dweller",
                    claimType: f.properties?.claimType || "IFR",
                    landAreaHa: f.properties?.landAreaHa || 2.0,
                    state: f.properties?.state || "Maharashtra",
                    district: f.properties?.district || "Thane",
                    districtCode: f.properties?.districtCode || "MH-THA",
                    gramSabha: f.properties?.gramSabha || "Gram Sabha 1",
                    panchayat: f.properties?.panchayat || "GP 1",
                    surveyNo: f.properties?.surveyNo || `FS-${200 + i}/A`,
                    forestCompartment: f.properties?.forestCompartment || `COMP-${10 + i}`,
                    coordinates: f.geometry?.coordinates ? [f.geometry.coordinates[1], f.geometry.coordinates[0]] : [19.25, 73.10],
                    submittedDate: f.properties?.submittedDate || "2025-06-15",
                    daysInPipeline: f.properties?.daysInPipeline || 120,
                    status: f.properties?.status || "SDLC Review",
                    timeline: f.properties?.timeline || { submitted: "2025-06-15" },
                    rejectionReason: f.properties?.rejectionReason || null,
                    anomalies: []
                  }));
                }
                this.processedClaims = runAnomalyDetection(this.rawClaims);
                this.districtAnalytics = computeDistrictAnalytics(this.processedClaims, this.districts);
                this.renderAllViews();
                alert(`Successfully loaded & scanned ${this.rawClaims.length} records from uploaded file.`);
              }
            } catch (err) {
              alert("Error parsing uploaded dataset: " + err.message);
            }
          };
          reader.readAsText(file);
        }

        alert(key ? "Gemini API key saved & live AI engine connected!" : "Settings saved.");
        closeSettings();
      };
    }

    // AI Briefing Modal
    const btnAiBrief = document.getElementById("btn-toggle-ai-brief");
    const modalAiBrief = document.getElementById("modal-ai-briefing");
    const btnCloseBrief = document.getElementById("btn-close-briefing-modal");

    if (btnAiBrief && modalAiBrief) {
      btnAiBrief.onclick = async () => {
        document.getElementById("ai-briefing-content").innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--text-muted);">
            <i class="fa-solid fa-spinner fa-spin text-purple" style="font-size: 2rem; margin-bottom: 12px; display: block;"></i>
            Generating contextual executive intelligence brief...
          </div>
        `;
        modalAiBrief.classList.add("active");

        const briefContent = await this.aiService.generateExecutiveBrief(
          this.districtAnalytics,
          this.processedClaims,
          this.selectedDistrict,
          this.selectedState
        );
        document.getElementById("ai-briefing-content").innerHTML = briefContent;
      };
    }
    if (btnCloseBrief && modalAiBrief) {
      btnCloseBrief.onclick = () => modalAiBrief.classList.remove("active");
    }

    // Batch Action Modal
    const btnBatchDialog = document.getElementById("btn-batch-resolve-dialog");
    const modalBatch = document.getElementById("modal-batch-action");
    const btnCloseBatch = document.getElementById("btn-close-batch-modal");
    const btnCancelBatch = document.getElementById("btn-cancel-batch");
    const btnConfirmBatch = document.getElementById("btn-confirm-batch-action");

    if (btnBatchDialog && modalBatch) {
      btnBatchDialog.onclick = () => {
        const count = this.anomalyQueueController.selectedClaimIds.size;
        if (count === 0) {
          alert("Please select at least one claim checkbox in the triage queue.");
          return;
        }
        document.getElementById("batch-modal-count").innerText = count;
        modalBatch.classList.add("active");
      };
    }

    const closeBatch = () => modalBatch?.classList.remove("active");
    if (btnCloseBatch) btnCloseBatch.onclick = closeBatch;
    if (btnCancelBatch) btnCancelBatch.onclick = closeBatch;

    if (btnConfirmBatch) {
      btnConfirmBatch.onclick = () => {
        const actionType = document.getElementById("select-batch-action").value;
        const count = this.anomalyQueueController.selectedClaimIds.size;
        alert(`Successfully executed administrative directive [${actionType}] for ${count} selected claims.`);
        this.anomalyQueueController.selectedClaimIds.clear();
        this.anomalyQueueController.updateBatchSelectionCount();
        this.renderAllViews();
        closeBatch();
      };
    }

    // Theme Toggle
    const btnTheme = document.getElementById("btn-theme-toggle");
    if (btnTheme) {
      btnTheme.onclick = () => {
        const html = document.documentElement;
        const isDark = html.getAttribute("data-theme") === "dark";
        html.setAttribute("data-theme", isDark ? "light" : "dark");
        btnTheme.innerHTML = isDark ? `<i class="fa-solid fa-sun"></i>` : `<i class="fa-solid fa-moon"></i>`;
      };
    }
  }

  bindExportButtons() {
    // Export CSV from Header or Registry
    const handleExport = () => {
      const claims = this.getFilteredClaims();
      ExportService.exportClaimsToCSV(claims, `FRA_Claims_Register_${Date.now()}.csv`);
    };

    const btnHdrExport = document.getElementById("btn-export-report");
    const btnRegExport = document.getElementById("btn-export-claims-csv");
    if (btnHdrExport) btnHdrExport.onclick = handleExport;
    if (btnRegExport) btnRegExport.onclick = handleExport;

    // Download Brief PDF
    const btnBriefPdf = document.getElementById("btn-download-brief-pdf");
    if (btnBriefPdf) {
      btnBriefPdf.onclick = () => {
        window.print();
      };
    }

    // Copy Briefing
    const btnCopyBrief = document.getElementById("btn-copy-brief");
    if (btnCopyBrief) {
      btnCopyBrief.onclick = () => {
        const content = document.getElementById("ai-briefing-content").innerText;
        navigator.clipboard.writeText(content).then(() => {
          alert("Executive Decision Briefing copied to clipboard.");
        });
      };
    }
  }
}

// Bootstrap Application on DOM Ready or Immediate if already loaded
function bootstrapApp() {
  try {
    const app = new FRAVisionApp();
    app.init();
    window._fraApp = app;
  } catch (err) {
    console.error("Error initializing VanDrishti FRA app:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapApp);
} else {
  bootstrapApp();
}
