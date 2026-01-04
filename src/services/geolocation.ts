/**
 * Geolocation Service
 *
 * Detects user location and maps to available labor market data providers.
 * Uses IP geolocation with fallbacks to timezone/locale detection.
 * Caches results in localStorage with 7-day TTL.
 *
 * Features:
 * - Multi-level detection (IP API → timezone → locale)
 * - localStorage caching with TTL
 * - Manual override support for testing/preferences
 * - Economic region mapping (North America, EU, Asia-Pacific, etc.)
 * - Labor market data provider availability per region
 * - Graceful fallbacks and error handling
 *
 * @module services/geolocation
 */

import { logger } from '../lib/logger';

const geoLogger = logger.create('Geo');

// =============================================================================
// Types
// =============================================================================

/** ISO 3166-1 alpha-2 country code (US, GB, DE, etc.) */
export type CountryCode = string;

/** Economic/geographic regions for labor market data grouping */
export type EconomicRegion =
  | 'north-america'
  | 'europe'
  | 'asia-pacific'
  | 'latin-america'
  | 'middle-east-africa'
  | 'unknown';

/** Available labor market data providers */
export type LaborMarketProvider =
  | 'bls' // US Bureau of Labor Statistics (available)
  | 'eurostat' // European Union (future)
  | 'stats-canada' // Canada (future)
  | 'ons' // UK Office for National Statistics (future)
  | 'abs' // Australian Bureau of Statistics (future)
  | 'none'; // No provider available

/** Detection method used to determine location */
export type DetectionMethod = 'ip' | 'timezone' | 'locale' | 'manual' | 'cached';

/** User location information */
export interface UserLocation {
  /** ISO country code */
  countryCode: CountryCode;
  /** Human-readable country name */
  countryName: string;
  /** Economic region classification */
  region: EconomicRegion;
  /** IANA timezone identifier */
  timezone?: string;
  /** When location was detected */
  detectedAt: Date;
  /** How location was determined */
  detectionMethod: DetectionMethod;
  /** Whether user manually set location */
  isManualOverride: boolean;
}

/** Capabilities and features available for a region */
export interface RegionCapabilities {
  /** Whether labor market data is available */
  laborMarketData: boolean;
  /** Which provider supplies the data */
  provider: LaborMarketProvider;
  /** Wage/salary data available */
  wageData: boolean;
  /** Unemployment statistics available */
  unemploymentData: boolean;
  /** Job openings data available */
  jobOpeningsData: boolean;
  /** Industry-specific data available */
  industryData: boolean;
}

/** Structure for cached location data */
interface CachedLocation {
  /** Cached location data */
  data: UserLocation;
  /** Timestamp when cached (ms since epoch) */
  cachedAt: number;
  /** Timestamp when cache expires (ms since epoch) */
  expiresAt: number;
}

/** Response from IP geolocation API */
interface IpApiResponse {
  country_code?: string;
  country_name?: string;
  timezone?: string;
  error?: boolean;
  reason?: string;
}

// =============================================================================
// Constants
// =============================================================================

/** Cache key for localStorage */
const LOCATION_CACHE_KEY = 'taco_user_location';

/** Cache TTL: 7 days in milliseconds */
const LOCATION_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

/** IP geolocation API endpoint (15k requests/month free) */
const IP_API_ENDPOINT = 'https://ipapi.co/json/';

/** Fallback IP API if primary fails */
const FALLBACK_IP_API = 'https://api.country.is/';

/** Timeout for IP API requests (5 seconds) */
const IP_API_TIMEOUT = 5000;

// =============================================================================
// Country-to-Region Mappings
// =============================================================================

/**
 * Comprehensive mapping of country codes to economic regions.
 * Based on geographic and economic integration groupings.
 */
