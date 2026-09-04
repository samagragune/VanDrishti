// Executive Dashboard & Chart.js Analytics Controller for FRA Monitoring

import Chart from 'chart.js/auto';

export class DashboardViewController {
  constructor(onSelectDistrictCallback) {
    this.onSelectDistrict = onSelectDistrictCallback;
    this.chartProgress = null;
    this.chartAnomalies = null;
    this.chartTribal = null;
  }

  renderDashboard(districtAnalytics, claims, selectedDistrict = "ALL", selectedState = "ALL") {
    let filteredDistricts = districtAnalytics;
    let filteredClaims = claims;

    if (selectedState !== "ALL") {
      filteredDistricts = filteredDistricts.filter((d) => d.state === selectedState);
      filteredClaims = filteredClaims.filter((c) => c.state === selectedState);
    }
    if (selectedDistrict !== "ALL") {
      filteredDistricts = filteredDistricts.filter((d) => d.name === selectedDistrict);
      filteredClaims = filteredClaims.filter((c) => c.district === selectedDistrict);
    }

    this.renderKPICards(filteredClaims);
    this.renderProgressChart(filteredDistricts);
    this.renderAnomalyChart(filteredClaims);
    this.renderTribalChart(filteredClaims);
    this.renderLeaderboardTable(filteredDistricts);
  }

  renderKPICards(claims) {
    const total = claims.length;
    const titles = claims.filter((c) => c.status === "Title Conferred").length;
    const rejected = claims.filter((c) => c.status === "Rejected").length;
    const pending = total - titles - rejected;
    const landTitled = claims
      .filter((c) => c.status === "Title Conferred")
      .reduce((acc, c) => acc + c.landAreaHa, 0)
      .toFixed(1);

    const anomalies = claims.filter((c) => c.hasAnomaly).length;
    const slaBreaches = claims.filter((c) =>
      c.anomalies.some((a) => a.type === "SLA_DELAY")
    ).length;

    const recognitionRate = total > 0 ? ((titles / total) * 100).toFixed(1) : 0;
    const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : 0;

    // Update KPI Card DOM
    document.getElementById("kpi-total-claims").innerText = total.toLocaleString();
    document.getElementById("kpi-titles-granted").innerText = titles.toLocaleString();
    document.getElementById("kpi-pending-claims").innerText = pending.toLocaleString();
    document.getElementById("kpi-rejected-claims").innerText = rejected.toLocaleString();
    document.getElementById("kpi-land-hectares").innerText = `${landTitled} Ha`;
    document.getElementById("kpi-anomalies").innerText = anomalies.toLocaleString();

    document.getElementById("kpi-recognition-rate").innerHTML = `<i class="fa-solid fa-percent text-emerald"></i> ${recognitionRate}% recognition efficiency`;
    document.getElementById("kpi-sla-breached").innerHTML = `<i class="fa-solid fa-clock"></i> ${slaBreaches} exceeding 180-day SLA`;
    document.getElementById("kpi-rejection-rate").innerHTML = `<i class="fa-solid fa-chart-pie"></i> ${rejectionRate}% gross rejection rate`;

    // Global Header Ticker Sync
    document.getElementById("hdr-total-claims").innerText = total.toLocaleString();
    document.getElementById("hdr-titles-granted").innerText = titles.toLocaleString();
    document.getElementById("hdr-anomalies-count").innerText = anomalies.toLocaleString();
    document.getElementById("hdr-land-hectares").innerText = `${landTitled} Ha`;
    document.getElementById("nav-anomaly-badge").innerText = anomalies.toLocaleString();
  }

