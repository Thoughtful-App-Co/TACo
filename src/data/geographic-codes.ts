/**
 * Geographic Codes and BLS Area Code Utilities
 *
 * Comprehensive mapping of US geographic data for BLS API integration.
 * Includes FIPS codes, Metropolitan Statistical Areas, and helper functions.
 *
 * Sources:
 * - FIPS State Codes: US Census Bureau
 * - MSA Codes: Office of Management and Budget (OMB)
 * - Population Data: US Census Bureau (2023 estimates)
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

// ============================================================================
// TYPES
// ============================================================================

/** State information with FIPS code */
export interface StateInfo {
  /** Two-digit FIPS code (e.g., '01' for Alabama) */
  fips: string;
  /** Full state name */
  name: string;
  /** Two-letter postal abbreviation */
  abbrev: string;
  /** Region for relocation suggestions */
  region: 'northeast' | 'southeast' | 'midwest' | 'southwest' | 'west' | 'pacific' | 'territory';
}

/** Metropolitan Statistical Area information */
export interface MsaInfo {
  /** CBSA code (Core Based Statistical Area) */
  code: string;
  /** Full MSA name */
  name: string;
  /** States the MSA spans */
  states: string[];
  /** Principal city name(s) for matching */
  principalCities: string[];
  /** 2023 population estimate */
  population: number;
  /** Rank by population (1-100) */
  rank: number;
}

/** Parsed location result */
export interface ParsedLocation {
  city: string | null;
  state: string | null;
  stateAbbrev: string | null;
}

// ============================================================================
// FIPS STATE CODES - All 50 States + DC + Territories
// ============================================================================

/**
 * Complete mapping of US states, DC, and territories with FIPS codes.
 * Keyed by two-letter postal abbreviation.
 */
export const STATE_FIPS: Record<string, StateInfo> = {
  // Northeast Region
  CT: { fips: '09', name: 'Connecticut', abbrev: 'CT', region: 'northeast' },
  ME: { fips: '23', name: 'Maine', abbrev: 'ME', region: 'northeast' },
  MA: { fips: '25', name: 'Massachusetts', abbrev: 'MA', region: 'northeast' },
  NH: { fips: '33', name: 'New Hampshire', abbrev: 'NH', region: 'northeast' },
  NJ: { fips: '34', name: 'New Jersey', abbrev: 'NJ', region: 'northeast' },
  NY: { fips: '36', name: 'New York', abbrev: 'NY', region: 'northeast' },
  PA: { fips: '42', name: 'Pennsylvania', abbrev: 'PA', region: 'northeast' },
  RI: { fips: '44', name: 'Rhode Island', abbrev: 'RI', region: 'northeast' },
  VT: { fips: '50', name: 'Vermont', abbrev: 'VT', region: 'northeast' },

  // Southeast Region
  AL: { fips: '01', name: 'Alabama', abbrev: 'AL', region: 'southeast' },
  AR: { fips: '05', name: 'Arkansas', abbrev: 'AR', region: 'southeast' },
  DE: { fips: '10', name: 'Delaware', abbrev: 'DE', region: 'southeast' },
  FL: { fips: '12', name: 'Florida', abbrev: 'FL', region: 'southeast' },
  GA: { fips: '13', name: 'Georgia', abbrev: 'GA', region: 'southeast' },
  KY: { fips: '21', name: 'Kentucky', abbrev: 'KY', region: 'southeast' },
  LA: { fips: '22', name: 'Louisiana', abbrev: 'LA', region: 'southeast' },
  MD: { fips: '24', name: 'Maryland', abbrev: 'MD', region: 'southeast' },
  MS: { fips: '28', name: 'Mississippi', abbrev: 'MS', region: 'southeast' },
  NC: { fips: '37', name: 'North Carolina', abbrev: 'NC', region: 'southeast' },
  SC: { fips: '45', name: 'South Carolina', abbrev: 'SC', region: 'southeast' },
  TN: { fips: '47', name: 'Tennessee', abbrev: 'TN', region: 'southeast' },
  VA: { fips: '51', name: 'Virginia', abbrev: 'VA', region: 'southeast' },
  WV: { fips: '54', name: 'West Virginia', abbrev: 'WV', region: 'southeast' },
  DC: { fips: '11', name: 'District of Columbia', abbrev: 'DC', region: 'southeast' },

  // Midwest Region
  IL: { fips: '17', name: 'Illinois', abbrev: 'IL', region: 'midwest' },
  IN: { fips: '18', name: 'Indiana', abbrev: 'IN', region: 'midwest' },
  IA: { fips: '19', name: 'Iowa', abbrev: 'IA', region: 'midwest' },
  KS: { fips: '20', name: 'Kansas', abbrev: 'KS', region: 'midwest' },
  MI: { fips: '26', name: 'Michigan', abbrev: 'MI', region: 'midwest' },
  MN: { fips: '27', name: 'Minnesota', abbrev: 'MN', region: 'midwest' },
  MO: { fips: '29', name: 'Missouri', abbrev: 'MO', region: 'midwest' },
  NE: { fips: '31', name: 'Nebraska', abbrev: 'NE', region: 'midwest' },
  ND: { fips: '38', name: 'North Dakota', abbrev: 'ND', region: 'midwest' },
  OH: { fips: '39', name: 'Ohio', abbrev: 'OH', region: 'midwest' },
  SD: { fips: '46', name: 'South Dakota', abbrev: 'SD', region: 'midwest' },
  WI: { fips: '55', name: 'Wisconsin', abbrev: 'WI', region: 'midwest' },

  // Southwest Region
  AZ: { fips: '04', name: 'Arizona', abbrev: 'AZ', region: 'southwest' },
  NM: { fips: '35', name: 'New Mexico', abbrev: 'NM', region: 'southwest' },
  OK: { fips: '40', name: 'Oklahoma', abbrev: 'OK', region: 'southwest' },
  TX: { fips: '48', name: 'Texas', abbrev: 'TX', region: 'southwest' },

  // West Region (Mountain)
  CO: { fips: '08', name: 'Colorado', abbrev: 'CO', region: 'west' },
  ID: { fips: '16', name: 'Idaho', abbrev: 'ID', region: 'west' },
  MT: { fips: '30', name: 'Montana', abbrev: 'MT', region: 'west' },
  NV: { fips: '32', name: 'Nevada', abbrev: 'NV', region: 'west' },
  UT: { fips: '49', name: 'Utah', abbrev: 'UT', region: 'west' },
  WY: { fips: '56', name: 'Wyoming', abbrev: 'WY', region: 'west' },

  // Pacific Region
  AK: { fips: '02', name: 'Alaska', abbrev: 'AK', region: 'pacific' },
  CA: { fips: '06', name: 'California', abbrev: 'CA', region: 'pacific' },
  HI: { fips: '15', name: 'Hawaii', abbrev: 'HI', region: 'pacific' },
  OR: { fips: '41', name: 'Oregon', abbrev: 'OR', region: 'pacific' },
  WA: { fips: '53', name: 'Washington', abbrev: 'WA', region: 'pacific' },

  // US Territories
  PR: { fips: '72', name: 'Puerto Rico', abbrev: 'PR', region: 'territory' },
  VI: { fips: '78', name: 'Virgin Islands', abbrev: 'VI', region: 'territory' },
  GU: { fips: '66', name: 'Guam', abbrev: 'GU', region: 'territory' },
  AS: { fips: '60', name: 'American Samoa', abbrev: 'AS', region: 'territory' },
  MP: { fips: '69', name: 'Northern Mariana Islands', abbrev: 'MP', region: 'territory' },
};

// ============================================================================
// MAJOR METROPOLITAN STATISTICAL AREAS - Top 100 by Population
// ============================================================================

/**
 * Top 100 Metropolitan Statistical Areas by 2023 population.
 * Keyed by normalized name for easy lookup.
 */
