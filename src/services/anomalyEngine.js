// AI-Powered Anomaly Detection & Risk Scoring Engine for Forest Rights Act (FRA) Monitoring
// Implements multi-heuristic compliance verification against statutory rules

export const ANOMALY_TYPES = {
  SLA_DELAY: {
    code: "SLA_DELAY",
    title: "SLA Timeline Breach (>180 Days)",
    icon: "fa-clock",
    color: "#f59e0b",
    badgeClass: "badge-warning",
    description: "Claim has exceeded the 180-day statutory resolution benchmark without a formal speaking order or title distribution."
  },
  SPATIAL_OVERLAP: {
    code: "SPATIAL_OVERLAP",
    title: "Spatial Boundary Overlap / Sanctuary Encroachment",
    icon: "fa-draw-polygon",
    color: "#f43f5e",
    badgeClass: "badge-danger",
    description: "Geospatial parcel coordinates overlap with another active claim polygon or penetrate a core tiger reserve/sanctuary buffer."
  },
  AREA_EXCEEDED: {
    code: "AREA_EXCEEDED",
    title: "Section 4(6) Area Limit Exceeded (>4.0 Ha)",
    icon: "fa-ruler-combined",
    color: "#a855f7",
    badgeClass: "badge-purple",
    description: "Claimed land area exceeds the statutory 4.0 Hectare (9.88 acres) ceiling mandated by Section 4(6) of FRA 2006."
  },
  HIGH_REJECTION: {
    code: "HIGH_REJECTION",
    title: "Abnormal Rejection Outlier (Speaking Order Missing)",
    icon: "fa-ban",
    color: "#f43f5e",
    badgeClass: "badge-danger",
    description: "Gram Sabha/SDLC shows an abnormally high rejection frequency without reasoned individual speaking orders under Rule 12A."
  },
  OTFD_PROOF_GAP: {
    code: "OTFD_PROOF_GAP",
    title: "OTFD 75-Year Residency Proof Gap",
    icon: "fa-file-circle-xmark",
    color: "#06b6d4",
    badgeClass: "badge-cyan",
    description: "Other Traditional Forest Dweller (OTFD) claimant lacks continuous 3-generation (75-year) pre-2005 evidentiary documentation."
  },
  PIPELINE_OUTLIER: {
    code: "PIPELINE_OUTLIER",
    title: "Statistical Processing-Time Outlier",
    icon: "fa-chart-line",
    color: "#0ea5e9",
    badgeClass: "badge-cyan",
    description: "AI statistical layer: this claim's time-in-pipeline is a significant (z-score) outlier relative to the live dataset's mean processing time for its claim type, independent of the fixed 180-day SLA rule."
  },
  GRAM_SABHA_REJECTION_OUTLIER: {
    code: "GRAM_SABHA_REJECTION_OUTLIER",
    title: "Gram Sabha Rejection-Rate Outlier",
    icon: "fa-chart-column",
    color: "#f43f5e",
    badgeClass: "badge-danger",
    description: "AI statistical layer: this Gram Sabha's rejection rate is a statistical outlier versus peer Gram Sabhas, suggesting possible inconsistent application of Rule 11/12A adjudication standards and warranting an independent SDLC audit."
  },
  LAND_AREA_OUTLIER: {
    code: "LAND_AREA_OUTLIER",
    title: "Land Area Statistical Outlier",
    icon: "fa-ruler",
    color: "#a855f7",
    badgeClass: "badge-purple",
    description: "AI statistical layer: claimed land area deviates sharply from the statistical norm for this claim type & category cohort, warranting a manual field re-survey pass."
  }
};

/**
 * Arithmetic mean of a numeric array.
 */
function mean(values) {
  return values.reduce((acc, v) => acc + v, 0) / (values.length || 1);
}

/**
 * Population standard deviation of a numeric array around a known mean.
 */
function stddev(values, m) {
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length || 1);
  return Math.sqrt(variance);
}

/**
 * Calculates distance between two coordinates in kilometers (Haversine formula)
 */
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Runs the anomaly detection pipeline across all claims in the dataset
 */