const COUNTRY_TO_REGION: Record<CountryCode, EconomicRegion> = {
  // North America
  US: 'north-america',
  CA: 'north-america',
  MX: 'north-america',

  // Europe - EU Members
  AT: 'europe', // Austria
  BE: 'europe', // Belgium
  BG: 'europe', // Bulgaria
  HR: 'europe', // Croatia
  CY: 'europe', // Cyprus
  CZ: 'europe', // Czech Republic
  DK: 'europe', // Denmark
  EE: 'europe', // Estonia
  FI: 'europe', // Finland
  FR: 'europe', // France
  DE: 'europe', // Germany
  GR: 'europe', // Greece
  HU: 'europe', // Hungary
  IE: 'europe', // Ireland
  IT: 'europe', // Italy
  LV: 'europe', // Latvia
  LT: 'europe', // Lithuania
  LU: 'europe', // Luxembourg
  MT: 'europe', // Malta
  NL: 'europe', // Netherlands
  PL: 'europe', // Poland
  PT: 'europe', // Portugal
  RO: 'europe', // Romania
  SK: 'europe', // Slovakia
  SI: 'europe', // Slovenia
  ES: 'europe', // Spain
  SE: 'europe', // Sweden

  // Europe - Non-EU
  GB: 'europe', // United Kingdom
  CH: 'europe', // Switzerland
  NO: 'europe', // Norway
  IS: 'europe', // Iceland
  LI: 'europe', // Liechtenstein
  AL: 'europe', // Albania
  BA: 'europe', // Bosnia and Herzegovina
  MK: 'europe', // North Macedonia
  ME: 'europe', // Montenegro
  RS: 'europe', // Serbia
  UA: 'europe', // Ukraine
  BY: 'europe', // Belarus
  MD: 'europe', // Moldova
  RU: 'europe', // Russia

  // Asia-Pacific
  AU: 'asia-pacific', // Australia
  NZ: 'asia-pacific', // New Zealand
  JP: 'asia-pacific', // Japan
  KR: 'asia-pacific', // South Korea
  CN: 'asia-pacific', // China
  HK: 'asia-pacific', // Hong Kong
  TW: 'asia-pacific', // Taiwan
  SG: 'asia-pacific', // Singapore
  MY: 'asia-pacific', // Malaysia
  TH: 'asia-pacific', // Thailand
  VN: 'asia-pacific', // Vietnam
  PH: 'asia-pacific', // Philippines
  ID: 'asia-pacific', // Indonesia
  IN: 'asia-pacific', // India
  PK: 'asia-pacific', // Pakistan
  BD: 'asia-pacific', // Bangladesh
  LK: 'asia-pacific', // Sri Lanka
  NP: 'asia-pacific', // Nepal
  MM: 'asia-pacific', // Myanmar
  KH: 'asia-pacific', // Cambodia
  LA: 'asia-pacific', // Laos
  BN: 'asia-pacific', // Brunei
  MN: 'asia-pacific', // Mongolia

  // Latin America
  BR: 'latin-america', // Brazil
  AR: 'latin-america', // Argentina
  CL: 'latin-america', // Chile
  CO: 'latin-america', // Colombia
  PE: 'latin-america', // Peru
  VE: 'latin-america', // Venezuela
  EC: 'latin-america', // Ecuador
  BO: 'latin-america', // Bolivia
  PY: 'latin-america', // Paraguay
  UY: 'latin-america', // Uruguay
  GY: 'latin-america', // Guyana
  SR: 'latin-america', // Suriname
  GF: 'latin-america', // French Guiana
  CR: 'latin-america', // Costa Rica
  PA: 'latin-america', // Panama
  NI: 'latin-america', // Nicaragua
  HN: 'latin-america', // Honduras
  SV: 'latin-america', // El Salvador
  GT: 'latin-america', // Guatemala
  BZ: 'latin-america', // Belize
  CU: 'latin-america', // Cuba
  DO: 'latin-america', // Dominican Republic
  HT: 'latin-america', // Haiti
  JM: 'latin-america', // Jamaica
  TT: 'latin-america', // Trinidad and Tobago
  BB: 'latin-america', // Barbados
  BS: 'latin-america', // Bahamas

  // Middle East & Africa
  ZA: 'middle-east-africa', // South Africa
  EG: 'middle-east-africa', // Egypt
  NG: 'middle-east-africa', // Nigeria
  KE: 'middle-east-africa', // Kenya
  ET: 'middle-east-africa', // Ethiopia
  GH: 'middle-east-africa', // Ghana
  TZ: 'middle-east-africa', // Tanzania
  UG: 'middle-east-africa', // Uganda
  DZ: 'middle-east-africa', // Algeria
  MA: 'middle-east-africa', // Morocco
  TN: 'middle-east-africa', // Tunisia
  LY: 'middle-east-africa', // Libya
  SD: 'middle-east-africa', // Sudan
  AO: 'middle-east-africa', // Angola
  MZ: 'middle-east-africa', // Mozambique
  ZW: 'middle-east-africa', // Zimbabwe
  BW: 'middle-east-africa', // Botswana
  NA: 'middle-east-africa', // Namibia
  IL: 'middle-east-africa', // Israel
  SA: 'middle-east-africa', // Saudi Arabia
  AE: 'middle-east-africa', // United Arab Emirates
  QA: 'middle-east-africa', // Qatar
  KW: 'middle-east-africa', // Kuwait
  BH: 'middle-east-africa', // Bahrain
  OM: 'middle-east-africa', // Oman
  JO: 'middle-east-africa', // Jordan
  LB: 'middle-east-africa', // Lebanon
  IQ: 'middle-east-africa', // Iraq
  IR: 'middle-east-africa', // Iran
  TR: 'middle-east-africa', // Turkey
};