export const MAJOR_MSAS: Record<string, MsaInfo> = {
  NEW_YORK: {
    code: '35620',
    name: 'New York-Newark-Jersey City, NY-NJ-PA',
    states: ['NY', 'NJ', 'PA'],
    principalCities: [
      'New York',
      'Newark',
      'Jersey City',
      'Paterson',
      'Elizabeth',
      'Edison',
      'Woodbridge',
      'Yonkers',
      'White Plains',
    ],
    population: 19498513,
    rank: 1,
  },
  LOS_ANGELES: {
    code: '31080',
    name: 'Los Angeles-Long Beach-Anaheim, CA',
    states: ['CA'],
    principalCities: [
      'Los Angeles',
      'Long Beach',
      'Anaheim',
      'Santa Ana',
      'Irvine',
      'Glendale',
      'Huntington Beach',
      'Santa Clarita',
      'Garden Grove',
      'Oceanside',
      'Rancho Cucamonga',
      'Ontario',
      'Fontana',
      'Pasadena',
      'Torrance',
      'Fullerton',
      'Orange',
      'Pomona',
      'Burbank',
    ],
    population: 12872322,
    rank: 2,
  },
  CHICAGO: {
    code: '16980',
    name: 'Chicago-Naperville-Elgin, IL-IN-WI',
    states: ['IL', 'IN', 'WI'],
    principalCities: [
      'Chicago',
      'Aurora',
      'Naperville',
      'Joliet',
      'Elgin',
      'Waukegan',
      'Cicero',
      'Gary',
      'Hammond',
      'Kenosha',
    ],
    population: 9441499,
    rank: 3,
  },
  DALLAS: {
    code: '19100',
    name: 'Dallas-Fort Worth-Arlington, TX',
    states: ['TX'],
    principalCities: [
      'Dallas',
      'Fort Worth',
      'Arlington',
      'Plano',
      'Garland',
      'Irving',
      'Frisco',
      'McKinney',
      'Grand Prairie',
      'Denton',
      'Mesquite',
      'Carrollton',
      'Midland',
      'Richardson',
      'Lewisville',
      'Allen',
      'Flower Mound',
    ],
    population: 7944851,
    rank: 4,
  },
  HOUSTON: {
    code: '26420',
    name: 'Houston-The Woodlands-Sugar Land, TX',
    states: ['TX'],
    principalCities: [
      'Houston',
      'The Woodlands',
      'Sugar Land',
      'Pasadena',
      'Pearland',
      'League City',
      'Baytown',
      'Conroe',
      'Missouri City',
      'Beaumont',
    ],
    population: 7340508,
    rank: 5,
  },
  WASHINGTON_DC: {
    code: '47900',
    name: 'Washington-Arlington-Alexandria, DC-VA-MD-WV',
    states: ['DC', 'VA', 'MD', 'WV'],
    principalCities: [
      'Washington',
      'Arlington',
      'Alexandria',
      'Silver Spring',
      'Rockville',
      'Frederick',
      'Gaithersburg',
      'Fairfax',
      'Reston',
      'Bethesda',
    ],
    population: 6361874,
    rank: 6,
  },
  PHILADELPHIA: {
    code: '37980',
    name: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD',
    states: ['PA', 'NJ', 'DE', 'MD'],
    principalCities: [
      'Philadelphia',
      'Camden',
      'Wilmington',
      'Chester',
      'Trenton',
      'Cherry Hill',
      'Reading',
    ],
    population: 6246350,
    rank: 7,
  },
  MIAMI: {
    code: '33100',
    name: 'Miami-Fort Lauderdale-Pompano Beach, FL',
    states: ['FL'],
    principalCities: [
      'Miami',
      'Fort Lauderdale',
      'Pompano Beach',
      'Hollywood',
      'Hialeah',
      'Coral Springs',
      'Miami Beach',
      'Pembroke Pines',
      'Miramar',
      'Davie',
      'Boca Raton',
      'Sunrise',
      'Plantation',
      'Deerfield Beach',
      'Weston',
    ],
    population: 6183199,
    rank: 8,
  },
  ATLANTA: {
    code: '12060',
    name: 'Atlanta-Sandy Springs-Alpharetta, GA',
    states: ['GA'],
    principalCities: [
      'Atlanta',
      'Sandy Springs',
      'Alpharetta',
      'Roswell',
      'Johns Creek',
      'Marietta',
      'Smyrna',
      'Brookhaven',
      'Dunwoody',
      'Peachtree Corners',
    ],
    population: 6144050,
    rank: 9,
  },
  PHOENIX: {
    code: '38060',
    name: 'Phoenix-Mesa-Chandler, AZ',
    states: ['AZ'],
    principalCities: [
      'Phoenix',
      'Mesa',
      'Chandler',
      'Scottsdale',
      'Gilbert',
      'Glendale',
      'Tempe',
      'Peoria',
      'Surprise',
      'Goodyear',
      'Buckeye',
      'Avondale',
    ],
    population: 5024221,
    rank: 10,
  },
  BOSTON: {
    code: '14460',
    name: 'Boston-Cambridge-Newton, MA-NH',
    states: ['MA', 'NH'],
    principalCities: [
      'Boston',
      'Cambridge',
      'Newton',
      'Quincy',
      'Somerville',
      'Lynn',
      'Framingham',
      'Waltham',
      'Brockton',
      'New Bedford',
      'Fall River',
      'Lowell',
      'Worcester',
      'Lawrence',
      'Nashua',
      'Manchester',
    ],
    population: 4919179,
    rank: 11,
  },
  SAN_FRANCISCO: {
    code: '41860',
    name: 'San Francisco-Oakland-Berkeley, CA',
    states: ['CA'],
    principalCities: [
      'San Francisco',
      'Oakland',
      'Berkeley',
      'Fremont',
      'Hayward',
      'Sunnyvale',
      'Santa Clara',
      'Concord',
      'Richmond',
      'Daly City',
      'San Mateo',
      'Vallejo',
      'Antioch',
      'Fairfield',
    ],
    population: 4566961,
    rank: 12,
  },
  RIVERSIDE: {
    code: '40140',
    name: 'Riverside-San Bernardino-Ontario, CA',
    states: ['CA'],
    principalCities: [
      'Riverside',
      'San Bernardino',
      'Ontario',
      'Fontana',
      'Moreno Valley',
      'Rancho Cucamonga',
      'Corona',
      'Murrieta',
      'Temecula',
      'Victorville',
      'Rialto',
      'El Centro',
      'Hemet',
      'Indio',
      'Menifee',
      'Chino',
      'Chino Hills',
    ],
    population: 4653105,
    rank: 13,
  },
  DETROIT: {
    code: '19820',
    name: 'Detroit-Warren-Dearborn, MI',
    states: ['MI'],
    principalCities: [
      'Detroit',
      'Warren',
      'Dearborn',
      'Sterling Heights',
      'Ann Arbor',
      'Livonia',
      'Troy',
      'Westland',
      'Farmington Hills',
      'Southfield',
      'Rochester Hills',
      'Pontiac',
      'Royal Oak',
      'Novi',
      'Taylor',
      'St. Clair Shores',
      'Dearborn Heights',
    ],
    population: 4340618,
    rank: 14,
  },
  SEATTLE: {
    code: '42660',
    name: 'Seattle-Tacoma-Bellevue, WA',
    states: ['WA'],
    principalCities: [
      'Seattle',
      'Tacoma',
      'Bellevue',
      'Kent',
      'Everett',
      'Renton',
      'Federal Way',
      'Spokane',
      'Kirkland',
      'Auburn',
      'Redmond',
      'Sammamish',
      'Lakewood',
      'Bellingham',
      'Olympia',
    ],
    population: 4018762,
    rank: 15,
  },
  MINNEAPOLIS: {
    code: '33460',
    name: 'Minneapolis-St. Paul-Bloomington, MN-WI',
    states: ['MN', 'WI'],
    principalCities: [
      'Minneapolis',
      'St. Paul',
      'Bloomington',
      'Brooklyn Park',
      'Plymouth',
      'Maple Grove',
      'Woodbury',
      'Blaine',
      'Lakeville',
      'Eagan',
      'Burnsville',
      'Eden Prairie',
      'Coon Rapids',
      'Apple Valley',
      'Edina',
      'St. Louis Park',
      'Minnetonka',
      'Eau Claire',
    ],
    population: 3690512,
    rank: 16,
  },
  SAN_DIEGO: {
    code: '41740',
    name: 'San Diego-Chula Vista-Carlsbad, CA',
    states: ['CA'],
    principalCities: [
      'San Diego',
      'Chula Vista',
      'Carlsbad',
      'Oceanside',
      'Escondido',
      'El Cajon',
      'Vista',
      'San Marcos',
      'Encinitas',
      'National City',
      'La Mesa',
      'Santee',
      'Poway',
    ],
    population: 3276208,
    rank: 17,
  },
  TAMPA: {
    code: '45300',
    name: 'Tampa-St. Petersburg-Clearwater, FL',
    states: ['FL'],
    principalCities: [
      'Tampa',
      'St. Petersburg',
      'Clearwater',
      'Brandon',
      'Lakeland',
      'Palm Harbor',
      'Spring Hill',
      'Largo',
      'Riverview',
      'Plant City',
      'Wesley Chapel',
      'New Port Richey',
    ],
    population: 3347937,
    rank: 18,
  },
  DENVER: {
    code: '19740',
    name: 'Denver-Aurora-Lakewood, CO',
    states: ['CO'],
    principalCities: [
      'Denver',
      'Aurora',
      'Lakewood',
      'Thornton',
      'Arvada',
      'Westminster',
      'Centennial',
      'Boulder',
      'Greeley',
      'Longmont',
      'Loveland',
      'Broomfield',
      'Castle Rock',
      'Parker',
      'Littleton',
      'Commerce City',
      'Brighton',
      'Northglenn',
    ],
    population: 2986767,
    rank: 19,
  },
  ST_LOUIS: {
    code: '41180',
    name: 'St. Louis, MO-IL',
    states: ['MO', 'IL'],
    principalCities: [
      'St. Louis',
      'St. Charles',
      "O'Fallon",
      'St. Peters',
      'Florissant',
      'Chesterfield',
      'Wildwood',
      'Ballwin',
      'University City',
      'Kirkwood',
      'Webster Groves',
      'Maryland Heights',
      'Belleville',
      'Granite City',
      'Alton',
      'Edwardsville',
    ],
    population: 2803228,
    rank: 20,
  },
  BALTIMORE: {
    code: '12580',
    name: 'Baltimore-Columbia-Towson, MD',
    states: ['MD'],
    principalCities: [
      'Baltimore',
      'Columbia',
      'Towson',
      'Ellicott City',
      'Dundalk',
      'Catonsville',
      'Woodlawn',
      'Severn',
      'Odenton',
      'Annapolis',
      'Glen Burnie',
      'Bel Air',
    ],
    population: 2834853,
    rank: 21,
  },
  ORLANDO: {
    code: '36740',
    name: 'Orlando-Kissimmee-Sanford, FL',
    states: ['FL'],
    principalCities: [
      'Orlando',
      'Kissimmee',
      'Sanford',
      'Deltona',
      'Ocoee',
      'Apopka',
      'Winter Garden',
      'Altamonte Springs',
      'Oviedo',
      'Winter Park',
      'Lake Mary',
      'Clermont',
    ],
    population: 2817925,
    rank: 22,
  },
  CHARLOTTE: {
    code: '16740',
    name: 'Charlotte-Concord-Gastonia, NC-SC',
    states: ['NC', 'SC'],
    principalCities: [
      'Charlotte',
      'Concord',
      'Gastonia',
      'Huntersville',
      'Rock Hill',
      'Kannapolis',
      'Monroe',
      'Indian Trail',
      'Cornelius',
      'Matthews',
      'Mooresville',
      'Mint Hill',
    ],
    population: 2805115,
    rank: 23,
  },
  SAN_ANTONIO: {
    code: '41700',
    name: 'San Antonio-New Braunfels, TX',
    states: ['TX'],
    principalCities: [
      'San Antonio',
      'New Braunfels',
      'San Marcos',
      'Seguin',
      'Schertz',
      'Cibolo',
      'Universal City',
      'Live Oak',
      'Converse',
      'Selma',
    ],
    population: 2655092,
    rank: 24,
  },
  PORTLAND: {
    code: '38900',
    name: 'Portland-Vancouver-Hillsboro, OR-WA',
    states: ['OR', 'WA'],
    principalCities: [
      'Portland',
      'Vancouver',
      'Hillsboro',
      'Gresham',
      'Beaverton',
      'Tigard',
      'Lake Oswego',
      'Oregon City',
      'Tualatin',
      'West Linn',
      'Milwaukie',
      'Camas',
      'Battle Ground',
    ],
    population: 2508050,
    rank: 25,
  },
  SACRAMENTO: {
    code: '40900',
    name: 'Sacramento-Roseville-Folsom, CA',
    states: ['CA'],
    principalCities: [
      'Sacramento',
      'Roseville',
      'Folsom',
      'Elk Grove',
      'Rancho Cordova',
      'Citrus Heights',
      'Rocklin',
      'Davis',
      'Woodland',
      'Lincoln',
      'West Sacramento',
      'Yuba City',
      'Vacaville',
    ],
    population: 2422185,
    rank: 26,
  },
  PITTSBURGH: {
    code: '38300',
    name: 'Pittsburgh, PA',
    states: ['PA'],
    principalCities: [
      'Pittsburgh',
      'McKeesport',
      'Bethel Park',
      'Mount Lebanon',
      'Penn Hills',
      'Ross Township',
      'McCandless',
      'Shaler Township',
      'Plum',
      'Monroeville',
      'West Mifflin',
      'Hampton Township',
      'North Huntingdon',
    ],
    population: 2352573,
    rank: 27,
  },
  LAS_VEGAS: {
    code: '29820',
    name: 'Las Vegas-Henderson-Paradise, NV',
    states: ['NV'],
    principalCities: [
      'Las Vegas',
      'Henderson',
      'Paradise',
      'North Las Vegas',
      'Enterprise',
      'Spring Valley',
      'Sunrise Manor',
      'Whitney',
      'Summerlin South',
    ],
    population: 2336573,
    rank: 28,
  },
  AUSTIN: {
    code: '12420',
    name: 'Austin-Round Rock-Georgetown, TX',
    states: ['TX'],
    principalCities: [
      'Austin',
      'Round Rock',
      'Georgetown',
      'Cedar Park',
      'Pflugerville',
      'San Marcos',
      'Leander',
      'Kyle',
      'Hutto',
      'Taylor',
      'Bastrop',
      'Buda',
    ],
    population: 2352426,
    rank: 29,
  },
  CINCINNATI: {
    code: '17140',
    name: 'Cincinnati, OH-KY-IN',
    states: ['OH', 'KY', 'IN'],
    principalCities: [
      'Cincinnati',
      'Covington',
      'Newport',
      'Hamilton',
      'Fairfield',
      'Middletown',
      'Mason',
      'Florence',
      'Burlington',
      'West Chester',
      'Colerain Township',
      'Green Township',
      'Deerfield Township',
    ],
    population: 2256884,
    rank: 30,
  },
  KANSAS_CITY: {
    code: '28140',
    name: 'Kansas City, MO-KS',
    states: ['MO', 'KS'],
    principalCities: [
      'Kansas City',
      'Overland Park',
      'Olathe',
      'Independence',
      "Lee's Summit",
      'Shawnee',
      'Blue Springs',
      'Lenexa',
      'Leavenworth',
      'Leawood',
      'Liberty',
      'Raytown',
      'Gladstone',
      'Prairie Village',
    ],
    population: 2213711,
    rank: 31,
  },
  COLUMBUS: {
    code: '18140',
    name: 'Columbus, OH',
    states: ['OH'],
    principalCities: [
      'Columbus',
      'Dublin',
      'Westerville',
      'Grove City',
      'Reynoldsburg',
      'Gahanna',
      'Hilliard',
      'Upper Arlington',
      'Newark',
      'Lancaster',
      'Delaware',
      'Marion',
      'Marysville',
      'Pickerington',
    ],
    population: 2181269,
    rank: 32,
  },
  INDIANAPOLIS: {
    code: '26900',
    name: 'Indianapolis-Carmel-Anderson, IN',
    states: ['IN'],
    principalCities: [
      'Indianapolis',
      'Carmel',
      'Anderson',
      'Fishers',
      'Noblesville',
      'Greenwood',
      'Lawrence',
      'Westfield',
      'Brownsburg',
      'Plainfield',
      'Avon',
      'Zionsville',
    ],
    population: 2138468,
    rank: 33,
  },
  CLEVELAND: {
    code: '17460',
    name: 'Cleveland-Elyria, OH',
    states: ['OH'],
    principalCities: [
      'Cleveland',
      'Elyria',
      'Lakewood',
      'Parma',
      'Lorain',
      'Euclid',
      'Mentor',
      'Cleveland Heights',
      'Strongsville',
      'Westlake',
      'North Olmsted',
      'Solon',
      'Brunswick',
    ],
    population: 2058844,
    rank: 34,
  },
  SAN_JOSE: {
    code: '41940',
    name: 'San Jose-Sunnyvale-Santa Clara, CA',
    states: ['CA'],
    principalCities: [
      'San Jose',
      'Sunnyvale',
      'Santa Clara',
      'Mountain View',
      'Milpitas',
      'Palo Alto',
      'Cupertino',
      'Gilroy',
      'Campbell',
      'Morgan Hill',
      'Los Gatos',
      'Saratoga',
      'Los Altos',
    ],
    population: 1945566,
    rank: 35,
  },
  NASHVILLE: {
    code: '34980',
    name: 'Nashville-Davidson--Murfreesboro--Franklin, TN',
    states: ['TN'],
    principalCities: [
      'Nashville',
      'Murfreesboro',
      'Franklin',
      'Hendersonville',
      'Smyrna',
      'Mount Juliet',
      'Gallatin',
      'Spring Hill',
      'Brentwood',
      'Lebanon',
      'Columbia',
      'Clarksville',
    ],
    population: 2050317,
    rank: 36,
  },
  VIRGINIA_BEACH: {
    code: '47260',
    name: 'Virginia Beach-Norfolk-Newport News, VA-NC',
    states: ['VA', 'NC'],
    principalCities: [
      'Virginia Beach',
      'Norfolk',
      'Newport News',
      'Hampton',
      'Chesapeake',
      'Portsmouth',
      'Suffolk',
      'Williamsburg',
      'Yorktown',
      'Elizabeth City',
    ],
    population: 1821606,
    rank: 37,
  },
  PROVIDENCE: {
    code: '39300',
    name: 'Providence-Warwick, RI-MA',
    states: ['RI', 'MA'],
    principalCities: [
      'Providence',
      'Warwick',
      'Cranston',
      'Pawtucket',
      'East Providence',
      'Woonsocket',
      'Newport',
      'Bristol',
      'Attleboro',
      'Fall River',
      'New Bedford',
      'Taunton',
    ],
    population: 1676579,
    rank: 38,
  },
  MILWAUKEE: {
    code: '33340',
    name: 'Milwaukee-Waukesha, WI',
    states: ['WI'],
    principalCities: [
      'Milwaukee',
      'Waukesha',
      'West Allis',
      'Wauwatosa',
      'Brookfield',
      'New Berlin',
      'Menomonee Falls',
      'Oak Creek',
      'Franklin',
      'Greenfield',
      'South Milwaukee',
      'Cudahy',
      'Muskego',
    ],
    population: 1560424,
    rank: 39,
  },
  JACKSONVILLE: {
    code: '27260',
    name: 'Jacksonville, FL',
    states: ['FL'],
    principalCities: [
      'Jacksonville',
      'St. Augustine',
      'Orange Park',
      'Fleming Island',
      'Jacksonville Beach',
      'Ponte Vedra Beach',
      'Palm Coast',
      'Fernandina Beach',
    ],
    population: 1660449,
    rank: 40,
  },
  OKLAHOMA_CITY: {
    code: '36420',
    name: 'Oklahoma City, OK',
    states: ['OK'],
    principalCities: [
      'Oklahoma City',
      'Norman',
      'Edmond',
      'Moore',
      'Midwest City',
      'Enid',
      'Stillwater',
      'Shawnee',
      'Yukon',
      'Mustang',
      'Bethany',
      'El Reno',
    ],
    population: 1477926,
    rank: 41,
  },
  RALEIGH: {
    code: '39580',
    name: 'Raleigh-Cary, NC',
    states: ['NC'],
    principalCities: [
      'Raleigh',
      'Cary',
      'Durham',
      'Chapel Hill',
      'Apex',
      'Morrisville',
      'Wake Forest',
      'Holly Springs',
      'Fuquay-Varina',
      'Garner',
      'Clayton',
      'Knightdale',
    ],
    population: 1503881,
    rank: 42,
  },
  MEMPHIS: {
    code: '32820',
    name: 'Memphis, TN-MS-AR',
    states: ['TN', 'MS', 'AR'],
    principalCities: [
      'Memphis',
      'Bartlett',
      'Collierville',
      'Germantown',
      'Southaven',
      'Olive Branch',
      'Horn Lake',
      'West Memphis',
      'Marion',
    ],
    population: 1339582,
    rank: 43,
  },
  RICHMOND: {
    code: '40060',
    name: 'Richmond, VA',
    states: ['VA'],
    principalCities: [
      'Richmond',
      'Henrico',
      'Chesterfield',
      'Midlothian',
      'Glen Allen',
      'Mechanicsville',
      'Colonial Heights',
      'Hopewell',
      'Petersburg',
      'Ashland',
    ],
    population: 1350104,
    rank: 44,
  },
  NEW_ORLEANS: {
    code: '35380',
    name: 'New Orleans-Metairie, LA',
    states: ['LA'],
    principalCities: [
      'New Orleans',
      'Metairie',
      'Kenner',
      'Harvey',
      'Marrero',
      'Slidell',
      'Mandeville',
      'Covington',
      'Houma',
      'Thibodaux',
      'Chalmette',
      'Gretna',
    ],
    population: 1271651,
    rank: 45,
  },
  LOUISVILLE: {
    code: '31140',
    name: 'Louisville/Jefferson County, KY-IN',
    states: ['KY', 'IN'],
    principalCities: [
      'Louisville',
      'Jeffersonville',
      'New Albany',
      'Elizabethtown',
      'Frankfort',
      'Radcliff',
      'Clarksville',
      'St. Matthews',
      'Middletown',
    ],
    population: 1296113,
    rank: 46,
  },
  SALT_LAKE_CITY: {
    code: '41620',
    name: 'Salt Lake City, UT',
    states: ['UT'],
    principalCities: [
      'Salt Lake City',
      'West Valley City',
      'Provo',
      'West Jordan',
      'Orem',
      'Sandy',
      'Ogden',
      'St. George',
      'Layton',
      'Millcreek',
      'Taylorsville',
      'South Jordan',
      'Lehi',
      'Bountiful',
      'Murray',
      'Draper',
      'Riverton',
      'Roy',
      'Spanish Fork',
      'Pleasant Grove',
    ],
    population: 1267864,
    rank: 47,
  },
  HARTFORD: {
    code: '25540',
    name: 'Hartford-East Hartford-Middletown, CT',
    states: ['CT'],
    principalCities: [
      'Hartford',
      'East Hartford',
      'Middletown',
      'New Britain',
      'Bristol',
      'West Hartford',
      'Manchester',
      'Enfield',
      'Glastonbury',
      'Newington',
      'Vernon',
      'Wethersfield',
      'Farmington',
    ],
    population: 1213531,
    rank: 48,
  },
  BUFFALO: {
    code: '15380',
    name: 'Buffalo-Cheektowaga, NY',
    states: ['NY'],
    principalCities: [
      'Buffalo',
      'Cheektowaga',
      'Tonawanda',
      'Amherst',
      'Hamburg',
      'West Seneca',
      'Lancaster',
      'Niagara Falls',
      'Lockport',
      'Clarence',
      'Orchard Park',
    ],
    population: 1163146,
    rank: 49,
  },
  BIRMINGHAM: {
    code: '13820',
    name: 'Birmingham-Hoover, AL',
    states: ['AL'],
    principalCities: [
      'Birmingham',
      'Hoover',
      'Tuscaloosa',
      'Vestavia Hills',
      'Homewood',
      'Mountain Brook',
      'Bessemer',
      'Alabaster',
      'Helena',
      'Trussville',
      'Pelham',
      'Gardendale',
      'Prattville',
    ],
    population: 1115289,
    rank: 50,
  },
  GRAND_RAPIDS: {
    code: '24340',
    name: 'Grand Rapids-Kentwood, MI',
    states: ['MI'],
    principalCities: [
      'Grand Rapids',
      'Kentwood',
      'Wyoming',
      'Walker',
      'Grandville',
      'Holland',
      'Muskegon',
      'East Grand Rapids',
      'Jenison',
      'Norton Shores',
      'Rockford',
    ],
    population: 1104430,
    rank: 51,
  },
  ROCHESTER: {
    code: '40380',
    name: 'Rochester, NY',
    states: ['NY'],
    principalCities: [
      'Rochester',
      'Greece',
      'Irondequoit',
      'Brighton',
      'Henrietta',
      'Penfield',
      'Perinton',
      'Webster',
      'Gates',
      'Pittsford',
      'Chili',
      'Victor',
    ],
    population: 1088162,
    rank: 52,
  },
  TUCSON: {
    code: '46060',
    name: 'Tucson, AZ',
    states: ['AZ'],
    principalCities: [
      'Tucson',
      'Marana',
      'Oro Valley',
      'Sahuarita',
      'South Tucson',
      'Casas Adobes',
      'Catalina Foothills',
      'Sierra Vista',
    ],
    population: 1063075,
    rank: 53,
  },
  HONOLULU: {
    code: '46520',
    name: 'Urban Honolulu, HI',
    states: ['HI'],
    principalCities: [
      'Honolulu',
      'Pearl City',
      'Hilo',
      'Kailua',
      'Kapolei',
      'Kaneohe',
      'Mililani',
      'Ewa Beach',
      'Aiea',
      'Waipahu',
    ],
    population: 1000890,
    rank: 54,
  },
  TULSA: {
    code: '46140',
    name: 'Tulsa, OK',
    states: ['OK'],
    principalCities: [
      'Tulsa',
      'Broken Arrow',
      'Muskogee',
      'Bixby',
      'Bartlesville',
      'Owasso',
      'Sapulpa',
      'Jenks',
      'Sand Springs',
      'Claremore',
      'Glenpool',
    ],
    population: 1015331,
    rank: 55,
  },
  FRESNO: {
    code: '23420',
    name: 'Fresno, CA',
    states: ['CA'],
    principalCities: [
      'Fresno',
      'Clovis',
      'Visalia',
      'Tulare',
      'Porterville',
      'Hanford',
      'Madera',
      'Selma',
      'Dinuba',
      'Sanger',
      'Reedley',
      'Lemoore',
    ],
    population: 1008654,
    rank: 56,
  },
  WORCESTER: {
    code: '49340',
    name: 'Worcester, MA-CT',
    states: ['MA', 'CT'],
    principalCities: [
      'Worcester',
      'Springfield',
      'Leominster',
      'Fitchburg',
      'Shrewsbury',
      'Westborough',
      'Marlborough',
      'Auburn',
      'Grafton',
      'Milford',
      'Webster',
    ],
    population: 983036,
    rank: 57,
  },
  BRIDGEPORT: {
    code: '14860',
    name: 'Bridgeport-Stamford-Norwalk, CT',
    states: ['CT'],
    principalCities: [
      'Bridgeport',
      'Stamford',
      'Norwalk',
      'Danbury',
      'Stratford',
      'Shelton',
      'Milford',
      'Trumbull',
      'Fairfield',
      'Greenwich',
      'Westport',
      'Darien',
    ],
    population: 969510,
    rank: 58,
  },
  OMAHA: {
    code: '36540',
    name: 'Omaha-Council Bluffs, NE-IA',
    states: ['NE', 'IA'],
    principalCities: [
      'Omaha',
      'Council Bluffs',
      'Bellevue',
      'Lincoln',
      'Grand Island',
      'Papillion',
      'La Vista',
      'Fremont',
      'Norfolk',
      'Columbus',
      'Beatrice',
    ],
    population: 976002,
    rank: 59,
  },
  ALBUQUERQUE: {
    code: '10740',
    name: 'Albuquerque, NM',
    states: ['NM'],
    principalCities: [
      'Albuquerque',
      'Rio Rancho',
      'Santa Fe',
      'Las Cruces',
      'Farmington',
      'Los Lunas',
      'Bernalillo',
      'Belen',
    ],
    population: 942386,
    rank: 60,
  },
  BAKERSFIELD: {
    code: '12540',
    name: 'Bakersfield, CA',
    states: ['CA'],
    principalCities: [
      'Bakersfield',
      'Delano',
      'Wasco',
      'Shafter',
      'Arvin',
      'Tehachapi',
      'California City',
      'Taft',
    ],
    population: 909235,
    rank: 61,
  },
  ALBANY: {
    code: '10580',
    name: 'Albany-Schenectady-Troy, NY',
    states: ['NY'],
    principalCities: [
      'Albany',
      'Schenectady',
      'Troy',
      'Saratoga Springs',
      'Clifton Park',
      'Colonie',
      'Rotterdam',
      'Guilderland',
      'Niskayuna',
      'Bethlehem',
      'Cohoes',
    ],
    population: 899262,
    rank: 62,
  },
  NEW_HAVEN: {
    code: '35300',
    name: 'New Haven-Milford, CT',
    states: ['CT'],
    principalCities: [
      'New Haven',
      'Milford',
      'West Haven',
      'Hamden',
      'Meriden',
      'Wallingford',
      'Branford',
      'East Haven',
      'North Haven',
      'Guilford',
      'Cheshire',
      'Naugatuck',
    ],
    population: 864835,
    rank: 63,
  },
  MCALLEN: {
    code: '32580',
    name: 'McAllen-Edinburg-Mission, TX',
    states: ['TX'],
    principalCities: [
      'McAllen',
      'Edinburg',
      'Mission',
      'Pharr',
      'Brownsville',
      'Harlingen',
      'San Benito',
      'Weslaco',
      'Mercedes',
    ],
    population: 880636,
    rank: 64,
  },
  OXNARD: {
    code: '37100',
    name: 'Oxnard-Thousand Oaks-Ventura, CA',
    states: ['CA'],
    principalCities: [
      'Oxnard',
      'Thousand Oaks',
      'Ventura',
      'Simi Valley',
      'Santa Paula',
      'Camarillo',
      'Moorpark',
      'Port Hueneme',
      'Ojai',
      'Fillmore',
    ],
    population: 839784,
    rank: 65,
  },
  EL_PASO: {
    code: '21340',
    name: 'El Paso, TX',
    states: ['TX'],
    principalCities: [
      'El Paso',
      'Socorro',
      'Horizon City',
      'Anthony',
      'Canutillo',
      'Fabens',
      'Clint',
    ],
    population: 868859,
    rank: 66,
  },
  BATON_ROUGE: {
    code: '12940',
    name: 'Baton Rouge, LA',
    states: ['LA'],
    principalCities: [
      'Baton Rouge',
      'Denham Springs',
      'Central',
      'Zachary',
      'Baker',
      'Gonzales',
      'Prairieville',
      'Shenandoah',
      'Port Allen',
    ],
    population: 870569,
    rank: 67,
  },
  ALLENTOWN: {
    code: '10900',
    name: 'Allentown-Bethlehem-Easton, PA-NJ',
    states: ['PA', 'NJ'],
    principalCities: [
      'Allentown',
      'Bethlehem',
      'Easton',
      'Phillipsburg',
      'Whitehall',
      'Emmaus',
      'Nazareth',
      'Palmer Township',
      'Lower Macungie',
    ],
    population: 861889,
    rank: 68,
  },
  COLUMBIA_SC: {
    code: '17900',
    name: 'Columbia, SC',
    states: ['SC'],
    principalCities: [
      'Columbia',
      'Rock Hill',
      'Sumter',
      'Florence',
      'Lexington',
      'Irmo',
      'Forest Acres',
      'Cayce',
      'West Columbia',
      'Blythewood',
    ],
    population: 854326,
    rank: 69,
  },
  KNOXVILLE: {
    code: '28940',
    name: 'Knoxville, TN',
    states: ['TN'],
    principalCities: [
      'Knoxville',
      'Maryville',
      'Oak Ridge',
      'Farragut',
      'Sevierville',
      'Alcoa',
      'Clinton',
      'Morristown',
      'Jefferson City',
    ],
    population: 911827,
    rank: 70,
  },
  NORTH_PORT: {
    code: '35840',
    name: 'North Port-Sarasota-Bradenton, FL',
    states: ['FL'],
    principalCities: [
      'North Port',
      'Sarasota',
      'Bradenton',
      'Venice',
      'Englewood',
      'Palmetto',
      'Lakewood Ranch',
      'Siesta Key',
    ],
    population: 889479,
    rank: 71,
  },
  GREENSBORO: {
    code: '24660',
    name: 'Greensboro-High Point, NC',
    states: ['NC'],
    principalCities: [
      'Greensboro',
      'High Point',
      'Burlington',
      'Thomasville',
      'Asheboro',
      'Lexington',
      'Kernersville',
      'Graham',
      'Jamestown',
      'Oak Ridge',
    ],
    population: 783506,
    rank: 72,
  },
  CHARLESTON_SC: {
    code: '16700',
    name: 'Charleston-North Charleston, SC',
    states: ['SC'],
    principalCities: [
      'Charleston',
      'North Charleston',
      'Mount Pleasant',
      'Summerville',
      'Goose Creek',
      'Hanahan',
      'Ladson',
      'James Island',
      'Isle of Palms',
      "Sullivan's Island",
    ],
    population: 838962,
    rank: 73,
  },
  STOCKTON: {
    code: '44700',
    name: 'Stockton, CA',
    states: ['CA'],
    principalCities: ['Stockton', 'Tracy', 'Manteca', 'Lodi', 'Lathrop', 'Ripon'],
    population: 789410,
    rank: 74,
  },
  AKRON: {
    code: '10420',
    name: 'Akron, OH',
    states: ['OH'],
    principalCities: [
      'Akron',
      'Canton',
      'Massillon',
      'Stow',
      'Barberton',
      'Cuyahoga Falls',
      'Green',
      'Kent',
      'Hudson',
      'Wadsworth',
      'Tallmadge',
      'North Canton',
    ],
    population: 703479,
    rank: 75,
  },
  CAPE_CORAL: {
    code: '15980',
    name: 'Cape Coral-Fort Myers, FL',
    states: ['FL'],
    principalCities: [
      'Cape Coral',
      'Fort Myers',
      'Lehigh Acres',
      'Bonita Springs',
      'Estero',
      'North Fort Myers',
      'Sanibel',
      'Pine Island',
    ],
    population: 840998,
    rank: 76,
  },
  COLORADO_SPRINGS: {
    code: '17820',
    name: 'Colorado Springs, CO',
    states: ['CO'],
    principalCities: [
      'Colorado Springs',
      'Pueblo',
      'Security-Widefield',
      'Fountain',
      'Cimarron Hills',
      'Black Forest',
      'Woodland Park',
      'Canon City',
    ],
    population: 764115,
    rank: 77,
  },
  BOISE: {
    code: '14260',
    name: 'Boise City, ID',
    states: ['ID'],
    principalCities: [
      'Boise',
      'Meridian',
      'Nampa',
      'Caldwell',
      'Twin Falls',
      'Pocatello',
      'Idaho Falls',
      'Eagle',
      'Kuna',
      'Star',
      'Mountain Home',
    ],
    population: 824003,
    rank: 78,
  },
  DAYTON: {
    code: '19380',
    name: 'Dayton-Kettering, OH',
    states: ['OH'],
    principalCities: [
      'Dayton',
      'Kettering',
      'Beavercreek',
      'Springfield',
      'Huber Heights',
      'Fairborn',
      'Centerville',
      'Xenia',
      'Miamisburg',
      'Trotwood',
      'Riverside',
    ],
    population: 813183,
    rank: 79,
  },
  LITTLE_ROCK: {
    code: '30780',
    name: 'Little Rock-North Little Rock-Conway, AR',
    states: ['AR'],
    principalCities: [
      'Little Rock',
      'North Little Rock',
      'Conway',
      'Jacksonville',
      'Benton',
      'Sherwood',
      'Cabot',
      'Bryant',
      'Maumelle',
      'Hot Springs',
    ],
    population: 761432,
    rank: 80,
  },
  PROVO: {
    code: '39340',
    name: 'Provo-Orem, UT',
    states: ['UT'],
    principalCities: [
      'Provo',
      'Orem',
      'Lehi',
      'Spanish Fork',
      'Pleasant Grove',
      'American Fork',
      'Springville',
      'Eagle Mountain',
      'Saratoga Springs',
      'Payson',
      'Highland',
      'Cedar Hills',
    ],
    population: 714388,
    rank: 81,
  },
  DES_MOINES: {
    code: '19780',
    name: 'Des Moines-West Des Moines, IA',
    states: ['IA'],
    principalCities: [
      'Des Moines',
      'West Des Moines',
      'Ankeny',
      'Ames',
      'Urbandale',
      'Waukee',
      'Johnston',
      'Clive',
      'Altoona',
      'Pleasant Hill',
      'Indianola',
      'Grimes',
    ],
    population: 709466,
    rank: 82,
  },
  WINSTON_SALEM: {
    code: '49180',
    name: 'Winston-Salem, NC',
    states: ['NC'],
    principalCities: [
      'Winston-Salem',
      'Clemmons',
      'Kernersville',
      'Lexington',
      'Thomasville',
      'King',
      'Lewisville',
      'Walkertown',
      'Bermuda Run',
      'Advance',
    ],
    population: 682952,
    rank: 83,
  },
  OGDEN: {
    code: '36260',
    name: 'Ogden-Clearfield, UT',
    states: ['UT'],
    principalCities: [
      'Ogden',
      'Clearfield',
      'Layton',
      'Roy',
      'Syracuse',
      'Kaysville',
      'Farmington',
      'Bountiful',
      'Clinton',
      'South Ogden',
      'North Ogden',
      'West Point',
    ],
    population: 720590,
    rank: 84,
  },
  SPRINGFIELD_MA: {
    code: '44140',
    name: 'Springfield, MA',
    states: ['MA'],
    principalCities: [
      'Springfield',
      'Chicopee',
      'Westfield',
      'Holyoke',
      'West Springfield',
      'Agawam',
      'Northampton',
      'Easthampton',
      'Ludlow',
    ],
    population: 698537,
    rank: 85,
  },
  MADISON: {
    code: '31540',
    name: 'Madison, WI',
    states: ['WI'],
    principalCities: [
      'Madison',
      'Sun Prairie',
      'Fitchburg',
      'Middleton',
      'Janesville',
      'Beloit',
      'Waunakee',
      'Verona',
      'Stoughton',
      'Oregon',
      'McFarland',
      'DeForest',
    ],
    population: 695364,
    rank: 86,
  },
  HARRISBURG: {
    code: '25420',
    name: 'Harrisburg-Carlisle, PA',
    states: ['PA'],
    principalCities: [
      'Harrisburg',
      'Carlisle',
      'Mechanicsburg',
      'Camp Hill',
      'Hershey',
      'Lemoyne',
      'New Cumberland',
      'Enola',
      'Hummelstown',
      'Middletown',
    ],
    population: 594852,
    rank: 87,
  },
  LAKELAND: {
    code: '29460',
    name: 'Lakeland-Winter Haven, FL',
    states: ['FL'],
    principalCities: [
      'Lakeland',
      'Winter Haven',
      'Auburndale',
      'Bartow',
      'Haines City',
      'Lake Wales',
      'Mulberry',
      'Dundee',
      'Davenport',
      'Poinciana',
    ],
    population: 784399,
    rank: 88,
  },
  WICHITA: {
    code: '48620',
    name: 'Wichita, KS',
    states: ['KS'],
    principalCities: [
      'Wichita',
      'Derby',
      'Hutchinson',
      'Newton',
      'Andover',
      'Haysville',
      'Valley Center',
      'Park City',
      'Goddard',
      'Bel Aire',
      'Maize',
    ],
    population: 649114,
    rank: 89,
  },
  SCRANTON: {
    code: '42540',
    name: 'Scranton--Wilkes-Barre, PA',
    states: ['PA'],
    principalCities: [
      'Scranton',
      'Wilkes-Barre',
      'Hazleton',
      'Pittston',
      'Kingston',
      'Nanticoke',
      'Dunmore',
      'Old Forge',
      'Taylor',
      'Clarks Summit',
      'Carbondale',
    ],
    population: 555485,
    rank: 90,
  },
  GREENVILLE_SC: {
    code: '24860',
    name: 'Greenville-Anderson, SC',
    states: ['SC'],
    principalCities: [
      'Greenville',
      'Anderson',
      'Spartanburg',
      'Greer',
      'Mauldin',
      'Simpsonville',
      'Easley',
      'Taylors',
      'Five Forks',
      'Wade Hampton',
    ],
    population: 958661,
    rank: 91,
  },
  SYRACUSE: {
    code: '45060',
    name: 'Syracuse, NY',
    states: ['NY'],
    principalCities: [
      'Syracuse',
      'Liverpool',
      'Cicero',
      'Clay',
      'Manlius',
      'DeWitt',
      'Camillus',
      'Baldwinsville',
      'Fayetteville',
      'Salina',
      'Onondaga',
    ],
    population: 649211,
    rank: 92,
  },
  PALM_BAY: {
    code: '37340',
    name: 'Palm Bay-Melbourne-Titusville, FL',
    states: ['FL'],
    principalCities: [
      'Palm Bay',
      'Melbourne',
      'Titusville',
      'Rockledge',
      'Cocoa',
      'Merritt Island',
      'West Melbourne',
      'Satellite Beach',
      'Cocoa Beach',
      'Cape Canaveral',
    ],
    population: 639407,
    rank: 93,
  },
  CHATTANOOGA: {
    code: '16860',
    name: 'Chattanooga, TN-GA',
    states: ['TN', 'GA'],
    principalCities: [
      'Chattanooga',
      'East Ridge',
      'Red Bank',
      'Signal Mountain',
      'Soddy-Daisy',
      'Collegedale',
      'Ringgold',
      'Fort Oglethorpe',
      'Cleveland',
    ],
    population: 575153,
    rank: 94,
  },
  DELTONA: {
    code: '19660',
    name: 'Deltona-Daytona Beach-Ormond Beach, FL',
    states: ['FL'],
    principalCities: [
      'Deltona',
      'Daytona Beach',
      'Ormond Beach',
      'Port Orange',
      'New Smyrna Beach',
      'DeLand',
      'Holly Hill',
      'South Daytona',
      'Edgewater',
    ],
    population: 706469,
    rank: 95,
  },
  LANCASTER: {
    code: '29540',
    name: 'Lancaster, PA',
    states: ['PA'],
    principalCities: [
      'Lancaster',
      'Ephrata',
      'Lititz',
      'Elizabethtown',
      'Columbia',
      'Manheim',
      'Mount Joy',
      'Millersville',
      'Quarryville',
    ],
    population: 563342,
    rank: 96,
  },
  YOUNGSTOWN: {
    code: '49660',
    name: 'Youngstown-Warren-Boardman, OH-PA',
    states: ['OH', 'PA'],
    principalCities: [
      'Youngstown',
      'Warren',
      'Boardman',
      'Austintown',
      'Niles',
      'Girard',
      'Sharon',
      'Hermitage',
      'Struthers',
      'Canfield',
      'Hubbard',
    ],
    population: 538952,
    rank: 97,
  },
  TOLEDO: {
    code: '45780',
    name: 'Toledo, OH',
    states: ['OH'],
    principalCities: [
      'Toledo',
      'Oregon',
      'Sylvania',
      'Maumee',
      'Perrysburg',
      'Bowling Green',
      'Fremont',
      'Findlay',
      'Fostoria',
    ],
    population: 605356,
    rank: 98,
  },
  SPOKANE: {
    code: '44060',
    name: 'Spokane-Spokane Valley, WA',
    states: ['WA'],
    principalCities: [
      'Spokane',
      'Spokane Valley',
      'Liberty Lake',
      'Cheney',
      'Airway Heights',
      'Medical Lake',
    ],
    population: 591934,
    rank: 99,
  },
  AUGUSTA: {
    code: '12260',
    name: 'Augusta-Richmond County, GA-SC',
    states: ['GA', 'SC'],
    principalCities: [
      'Augusta',
      'Evans',
      'North Augusta',
      'Martinez',
      'Aiken',
      'Grovetown',
      'Hephzibah',
      'Thomson',
    ],
    population: 619923,
    rank: 100,
  },
};

