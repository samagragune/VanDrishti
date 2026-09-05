// State-Wise Decision Support Panel Controller
// Aggregates live district analytics into state-level progress rankings and
// surfaces plain-language AI insights derived from the statistical anomaly layer.

import Chart from 'chart.js/auto';
import { generateStateInsights } from '../services/anomalyEngine.js';

export class DecisionSupportController {
  constructor(onSelectStateCallback) {
    this.onSelectState = onSelectStateCallback;
    this.chartStateProgress = null;
  }

  render(stateAnalytics) {
    this.renderInsights(stateAnalytics);
    this.renderStateProgressList(stateAnalytics);
    this.renderStateChart(stateAnalytics);
  }

  renderInsights(stateAnalytics) {
    const container = document.getElementById("decision-support-insights");
    if (!container) return;

    const insights = generateStateInsights(stateAnalytics);
    if (insights.length === 0) {
      container.innerHTML = `
        <div class="empty-selection-state">
          <i class="fa-solid fa-circle-info"></i>
          <p>Not enough data in the current filter to generate AI decision insights.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = insights
      .map(
        (ins) => `
        <div class="insight-card insight-${ins.tone}">
          <div class="insight-icon"><i class="fa-solid ${ins.icon}"></i></div>
          <p>${ins.text}</p>
        </div>
      `
      )
      .join("");
  }

  renderStateProgressList(stateAnalytics) {
    const container = document.getElementById("state-progress-list");
    if (!container) return;

    if (stateAnalytics.length === 0) {
      container.innerHTML = `
        <div class="empty-selection-state">
          <i class="fa-solid fa-hand-pointer"></i>
          <p>No states match the current filters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = stateAnalytics
      .map((s) => {
        let tierClass = "tier-low";
        let tierBadge = `<span class="badge badge-primary">LOW RISK</span>`;
        if (s.riskTier === "CRITICAL") {
          tierClass = "tier-critical";
          tierBadge = `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> CRITICAL (${s.vulnerabilityScore})</span>`;
        } else if (s.riskTier === "MODERATE") {
          tierClass = "tier-moderate";
          tierBadge = `<span class="badge badge-warning">MODERATE (${s.vulnerabilityScore})</span>`;
        }

        const fillColor =
          s.recognitionRate >= 60 ? "var(--emerald-primary)" : s.recognitionRate >= 35 ? "var(--amber-warning)" : "var(--rose-danger)";

        return `
        <div class="state-progress-row ${tierClass}" data-state="${s.state}">
          <div class="state-progress-top">
            <div class="state-progress-name">
              <strong>${s.state}</strong>
              <span class="text-muted">${s.districtCount} district${s.districtCount === 1 ? "" : "s"} tracked</span>
            </div>
            ${tierBadge}
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${s.recognitionRate}%; background: ${fillColor};"></div>
          </div>
          <div class="state-progress-stats">
            <span><strong>${s.totalClaims.toLocaleString()}</strong> claims</span>
            <span class="text-emerald"><strong>${s.titlesGranted.toLocaleString()}</strong> titled</span>
            <span class="text-amber"><strong>${s.pending.toLocaleString()}</strong> pending</span>
            <span class="text-rose"><strong>${s.rejected.toLocaleString()}</strong> rejected</span>
            <span class="text-purple"><strong>${s.anomalousClaimsCount.toLocaleString()}</strong> anomalies</span>
            <span class="recognition-pct">${s.recognitionRate}%</span>
          </div>
        </div>
      `;
      })
      .join("");

    container.querySelectorAll(".state-progress-row").forEach((row) => {
      row.onclick = () => {
        const stateName = row.getAttribute("data-state");
        if (this.onSelectState) this.onSelectState(stateName);
      };
    });
  }

  renderStateChart(stateAnalytics) {
    const canvas = document.getElementById("chart-state-progress");
    if (!canvas) return;

    if (this.chartStateProgress) {
      this.chartStateProgress.destroy();
    }

    const sorted = [...stateAnalytics].sort((a, b) => b.recognitionRate - a.recognitionRate).slice(0, 14);

    this.chartStateProgress = new Chart(canvas, {
      type: "bar",
      data: {
        labels: sorted.map((s) => s.state),
        datasets: [
          {
            label: "Recognition Rate (%)",
            data: sorted.map((s) => s.recognitionRate),
            backgroundColor: sorted.map((s) =>
              s.recognitionRate >= 60 ? "#ACC8A2" : s.recognitionRate >= 35 ? "#f59e0b" : "#f43f5e"
            ),
            borderRadius: 4
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            max: 100,
            grid: { color: "rgba(255, 255, 255, 0.06)" },
            ticks: { color: "#9ca3af", font: { family: "Inter", size: 11 } }
          },
          y: {
            grid: { display: false },
            ticks: { color: "#9ca3af", font: { family: "Inter", size: 11 } }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}