/**
 * Mapping of country codes to human-readable names.
 * Covers all countries in COUNTRY_TO_REGION.
 */
const COUNTRY_NAMES: Record<CountryCode, string> = {
  // North America
  US: 'United States',
  CA: 'Canada',
  MX: 'Mexico',

  // Europe
  AT: 'Austria',
  BE: 'Belgium',
  BG: 'Bulgaria',
  HR: 'Croatia',
  CY: 'Cyprus',
  CZ: 'Czech Republic',
  DK: 'Denmark',
  EE: 'Estonia',
  FI: 'Finland',
  FR: 'France',
  DE: 'Germany',
  GR: 'Greece',
  HU: 'Hungary',
  IE: 'Ireland',
  IT: 'Italy',
  LV: 'Latvia',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  MT: 'Malta',
  NL: 'Netherlands',
  PL: 'Poland',
  PT: 'Portugal',
  RO: 'Romania',
  SK: 'Slovakia',
  SI: 'Slovenia',
  ES: 'Spain',
  SE: 'Sweden',
  GB: 'United Kingdom',
  CH: 'Switzerland',
  NO: 'Norway',
  IS: 'Iceland',
  LI: 'Liechtenstein',
  AL: 'Albania',
  BA: 'Bosnia and Herzegovina',
  MK: 'North Macedonia',
  ME: 'Montenegro',
  RS: 'Serbia',
  UA: 'Ukraine',
  BY: 'Belarus',
  MD: 'Moldova',
  RU: 'Russia',

  // Asia-Pacific
  AU: 'Australia',
  NZ: 'New Zealand',
  JP: 'Japan',
  KR: 'South Korea',
  CN: 'China',
  HK: 'Hong Kong',
  TW: 'Taiwan',
  SG: 'Singapore',
  MY: 'Malaysia',
  TH: 'Thailand',
  VN: 'Vietnam',
  PH: 'Philippines',
  ID: 'Indonesia',
  IN: 'India',
  PK: 'Pakistan',
  BD: 'Bangladesh',
  LK: 'Sri Lanka',
  NP: 'Nepal',
  MM: 'Myanmar',
  KH: 'Cambodia',
  LA: 'Laos',
  BN: 'Brunei',
  MN: 'Mongolia',

  // Latin America
  BR: 'Brazil',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
  VE: 'Venezuela',
  EC: 'Ecuador',
  BO: 'Bolivia',
  PY: 'Paraguay',
  UY: 'Uruguay',
  GY: 'Guyana',
  SR: 'Suriname',
  GF: 'French Guiana',
  CR: 'Costa Rica',
  PA: 'Panama',
  NI: 'Nicaragua',
  HN: 'Honduras',
  SV: 'El Salvador',
  GT: 'Guatemala',
  BZ: 'Belize',
  CU: 'Cuba',
  DO: 'Dominican Republic',
  HT: 'Haiti',
  JM: 'Jamaica',
  TT: 'Trinidad and Tobago',
  BB: 'Barbados',
  BS: 'Bahamas',

  // Middle East & Africa
  ZA: 'South Africa',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',
  ET: 'Ethiopia',
  GH: 'Ghana',
  TZ: 'Tanzania',
  UG: 'Uganda',
  DZ: 'Algeria',
  MA: 'Morocco',
  TN: 'Tunisia',
  LY: 'Libya',
  SD: 'Sudan',
  AO: 'Angola',
  MZ: 'Mozambique',
  ZW: 'Zimbabwe',
  BW: 'Botswana',
  NA: 'Namibia',
  IL: 'Israel',
  SA: 'Saudi Arabia',
  AE: 'United Arab Emirates',
  QA: 'Qatar',
  KW: 'Kuwait',
  BH: 'Bahrain',
  OM: 'Oman',
  JO: 'Jordan',
  LB: 'Lebanon',
  IQ: 'Iraq',
  IR: 'Iran',
  TR: 'Turkey',
};