// ============================================================================
// REVERSE LOOKUP MAPS (Built at module load for performance)
// ============================================================================

/** Map of FIPS code to state abbreviation */
const FIPS_TO_STATE: Map<string, string> = new Map(
  Object.entries(STATE_FIPS).map(([abbrev, info]) => [info.fips, abbrev])
);

/** Map of MSA code to MSA key */
const MSA_CODE_TO_KEY: Map<string, string> = new Map(
  Object.entries(MAJOR_MSAS).map(([key, info]) => [info.code, key])
);

/** Map of lowercase city name to array of MSA keys containing that city */
const CITY_TO_MSA: Map<string, string[]> = new Map();

// Build city-to-MSA index
for (const [key, msa] of Object.entries(MAJOR_MSAS)) {
  for (const city of msa.principalCities) {
    const lowerCity = city.toLowerCase();
    const existing = CITY_TO_MSA.get(lowerCity) || [];
    existing.push(key);
    CITY_TO_MSA.set(lowerCity, existing);
  }
}

// ============================================================================
// BLS AREA CODE BUILDERS
// ============================================================================

/**
 * Build BLS national area code.
 * @returns The national area code 'N0000000'
 */
export function buildNationalAreaCode(): string {
  return 'N0000000';
}

/**
 * Build BLS state area code from state abbreviation.
 * @param stateAbbrev - Two-letter state abbreviation (e.g., 'CA')
 * @returns State area code (e.g., 'S0600000' for California)
 * @throws Error if state abbreviation is not found
 */
