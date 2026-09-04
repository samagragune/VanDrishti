// Export Service for FRA Decision Support Platform (CSV, JSON, Dossier Print)

export class ExportService {
  /**
   * Exports an array of claims to CSV format and triggers browser download
   */
  static exportClaimsToCSV(claims, filename = "FRA_Claims_Audit_Register.csv") {
    if (!claims || claims.length === 0) {
      alert("No claim records available to export.");
      return;
    }

    const headers = [
      "Claim ID",
      "Applicant Name",
      "Category",
      "Tribe/Community",
      "Claim Type",
      "Land Area (Ha)",
      "State",
      "District",
      "Gram Sabha",
      "Survey No",
      "Forest Compartment",
      "Latitude",
      "Longitude",
      "Submitted Date",
      "Days in Pipeline",
      "Lifecycle Status",
      "Has Anomaly",
      "Anomaly Count",
      "Anomaly Details",
      "Risk Score"
    ];

    const rows = claims.map((c) => {
      const anomalyDetails = c.anomalies.map((a) => `[${a.type}] ${a.title}`).join(" | ");
      return [
        c.id,
        `"${c.applicant.replace(/"/g, '""')}"`,
        c.category,
        `"${(c.tribe || "").replace(/"/g, '""')}"`,
        c.claimType,
        c.landAreaHa,
        c.state,
        c.district,
        `"${c.gramSabha.replace(/"/g, '""')}"`,
        c.surveyNo,
        c.forestCompartment,
        c.coordinates[0],
        c.coordinates[1],
        c.submittedDate,
        c.daysInPipeline,
        c.status,
        c.hasAnomaly ? "YES" : "NO",
        c.anomalies.length,
        `"${anomalyDetails.replace(/"/g, '""')}"`,
        c.riskScore || 10
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Opens the print dialog for an official claim dossier
   */
  static printClaimDossier(claim) {
    window.print();
  }
}