/**
 * Labor market data provider availability by country.
 * Currently only US (BLS) is supported, with future providers planned.
 */
const PROVIDER_MAP: Record<CountryCode, LaborMarketProvider> = {
  US: 'bls',
  // Future expansions:
  // EU countries → 'eurostat'
  // 'CA': 'stats-canada',
  // 'GB': 'ons',
  // 'AU': 'abs',
};

/**
 * Timezone-to-country mapping for fallback detection.
 * Maps IANA timezone identifiers to most likely country codes.
 */
const TIMEZONE_TO_COUNTRY: Record<string, CountryCode> = {
  // United States
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',

  // Canada
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'America/St_Johns': 'CA',

  // Mexico
  'America/Mexico_City': 'MX',
  'America/Tijuana': 'MX',
  'America/Monterrey': 'MX',

  // Europe
  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE',
  'Europe/Vienna': 'AT',
  'Europe/Stockholm': 'SE',
  'Europe/Copenhagen': 'DK',
  'Europe/Oslo': 'NO',
  'Europe/Helsinki': 'FI',
  'Europe/Warsaw': 'PL',
  'Europe/Prague': 'CZ',
  'Europe/Budapest': 'HU',
  'Europe/Bucharest': 'RO',
  'Europe/Athens': 'GR',
  'Europe/Lisbon': 'PT',
  'Europe/Dublin': 'IE',
  'Europe/Zurich': 'CH',
  'Europe/Moscow': 'RU',
  'Europe/Kiev': 'UA',

  // Asia-Pacific
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Singapore': 'SG',
  'Asia/Bangkok': 'TH',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Manila': 'PH',
  'Asia/Jakarta': 'ID',
  'Asia/Kolkata': 'IN',
  'Asia/Dubai': 'AE',
  'Asia/Taipei': 'TW',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Pacific/Auckland': 'NZ',

  // Latin America
  'America/Sao_Paulo': 'BR',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Santiago': 'CL',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',

  // Middle East & Africa
  'Africa/Johannesburg': 'ZA',
  'Africa/Cairo': 'EG',
  'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE',
  'Asia/Jerusalem': 'IL',
  'Asia/Riyadh': 'SA',
  'Asia/Istanbul': 'TR',
};

// =============================================================================
// Cache Management
// =============================================================================

/**
 * Get cached location data from localStorage.
 * Returns null if cache is expired or invalid.
 */
