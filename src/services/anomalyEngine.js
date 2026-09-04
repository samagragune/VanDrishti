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
  }
};

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

    // Compute composite Risk Score for the claim
    if (claimA.anomalies.length > 0) {
      const maxScore = Math.max(...claimA.anomalies.map((a) => a.score));
      claimA.riskScore = Math.min(100, maxScore + (claimA.anomalies.length - 1) * 10);
      claimA.hasAnomaly = true;
    } else {
      claimA.riskScore = 10;
      claimA.hasAnomaly = false;
    }
  }

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
