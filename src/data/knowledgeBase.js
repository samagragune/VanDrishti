// Comprehensive Legal & Operational Knowledge Base for Forest Rights Act (FRA 2006)
// Grounding context for AI Decision Engine and Copilot

export const FRA_LEGAL_KNOWLEDGE = {
  actName: "The Scheduled Tribes and Other Traditional Forest Dwellers (Recognition of Forest Rights) Act, 2006 (Act No. 2 of 2007)",
  amendments: "Forest Rights Amendment Rules, 2012 (G.S.R. 669(E))",
  nodalMinistry: "Ministry of Tribal Affairs (MoTA), Government of India",

  coreSections: [
    {
      section: "Section 3(1)(a)",
      title: "Individual Forest Rights (IFR)",
      description: "Right to hold and live in the forest land under individual or common occupation for habitation or for self-cultivation for livelihood by a member or members of a forest dwelling Scheduled Tribe or other traditional forest dwellers."
    },
    {
      section: "Section 3(1)(c)",
      title: "Minor Forest Produce (MFP)",
      description: "Right of ownership, access to collect, use, and dispose of minor forest produce (including tendu patta, mahua, bamboo, honey) which has been traditionally collected within or outside village boundaries."
    },
    {
      section: "Section 3(1)(i)",
      title: "Community Forest Resource Rights (CFRR)",
      description: "Right to protect, regenerate or conserve or manage any community forest resource which they have been traditionally protecting and conserving for sustainable use."
    },
    {
      section: "Section 4(6)",
      title: "Statutory Ceiling on Land Rights",
      description: "The land rights recognized under this Act shall be restricted to the area under actual occupation and shall in no case exceed an area of four (4.0) hectares (approx. 9.88 acres). Any claim above 4.0 Ha is ultra vires and invalid."
    },
    {
      section: "Section 2(o)",
      title: "Other Traditional Forest Dweller (OTFD) Qualification",
      description: "Any member or community who has for at least three generations (75 years) prior to the 13th day of December, 2005 primarily resided in and who depends on the forest or forest land for bona fide livelihood needs."
    },
    {
      section: "Section 6",
      title: "Three-Tier Adjudication Process",
      description: "1. Gram Sabha (Initiation, verification by Forest Rights Committee with min 50% quorum, 1/3rd women). 2. Sub-Divisional Level Committee (SDLC - Examination and consolidation). 3. District Level Committee (DLC - Final approval and title deed issuance presided over by District Collector/DM)."
    },
    {
      section: "Rule 12A(3) - 2012 Amendment",
      title: "Rejection Speaking Order Mandate",
      description: "No claim shall be rejected without giving the claimant a reasonable opportunity of being heard. The reasons for rejection must be recorded in writing by the SDLC or DLC as a reasoned speaking order and communicated in the local vernacular."
    }
  ],

  statutorySLAs: {
    gramSabhaVerification: "60 days from submission",
    sdlcReview: "60 days from Gram Sabha resolution",
    dlcApproval: "60 days from SDLC receipt",
    totalProcessingSLA: "180 days (6 months maximum benchmark)"
  },

  evidenceRequirements: [
    "Elder testimonials / oral statements (Rule 13(a))",
    "Physical structures, permanent trees planted, ancestral burial grounds, sacred groves (Rule 13(b))",
    "Government receipts, fine slips, compounding orders issued by Forest or Revenue Dept prior to 13 Dec 2005 (Rule 13(c))",
    "Census records, voter lists, ration cards establishing 75-year residency for OTFD (Rule 13(e))",
    "GPS / Spatial boundary trace certified by Joint Forest Rights Committee (FRC) survey team"
  ]
};