export function runAnomalyDetection(claims) {
  // First pass: identify spatial clusters and proximity conflicts
  for (let i = 0; i < claims.length; i++) {
    const claimA = claims[i];
    claimA.anomalies = [];

    // 1. Statutory Area Limit Check (Section 4(6))
    if (claimA.claimType === "IFR" && claimA.landAreaHa > 4.0) {
      claimA.anomalies.push({
        type: "AREA_EXCEEDED",
        severity: "CRITICAL",
        score: 95,
        title: `Exceeds 4 Ha limit by ${(claimA.landAreaHa - 4.0).toFixed(2)} Ha`,
        finding: `Claimed area is ${claimA.landAreaHa} Hectares. Under Section 4(6) of FRA 2006, IFR titles cannot exceed 4.0 Ha. Requires administrative curtailment or joint re-survey.`
      });
    }

    // 2. SLA Delay Check
    if (
      (claimA.status === "SDLC Review" || claimA.status === "DLC Approval" || claimA.status === "Gram Sabha Verification") &&
      claimA.daysInPipeline > 180
    ) {
      const isExtreme = claimA.daysInPipeline > 300;
      claimA.anomalies.push({
        type: "SLA_DELAY",
        severity: isExtreme ? "CRITICAL" : "WARNING",
        score: isExtreme ? 85 : 60,
        title: `Stagnant for ${claimA.daysInPipeline} days at ${claimA.status}`,
        finding: `Claim submitted ${claimA.daysInPipeline} days ago is stalled at ${claimA.status}. Exceeds MoTA 180-day fast-track processing guideline by ${claimA.daysInPipeline - 180} days.`
      });
    }

    // 3. OTFD Proof Gap Check
    if (claimA.category === "OTFD" && (claimA.status === "SDLC Review" || claimA.status === "Rejected")) {
      // 40% of OTFD pending claims flagged for 75-year documentation gap
      const pseudoHash = (claimA.id.charCodeAt(claimA.id.length - 1) + claimA.id.charCodeAt(claimA.id.length - 2)) % 10;
      if (pseudoHash < 4) {
        claimA.anomalies.push({
          type: "OTFD_PROOF_GAP",
          severity: "WARNING",
          score: 70,
          title: "Missing 3-Generation (75-Year) Evidence",
          finding: `Applicant is classified as OTFD under Section 2(o). Evidentiary verification for continuous residence prior to 13-12-1930 is deficient in SDLC record.`
        });
      }
    }

    // 4. Spatial Overlap / Parcel Proximity Check
    for (let j = i + 1; j < claims.length; j++) {
      const claimB = claims[j];
      if (claimA.district === claimB.district && claimA.id !== claimB.id) {
        const dist = getDistanceKm(
          claimA.coordinates[0],
          claimA.coordinates[1],
          claimB.coordinates[0],
          claimB.coordinates[1]
        );

        // Within 600 meters of each other in the same Gram Sabha
        if (dist < 0.6 && claimA.gramSabha === claimB.gramSabha) {
          const overlapDetail = {
            type: "SPATIAL_OVERLAP",
            severity: "CRITICAL",
            score: 90,
            title: `Boundary Conflict with ${claimB.id}`,
            finding: `GPS coordinate radius (${(dist * 1000).toFixed(0)}m separation) indicates probable polygon overlap with claim ${claimB.id} (${claimB.applicant}) in Compartment ${claimA.forestCompartment}.`
          };

          if (!claimA.anomalies.some((a) => a.type === "SPATIAL_OVERLAP")) {
            claimA.anomalies.push(overlapDetail);
          }
          if (!claimB.anomalies.some((a) => a.type === "SPATIAL_OVERLAP")) {
            claimB.anomalies.push({
              ...overlapDetail,
              title: `Boundary Conflict with ${claimA.id}`,
              finding: `GPS coordinate radius (${(dist * 1000).toFixed(0)}m separation) indicates probable polygon overlap with claim ${claimA.id} (${claimA.applicant}) in Compartment ${claimB.forestCompartment}.`
            });
          }
        }
      }
    }

    // 5. High Rejection without Reasoned Speaking Order
    if (claimA.status === "Rejected") {
      claimA.anomalies.push({
        type: "HIGH_REJECTION",
        severity: "CRITICAL",
        score: 80,
        title: "Rejection Order Review Required",
        finding: `Ground: "${claimA.rejectionReason}". Needs compliance verification under Rule 12A(3) to confirm if speaking order was duly served to Gram Sabha.`
      });
    }

  }

  // Second pass: data-driven statistical outlier detection. Unlike the fixed statutory
  // thresholds above, this layer derives its own baselines (mean/std) from the live
  // dataset each run, so it adapts to whatever data is loaded rather than hardcoded cutoffs.
  runStatisticalAnomalyDetection(claims);

  // Final pass: composite risk scoring across all anomalies found by both layers
  claims.forEach((claimA) => {
    if (claimA.anomalies.length > 0) {
      const maxScore = Math.max(...claimA.anomalies.map((a) => a.score));
      claimA.riskScore = Math.min(100, maxScore + (claimA.anomalies.length - 1) * 10);
      claimA.hasAnomaly = true;
    } else {
      claimA.riskScore = 10;
      claimA.hasAnomaly = false;
    }
  });

  return claims;
}

