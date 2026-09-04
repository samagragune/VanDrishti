// Claim Inspector & Lifecycle Modal Controller for FRA Monitoring

import L from 'leaflet';

export class ClaimModalController {
  constructor(onUpdateClaimCallback) {
    this.onUpdateClaim = onUpdateClaimCallback;
    this.currentClaim = null;
    this.miniMap = null;
    this.miniMapMarker = null;
  }

  openModal(claim) {
    this.currentClaim = claim;
    const modal = document.getElementById("modal-claim-inspector");
    if (!modal) return;

    // Set Header
    document.getElementById("modal-claim-id").innerText = claim.id;
    document.getElementById("modal-claim-applicant").innerText = `${claim.applicant} | ${claim.district}, ${claim.state}`;
    document.getElementById("modal-claim-type").innerText = claim.claimType;

    // Set Details Grid
    document.getElementById("insp-applicant").innerText = claim.applicant;
    document.getElementById("insp-tribe").innerText = `${claim.category} (${claim.tribe || "General ST"})`;
    document.getElementById("insp-type").innerText = claim.claimType;
    document.getElementById("insp-area").innerText = `${claim.landAreaHa} Ha`;
    document.getElementById("insp-panchayat").innerText = `${claim.gramSabha}, ${claim.panchayat}`;
    document.getElementById("insp-location").innerText = `${claim.district}, ${claim.state}`;
    document.getElementById("insp-survey").innerText = `${claim.surveyNo} (Comp: ${claim.forestCompartment})`;
    document.getElementById("insp-coords").innerText = `${claim.coordinates[0].toFixed(4)}, ${claim.coordinates[1].toFixed(4)}`;
    document.getElementById("insp-date").innerText = claim.submittedDate;
    document.getElementById("insp-days").innerText = `${claim.daysInPipeline} days`;

    // Render Stepper Timeline
    this.renderStepper(claim);

    // Render Anomaly Diagnostic Box
    this.renderAnomalyDiagnostic(claim);

    // Render Evidence Checkbox States
    const otfdChk = document.getElementById("chk-otfd-proof");
    if (otfdChk) {
      const isOtfdWithProof = claim.category === "OTFD" && !claim.anomalies.some((a) => a.type === "OTFD_PROOF_GAP");
      otfdChk.querySelector("input").checked = isOtfdWithProof;
      otfdChk.style.display = claim.category === "OTFD" ? "flex" : "none";
    }

    modal.classList.add("active");

    // Initialize or re-center mini map
    setTimeout(() => {
      this.initMiniMap(claim.coordinates);
    }, 150);

    // Bind Action Buttons
    this.bindActionButtons();
  }

  closeModal() {
    const modal = document.getElementById("modal-claim-inspector");
    if (modal) modal.classList.remove("active");
  }

  renderStepper(claim) {
    const stepGS = document.getElementById("step-gram-sabha");
    const stepSDLC = document.getElementById("step-sdlc");
    const stepDLC = document.getElementById("step-dlc");
    const stepTitle = document.getElementById("step-patta");

    const dateGS = document.getElementById("step-date-gs");
    const dateSDLC = document.getElementById("step-date-sdlc");
    const dateDLC = document.getElementById("step-date-dlc");
    const dateTitle = document.getElementById("step-date-title");

    // Reset classes
    [stepGS, stepSDLC, stepDLC, stepTitle].forEach((s) => {
      s.className = "timeline-step";
    });

    if (claim.status === "Gram Sabha Verification") {
      stepGS.classList.add("step-active");
      dateGS.innerText = "In Verification";
      dateSDLC.innerText = "Pending";
      dateDLC.innerText = "Pending";
      dateTitle.innerText = "Pending";
    } else if (claim.status === "SDLC Review") {
      stepGS.classList.add("step-complete");
      stepSDLC.classList.add("step-active");
      dateGS.innerText = claim.timeline.gramSabha || "Passed";
      dateSDLC.innerText = "Under Scrutiny";
      dateDLC.innerText = "Pending";
      dateTitle.innerText = "Pending";
    } else if (claim.status === "DLC Approval") {
      stepGS.classList.add("step-complete");
      stepSDLC.classList.add("step-complete");
      stepDLC.classList.add("step-active");
      dateGS.innerText = claim.timeline.gramSabha || "Passed";
      dateSDLC.innerText = claim.timeline.sdlc || "Verified";
      dateDLC.innerText = "Awaiting DM Sanction";
      dateTitle.innerText = "Pending";
    } else if (claim.status === "Title Conferred") {
      stepGS.classList.add("step-complete");
      stepSDLC.classList.add("step-complete");
      stepDLC.classList.add("step-complete");
      stepTitle.classList.add("step-complete");
      dateGS.innerText = claim.timeline.gramSabha || "Passed";
      dateSDLC.innerText = claim.timeline.sdlc || "Verified";
      dateDLC.innerText = claim.timeline.dlc || "Sanctioned";
      dateTitle.innerText = claim.timeline.title || "Patta Issued";
    } else if (claim.status === "Rejected") {
      stepGS.classList.add("step-complete");
      stepSDLC.classList.add("step-rejected");
      dateGS.innerText = claim.timeline.gramSabha || "Passed";
      dateSDLC.innerText = "Rejected with Order";
      dateDLC.innerText = "Closed";
      dateTitle.innerText = "N/A";
    }
  }