export function buildStateAreaCode(stateAbbrev: string): string {
  const state = STATE_FIPS[stateAbbrev.toUpperCase()];
  if (!state) {
    throw new Error(`Unknown state abbreviation: ${stateAbbrev}`);
  }
  return `S${state.fips}00000`;
}

/**
 * Build BLS Metropolitan Statistical Area code.
 * @param msaCode - The CBSA code (e.g., '35620' for New York)
 * @returns MSA area code (e.g., 'M0000035620' for New York)
 */
export function buildMsaAreaCode(msaCode: string): string {
  // MSA codes are typically 5 digits, pad if necessary
  const paddedCode = msaCode.padStart(5, '0');
  return `M0000${paddedCode}`;
}

/**
 * Build BLS county area code.
 * @param stateAbbrev - Two-letter state abbreviation
 * @param countyFips - Three-digit county FIPS code
 * @returns County area code (e.g., 'CN0601000' for Alameda County, CA)
 */
export function buildCountyAreaCode(stateAbbrev: string, countyFips: string): string {
  const state = STATE_FIPS[stateAbbrev.toUpperCase()];
  if (!state) {
    throw new Error(`Unknown state abbreviation: ${stateAbbrev}`);
  }
  const paddedCounty = countyFips.padStart(3, '0');
  return `CN${state.fips}${paddedCounty}00`;
}

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get state information by abbreviation.
 * @param abbrev - Two-letter state abbreviation
 * @returns State info or null if not found
 */