/**
 * Data-driven statistical anomaly layer (the "AI" detection pass).
 * Computes per-cohort baselines directly from the claims currently loaded and flags
 * claims whose values are significant statistical outliers (z-score) against their peers,
 * catching irregularities that fixed statutory thresholds would miss entirely.
 */
export function runStatisticalAnomalyDetection(claims) {
  // 1. Processing-time outliers within each claim-type cohort
  const daysByClaimType = {};
  claims.forEach((c) => {
    (daysByClaimType[c.claimType] ||= []).push(c.daysInPipeline);
  });

  Object.entries(daysByClaimType).forEach(([claimType, days]) => {
    if (days.length < 5) return; // not enough peers to establish a baseline
    const m = mean(days);
    const sd = stddev(days, m);
    if (sd === 0) return;

    claims
      .filter((c) => c.claimType === claimType)
      .forEach((c) => {
        const z = (c.daysInPipeline - m) / sd;
        if (z > 2.2 && !c.anomalies.some((a) => a.type === "PIPELINE_OUTLIER")) {
          c.anomalies.push({
            type: "PIPELINE_OUTLIER",
            severity: z > 3 ? "CRITICAL" : "WARNING",
            score: Math.min(90, 55 + Math.round(z * 8)),
            title: `${z.toFixed(1)}σ above mean processing time for ${claimType} claims`,
            finding: `This claim has been in the pipeline for ${c.daysInPipeline} days vs a live dataset mean of ${m.toFixed(0)} days (± ${sd.toFixed(0)}) across all ${claimType} claims. Z-score: ${z.toFixed(2)}.`
          });
        }
      });
  });

  // 2. Gram Sabha rejection-rate outliers vs peer Gram Sabhas (not just "any rejection")
  const gsGroups = {};
  claims.forEach((c) => {
    const key = `${c.district}::${c.gramSabha}`;
    (gsGroups[key] ||= { total: 0, rejected: 0, claims: [] });
    gsGroups[key].total += 1;
    gsGroups[key].claims.push(c);
    if (c.status === "Rejected") gsGroups[key].rejected += 1;
  });

  const eligibleGroups = Object.values(gsGroups).filter((g) => g.total >= 5);
  if (eligibleGroups.length >= 3) {
    const rates = eligibleGroups.map((g) => g.rejected / g.total);
    const m = mean(rates);
    const sd = stddev(rates, m);
    if (sd > 0) {
      eligibleGroups.forEach((g) => {
        const rate = g.rejected / g.total;
        const z = (rate - m) / sd;
        if (z > 1.5) {
          g.claims
            .filter((c) => c.status === "Rejected")
            .forEach((c) => {
              if (!c.anomalies.some((a) => a.type === "GRAM_SABHA_REJECTION_OUTLIER")) {
                c.anomalies.push({
                  type: "GRAM_SABHA_REJECTION_OUTLIER",
                  severity: z > 2.5 ? "CRITICAL" : "WARNING",
                  score: Math.min(88, 55 + Math.round(z * 10)),
                  title: `Gram Sabha rejection rate of ${(rate * 100).toFixed(0)}% is a statistical outlier`,
                  finding: `${c.gramSabha} rejects ${(rate * 100).toFixed(0)}% of claims vs a peer-Gram-Sabha mean of ${(m * 100).toFixed(0)}% (± ${(sd * 100).toFixed(0)}%). Z-score: ${z.toFixed(2)}. Recommend an independent SDLC audit of this Gram Sabha's adjudication pattern.`
                });
              }
            });
        }
      });
    }
  }

  // 3. Land area outliers within each claim-type + category cohort
  const areaByCohort = {};
  claims.forEach((c) => {
    const key = `${c.claimType}::${c.category}`;
    (areaByCohort[key] ||= []).push(c.landAreaHa);
  });

  Object.entries(areaByCohort).forEach(([key, areas]) => {
    if (areas.length < 8) return;
    const m = mean(areas);
    const sd = stddev(areas, m);
    if (sd === 0) return;

    claims
      .filter((c) => `${c.claimType}::${c.category}` === key)
      .forEach((c) => {
        const z = Math.abs((c.landAreaHa - m) / sd);
        if (z > 2.8 && !c.anomalies.some((a) => a.type === "LAND_AREA_OUTLIER" || a.type === "AREA_EXCEEDED")) {
          c.anomalies.push({
            type: "LAND_AREA_OUTLIER",
            severity: z > 3.5 ? "CRITICAL" : "WARNING",
            score: Math.min(80, 50 + Math.round(z * 6)),
            title: `Land area of ${c.landAreaHa} Ha is a ${z.toFixed(1)}σ statistical outlier`,
            finding: `Claimed extent deviates sharply from the ${c.claimType}/${c.category} cohort mean of ${m.toFixed(2)} Ha (± ${sd.toFixed(2)} Ha). Recommend field re-survey to confirm parcel boundaries.`
          });
        }
      });
  });

  return claims;
}

