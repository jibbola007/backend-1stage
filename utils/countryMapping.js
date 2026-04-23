// ISO country code to country name mapping
const countryMap = {
  NG: "Nigeria",
  BJ: "Benin",
  AO: "Angola",
  KE: "Kenya",
  ET: "Ethiopia",
  GH: "Ghana",
  SD: "Sudan",
  ZA: "South Africa",
  EG: "Egypt",
  MA: "Morocco",
  TZ: "Tanzania",
  UG: "Uganda",
  CM: "Cameroon",
  SN: "Senegal",
  CI: "Côte d'Ivoire",
  MZ: "Mozambique",
  MW: "Malawi",
  ZM: "Zambia",
  RW: "Rwanda",
  BW: "Botswana",
  NA: "Namibia",
  LS: "Lesotho",
  SZ: "Eswatini",
  MG: "Madagascar",
  MU: "Mauritius",
  SC: "Seychelles",
  DZ: "Algeria",
  TN: "Tunisia",
  LY: "Libya",
  CD: "Democratic Republic of the Congo",
  CG: "Republic of the Congo",
  GA: "Gabon",
  GQ: "Equatorial Guinea",
  ST: "São Tomé and Príncipe",
  CF: "Central African Republic",
  TD: "Chad",
  NE: "Niger",
  ML: "Mali",
  BF: "Burkina Faso",
  GM: "Gambia",
  GW: "Guinea-Bissau",
  GN: "Guinea",
  LR: "Liberia",
  SL: "Sierra Leone",
  TG: "Togo",
  BN: "Benin",
  KM: "Comoros",
  DJ: "Djibouti",
  ER: "Eritrea",
  SO: "Somalia",
  SS: "South Sudan",
  // Add more as needed
};

/**
 * Get country name from ISO code
 */
function getCountryName(countryId) {
  return countryMap[countryId?.toUpperCase()] || null;
}

/**
 * Get country ISO code from country name
 */
function getCountryId(countryName) {
  const normalized = countryName?.toLowerCase().trim();
  for (const [code, name] of Object.entries(countryMap)) {
    if (name.toLowerCase() === normalized) {
      return code;
    }
  }
  return null;
}

/**
 * Get all country mappings
 */
function getAllCountries() {
  return Object.entries(countryMap).map(([code, name]) => ({
    id: code,
    name: name
  }));
}

module.exports = {
  getCountryName,
  getCountryId,
  getAllCountries,
  countryMap
};
