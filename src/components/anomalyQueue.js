// Anomaly Triage Queue View Controller for FRA Monitoring

import { ANOMALY_TYPES } from '../services/anomalyEngine.js';

export class AnomalyQueueController {
  constructor(onInspectClaimCallback, onBatchActionCallback) {
    this.onInspectClaim = onInspectClaimCallback;
    this.onBatchAction = onBatchActionCallback;
    this.activeAnomalyFilter = "ALL";
    this.selectedClaimIds = new Set();
    this.claimsWithAnomalies = [];
  }

  renderQueue(claims) {
    this.claimsWithAnomalies = claims.filter((c) => c.hasAnomaly);
    this.updateFilterPillCounts(claims);
    this.renderTable();
  }

  updateFilterPillCounts(claims) {
    const allCount = claims.filter((c) => c.hasAnomaly).length;
    const slaCount = claims.filter((c) => c.anomalies.some((a) => a.type === "SLA_DELAY")).length;
    const overlapCount = claims.filter((c) => c.anomalies.some((a) => a.type === "SPATIAL_OVERLAP")).length;
    const areaCount = claims.filter((c) => c.anomalies.some((a) => a.type === "AREA_EXCEEDED")).length;
    const rejectionCount = claims.filter((c) => c.anomalies.some((a) => a.type === "HIGH_REJECTION")).length;
    const otfdCount = claims.filter((c) => c.anomalies.some((a) => a.type === "OTFD_PROOF_GAP")).length;
    const pipelineCount = claims.filter((c) => c.anomalies.some((a) => a.type === "PIPELINE_OUTLIER")).length;
    const gsRejectionCount = claims.filter((c) => c.anomalies.some((a) => a.type === "GRAM_SABHA_REJECTION_OUTLIER")).length;
    const landOutlierCount = claims.filter((c) => c.anomalies.some((a) => a.type === "LAND_AREA_OUTLIER")).length;

    document.getElementById("pill-count-all").innerText = allCount;
    document.getElementById("pill-count-sla").innerText = slaCount;
    document.getElementById("pill-count-overlap").innerText = overlapCount;
    document.getElementById("pill-count-area").innerText = areaCount;
    document.getElementById("pill-count-rejection").innerText = rejectionCount;
    document.getElementById("pill-count-otfd").innerText = otfdCount;
    document.getElementById("pill-count-pipeline").innerText = pipelineCount;
    document.getElementById("pill-count-gs-rejection").innerText = gsRejectionCount;
    document.getElementById("pill-count-land-outlier").innerText = landOutlierCount;
  }

  setFilter(type) {
    this.activeAnomalyFilter = type;
    this.renderTable();
  }

  renderTable() {
    const tbody = document.getElementById("tbody-anomalies");
    if (!tbody) return;

    let filtered = this.claimsWithAnomalies;
    if (this.activeAnomalyFilter !== "ALL") {
      filtered = filtered.filter((c) =>
        c.anomalies.some((a) => a.type === this.activeAnomalyFilter)
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 30px; color: var(--text-muted);">
            <i class="fa-solid fa-circle-check text-emerald" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
            No active anomalies found for the selected category.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered
      .map((c) => {
        const topAnomaly = c.anomalies[0];
        const isSelected = this.selectedClaimIds.has(c.id);

        let severityBadge = `<span class="badge badge-warning">WARNING</span>`;
        if (topAnomaly.severity === "CRITICAL") {
          severityBadge = `<span class="badge badge-danger"><i class="fa-solid fa-circle-exclamation"></i> CRITICAL (${c.riskScore})</span>`;
        }

        return `
        <tr>
          <td>
            <input type="checkbox" class="chk-anomaly-item" data-id="${c.id}" ${isSelected ? "checked" : ""} />
          </td>
          <td><strong>${c.id}</strong></td>
          <td>
            <div>${c.applicant}</div>
            <span class="text-muted" style="font-size: 0.725rem;">${c.gramSabha} GP</span>
          </td>
          <td>${c.district}, ${c.state}</td>
          <td>
            <span class="badge ${c.category === 'PVTG' ? 'badge-purple' : 'badge-primary'}">${c.category}</span>
            <div style="font-size: 0.725rem; color: var(--text-muted);">${c.tribe || ""}</div>
          </td>
          <td><strong>${c.claimType}</strong> (${c.landAreaHa} Ha)</td>
          <td><span class="badge badge-warning">${c.status}</span></td>
          <td>
            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">
              ${topAnomaly.title}
            </div>
            ${severityBadge}
          </td>
          <td style="max-width: 280px; font-size: 0.75rem; color: var(--text-secondary);">
            ${topAnomaly.finding}
          </td>
          <td>
            <button class="btn btn-primary btn-sm btn-inspect-anomaly" data-id="${c.id}">
              <i class="fa-solid fa-eye"></i> Triage
            </button>
          </td>
        </tr>
      `;
      })
      .join("");

    // Bind event listeners
    tbody.querySelectorAll(".chk-anomaly-item").forEach((chk) => {
      chk.onchange = (e) => {
        const id = e.target.getAttribute("data-id");
        if (e.target.checked) this.selectedClaimIds.add(id);
        else this.selectedClaimIds.delete(id);
        this.updateBatchSelectionCount();
      };
    });

    tbody.querySelectorAll(".btn-inspect-anomaly").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const claim = this.claimsWithAnomalies.find((c) => c.id === id);
        if (claim && this.onInspectClaim) this.onInspectClaim(claim);
      };
    });
  }

  updateBatchSelectionCount() {
    const count = this.selectedClaimIds.size;
    const batchCounter = document.getElementById("batch-selected-count");
    if (batchCounter) batchCounter.innerText = count;
  }

  selectAll(checked) {
    if (checked) {
      this.claimsWithAnomalies.forEach((c) => this.selectedClaimIds.add(c.id));
    } else {
      this.selectedClaimIds.clear();
    }
    this.updateBatchSelectionCount();
    this.renderTable();
  }
}