  renderProgressChart(districts) {
    const canvas = document.getElementById("chart-district-progress");
    if (!canvas) return;

    if (this.chartProgress) {
      this.chartProgress.destroy();
    }

    const labels = districts.map((d) => d.name);
    const approvedData = districts.map((d) => d.titlesGranted);
    const pendingData = districts.map((d) => d.pending);
    const rejectedData = districts.map((d) => d.rejected);

    this.chartProgress = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Titles Conferred',
            data: approvedData,
            backgroundColor: '#10b981',
            borderRadius: 4
          },
          {
            label: 'Pending SDLC/DLC',
            data: pendingData,
            backgroundColor: '#f59e0b',
            borderRadius: 4
          },
          {
            label: 'Rejected Claims',
            data: rejectedData,
            backgroundColor: '#f43f5e',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: '#9ca3af', font: { family: 'Inter', size: 11 } }
          },
          y: {
            stacked: true,
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#9ca3af', font: { family: 'Inter', size: 11 } }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#f3f4f6', font: { family: 'Inter', size: 12 }, boxWidth: 12 }
          }
        }
      }
    });
  }

  renderAnomalyChart(claims) {
    const canvas = document.getElementById("chart-anomaly-breakdown");
    if (!canvas) return;

    if (this.chartAnomalies) {
      this.chartAnomalies.destroy();
    }

    const slaCount = claims.filter((c) => c.anomalies.some((a) => a.type === "SLA_DELAY")).length;
    const overlapCount = claims.filter((c) => c.anomalies.some((a) => a.type === "SPATIAL_OVERLAP")).length;
    const areaCount = claims.filter((c) => c.anomalies.some((a) => a.type === "AREA_EXCEEDED")).length;
    const rejectCount = claims.filter((c) => c.anomalies.some((a) => a.type === "HIGH_REJECTION")).length;
    const otfdCount = claims.filter((c) => c.anomalies.some((a) => a.type === "OTFD_PROOF_GAP")).length;

    this.chartAnomalies = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: [
          'SLA Delay >180d',
          'Spatial Overlap',
          'Area >4 Ha Limit',
          'Rejection Review',
          'OTFD Proof Gap'
        ],
        datasets: [
          {
            data: [slaCount, overlapCount, areaCount, rejectCount, otfdCount],
            backgroundColor: ['#f59e0b', '#f43f5e', '#a855f7', '#ef4444', '#06b6d4'],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#f3f4f6', font: { family: 'Inter', size: 11 }, boxWidth: 10 }
          }
        },
        cutout: '65%'
      }
    });
  }

  renderTribalChart(claims) {
    const canvas = document.getElementById("chart-tribal-breakdown");
    if (!canvas) return;

    if (this.chartTribal) {
      this.chartTribal.destroy();
    }

    const pvtgCount = claims.filter((c) => c.category === "PVTG").length;
    const stCount = claims.filter((c) => c.category === "ST").length;
    const otfdCount = claims.filter((c) => c.category === "OTFD").length;

    this.chartTribal = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['Scheduled Tribes (ST)', 'PVTGs (Vulnerable Groups)', 'OTFDs (Traditional Dwellers)'],
        datasets: [
          {
            data: [stCount, pvtgCount, otfdCount],
            backgroundColor: ['#10b981', '#8b5cf6', '#3b82f6'],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#f3f4f6', font: { family: 'Inter', size: 11 }, boxWidth: 10 }
          }
        }
      }
    });
  }

  renderLeaderboardTable(districts) {
    const tbody = document.querySelector("#table-district-leaderboard tbody");
    if (!tbody) return;

    const sorted = [...districts].sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);

    tbody.innerHTML = sorted
      .map((d) => {
        let tierBadge = `<span class="badge badge-primary">LOW RISK</span>`;
        if (d.riskTier === "CRITICAL") {
          tierBadge = `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> CRITICAL (${d.vulnerabilityScore})</span>`;
        } else if (d.riskTier === "MODERATE") {
          tierBadge = `<span class="badge badge-warning">MODERATE (${d.vulnerabilityScore})</span>`;
        }

        return `
        <tr style="cursor: pointer;" onclick="window.appSelectDistrict('${d.name}', '${d.state}')">
          <td><strong>${d.name}</strong> <span class="text-muted">(${d.state})</span></td>
          <td>${d.totalClaims}</td>
          <td><strong class="text-emerald">${d.titlesGranted}</strong></td>
          <td>${d.recognitionRate}%</td>
          <td>${d.avgDaysStuck} days</td>
          <td><strong class="text-amber">${d.anomalousClaimsCount}</strong></td>
          <td>${tierBadge}</td>
        </tr>
      `;
      })
      .join("");
  }
}