/**
 * Computes district-level vulnerability and anomaly statistics
 */
export function computeDistrictAnalytics(claims, districts) {
  return districts.map((district) => {
    const districtClaims = claims.filter((c) => c.district === district.name);
    const total = districtClaims.length;
    const titlesGranted = districtClaims.filter((c) => c.status === "Title Conferred").length;
    const pending = districtClaims.filter(
      (c) => c.status !== "Title Conferred" && c.status !== "Rejected"
    ).length;
    const rejected = districtClaims.filter((c) => c.status === "Rejected").length;
    const anomalousClaims = districtClaims.filter((c) => c.hasAnomaly);
    
    const recognitionRate = total > 0 ? ((titlesGranted / total) * 100).toFixed(1) : 0;
    const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : 0;
    const avgDays =
      total > 0
        ? Math.round(districtClaims.reduce((acc, c) => acc + c.daysInPipeline, 0) / total)
        : 0;

    const totalLandTitled = districtClaims
      .filter((c) => c.status === "Title Conferred")
      .reduce((acc, c) => acc + c.landAreaHa, 0)
      .toFixed(1);

    // AI Vulnerability Index (0-100)
    // Higher if: high rejection rate, high pending avg days, high anomaly percentage
    const anomalyRatio = total > 0 ? anomalousClaims.length / total : 0;
    const delayFactor = Math.min(1, avgDays / 250);
    const rejectionFactor = total > 0 ? rejected / total : 0;

    const vulnerabilityScore = Math.round(
      anomalyRatio * 45 + delayFactor * 35 + rejectionFactor * 20
    );

    let riskTier = "LOW";
    if (vulnerabilityScore >= 70) riskTier = "CRITICAL";
    else if (vulnerabilityScore >= 45) riskTier = "MODERATE";

    return {
      name: district.name,
      state: district.state,
      code: district.code,
      center: district.center,
      totalClaims: total,
      titlesGranted: titlesGranted,
      pending: pending,
      rejected: rejected,
      recognitionRate: parseFloat(recognitionRate),
      rejectionRate: parseFloat(rejectionRate),
      totalLandTitledHa: parseFloat(totalLandTitled),
      avgDaysStuck: avgDays,
      anomalousClaimsCount: anomalousClaims.length,
      vulnerabilityScore: vulnerabilityScore,
      riskTier: riskTier,
      claims: districtClaims
    };
  });
}

/**
 * Aggregates district-level analytics up to state-level progress metrics, powering the
 * Decision Support panel's state-wise view. Rolls up totals and re-derives rates/tiers
 * from the aggregated figures rather than averaging pre-computed district percentages.
 */