export function getStateByAbbrev(abbrev: string): StateInfo | null {
  return STATE_FIPS[abbrev.toUpperCase()] || null;
}

/**
 * Get state information by FIPS code.
 * @param fips - Two-digit FIPS code
 * @returns State info or null if not found
 */
export function getStateByFips(fips: string): StateInfo | null {
  const paddedFips = fips.padStart(2, '0');
  const abbrev = FIPS_TO_STATE.get(paddedFips);
  return abbrev ? STATE_FIPS[abbrev] : null;
}

/**
 * Get MSA information by CBSA code.
 * @param code - CBSA code (e.g., '35620')
 * @returns MSA info or null if not found
 */
export function getMsaByCode(code: string): MsaInfo | null {
  const key = MSA_CODE_TO_KEY.get(code);
  return key ? MAJOR_MSAS[key] : null;
}

/**
 * Get MSA information by key.
 * @param key - MSA key (e.g., 'NEW_YORK')
 * @returns MSA info or null if not found
 */
export function getMsaByKey(key: string): MsaInfo | null {
  return MAJOR_MSAS[key.toUpperCase()] || null;
}

/**
 * Get all MSAs that include a given state.
 * @param stateAbbrev - Two-letter state abbreviation
 * @returns Array of MSAs in the state, sorted by population
 */
