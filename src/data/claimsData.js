// Comprehensive realistic FRA claims dataset generator and master registry
// Conforms to Ministry of Tribal Affairs (MoTA) and FRA 2006 data structure

import { DISTRICT_REGIONS } from './districtBoundaries.js';

const TRIBAL_NAMES = {
  "Odisha": {
    ST: ["Santhal", "Munda", "Ho", "Bhumij", "Oraon", "Kondh", "Gond"],
    PVTG: ["Birhor", "Lodha", "Hill Kharia", "Dongria Kondh", "Paudi Bhuyan", "Kutia Kondh"],
    OTFD: ["Gopala", "Karan", "Kandha Gauda", "Teli Forest Dweller"]
  },
  "Chhattisgarh": {
    ST: ["Gond", "Muria", "Halba", "Bhatra", "Dhurwa", "Kanwar"],
    PVTG: ["Abujh Maria", "Hill Korwa", "Birhor", "Baiga", "Kamar"],
    OTFD: ["Raut Forest Traditional", "Kalar", "Sahu Traditional Resident"]
  },
  "Madhya Pradesh": {
    ST: ["Gond", "Bhil", "Korku", "Kol", "Pradhan", "Sahariya"],
    PVTG: ["Baiga", "Bharia", "Sahariya"],
    OTFD: ["Yadav Forest Grazer", "Kushwaha Traditional", "Lohar"]
  },
  "Maharashtra": {
    ST: ["Madia Gond", "Gond", "Koli Mahadev", "Bhil", "Pawra", "Gamit"],
    PVTG: ["Kolam", "Katkari", "Madia Gond"],
    OTFD: ["Dhangar Pastoralist", "Maratha Forest Resident"]
  },
  "Jharkhand": {
    ST: ["Santhal", "Oraon", "Munda", "Ho", "Kharia", "Chero"],
    PVTG: ["Asur", "Birjia", "Birhor", "Parhaiya", "Mal Paharia"],
    OTFD: ["Kumhar Traditional", "Mahto", "Gope Forest Settler"]
  },
  "Kerala": {
    ST: ["Paniya", "Kurichiya", "Mullu Kurumba", "Kuruma"],
    PVTG: ["Kattunayakan", "Cholanayakan", "Kadar"],
    OTFD: ["Traditional Forest Cultivator", "Chetty Settler (Pre-1930)"]
  },
  "Andhra Pradesh": {
    ST: ["Bagata", "Valmiki", "Koya", "Yanadi", "Yerukala"],
    PVTG: ["Chenchu", "Konda Reddi", "Kolam", "Thoti"],
    OTFD: ["Kapu Forest Settler", "Gowda Traditional"]
  },
  "Telangana": {
    ST: ["Koya", "Gond", "Naikpod", "Pradhan", "Lambada"],
    PVTG: ["Kolam", "Thoti", "Chenchu"],
    OTFD: ["Munnuru Kapu", "Yadava Forest Grazer"]
  },
  "Gujarat": {
    ST: ["Vasava", "Bhil", "Chaudhri", "Gamit", "Dhodia", "Rathwa"],
    PVTG: ["Kotwalia", "Kathodi", "Kolgha", "Siddi"],
    OTFD: ["Rabari Pastoralist", "Bharwad Forest Grazer"]
  },
  "Rajasthan": {
    ST: ["Bhil", "Mina", "Garasia", "Damor"],
    PVTG: ["Saharaiya (Baran)"],
    OTFD: ["Gujjar Forest Dweller", "Rebari Grazer"]
  },
  "Karnataka": {
    ST: ["Naikda", "Soliga", "Hasalaru", "Kadu Kuruba"],
    PVTG: ["Jenu Kuruba", "Koraga"],
    OTFD: ["Gowda Traditional", "Shetty Forest Resident"]
  },
  "Tripura": {
    ST: ["Tripuri", "Chakma", "Halam", "Jamatia", "Mog"],
    PVTG: ["Reang (Bru)"],
    OTFD: ["Bengali Pre-1930 Settler"]
  },
  "West Bengal": {
    ST: ["Santhal", "Munda", "Oraon", "Bhumij", "Mech", "Rabha"],
    PVTG: ["Toto", "Birhor", "Lodha"],
    OTFD: ["Mahato Traditional Forest Dweller", "Sadgop"]
  },
  "Assam": {
    ST: ["Bodo", "Karbi", "Mishing", "Dimasa", "Tiwa", "Sonowal"],
    PVTG: ["Chakma", "Hajong"],
    OTFD: ["Ahom Forest Settler", "Koch Rajbongshi"]
  },
  "Himachal Pradesh": {
    ST: ["Kinnaura", "Gaddi", "Gujjar", "Lahaula"],
    PVTG: ["Gaddi Pastoralist", "Gujjar Forest Grazer"],
    OTFD: ["Himachali Traditional Forest Settler"]
  },
  "Uttarakhand": {
    ST: ["Bhotia", "Jaunsari", "Tharu", "Buxa", "Raji (Van Rawat)"],
    PVTG: ["Raji (Van Rawat)", "Van Gujjar"],
    OTFD: ["Garhwali Forest Cultivator", "Kumaoni Settler"]
  },
  "Uttar Pradesh": {
    ST: ["Gond", "Kharwar", "Sahariya", "Tharu", "Kol"],
    PVTG: ["Kol Traditional", "Baiga"],
    OTFD: ["Yadav Forest Grazer", "Kurmi Traditional"]
  },
  "Tamil Nadu": {
    ST: ["Malayali", "Irular", "Kurumbas", "Kani", "Paliyan"],
    PVTG: ["Toda", "Kota", "Kurumba", "Irula", "Kattunayakan"],
    OTFD: ["Badaga Forest Cultivator", "Chettiar Traditional"]
  },
  "Bihar": {
    ST: ["Santhal", "Oraon", "Tharu", "Munda", "Ho"],
    PVTG: ["Birhor", "Mal Paharia"],
    OTFD: ["Yadav Forest Grazer", "Kushwaha Traditional"]
  },
  "Meghalaya": {
    ST: ["Khasi", "Garo", "Jaintia", "Hajong", "Koch"],
    PVTG: ["Khasi Sacred Grove Caretaker", "Pnar"],
    OTFD: ["Assamese Forest Settler"]
  },
  "Jammu and Kashmir": {
    ST: ["Gujjars", "Bakarwals", "Gaddi", "Sippi"],
    PVTG: ["Transhumant Bakarwal Pastoralist"],
    OTFD: ["Kashmiri Forest Dweller"]
  },
  "Ladakh": {
    ST: ["Balti", "Beda", "Bot", "Brokpa", "Changpa", "Garra", "Mon", "Purigpa"],
    PVTG: ["Brokpa Traditional", "Changpa Nomad"],
    OTFD: ["Ladakhi Traditional Resident"]
  },
  "Arunachal Pradesh": {
    ST: ["Adi", "Apatani", "Nyishi", "Tagin", "Mishmi", "Tangsa", "Singpho"],
    PVTG: ["Puroik (Sulung)"],
    OTFD: ["Assamese Forest Settler"]
  },
  "Manipur": {
    ST: ["Kuki", "Naga", "Zomi", "Hmar", "Paite", "Tangkhul"],
    PVTG: ["Maring Traditional"],
    OTFD: ["Meitei Forest Dweller"]
  },
  "Mizoram": {
    ST: ["Mizo", "Lushai", "Chakma", "Lai", "Mara", "Hmar"],
    PVTG: ["Chakma Traditional"],
    OTFD: ["Tripuri Forest Settler"]
  },
  "Nagaland": {
    ST: ["Angami", "Ao", "Chakhesang", "Chang", "Konyak", "Lotha", "Phom", "Sumi"],
    PVTG: ["Konyak Angh Traditional"],
    OTFD: ["Assamese Frontier Settler"]
  },
  "Sikkim": {
    ST: ["Bhutia", "Lepcha", "Limbu", "Tamang"],
    PVTG: ["Lepcha (Dzongu Reserve)"],
    OTFD: ["Nepali Pre-1930 Forest Settler"]
  },
  "Goa": {
    ST: ["Gawda", "Kunbi", "Velip"],
    PVTG: ["Velip Forest Dweller"],
    OTFD: ["Maratha Traditional Grazer"]
  }
};