function getCachedLocation(): UserLocation | null {
  try {
    const stored = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!stored) {
      return null;
    }

    const cached: CachedLocation = JSON.parse(stored);
    const now = Date.now();

    // Check expiration
    if (now > cached.expiresAt) {
      localStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }

    // Convert Date string back to Date object
    cached.data.detectedAt = new Date(cached.data.detectedAt);

    // Mark as cached detection method
    cached.data.detectionMethod = 'cached';

    return cached.data;
  } catch (error) {
    geoLogger.warn('Failed to read location cache:', error);
    try {
      localStorage.removeItem(LOCATION_CACHE_KEY);
    } catch {
      // Ignore removal errors
    }
    return null;
  }
}

/**
 * Store location data in localStorage cache.
 * @param location - Location data to cache
 */
function setCachedLocation(location: UserLocation): void {
  try {
    const now = Date.now();
    const cached: CachedLocation = {
      data: location,
      cachedAt: now,
      expiresAt: now + LOCATION_CACHE_TTL,
    };
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    geoLogger.warn('Failed to cache location data:', error);
    // Fail silently - caching is not critical
  }
}

/**
 * Clear cached location data from localStorage.
 */
export function clearLocationCache(): void {
  try {
    localStorage.removeItem(LOCATION_CACHE_KEY);
  } catch (error) {
    geoLogger.warn('Failed to clear location cache:', error);
  }
}

// =============================================================================
// Detection Functions
// =============================================================================

/**
 * Detect country from browser timezone.
 * This is a fallback method, less accurate than IP geolocation.
 *
 * @returns Country code or 'US' as default
 */
export function detectCountryFromTimezone(): CountryCode {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryCode = TIMEZONE_TO_COUNTRY[timezone];

    if (countryCode) {
      return countryCode;
    }

    // Try to extract region from timezone (e.g., "America/New_York" → "US")
    if (timezone.startsWith('America/')) {
      // Most America/* timezones are US, except specific ones
      if (
        timezone.includes('Toronto') ||
        timezone.includes('Vancouver') ||
        timezone.includes('Montreal') ||
        timezone.includes('Halifax')
      ) {
        return 'CA';
      }
      if (timezone.includes('Mexico')) {
        return 'MX';
      }
      if (timezone.includes('Sao_Paulo') || timezone.includes('Brazil')) {
        return 'BR';
      }
      if (timezone.includes('Argentina')) {
        return 'AR';
      }
      return 'US'; // Default for America/* timezones
    }

    if (timezone.startsWith('Europe/')) {
      return 'GB'; // Default for Europe/* timezones
    }

    if (timezone.startsWith('Asia/')) {
      return 'JP'; // Default for Asia/* timezones
    }

    if (timezone.startsWith('Australia/')) {
      return 'AU';
    }

    // Default fallback
    return 'US';
  } catch (error) {
    geoLogger.warn('Failed to detect timezone:', error);
    return 'US';
  }
}

/**
 * Detect country from browser language/locale settings.
 * This is a fallback method, less accurate than IP geolocation.
 *
 * @returns Country code or 'US' as default
 */
export function detectCountryFromLocale(): CountryCode {
  try {
    // Get browser language (e.g., "en-US", "fr-FR")
    const navigatorWithLegacy = navigator as typeof navigator & { userLanguage?: string };
    const locale = navigator.language || navigatorWithLegacy.userLanguage;

    if (!locale) {
      return 'US';
    }

    // Extract country code from locale (e.g., "en-US" → "US")
    const parts = locale.split('-');
    if (parts.length > 1) {
      const countryCode = parts[1].toUpperCase();

      // Validate it's a known country
      if (COUNTRY_NAMES[countryCode]) {
        return countryCode;
      }
    }

    // Language-based fallback guesses
    const language = parts[0].toLowerCase();
    const languageCountryMap: Record<string, CountryCode> = {
      en: 'US',
      es: 'ES',
      fr: 'FR',
      de: 'DE',
      it: 'IT',
      pt: 'BR',
      ja: 'JP',
      ko: 'KR',
      zh: 'CN',
      ru: 'RU',
      ar: 'SA',
      hi: 'IN',
      nl: 'NL',
      sv: 'SE',
      no: 'NO',
      da: 'DK',
      fi: 'FI',
      pl: 'PL',
      tr: 'TR',
    };

    return languageCountryMap[language] || 'US';
  } catch (error) {
    geoLogger.warn('Failed to detect locale:', error);
    return 'US';
  }
}