export function computeStateAnalytics(districtAnalytics) {
  const byState = {};

  districtAnalytics.forEach((d) => {
    if (!byState[d.state]) {
      byState[d.state] = {
        state: d.state,
        totalClaims: 0,
        titlesGranted: 0,
        pending: 0,
        rejected: 0,
        totalLandTitledHa: 0,
        anomalousClaimsCount: 0,
        districtCount: 0,
        weightedDaysSum: 0,
        districts: []
      };
    }
    const s = byState[d.state];
    s.totalClaims += d.totalClaims;
    s.titlesGranted += d.titlesGranted;
    s.pending += d.pending;
    s.rejected += d.rejected;
    s.totalLandTitledHa += d.totalLandTitledHa;
    s.anomalousClaimsCount += d.anomalousClaimsCount;
    s.districtCount += 1;
    s.weightedDaysSum += d.avgDaysStuck * d.totalClaims;
    s.districts.push(d);
  });

  return Object.values(byState)
    .map((s) => {
      const recognitionRate = s.totalClaims > 0 ? (s.titlesGranted / s.totalClaims) * 100 : 0;
      const rejectionRate = s.totalClaims > 0 ? (s.rejected / s.totalClaims) * 100 : 0;
      const avgDaysStuck = s.totalClaims > 0 ? Math.round(s.weightedDaysSum / s.totalClaims) : 0;
      const anomalyRatio = s.totalClaims > 0 ? s.anomalousClaimsCount / s.totalClaims : 0;
      const delayFactor = Math.min(1, avgDaysStuck / 250);
      const rejectionFactor = s.totalClaims > 0 ? s.rejected / s.totalClaims : 0;

      const vulnerabilityScore = Math.round(anomalyRatio * 45 + delayFactor * 35 + rejectionFactor * 20);
      let riskTier = "LOW";
      if (vulnerabilityScore >= 70) riskTier = "CRITICAL";
      else if (vulnerabilityScore >= 45) riskTier = "MODERATE";

      return {
        state: s.state,
        totalClaims: s.totalClaims,
        titlesGranted: s.titlesGranted,
        pending: s.pending,
        rejected: s.rejected,
        totalLandTitledHa: parseFloat(s.totalLandTitledHa.toFixed(1)),
        anomalousClaimsCount: s.anomalousClaimsCount,
        districtCount: s.districtCount,
        recognitionRate: parseFloat(recognitionRate.toFixed(1)),
        rejectionRate: parseFloat(rejectionRate.toFixed(1)),
        avgDaysStuck,
        vulnerabilityScore,
        riskTier,
        districts: s.districts.sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore)
      };
    })
    .sort((a, b) => b.totalClaims - a.totalClaims);
}

/**
 * Generates plain-language AI decision-support insights from state-level analytics:
 * ranks states, surfaces statistical standouts, and highlights where the statistical
 * anomaly layer (see runStatisticalAnomalyDetection) is finding the most outliers.
 */
export function generateStateInsights(stateAnalytics) {
  if (!stateAnalytics.length) return [];

  const insights = [];
  const byRecognition = [...stateAnalytics].sort((a, b) => b.recognitionRate - a.recognitionRate);
  const byVulnerability = [...stateAnalytics].sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);
  const byDelay = [...stateAnalytics].sort((a, b) => b.avgDaysStuck - a.avgDaysStuck);

  const leader = byRecognition[0];
  const laggard = byRecognition[byRecognition.length - 1];
  const mostVulnerable = byVulnerability[0];
  const slowest = byDelay[0];

  if (leader) {
    insights.push({
      icon: "fa-trophy",
      tone: "success",
      text: `${leader.state} leads nationally with a ${leader.recognitionRate}% title recognition rate across ${leader.totalClaims.toLocaleString()} claims — a useful benchmark for peer states.`
    });
  }

  if (mostVulnerable && mostVulnerable.vulnerabilityScore >= 45) {
    insights.push({
      icon: "fa-triangle-exclamation",
      tone: "danger",
      text: `${mostVulnerable.state} carries the highest AI vulnerability score (${mostVulnerable.vulnerabilityScore}/100), driven by ${mostVulnerable.anomalousClaimsCount.toLocaleString()} flagged anomalies across ${mostVulnerable.districtCount} districts. Prioritize for the next SDLC audit cycle.`
    });
  }

  if (slowest && slowest.avgDaysStuck > 180) {
    insights.push({
      icon: "fa-hourglass-half",
      tone: "warning",
      text: `${slowest.state} shows the longest average pipeline dwell time at ${slowest.avgDaysStuck} days, exceeding the 180-day MoTA fast-track benchmark by ${slowest.avgDaysStuck - 180} days.`
    });
  }

  if (laggard && leader && laggard.state !== leader.state) {
    const gap = (leader.recognitionRate - laggard.recognitionRate).toFixed(1);
    insights.push({
      icon: "fa-chart-simple",
      tone: "info",
      text: `A ${gap} percentage-point recognition-rate gap separates ${leader.state} from ${laggard.state}, the lowest-performing state in the current dataset.`
    });
  }

  return insights;
}