const APPLICANT_FIRST_NAMES = [
  "Rameshwar", "Budhram", "Sukra", "Mangal", "Jogi", "Somaru", "Dhanu", "Chaitanya",
  "Lakhan", "Devidas", "Shankar", "Birsa", "Manki", "Shibu", "Gurubari", "Kamla Bai",
  "Phoolo", "Sukmati", "Parvati", "Sona", "Champa", "Raimati", "Rukmini", "Sunita",
  "Nanu", "Kaliya", "Pema", "Babulal", "Mansoor", "Channu", "Raghu", "Dileshwar"
];

const APPLICANT_LAST_NAMES = [
  "Majhi", "Munda", "Hembram", "Gond", "Baiga", "Kondh", "Marandi", "Bhil", "Madavi",
  "Oraon", "Korwa", "Halba", "Kattunayakan", "Paniya", "Kharwar", "Baskey", "Tudu",
  "Murmu", "Soren", "Pawar", "Naik", "Dhurve", "Uikey", "Markam", "Tekam"
];

const GRAM_SABHA_NAMES = [
  "Gurguria", "Baripada", "Jashipur", "Tumudibandha", "Daringbadi", "Bonaigarh",
  "Tokapal", "Lohandiguda", "Kuakonda", "Katekalyan", "Pali", "Katghora",
  "Samnapur", "Bajag", "Bichhiya", "Nainpur", "Dhanora", "Etapalli", "Bhamragad",
  "Dhadgaon", "Akrani", "Bishunpur", "Chainpur", "Mahuadanr", "Mananthavady", "Sulthan Bathery",
  // Maharashtra & Thane Gram Sabhas
  "Padgha", "Vashind", "Tokawade", "Khadavli", "Kalyan-Rural", "Shahapur-Forest",
  "Murbad-Central", "Badlapur-Tribal", "Titwala-Panchayat", "Ambarnath-Range"
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min, max, decimals = 2) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate 520 comprehensive realistic claims
export function generateMasterClaimsDataset() {
  const claims = [];
  let claimSeq = 1001;

  DISTRICT_REGIONS.forEach((district) => {
    // Generate 35-45 claims per district
    const count = randomInt(36, 44);
    const state = district.state;
    const stateTribes = TRIBAL_NAMES[state] || TRIBAL_NAMES["Odisha"];
    const districtClaimsSoFar = [];

    for (let i = 0; i < count; i++) {
      const claimId = `CLM-${district.code}-${claimSeq++}`;
      const firstName = randomChoice(APPLICANT_FIRST_NAMES);
      const lastName = randomChoice(APPLICANT_LAST_NAMES);
      const applicantName = `${firstName} ${lastName}`;
      let gramSabha = randomChoice(GRAM_SABHA_NAMES);

      // Category: 60% ST, 25% PVTG, 15% OTFD
      const catRoll = Math.random();
      let category = "ST";
      let tribe = "";
      if (catRoll < 0.25) {
        category = "PVTG";
        tribe = randomChoice(stateTribes.PVTG);
      } else if (catRoll < 0.85) {
        category = "ST";
        tribe = randomChoice(stateTribes.ST);
      } else {
        category = "OTFD";
        tribe = randomChoice(stateTribes.OTFD);
      }

      // Claim Type: 70% IFR, 20% CFR, 10% CFRR/CR
      const typeRoll = Math.random();
      let claimType = "IFR";
      if (typeRoll > 0.85) claimType = "CFRR";
      else if (typeRoll > 0.70) claimType = "CFR";
      else if (typeRoll > 0.65) claimType = "CR";

      // Land Area in Hectares
      // Section 4(6) limit is 4.0 Ha. Default 0.4 to 3.8.
      // 5% intentional statutory violation (>4.0 Ha) to test anomaly engine.
      let landAreaHa = randomFloat(0.6, 3.75, 2);
      const isAreaViolator = (Math.random() < 0.05 && claimType === "IFR");
      if (isAreaViolator) {
        landAreaHa = randomFloat(4.25, 7.80, 2);
      }

      // Coordinates within district bounds
      let lat = randomFloat(district.center[0] - 0.25, district.center[0] + 0.25, 4);
      let lng = randomFloat(district.center[1] - 0.25, district.center[1] + 0.25, 4);

      // ~6% intentional spatial-overlap seeding: clone an earlier claim's Gram Sabha
      // and jitter its coordinates within ~300m to simulate real boundary conflicts
      // (mismatched land records) for the AI spatial-overlap detector to catch.
      if (districtClaimsSoFar.length > 0 && Math.random() < 0.06) {
        const anchor = randomChoice(districtClaimsSoFar);
        gramSabha = anchor.gramSabha;
        lat = anchor.coordinates[0] + (Math.random() - 0.5) * 0.006;
        lng = anchor.coordinates[1] + (Math.random() - 0.5) * 0.006;
      }

      // Submission timeline (between 60 to 450 days ago)
      const daysInPipeline = randomInt(45, 460);
      const submittedDate = new Date(Date.now() - daysInPipeline * 24 * 60 * 60 * 1000);
      const submittedDateStr = submittedDate.toISOString().split("T")[0];

      // Stage & Lifecycle Status
      // Status distribution: 40% Title Conferred, 22% SDLC Review, 16% DLC Approval, 12% Gram Sabha, 10% Rejected
      let status = "Title Conferred";
      let gsDate = new Date(submittedDate.getTime() + 25 * 86400000).toISOString().split("T")[0];
      let sdlcDate = null;
      let dlcDate = null;
      let titleDate = null;
      let rejectionReason = null;

      const statusRoll = Math.random();
      if (statusRoll < 0.38) {
        status = "Title Conferred";
        sdlcDate = new Date(submittedDate.getTime() + 75 * 86400000).toISOString().split("T")[0];
        dlcDate = new Date(submittedDate.getTime() + 130 * 86400000).toISOString().split("T")[0];
        titleDate = new Date(submittedDate.getTime() + 160 * 86400000).toISOString().split("T")[0];
      } else if (statusRoll < 0.62) {
        status = "SDLC Review";
        sdlcDate = new Date(submittedDate.getTime() + 50 * 86400000).toISOString().split("T")[0];
      } else if (statusRoll < 0.78) {
        status = "DLC Approval";
        sdlcDate = new Date(submittedDate.getTime() + 65 * 86400000).toISOString().split("T")[0];
        dlcDate = new Date(submittedDate.getTime() + 120 * 86400000).toISOString().split("T")[0];
      } else if (statusRoll < 0.88) {
        status = "Gram Sabha Verification";
      } else {
        status = "Rejected";
        sdlcDate = new Date(submittedDate.getTime() + 60 * 86400000).toISOString().split("T")[0];
        const reasons = [
          "Claimed land overlaps with non-notified Reserve Forest zone",
          "Inadequate proof of 75-year residency under Section 2(o) OTFD",
          "Gram Sabha resolution quorum was below statutory 50% threshold",
          "Forest Rights Committee (FRC) physical verification report missing",
          "Land found to be under active village communal grazing commons without NOC"
        ];
        rejectionReason = randomChoice(reasons);
      }

      // Survey Number & Forest Compartment
      const surveyNo = `FS-${randomInt(101, 899)}/${randomChoice(["A", "B", "C", "D"])}`;
      const forestCompartment = `COMP-${randomInt(12, 98)}`;

      // Construct Claim Object
      claims.push({
        id: claimId,
        applicant: applicantName,
        category: category,
        tribe: tribe,
        claimType: claimType,
        landAreaHa: landAreaHa,
        state: district.state,
        district: district.name,
        districtCode: district.code,
        subDivision: district.subDivisions ? randomChoice(district.subDivisions) : `${district.name} Sadar`,
        gramSabha: gramSabha,
        panchayat: `${gramSabha} GP`,
        surveyNo: surveyNo,
        forestCompartment: forestCompartment,
        coordinates: [lat, lng],
        submittedDate: submittedDateStr,
        daysInPipeline: daysInPipeline,
        status: status,
        timeline: {
          submitted: submittedDateStr,
          gramSabha: gsDate,
          sdlc: sdlcDate,
          dlc: dlcDate,
          title: titleDate
        },
        rejectionReason: rejectionReason,
        // Flags to be computed and enriched by anomaly engine
        anomalies: []
      });

      districtClaimsSoFar.push({ gramSabha, coordinates: [lat, lng] });
    }
  });

  return claims;
}