export function getMsasInState(stateAbbrev: string): MsaInfo[] {
  const upperState = stateAbbrev.toUpperCase();
  return Object.values(MAJOR_MSAS)
    .filter((msa) => msa.states.includes(upperState))
    .sort((a, b) => b.population - a.population);
}

/**
 * Find MSAs by name using fuzzy search.
 * @param searchTerm - Search term to match against MSA names and cities
 * @returns Array of matching MSAs, sorted by relevance
 */
export function findMsaByName(searchTerm: string): MsaInfo[] {
  const lower = searchTerm.toLowerCase().trim();

  if (!lower) return [];

  const results: { msa: MsaInfo; score: number }[] = [];

  for (const msa of Object.values(MAJOR_MSAS)) {
    let score = 0;
    const msaNameLower = msa.name.toLowerCase();

    // Exact name match gets highest score
    if (msaNameLower === lower) {
      score = 100;
    }
    // Name starts with search term
    else if (msaNameLower.startsWith(lower)) {
      score = 80;
    }
    // Name contains search term
    else if (msaNameLower.includes(lower)) {
      score = 60;
    }
    // Check principal cities
    else {
      for (const city of msa.principalCities) {
        const cityLower = city.toLowerCase();
        if (cityLower === lower) {
          score = Math.max(score, 90);
        } else if (cityLower.startsWith(lower)) {
          score = Math.max(score, 70);
        } else if (cityLower.includes(lower)) {
          score = Math.max(score, 50);
        }
      }
    }

    if (score > 0) {
      // Boost score slightly by population rank (more popular areas rank higher)
      score += (101 - msa.rank) / 100;
      results.push({ msa, score });
    }
  }

  return results.sort((a, b) => b.score - a.score).map((r) => r.msa);
}