  renderAnomalyDiagnostic(claim) {
    const box = document.getElementById("insp-anomaly-box");
    if (!box) return;

    if (!claim.hasAnomaly || claim.anomalies.length === 0) {
      box.style.background = "rgba(16, 185, 129, 0.08)";
      box.style.borderColor = "rgba(16, 185, 129, 0.3)";
      box.innerHTML = `
        <div style="color: var(--emerald-primary); font-weight: 600;">
          <i class="fa-solid fa-circle-check"></i> Statutory Compliance Verified
        </div>
        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">
          This claim passes all Section 4(6) area thresholds, SLA resolution timelines, and spatial boundary conflict verifications.
        </p>
      `;
      return;
    }

    box.style.background = "rgba(244, 63, 94, 0.08)";
    box.style.borderColor = "rgba(244, 63, 94, 0.3)";
    box.innerHTML = `
      <div style="color: var(--rose-danger); font-weight: 700; display: flex; justify-content: space-between; align-items: center;">
        <span><i class="fa-solid fa-triangle-exclamation"></i> ${claim.anomalies.length} AI Anomalies Detected</span>
        <span class="badge badge-danger">Risk Score: ${claim.riskScore}/100</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
        ${claim.anomalies
          .map(
            (a) => `
          <div style="border-left: 2px solid ${a.severity === 'CRITICAL' ? 'var(--rose-danger)' : 'var(--amber-warning)'}; padding-left: 8px;">
            <strong style="color: var(--text-primary); font-size: 0.775rem;">${a.title}</strong>
            <p style="font-size: 0.725rem; color: var(--text-secondary); margin-top: 2px;">${a.finding}</p>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  initMiniMap(coords) {
    const container = document.getElementById("inspector-mini-map");
    if (!container) return;

    if (!this.miniMap) {
      this.miniMap = L.map("inspector-mini-map", {
        center: coords,
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(this.miniMap);

      this.miniMapMarker = L.marker(coords).addTo(this.miniMap);
    } else {
      this.miniMap.invalidateSize();
      this.miniMap.setView(coords, 14);
      this.miniMapMarker.setLatLng(coords);
    }
  }

  bindActionButtons() {
    const btnApprove = document.getElementById("btn-action-approve");
    const btnResurvey = document.getElementById("btn-action-resurvey");
    const btnEscalate = document.getElementById("btn-action-escalate");

    if (btnApprove) {
      btnApprove.onclick = () => {
        if (!this.currentClaim) return;
        this.currentClaim.status = "Title Conferred";
        this.currentClaim.timeline.title = new Date().toISOString().split("T")[0];
        this.currentClaim.hasAnomaly = false;
        this.currentClaim.anomalies = [];
        this.currentClaim.riskScore = 5;

        alert(`Title Deed (Patta) officially granted for Claim ${this.currentClaim.id}. Record updated in state registry.`);
        if (this.onUpdateClaim) this.onUpdateClaim(this.currentClaim);
        this.openModal(this.currentClaim);
      };
    }

    if (btnResurvey) {
      btnResurvey.onclick = () => {
        if (!this.currentClaim) return;
        alert(`Joint Forest-Revenue Re-Survey order dispatched to Tahsildar / DFO for Claim ${this.currentClaim.id}.`);
      };
    }

    if (btnEscalate) {
      btnEscalate.onclick = () => {
        if (!this.currentClaim) return;
        this.currentClaim.status = "DLC Approval";
        this.currentClaim.timeline.sdlc = new Date().toISOString().split("T")[0];
        alert(`Claim ${this.currentClaim.id} escalated to District Level Committee for Collector review.`);
        if (this.onUpdateClaim) this.onUpdateClaim(this.currentClaim);
        this.openModal(this.currentClaim);
      };
    }
  }
}