/**
 * Detect location from IP address using external API.
 * Tries primary API, then fallback, with timeout protection.
 *
 * @returns UserLocation or null if detection fails
 */
async function detectFromIpApi(): Promise<UserLocation | null> {
  try {
    // Try primary IP API with timeout
    const controller = new globalThis.AbortController();
    const timeoutId = setTimeout(() => controller.abort(), IP_API_TIMEOUT);

    const response = await globalThis.fetch(IP_API_ENDPOINT, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`IP API returned ${response.status}`);
    }

    const data: IpApiResponse = await response.json();

    if (data.error) {
      throw new Error(data.reason || 'IP API returned error');
    }

    const countryCode = data.country_code;
    if (!countryCode) {
      throw new Error('No country code in IP API response');
    }

    return {
      countryCode: countryCode.toUpperCase(),
      countryName: data.country_name || COUNTRY_NAMES[countryCode.toUpperCase()] || countryCode,
      region: getEconomicRegion(countryCode.toUpperCase()),
      timezone: data.timezone,
      detectedAt: new Date(),
      detectionMethod: 'ip',
      isManualOverride: false,
    };
  } catch (error) {
    geoLogger.warn('Primary IP API failed:', error);

    // Try fallback API
    try {
      const controller = new globalThis.AbortController();
      const timeoutId = setTimeout(() => controller.abort(), IP_API_TIMEOUT);

      const response = await globalThis.fetch(FALLBACK_IP_API, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Fallback IP API returned ${response.status}`);
      }

      const data = await response.json();
      const countryCode = data.country;

      if (!countryCode) {
        throw new Error('No country code in fallback API response');
      }

      return {
        countryCode: countryCode.toUpperCase(),
        countryName: COUNTRY_NAMES[countryCode.toUpperCase()] || countryCode,
        region: getEconomicRegion(countryCode.toUpperCase()),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        detectedAt: new Date(),
        detectionMethod: 'ip',
        isManualOverride: false,
      };
    } catch (fallbackError) {
      geoLogger.warn('Fallback IP API failed:', fallbackError);
      return null;
    }
  }
}

/**
 * Detect user location using all available methods.
 * Tries IP API first, then falls back to timezone/locale detection.
 *
 * @returns UserLocation (always returns a location, defaults to US if all methods fail)
 */
export async function detectUserLocation(): Promise<UserLocation> {
  // Try IP-based detection first
  const ipLocation = await detectFromIpApi();
  if (ipLocation) {
    return ipLocation;
  }

  // Fall back to timezone detection
  const timezoneCountry = detectCountryFromTimezone();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    countryCode: timezoneCountry,
    countryName: COUNTRY_NAMES[timezoneCountry] || timezoneCountry,
    region: getEconomicRegion(timezoneCountry),
    timezone,
    detectedAt: new Date(),
    detectionMethod: 'timezone',
    isManualOverride: false,
  };
}

/**
 * Get user location from cache or detect if not cached.
 * This is the main function to use for getting user location.
 *
 * @returns UserLocation (always returns a location)
 */
export async function getUserLocation(): Promise<UserLocation> {
  // Check cache first
  const cached = getCachedLocation();
  if (cached) {
    return cached;
  }

  // Detect location
  const location = await detectUserLocation();

  // Cache the result
  setCachedLocation(location);

  return location;
}

// =============================================================================
// Region Mapping Functions
// =============================================================================

/**
 * Map country code to economic region.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Economic region or 'unknown' if not mapped
 */
export function getEconomicRegion(countryCode: CountryCode): EconomicRegion {
  const normalized = countryCode.toUpperCase();
  return COUNTRY_TO_REGION[normalized] || 'unknown';
}

/**
 * Get labor market data provider for a country.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Labor market provider or 'none' if not available
 */
export function getLaborMarketProvider(countryCode: CountryCode): LaborMarketProvider {
  const normalized = countryCode.toUpperCase();
  return PROVIDER_MAP[normalized] || 'none';
}

/**
 * Get capabilities and available features for a country/region.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns RegionCapabilities object describing what's available
 */
export function getRegionCapabilities(countryCode: CountryCode): RegionCapabilities {
  const provider = getLaborMarketProvider(countryCode);

  // Currently only BLS (US) is fully supported
  if (provider === 'bls') {
    return {
      laborMarketData: true,
      provider: 'bls',
      wageData: true,
      unemploymentData: true,
      jobOpeningsData: true,
      industryData: true,
    };
  }

  // Future providers would have their own capability sets
  // For now, all other regions have no data
  return {
    laborMarketData: false,
    provider: 'none',
    wageData: false,
    unemploymentData: false,
    jobOpeningsData: false,
    industryData: false,
  };
}

// =============================================================================
// Manual Override Functions
// =============================================================================

/**
 * Manually set user location (for preferences/testing).
 * This will override automatic detection and persist in cache.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param isManual - Whether this is a manual override (default: true)
 */
export function setUserLocation(countryCode: CountryCode, isManual: boolean = true): void {
  const normalized = countryCode.toUpperCase();

  const location: UserLocation = {
    countryCode: normalized,
    countryName: COUNTRY_NAMES[normalized] || normalized,
    region: getEconomicRegion(normalized),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    detectedAt: new Date(),
    detectionMethod: 'manual',
    isManualOverride: isManual,
  };

  // Update cache
  setCachedLocation(location);
}

// =============================================================================
// Feature Availability Functions
// =============================================================================

/**
 * Check if labor market data is available for the user's location.
 *
 * @returns Promise<boolean> - true if labor market data is available
 */
export async function hasLaborMarketData(): Promise<boolean> {
  const location = await getUserLocation();
  const capabilities = getRegionCapabilities(location.countryCode);
  return capabilities.laborMarketData;
}

/**
 * Check if a specific feature is available for the user's location.
 *
 * @param feature - Feature key to check
 * @returns Promise<boolean> - true if feature is available
 */
export async function hasFeature(feature: keyof RegionCapabilities): Promise<boolean> {
  const location = await getUserLocation();
  const capabilities = getRegionCapabilities(location.countryCode);
  return capabilities[feature] as boolean;
}

/**
 * Get a user-friendly message explaining why a feature is unavailable.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns User-friendly message string
 */
export function getUnavailableFeatureMessage(countryCode: CountryCode): string {
  const normalized = countryCode.toUpperCase();
  const countryName = COUNTRY_NAMES[normalized] || normalized;
  const region = getEconomicRegion(normalized);

  // Build message based on region
  const regionName = region
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    `Labor market data is not yet available for ${countryName}. ` +
    `We're currently working on expanding coverage to ${regionName}. ` +
    `For now, labor market features are only available for users in the United States. ` +
    `You can still use all other features of the platform.`
  );
}

/**
 * Get all supported countries (countries with data providers).
 *
 * @returns Array of country codes that have labor market data
 */
export function getSupportedCountries(): CountryCode[] {
  return Object.keys(PROVIDER_MAP);
}

/**
 * Get all countries in a specific economic region.
 *
 * @param region - Economic region
 * @returns Array of country codes in that region
 */
export function getCountriesInRegion(region: EconomicRegion): CountryCode[] {
  return Object.entries(COUNTRY_TO_REGION)
    .filter(([, r]) => r === region)
    .map(([code]) => code);
}

/**
 * Check if a country code is valid.
 *
 * @param countryCode - Country code to validate
 * @returns true if country code is recognized
 */
export function isValidCountryCode(countryCode: string): boolean {
  return COUNTRY_NAMES[countryCode.toUpperCase()] !== undefined;
}

/**
 * Get country name from country code.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Country name or country code if not found
 */
export function getCountryName(countryCode: CountryCode): string {
  return COUNTRY_NAMES[countryCode.toUpperCase()] || countryCode;
}