// ============================================================================
// USER LOCATION HELPERS
// ============================================================================

/**
 * Parse a location string into city and state components.
 * Handles various formats:
 * - "San Francisco, CA"
 * - "San Francisco, California"
 * - "CA"
 * - "California"
 * - "San Francisco CA"
 *
 * @param location - Location string to parse
 * @returns Parsed location with city and state info
 */
export function parseLocationString(location: string): ParsedLocation {
  const result: ParsedLocation = {
    city: null,
    state: null,
    stateAbbrev: null,
  };

  if (!location || typeof location !== 'string') {
    return result;
  }

  const trimmed = location.trim();

  // Try comma-separated format first: "City, State"
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      result.city = parts[0] || null;
      const stateStr = parts[1];

      // Check if it's an abbreviation or full name
      if (stateStr.length === 2) {
        const stateInfo = getStateByAbbrev(stateStr);
        if (stateInfo) {
          result.state = stateInfo.name;
          result.stateAbbrev = stateInfo.abbrev;
        }
      } else {
        // Try to find by full name
        for (const [abbrev, info] of Object.entries(STATE_FIPS)) {
          if (info.name.toLowerCase() === stateStr.toLowerCase()) {
            result.state = info.name;
            result.stateAbbrev = abbrev;
            break;
          }
        }
      }
    }
  } else {
    // No comma - might be just state or "City State" format
    const words = trimmed.split(/\s+/);
    const lastWord = words[words.length - 1];

    // Check if last word is a state abbreviation
    if (lastWord.length === 2) {
      const stateInfo = getStateByAbbrev(lastWord);
      if (stateInfo) {
        result.state = stateInfo.name;
        result.stateAbbrev = stateInfo.abbrev;
        if (words.length > 1) {
          result.city = words.slice(0, -1).join(' ');
        }
        return result;
      }
    }

    // Check if entire string is a state name or abbreviation
    if (trimmed.length === 2) {
      const stateInfo = getStateByAbbrev(trimmed);
      if (stateInfo) {
        result.state = stateInfo.name;
        result.stateAbbrev = stateInfo.abbrev;
        return result;
      }
    }

    // Try to match full state name
    for (const [abbrev, info] of Object.entries(STATE_FIPS)) {
      if (info.name.toLowerCase() === trimmed.toLowerCase()) {
        result.state = info.name;
        result.stateAbbrev = abbrev;
        return result;
      }

      // Check if string ends with state name
      const lowerTrimmed = trimmed.toLowerCase();
      const lowerStateName = info.name.toLowerCase();
      if (lowerTrimmed.endsWith(lowerStateName)) {
        result.state = info.name;
        result.stateAbbrev = abbrev;
        const cityPart = trimmed.slice(0, -info.name.length).trim();
        if (cityPart) {
          result.city = cityPart;
        }
        return result;
      }
    }

    // If nothing matched, assume it's a city name
    result.city = trimmed;
  }

  return result;
}

/**
 * Find the MSA that contains a given city.
 * @param city - City name
 * @param state - State abbreviation (optional, helps narrow results)
 * @returns Best matching MSA or null if not found
 */
export function findNearestMsa(city: string, state?: string): MsaInfo | null {
  if (!city) return null;

  const lowerCity = city.toLowerCase().trim();
  const upperState = state?.toUpperCase();

  // First, try exact city match
  const msaKeys = CITY_TO_MSA.get(lowerCity);
  if (msaKeys && msaKeys.length > 0) {
    // If state is provided, filter by state
    if (upperState) {
      for (const key of msaKeys) {
        const msa = MAJOR_MSAS[key];
        if (msa.states.includes(upperState)) {
          return msa;
        }
      }
    }
    // Return first match if no state filter or no state match
    return MAJOR_MSAS[msaKeys[0]];
  }

  // Try fuzzy search
  const fuzzyResults = findMsaByName(city);
  if (fuzzyResults.length > 0) {
    // If state is provided, prefer MSAs in that state
    if (upperState) {
      const stateMatch = fuzzyResults.find((msa) => msa.states.includes(upperState));
      if (stateMatch) return stateMatch;
    }
    return fuzzyResults[0];
  }

  // If only state is provided, return largest MSA in that state
  if (upperState) {
    const stateMsas = getMsasInState(upperState);
    if (stateMsas.length > 0) {
      return stateMsas[0];
    }
  }

  return null;
}

/**
 * Get suggested relocation target states based on current location.
 * Suggests states in the same region and adjacent regions.
 *
 * @param currentState - Current state abbreviation
 * @returns Array of suggested state infos, sorted by proximity/relevance
 */
export function getRelocationTargets(currentState: string): StateInfo[] {
  const upperState = currentState.toUpperCase();
  const current = STATE_FIPS[upperState];

  if (!current) {
    // If state not found, return all states sorted by region
    return Object.values(STATE_FIPS)
      .filter((s) => s.region !== 'territory')
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Define region adjacency for suggestions
  const regionAdjacency: Record<string, string[]> = {
    northeast: ['northeast', 'southeast', 'midwest'],
    southeast: ['southeast', 'northeast', 'midwest', 'southwest'],
    midwest: ['midwest', 'northeast', 'southeast', 'southwest', 'west'],
    southwest: ['southwest', 'southeast', 'midwest', 'west', 'pacific'],
    west: ['west', 'midwest', 'southwest', 'pacific'],
    pacific: ['pacific', 'west', 'southwest'],
    territory: ['southeast', 'pacific'], // Territories might relocate to mainland
  };

  const currentRegion = current.region;
  const adjacentRegions = regionAdjacency[currentRegion] || [currentRegion];

  // Score states by region proximity
  const scored = Object.values(STATE_FIPS)
    .filter((s) => s.abbrev !== upperState && s.region !== 'territory')
    .map((state) => {
      let score = 0;
      const regionIndex = adjacentRegions.indexOf(state.region);
      if (regionIndex >= 0) {
        score = (adjacentRegions.length - regionIndex) * 10;
      }
      return { state, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.state.name.localeCompare(b.state.name);
    });

  return scored.map((s) => s.state);
}

/**
 * Get the top N largest MSAs.
 * @param n - Number of MSAs to return (default 10)
 * @returns Array of MSA infos sorted by population
 */
export function getTopMsas(n: number = 10): MsaInfo[] {
  return Object.values(MAJOR_MSAS)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, n);
}

/**
 * Get all states as an array.
 * @param includesTerritories - Whether to include US territories (default false)
 * @returns Array of state infos sorted alphabetically
 */
export function getAllStates(includesTerritories: boolean = false): StateInfo[] {
  return Object.values(STATE_FIPS)
    .filter((s) => includesTerritories || s.region !== 'territory')
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all MSAs as an array.
 * @returns Array of MSA infos sorted by population rank
 */
export function getAllMsas(): MsaInfo[] {
  return Object.values(MAJOR_MSAS).sort((a, b) => a.rank - b.rank);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if a string is a valid state abbreviation.
 * @param abbrev - String to check
 * @returns True if valid state abbreviation
 */
export function isValidStateAbbrev(abbrev: string): boolean {
  return abbrev?.length === 2 && STATE_FIPS[abbrev.toUpperCase()] !== undefined;
}

/**
 * Check if a string is a valid MSA code.
 * @param code - String to check
 * @returns True if valid MSA code in our top 100
 */
export function isValidMsaCode(code: string): boolean {
  return MSA_CODE_TO_KEY.has(code);
}

/**
 * Normalize a state input to abbreviation.
 * Accepts either abbreviation or full name.
 * @param input - State abbreviation or name
 * @returns Two-letter abbreviation or null if not found
 */
export function normalizeStateInput(input: string): string | null {
  if (!input) return null;

  const trimmed = input.trim();

  // Try as abbreviation first
  if (trimmed.length === 2 && STATE_FIPS[trimmed.toUpperCase()]) {
    return trimmed.toUpperCase();
  }

  // Try as full name
  const lowerInput = trimmed.toLowerCase();
  for (const [abbrev, info] of Object.entries(STATE_FIPS)) {
    if (info.name.toLowerCase() === lowerInput) {
      return abbrev;
    }
  }

  return null;
}
