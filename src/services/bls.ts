/**
 * Bureau of Labor Statistics (BLS) API Service
 *
 * Comprehensive service for fetching and caching labor market data from BLS.
 * Covers OES (Occupational Employment Statistics), JOLTS (Job Openings and
 * Labor Turnover Survey), LAU (Local Area Unemployment), and CPI (Consumer
 * Price Index) data.
 *
 * Features:
 * - 24-hour localStorage caching
 * - Graceful error handling with BlsResult<T> return type
 * - High-level composite functions for common use cases
 * - SOC/O*NET code utilities
 *
 * @see https://www.bls.gov/developers/
 * @module services/bls
 */

import type {
  BlsApiResponse,
  BlsDataPoint,
  BlsError,
  BlsErrorCode,
  BlsResult,
  BlsSeriesData,
  CareerOutlook,
  CpiData,
  EducationLevel,
  JoltsData,
  LaborMarketSnapshot,
  OesDataTypeCode,
  OesEmploymentData,
  OesWageData,
  OccupationMarketData,
  OnTheJobTraining,
  ProjectionOutlook,
  RegionalComparison,
  UnemploymentData,
  WorkExperience,
} from '../types/bls.types';

import { getStateByAbbrev, getMsaByCode, STATE_FIPS } from '../data/geographic-codes';

// =============================================================================
// Constants
// =============================================================================

/** Cache TTL: 24 hours in milliseconds */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Cache version for invalidation */
const CACHE_VERSION = 1;

/** Cache key prefix */
const CACHE_PREFIX = 'bls_cache';

/** Default start year for data queries (5 years back) */
const DEFAULT_START_YEAR = new Date().getFullYear() - 5;

/** Default end year for data queries (current year) */
const DEFAULT_END_YEAR = new Date().getFullYear();

/** National area code for OES */
const NATIONAL_AREA_CODE = '0000000';

/** Cross-industry code for OES */
const CROSS_INDUSTRY_CODE = '000000';

// =============================================================================
// Cache Types
// =============================================================================

/**
 * Structure for cached BLS data
 */
interface CacheEntry<T> {
  /** The cached data */
  data: T;
  /** Timestamp when cached (ISO string) */
  cachedAt: string;
  /** Timestamp when cache expires (ISO string) */
  expiresAt: string;
  /** Cache version */
  version: number;
}

// =============================================================================
// Caching Functions
// =============================================================================

/**
 * Build a cache key for BLS data.
 * @param dataType - Type of data (oes, jolts, lau, cpi, etc.)
 * @param identifier - Primary identifier (SOC code, area code, etc.)
 * @param year - Optional year for time-specific data
 * @returns Formatted cache key
 */
function buildCacheKey(dataType: string, identifier: string, year?: number): string {
  const parts = [CACHE_PREFIX, dataType, identifier];
  if (year !== undefined) {
    parts.push(String(year));
  }
  return parts.join('_');
}

/**
 * Get cached data from localStorage.
 * @param key - Cache key to retrieve
 * @returns Cached data if valid, null if expired or not found
 */
export function getCachedData<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(stored);

    // Check version compatibility
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(key);
      return null;
    }

    // Check expiration
    const now = new Date().getTime();
    const expiresAt = new Date(entry.expiresAt).getTime();
    if (now > expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch {
    // If parsing fails, remove corrupted entry
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore removal errors
    }
    return null;
  }
}

/**
 * Store data in localStorage cache with 24-hour TTL.
 * @param key - Cache key
 * @param data - Data to cache
 */
export function setCachedData<T>(key: string, data: T): void {
  try {
    const now = new Date();
    const entry: CacheEntry<T> = {
      data,
      cachedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    // localStorage might be full or disabled - fail silently
    console.warn('Failed to cache BLS data:', error);
  }
}

/**
 * Clear all BLS cached data from localStorage.
 * @returns Number of cache entries removed
 */
export function clearBlsCache(): number {
  let removedCount = 0;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      removedCount++;
    });
  } catch (error) {
    console.warn('Failed to clear BLS cache:', error);
  }
  return removedCount;
}

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Create a BLS error object.
 * @param code - Error code
 * @param message - Error message
 * @param apiMessages - Original API messages if available
 * @param failedSeries - Series IDs that failed
 * @returns BlsError object
 */
function createError(
  code: BlsErrorCode,
  message: string,
  apiMessages?: string[],
  failedSeries?: string[]
): BlsError {
  return {
    code,
    message,
    apiMessages,
    failedSeries,
  };
}

/**
 * Create a failed result.
 * @param error - Error object
 * @returns Failed BlsResult
 */
function failedResult<T>(error: BlsError): BlsResult<T> {
  return { success: false, error };
}

/**
 * Create a successful result.
 * @param data - Result data
 * @param warnings - Optional warnings
 * @returns Successful BlsResult
 */
function successResult<T>(data: T, warnings?: string[]): BlsResult<T> {
  return { success: true, data, warnings };
}

// =============================================================================
// Core API Communication
// =============================================================================

/**
 * Base fetcher that calls our proxy endpoint to get BLS data.
 * @param seriesIds - Array of BLS series IDs to fetch
 * @param startYear - Start year for data range
 * @param endYear - End year for data range
 * @returns BlsResult containing series data or error
 */
export async function fetchBlsSeries(
  seriesIds: string[],
  startYear: number = DEFAULT_START_YEAR,
  endYear: number = DEFAULT_END_YEAR
): Promise<BlsResult<BlsSeriesData[]>> {
  // Validate inputs
  if (!seriesIds || seriesIds.length === 0) {
    return failedResult(createError('INVALID_SERIES_ID', 'No series IDs provided'));
  }

  if (seriesIds.length > 50) {
    return failedResult(
      createError('INVALID_SERIES_ID', 'Maximum 50 series IDs allowed per request')
    );
  }

  if (startYear > endYear) {
    return failedResult(
      createError('INVALID_DATE_RANGE', 'Start year must be less than or equal to end year')
    );
  }

  try {
    const response = await fetch('/api/labor-market', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seriesid: seriesIds,
        startyear: String(startYear),
        endyear: String(endYear),
        catalog: true,
        calculations: true,
        annualaverage: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return failedResult(
          createError('RATE_LIMITED', 'BLS API rate limit exceeded. Please try again later.')
        );
      }
      return failedResult(
        createError('API_ERROR', `API request failed with status ${response.status}`)
      );
    }

    const data = await response.json();

    // Handle both our proxy format and direct BLS format
    const status = data.status;
    const results = data.results || data.Results;
    const messages = data.messages || data.message || [];

    // Log for debugging
    console.log('[BLS] fetchBlsSeries response:', {
      success: data.success,
      status,
      hasResults: !!results,
      seriesCount: results?.series?.length || 0,
      messagesCount: messages.length,
    });

    // Check if request failed - handle both proxy and direct formats
    if (
      data.success === false ||
      status === 'REQUEST_FAILED' ||
      status === 'REQUEST_NOT_PROCESSED'
    ) {
      const errorMessage = data.error || 'BLS API request failed';
      const apiMessages = Array.isArray(messages)
        ? messages.map((m: any) => (typeof m === 'string' ? m : m.message || m)).filter(Boolean)
        : [];
      return failedResult(createError('API_ERROR', errorMessage, apiMessages, seriesIds));
    }

    // Check for series with no data
    const warnings: string[] = [];
    const series = results?.series || [];
    const seriesWithData = series.filter((s: any) => s.data && s.data.length > 0);
    const seriesWithoutData = series.filter((s: any) => !s.data || s.data.length === 0);

    if (seriesWithoutData && seriesWithoutData.length > 0) {
      warnings.push(
        `No data returned for series: ${seriesWithoutData.map((s: any) => s.seriesID).join(', ')}`
      );
    }

    if (seriesWithData.length === 0) {
      return failedResult(
        createError(
          'NO_DATA_AVAILABLE',
          'No data available for the requested series',
          [],
          seriesIds
        )
      );
    }

    return successResult(seriesWithData, warnings.length > 0 ? warnings : undefined);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return failedResult(createError('NETWORK_ERROR', 'Network error: Unable to reach BLS API'));
    }
    return failedResult(
      createError(
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'An unknown error occurred'
      )
    );
  }
}

// =============================================================================
// SOC/O*NET Utilities
// =============================================================================

/**
 * Convert O*NET code to SOC code.
 * O*NET codes have format "XX-XXXX.XX", SOC codes are "XX-XXXX".
 * @param onetCode - O*NET occupation code (e.g., "15-1252.00")
 * @returns SOC code (e.g., "15-1252")
 */
export function onetToSoc(onetCode: string): string {
  if (!onetCode) return '';
  // Remove the decimal portion
  const socPart = onetCode.split('.')[0];
  return socPart;
}

/**
 * Build an OES series ID from components.
 * OES series ID format: OEU{areaType}{areaCode}{industryCode}{socCode}{dataType}
 * Area types: N=National, S=State, M=Metropolitan
 * @param socCode - SOC occupation code (e.g., "15-1252" or "151252")
 * @param dataType - OES data type code
 * @param areaCode - Optional area code (defaults to national)
 * @param industryCode - Optional industry code (defaults to cross-industry)
 * @returns Complete OES series ID
 */
export function buildOesSeriesId(
  socCode: string,
  dataType: OesDataTypeCode,
  areaCode: string = NATIONAL_AREA_CODE,
  industryCode: string = CROSS_INDUSTRY_CODE
): string {
  // Normalize SOC code: remove hyphens and ensure 6 digits
  const normalizedSoc = socCode.replace(/-/g, '').padEnd(6, '0');
  // Ensure industry code is 6 digits
  const normalizedIndustry = industryCode.padStart(6, '0');

  // Determine area type based on area code
  // N = National (0000000), S = State, M = Metropolitan
  let areaType: string;
  let normalizedArea: string;

  if (areaCode === NATIONAL_AREA_CODE || areaCode === '0000000') {
    // National area
    areaType = 'N';
    normalizedArea = '0000000';
  } else if (areaCode.startsWith('S')) {
    // State: format is S + 2-digit state FIPS + 00000
    // e.g., "S0600000" for California (FIPS 06)
    areaType = 'S';
    normalizedArea = areaCode.substring(1).padStart(7, '0');
  } else if (areaCode.startsWith('M')) {
    // Metropolitan: format is M + 7-digit area code
    areaType = 'M';
    normalizedArea = areaCode.substring(1).padStart(7, '0');
  } else if (areaCode.length === 2) {
    // State FIPS code without prefix
    areaType = 'S';
    normalizedArea = areaCode.padEnd(7, '0');
  } else {
    // Default to treating as area code, prepend with zeros
    areaType = 'N';
    normalizedArea = areaCode.padStart(7, '0');
  }

  return `OEU${areaType}${normalizedArea}${normalizedIndustry}${normalizedSoc}${dataType}`;
}

/**
 * Parse an OES series ID into its components.
 * @param seriesId - OES series ID to parse
 * @returns Parsed components or null if invalid
 */
export function parseSeriesId(seriesId: string): {
  surveyPrefix: string;
  seasonalAdjustment: string;
  areaCode: string;
  industryCode: string;
  occupationCode: string;
  dataType: string;
} | null {
  if (!seriesId || seriesId.length < 26) {
    return null;
  }

  // OES format: OEUM + 7 area + 6 industry + 6 occupation + 2 datatype = 23 characters minimum
  const surveyPrefix = seriesId.substring(0, 2); // OE
  const seasonalAdjustment = seriesId.substring(2, 3); // U
  const areaType = seriesId.substring(3, 4); // M (metro), S (state), N (national)

  // Parse based on survey type
  if (surveyPrefix === 'OE') {
    const areaCode = seriesId.substring(3, 10);
    const industryCode = seriesId.substring(10, 16);
    const occupationCode = seriesId.substring(16, 22);
    const dataType = seriesId.substring(22, 24);

    return {
      surveyPrefix,
      seasonalAdjustment,
      areaCode: areaType + areaCode.substring(1),
      industryCode,
      occupationCode,
      dataType,
    };
  }

  // JOLTS format: JTS + industry + region + element + rate/level
  if (surveyPrefix === 'JT') {
    return {
      surveyPrefix,
      seasonalAdjustment: seriesId.substring(2, 3),
      areaCode: seriesId.substring(13, 15), // Region code
      industryCode: seriesId.substring(3, 13),
      occupationCode: '',
      dataType: seriesId.substring(15, 18),
    };
  }

  // LAU format: LASS + state FIPS + measure
  if (surveyPrefix === 'LA') {
    return {
      surveyPrefix,
      seasonalAdjustment: seriesId.substring(2, 3),
      areaCode: seriesId.substring(3, 18),
      industryCode: '',
      occupationCode: '',
      dataType: seriesId.substring(18, 20),
    };
  }

  // CPI format: CUSR + area + item
  if (surveyPrefix === 'CU') {
    return {
      surveyPrefix,
      seasonalAdjustment: seriesId.substring(2, 3),
      areaCode: seriesId.substring(4, 8),
      industryCode: '',
      occupationCode: '',
      dataType: seriesId.substring(8),
    };
  }

  return null;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the most recent data point from a series.
 * @param dataPoints - Array of BLS data points
 * @returns Most recent data point or null
 */
function getMostRecentDataPoint(dataPoints: BlsDataPoint[]): BlsDataPoint | null {
  if (!dataPoints || dataPoints.length === 0) return null;

  // Sort by year and period descending
  const sorted = [...dataPoints].sort((a, b) => {
    const yearDiff = parseInt(b.year) - parseInt(a.year);
    if (yearDiff !== 0) return yearDiff;
    // Compare periods (e.g., "M12" > "M01", "A01" for annual)
    return b.period.localeCompare(a.period);
  });

  return sorted[0];
}

/**
 * Parse a BLS value string to a number.
 * @param value - String value from BLS
 * @returns Parsed number or null if invalid
 */
function parseBlsValue(value: string | undefined): number | null {
  if (!value || value === '-' || value === '*' || value === '#') {
    return null;
  }
  const parsed = parseFloat(value.replace(/,/g, ''));
  return isNaN(parsed) ? null : parsed;
}

/**
 * Get area name from area code.
 * @param areaCode - BLS area code
 * @returns Human-readable area name
 */
function getAreaName(areaCode: string): string {
  if (!areaCode || areaCode === NATIONAL_AREA_CODE || areaCode.startsWith('N')) {
    return 'National';
  }
  if (areaCode.startsWith('S')) {
    const fips = areaCode.substring(1, 3);
    for (const [, info] of Object.entries(STATE_FIPS)) {
      if (info.fips === fips) {
        return info.name;
      }
    }
  }
  if (areaCode.startsWith('M')) {
    const msaCode = areaCode.substring(5);
    const msa = getMsaByCode(msaCode);
    if (msa) {
      return msa.name;
    }
  }
  return areaCode;
}

/**
 * Format SOC code with hyphen.
 * @param socCode - SOC code (e.g., "151252")
 * @returns Formatted SOC code (e.g., "15-1252")
 */
function formatSocCode(socCode: string): string {
  const cleaned = socCode.replace(/-/g, '');
  if (cleaned.length >= 6) {
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 6)}`;
  }
  return socCode;
}

// =============================================================================
// OES (Occupational Employment Statistics) Functions
// =============================================================================

/**
 * Get wage data for an occupation.
 * @param socCode - SOC occupation code
 * @param areaCode - Optional area code (defaults to national)
 * @returns Wage data or error
 */
export async function getOccupationWages(
  socCode: string,
  areaCode?: string
): Promise<BlsResult<OesWageData>> {
  const effectiveAreaCode = areaCode || NATIONAL_AREA_CODE;
  const cacheKey = buildCacheKey('oes_wages', `${socCode}_${effectiveAreaCode}`);

  // Check cache first
  const cached = getCachedData<OesWageData>(cacheKey);
  if (cached) {
    return successResult(cached);
  }

  // Build series IDs for all wage data types
  const seriesIds = [
    buildOesSeriesId(socCode, '04', effectiveAreaCode), // Annual mean wage
    buildOesSeriesId(socCode, '03', effectiveAreaCode), // Hourly mean wage
    buildOesSeriesId(socCode, '13', effectiveAreaCode), // Annual median wage
    buildOesSeriesId(socCode, '08', effectiveAreaCode), // Hourly median wage
    buildOesSeriesId(socCode, '11', effectiveAreaCode), // Annual 10th percentile
    buildOesSeriesId(socCode, '12', effectiveAreaCode), // Annual 25th percentile
    buildOesSeriesId(socCode, '14', effectiveAreaCode), // Annual 75th percentile
    buildOesSeriesId(socCode, '15', effectiveAreaCode), // Annual 90th percentile
    buildOesSeriesId(socCode, '06', effectiveAreaCode), // Hourly 10th percentile
    buildOesSeriesId(socCode, '07', effectiveAreaCode), // Hourly 25th percentile
    buildOesSeriesId(socCode, '09', effectiveAreaCode), // Hourly 75th percentile
    buildOesSeriesId(socCode, '10', effectiveAreaCode), // Hourly 90th percentile
  ];

  const result = await fetchBlsSeries(seriesIds);

  if (!result.success) {
    return failedResult(result.error);
  }

  // Parse the series data into wage structure
  const seriesMap = new Map<string, BlsSeriesData>();
  for (const series of result.data) {
    const dataType = series.seriesID.substring(22, 24);
    seriesMap.set(dataType, series);
  }

  const getValue = (dataTypeCode: string): number | null => {
    const series = seriesMap.get(dataTypeCode);
    if (!series) return null;
    const point = getMostRecentDataPoint(series.data);
    return point ? parseBlsValue(point.value) : null;
  };

  const getReferencePeriod = (): string => {
    const firstSeries = result.data[0];
    if (!firstSeries) return 'Unknown';
    const point = getMostRecentDataPoint(firstSeries.data);
    return point ? `${point.periodName} ${point.year}` : 'Unknown';
  };

  const wageData: OesWageData = {
    socCode: formatSocCode(socCode),
    occupationTitle:
      result.data[0]?.catalog?.occupation_title || result.data[0]?.catalog?.series_title || socCode,
    areaCode: effectiveAreaCode,
    areaName: getAreaName(effectiveAreaCode),
    period: getReferencePeriod(),
    annual: {
      percentile10: getValue('11'),
      percentile25: getValue('12'),
      median: getValue('13'),
      percentile75: getValue('14'),
      percentile90: getValue('15'),
      mean: getValue('04'),
    },
    hourly: {
      percentile10: getValue('06'),
      percentile25: getValue('07'),
      median: getValue('08'),
      percentile75: getValue('09'),
      percentile90: getValue('10'),
      mean: getValue('03'),
    },
    isEstimated: false,
    relativeStandardError: undefined,
  };

  // Cache the result
  setCachedData(cacheKey, wageData);

  return successResult(wageData, result.warnings);
}

/**
 * Get employment data for an occupation.
 * @param socCode - SOC occupation code
 * @param areaCode - Optional area code (defaults to national)
 * @returns Employment data or error
 */
export async function getOccupationEmployment(
  socCode: string,
  areaCode?: string
): Promise<BlsResult<OesEmploymentData>> {
  const effectiveAreaCode = areaCode || NATIONAL_AREA_CODE;
  const cacheKey = buildCacheKey('oes_employment', `${socCode}_${effectiveAreaCode}`);

  // Check cache first
  const cached = getCachedData<OesEmploymentData>(cacheKey);
  if (cached) {
    return successResult(cached);
  }

  // Build series IDs for employment data
  const seriesIds = [
    buildOesSeriesId(socCode, '01', effectiveAreaCode), // Employment
    buildOesSeriesId(socCode, '16', effectiveAreaCode), // Employment per 1,000 jobs
    buildOesSeriesId(socCode, '17', effectiveAreaCode), // Location quotient
  ];

  const result = await fetchBlsSeries(seriesIds);

  if (!result.success) {
    return failedResult(result.error);
  }

  // Parse the series data
  const seriesMap = new Map<string, BlsSeriesData>();
  for (const series of result.data) {
    const dataType = series.seriesID.substring(22, 24);
    seriesMap.set(dataType, series);
  }

  const getValue = (dataTypeCode: string): number | null => {
    const series = seriesMap.get(dataTypeCode);
    if (!series) return null;
    const point = getMostRecentDataPoint(series.data);
    return point ? parseBlsValue(point.value) : null;
  };

  const getReferencePeriod = (): string => {
    const firstSeries = result.data[0];
    if (!firstSeries) return 'Unknown';
    const point = getMostRecentDataPoint(firstSeries.data);
    return point ? `${point.periodName} ${point.year}` : 'Unknown';
  };

  const employmentData: OesEmploymentData = {
    socCode: formatSocCode(socCode),
    occupationTitle:
      result.data[0]?.catalog?.occupation_title || result.data[0]?.catalog?.series_title || socCode,
    areaCode: effectiveAreaCode,
    areaName: getAreaName(effectiveAreaCode),
    period: getReferencePeriod(),
    employment: getValue('01'),
    employmentPer1000Jobs: getValue('16'),
    locationQuotient: getValue('17'),
    relativeStandardError: undefined,
  };

  // Cache the result
  setCachedData(cacheKey, employmentData);

  return successResult(employmentData, result.warnings);
}

// =============================================================================
// JOLTS (Job Openings & Labor Turnover) Functions
// =============================================================================

/**
 * Build a JOLTS series ID.
 * @param industryCode - Industry code (default: 000000 for total nonfarm)
 * @param dataElement - Data element code (JO, HI, QU, etc.)
 * @param rateOrLevel - 'L' for level (count), 'R' for rate
 * @param seasonallyAdjusted - Whether seasonally adjusted
 * @returns JOLTS series ID
 */
function buildJoltsSeriesId(
  industryCode: string = '000000',
  dataElement: string = 'JO',
  rateOrLevel: 'L' | 'R' = 'L',
  seasonallyAdjusted: boolean = true
): string {
  const seasonal = seasonallyAdjusted ? 'S' : 'U';
  const paddedIndustry = industryCode.padStart(6, '0');
  // JOLTS format: JT + S/U + industry(6) + 000000000(9) + element(2) + L/R(1) = 21 chars
  // Example: JTS000000000000000JOL
  return `JT${seasonal}${paddedIndustry}000000000${dataElement}${rateOrLevel}`;
}

/**
 * Get national job openings data.
 * @param industryCode - Optional industry code (defaults to total nonfarm)
 * @returns JOLTS job openings data or error
 */
export async function getJobOpenings(industryCode?: string): Promise<BlsResult<JoltsData>> {
  const effectiveIndustry = industryCode || '000000';
  const cacheKey = buildCacheKey('jolts_openings', effectiveIndustry);

  // Check cache first
  const cached = getCachedData<JoltsData>(cacheKey);
  if (cached) {
    return successResult(cached);
  }

  // Build series IDs for job openings level and rate
  const seriesIds = [
    buildJoltsSeriesId(effectiveIndustry, 'JO', 'L', true), // Job openings level
    buildJoltsSeriesId(effectiveIndustry, 'JO', 'R', true), // Job openings rate
    buildJoltsSeriesId(effectiveIndustry, 'HI', 'L', true), // Hires level
    buildJoltsSeriesId(effectiveIndustry, 'HI', 'R', true), // Hires rate
    buildJoltsSeriesId(effectiveIndustry, 'QU', 'L', true), // Quits level
    buildJoltsSeriesId(effectiveIndustry, 'QU', 'R', true), // Quits rate
    buildJoltsSeriesId(effectiveIndustry, 'TS', 'L', true), // Total separations level
    buildJoltsSeriesId(effectiveIndustry, 'TS', 'R', true), // Total separations rate
    buildJoltsSeriesId(effectiveIndustry, 'LD', 'L', true), // Layoffs level
    buildJoltsSeriesId(effectiveIndustry, 'LD', 'R', true), // Layoffs rate
  ];

  const result = await fetchBlsSeries(seriesIds);

  if (!result.success) {
    return failedResult(result.error);
  }

  // Parse series data - extract values from series
  const seriesMap = new Map<string, number | null>();
  for (const series of result.data) {
    // Extract the data element (JO, HI, QU, etc.) and level/rate from series ID
    // Format: JTS000000000000000XXY where XX is element, Y is L/R
    const id = series.seriesID;
    const element = id.substring(id.length - 3, id.length - 1); // e.g., "JO"
    const levelOrRate = id.substring(id.length - 1); // "L" or "R"
    const key = `${element}_${levelOrRate}`;

    const point = getMostRecentDataPoint(series.data);
    seriesMap.set(key, point ? parseBlsValue(point.value) : null);
  }

  const getReferencePeriod = (): { period: string; year: number; month: number } => {
    const firstSeries = result.data[0];
    if (!firstSeries) return { period: 'Unknown', year: 0, month: 0 };
    const point = getMostRecentDataPoint(firstSeries.data);
    if (!point) return { period: 'Unknown', year: 0, month: 0 };
    const year = parseInt(point.year);
    const month = parseInt(point.period.replace('M', '')) || 0;
    return {
      period: `${point.year}-${point.period.replace('M', '').padStart(2, '0')}`,
      year,
      month,
    };
  };

  const ref = getReferencePeriod();

  const joltsData: JoltsData = {
    period: ref.period,
    year: ref.year,
    month: ref.month,
    industryCode: effectiveIndustry,
    industryName:
      result.data[0]?.catalog?.industry_title ||
      (effectiveIndustry === '000000' ? 'Total Nonfarm' : effectiveIndustry),
    region: 'total_us',
    jobOpenings: seriesMap.get('JO_L') || null,
    jobOpeningsRate: seriesMap.get('JO_R') || null,
    hires: seriesMap.get('HI_L') || null,
    hiresRate: seriesMap.get('HI_R') || null,
    totalSeparations: seriesMap.get('TS_L') || null,
    totalSeparationsRate: seriesMap.get('TS_R') || null,
    quits: seriesMap.get('QU_L') || null,
    quitsRate: seriesMap.get('QU_R') || null,
    layoffsDischarges: seriesMap.get('LD_L') || null,
    layoffsDischargesRate: seriesMap.get('LD_R') || null,
    otherSeparations: null,
    seasonallyAdjusted: true,
  };

  // Cache the result
  setCachedData(cacheKey, joltsData);

  return successResult(joltsData, result.warnings);
}

/**
 * Get hiring rate data.
 * @param industryCode - Optional industry code
 * @returns Hiring data or error
 */
export async function getHiringRate(industryCode?: string): Promise<BlsResult<JoltsData>> {
  // This uses the same function as getJobOpenings which fetches all JOLTS data
  return getJobOpenings(industryCode);
}

// =============================================================================
// LAU (Local Area Unemployment) Functions
// =============================================================================

/**
 * Build a LAU series ID for state unemployment.
 * @param stateFips - Two-digit state FIPS code
 * @param measureCode - LAU measure code (03=rate, 04=unemployed, 05=employed, 06=labor force)
 * @param seasonallyAdjusted - Whether seasonally adjusted
 * @returns LAU series ID
 */
function buildLauSeriesId(
  stateFips: string,
  measureCode: string = '03',
  seasonallyAdjusted: boolean = true
): string {
  const seasonal = seasonallyAdjusted ? 'S' : 'U';
  const paddedFips = stateFips.padStart(2, '0');
  return `LA${seasonal}ST${paddedFips}0000000000${measureCode}`;
}

/**
 * Get national unemployment rate from CPS (Current Population Survey).
 * Uses LNS series which is the primary unemployment statistic.
 * @returns National unemployment data or error
 */
export async function getNationalUnemploymentRate(): Promise<BlsResult<UnemploymentData>> {
  const cacheKey = buildCacheKey('lns_unemployment', 'national');

  // Check cache first
  const cached = getCachedData<UnemploymentData>(cacheKey);
  if (cached) {
    return successResult(cached);
  }

  // National unemployment series IDs (CPS/LNS series)
  const seriesIds = [
    'LNS14000000', // Unemployment rate (seasonally adjusted)
    'LNS12000000', // Employed persons (seasonally adjusted)
    'LNS13000000', // Unemployed persons (seasonally adjusted)
    'LNS11000000', // Civilian labor force (seasonally adjusted)
  ];

  const result = await fetchBlsSeries(seriesIds);

  if (!result.success) {
    return failedResult(result.error);
  }

  // Parse series data
  const seriesMap = new Map<string, BlsSeriesData>();
  for (const series of result.data) {
    seriesMap.set(series.seriesID, series);
  }

  const getValue = (seriesId: string): number | null => {
    const series = seriesMap.get(seriesId);
    if (!series) return null;
    const point = getMostRecentDataPoint(series.data);
    return point ? parseBlsValue(point.value) : null;
  };

  // Get previous month's value for calculating change
  const getPreviousValue = (seriesId: string): number | null => {
    const series = seriesMap.get(seriesId);
    if (!series || !series.data || series.data.length < 2) return null;

    // Sort by year and period descending to ensure correct order
    const sorted = [...series.data].sort((a, b) => {
      const yearDiff = parseInt(b.year) - parseInt(a.year);
      if (yearDiff !== 0) return yearDiff;
      return b.period.localeCompare(a.period);
    });

    // Get second most recent (index 1)
    const point = sorted[1];
    return point ? parseBlsValue(point.value) : null;
  };

  // Calculate month-over-month change
  const calculateChange = (seriesId: string): number => {
    const current = getValue(seriesId);
    const previous = getPreviousValue(seriesId);
    if (current === null || previous === null) return 0;
    return current - previous;
  };

  const getReferencePeriod = (): { period: string; year: number; month: number | null } => {
    const firstSeries = result.data[0];
    if (!firstSeries) return { period: 'Unknown', year: 0, month: null };
    const point = getMostRecentDataPoint(firstSeries.data);
    if (!point) return { period: 'Unknown', year: 0, month: null };
    const year = parseInt(point.year);
    const month = point.period.startsWith('M') ? parseInt(point.period.replace('M', '')) : null;
    return {
      period: `${point.year}-${point.period.replace('M', '').padStart(2, '0')}`,
      year,
      month,
    };
  };

  const ref = getReferencePeriod();

  // Calculate month-over-month changes for employment data
  const employmentChange = calculateChange('LNS12000000') * 1000; // Change in employed persons
  const unemploymentRateChange = calculateChange('LNS14000000'); // Change in unemployment rate (percentage points)

  const unemploymentData: UnemploymentData & {
    employmentChange: number;
    unemploymentRateChange: number;
  } = {
    areaCode: '00000',
    areaName: 'United States',
    geographicLevel: 'national',
    period: ref.period,
    year: ref.year,
    month: ref.month,
    unemploymentRate: getValue('LNS14000000') || 0,
    laborForce: (getValue('LNS11000000') || 0) * 1000, // LNS reports in thousands
    employed: (getValue('LNS12000000') || 0) * 1000, // LNS12 is employed persons
    unemployed: (getValue('LNS13000000') || 0) * 1000, // LNS13 is unemployed persons
    seasonallyAdjusted: true,
    employmentChange, // Month-over-month change in employed persons
    unemploymentRateChange, // Month-over-month change in unemployment rate
  };

  // Cache the result
  setCachedData(cacheKey, unemploymentData);

  return successResult(unemploymentData, result.warnings);
}

/**
 * Get unemployment rate for an area.
 * @param areaCode - Area code (state FIPS, MSA code, etc.)
 * @returns Unemployment data or error
 */
export async function getUnemploymentRate(areaCode: string): Promise<BlsResult<UnemploymentData>> {
  const cacheKey = buildCacheKey('lau_unemployment', areaCode);

  // Check cache first
  const cached = getCachedData<UnemploymentData>(cacheKey);
  if (cached) {
    return successResult(cached);
  }

  // Build series IDs for unemployment measures
  const seriesIds = [
    buildLauSeriesId(areaCode, '03', true), // Unemployment rate
    buildLauSeriesId(areaCode, '04', true), // Unemployment count
    buildLauSeriesId(areaCode, '05', true), // Employment count
    buildLauSeriesId(areaCode, '06', true), // Labor force
  ];

  const result = await fetchBlsSeries(seriesIds);

  if (!result.success) {
    return failedResult(result.error);
  }

  // Parse series data
  const seriesMap = new Map<string, BlsSeriesData>();
  for (const series of result.data) {
    const measureCode = series.seriesID.slice(-2);
    seriesMap.set(measureCode, series);
  }

  const getValue = (measureCode: string): number | null => {
    const series = seriesMap.get(measureCode);
    if (!series) return null;
    const point = getMostRecentDataPoint(series.data);
    return point ? parseBlsValue(point.value) : null;
  };

  const getReferencePeriod = (): { period: string; year: number; month: number | null } => {
    const firstSeries = result.data[0];
    if (!firstSeries) return { period: 'Unknown', year: 0, month: null };
    const point = getMostRecentDataPoint(firstSeries.data);
    if (!point) return { period: 'Unknown', year: 0, month: null };
    const year = parseInt(point.year);
    const month = point.period.startsWith('M') ? parseInt(point.period.replace('M', '')) : null;
    return {
      period: `${point.year}-${point.period.replace('M', '').padStart(2, '0')}`,
      year,
      month,
    };
  };

  const ref = getReferencePeriod();

  const unemploymentData: UnemploymentData = {
    areaCode: areaCode,
    areaName: getAreaName(`S${areaCode.padStart(2, '0')}00000`),
    geographicLevel: 'state',
    period: ref.period,
    year: ref.year,
    month: ref.month,
    unemploymentRate: getValue('03') || 0,
    laborForce: getValue('06') || 0,
    employed: getValue('05') || 0,
    unemployed: getValue('04') || 0,
    seasonallyAdjusted: true,
  };

  // Cache the result
  setCachedData(cacheKey, unemploymentData);

  return successResult(unemploymentData, result.warnings);
}

/**
 * Get unemployment rate for a state by abbreviation.
 * @param stateAbbrev - Two-letter state abbreviation
 * @returns Unemployment data or error
 */
export async function getStateUnemployment(
  stateAbbrev: string
): Promise<BlsResult<UnemploymentData>> {
  const state = getStateByAbbrev(stateAbbrev);
  if (!state) {
    return failedResult(createError('INVALID_SERIES_ID', `Unknown state: ${stateAbbrev}`));
  }

  const result = await getUnemploymentRate(state.fips);

  if (result.success) {
    // Update the area name with the proper state name
    result.data.areaName = state.name;
  }

  return result;
}

// =============================================================================
// CPI (Consumer Price Index) Functions
// =============================================================================

/**
 * Build a CPI series ID.
 * @param itemCode - Item code (SA0 for all items, SA0L1E for core, etc.)
 * @param areaCode - Area code (0000 for US city average)
 * @param seasonallyAdjusted - Whether seasonally adjusted
 * @returns CPI series ID
 */
function buildCpiSeriesId(
  itemCode: string = 'SA0',
  areaCode: string = '0000',
  seasonallyAdjusted: boolean = true
): string {
  const seasonal = seasonallyAdjusted ? 'S' : 'U';
  return `CU${seasonal}R${areaCode}${itemCode}`;
}

/**
 * Get current CPI index value.
 * @returns CPI data or error
 */
export async function getCurrentCpi(): Promise<BlsResult<CpiData>> {
  const cacheKey = buildCacheKey('cpi_current', 'all_items');

  // Check cache first
  const cached = getCachedData<CpiData>(cacheKey);
  if (cached) {
    return successResult(cached);
  }

  // Fetch CPI-U all items, seasonally adjusted
  const seriesId = buildCpiSeriesId('SA0', '0000', true);
  const result = await fetchBlsSeries([seriesId]);

  if (!result.success) {
    return failedResult(result.error);
  }

  const series = result.data[0];
  if (!series) {
    return failedResult(createError('NO_DATA_AVAILABLE', 'No CPI data available'));
  }

  const point = getMostRecentDataPoint(series.data);
  if (!point) {
    return failedResult(createError('NO_DATA_AVAILABLE', 'No CPI data points available'));
  }

  const year = parseInt(point.year);
  const month = point.period.startsWith('M') ? parseInt(point.period.replace('M', '')) : 0;

  const cpiData: CpiData = {
    period: `${point.year}-${point.period.replace('M', '').padStart(2, '0')}`,
    year,
    month,
    itemCode: 'SA0',
    itemDescription: 'All items',
    area: 'U.S. city average',
    indexValue: parseBlsValue(point.value) || 0,
    percentChange1Month: point.calculations?.pct_changes?.[1]
      ? parseFloat(point.calculations.pct_changes[1])
      : null,
    percentChange12Month: point.calculations?.pct_changes?.[12]
      ? parseFloat(point.calculations.pct_changes[12])
      : null,
    seasonallyAdjusted: true,
  };

  // Cache the result
  setCachedData(cacheKey, cpiData);

  return successResult(cpiData, result.warnings);
}

/**
 * Get year-over-year inflation rate.
 * @returns Inflation rate or error
 */
export async function getInflationRate(): Promise<BlsResult<number>> {
  const cpiResult = await getCurrentCpi();

  if (!cpiResult.success) {
    return failedResult(cpiResult.error);
  }

  const inflation = cpiResult.data.percentChange12Month;
  if (inflation === null) {
    return failedResult(
      createError('NO_DATA_AVAILABLE', 'Year-over-year inflation data not available')
    );
  }

  return successResult(inflation);
}

// =============================================================================
// High-Level Composite Functions
// =============================================================================

/**
 * Get comprehensive market data for an occupation.
 * Combines OES wage and employment data with projections.
 * @param socCode - SOC occupation code
 * @param areaCode - Optional area code (defaults to national)
 * @returns Complete occupation market data or error
 */
export async function getOccupationMarketData(
  socCode: string,
  areaCode?: string
): Promise<BlsResult<OccupationMarketData>> {
  const effectiveAreaCode = areaCode || NATIONAL_AREA_CODE;
  const cacheKey = buildCacheKey('market_data', `${socCode}_${effectiveAreaCode}`);

  // Check cache first
  const cached = getCachedData<OccupationMarketData>(cacheKey);
  if (cached) {
    return successResult(cached);
  }

  // Fetch wage and employment data in parallel
  const [wageResult, employmentResult] = await Promise.all([
    getOccupationWages(socCode, effectiveAreaCode),
    getOccupationEmployment(socCode, effectiveAreaCode),
  ]);

  if (!wageResult.success) {
    return failedResult(wageResult.error);
  }

  if (!employmentResult.success) {
    return failedResult(employmentResult.error);
  }

  const warnings: string[] = [];
  if (wageResult.warnings) warnings.push(...wageResult.warnings);
  if (employmentResult.warnings) warnings.push(...employmentResult.warnings);

  // Determine occupation group from SOC code
  const socMajorGroup = socCode.replace(/-/g, '').substring(0, 2);
  const occupationGroups: Record<string, string> = {
    '11': 'Management',
    '13': 'Business and Financial Operations',
    '15': 'Computer and Mathematical',
    '17': 'Architecture and Engineering',
    '19': 'Life, Physical, and Social Science',
    '21': 'Community and Social Service',
    '23': 'Legal',
    '25': 'Educational Instruction and Library',
    '27': 'Arts, Design, Entertainment, Sports, and Media',
    '29': 'Healthcare Practitioners and Technical',
    '31': 'Healthcare Support',
    '33': 'Protective Service',
    '35': 'Food Preparation and Serving Related',
    '37': 'Building and Grounds Cleaning and Maintenance',
    '39': 'Personal Care and Service',
    '41': 'Sales and Related',
    '43': 'Office and Administrative Support',
    '45': 'Farming, Fishing, and Forestry',
    '47': 'Construction and Extraction',
    '49': 'Installation, Maintenance, and Repair',
    '51': 'Production',
    '53': 'Transportation and Material Moving',
  };

  const marketData: OccupationMarketData = {
    socCode: formatSocCode(socCode),
    occupationTitle: wageResult.data.occupationTitle,
    occupationGroup: occupationGroups[socMajorGroup] || 'Unknown',
    wages: wageResult.data,
    employment: employmentResult.data,
    projection: null, // Would require separate Employment Projections data
    dataAsOf: wageResult.data.period,
  };

  // Cache the result
  setCachedData(cacheKey, marketData);

  return successResult(marketData, warnings.length > 0 ? warnings : undefined);
}

/**
 * Get a snapshot of current labor market conditions.
 * Includes unemployment, JOLTS, and CPI data.
 * @returns Labor market snapshot or error
 */
export async function getLaborMarketSnapshot(): Promise<BlsResult<LaborMarketSnapshot>> {
  const cacheKey = buildCacheKey('snapshot', 'labor_market');

  // Check cache first
  const cached = getCachedData<LaborMarketSnapshot>(cacheKey);
  if (cached) {
    return successResult(cached);
  }

  // Fetch all data in parallel
  const [unemploymentResult, joltsResult, cpiResult] = await Promise.all([
    getNationalUnemploymentRate(), // Use CPS/LNS series for national data
    getJobOpenings(),
    getCurrentCpi(),
  ]);

  console.log('[BLS] getLaborMarketSnapshot API results:', {
    unemployment: unemploymentResult.success,
    jolts: joltsResult.success,
    cpi: cpiResult.success,
    unemploymentError: unemploymentResult.success ? null : unemploymentResult.error,
    joltsError: joltsResult.success ? null : joltsResult.error,
    cpiError: cpiResult.success ? null : cpiResult.error,
  });

  const warnings: string[] = [];

  // Build snapshot with available data
  const snapshot: LaborMarketSnapshot = {
    period: 'Current',
    nationalUnemploymentRate: 0,
    unemploymentRateChange: 0,
    totalEmployment: 0,
    monthlyJobChange: 0,
    laborForceParticipationRate: 0,
    jobOpenings: 0,
    quitsRate: 0,
    inflation: 0,
    marketCondition: 'moderate',
    highlights: [],
  };

  if (unemploymentResult.success) {
    snapshot.nationalUnemploymentRate = unemploymentResult.data.unemploymentRate;
    snapshot.totalEmployment = unemploymentResult.data.employed;
    snapshot.period = unemploymentResult.data.period;

    // Use change values if available, otherwise default to 0
    snapshot.monthlyJobChange = (unemploymentResult.data as any).employmentChange || 0;
    snapshot.unemploymentRateChange = (unemploymentResult.data as any).unemploymentRateChange || 0;

    if (unemploymentResult.data.laborForce > 0 && unemploymentResult.data.employed > 0) {
      // Calculate labor force participation rate
      snapshot.laborForceParticipationRate =
        (unemploymentResult.data.employed / unemploymentResult.data.laborForce) * 100;
    }
  } else {
    warnings.push('Unable to fetch unemployment data');
  }

  if (joltsResult.success) {
    snapshot.jobOpenings = joltsResult.data.jobOpenings || 0;
    snapshot.quitsRate = joltsResult.data.quitsRate || 0;
    if (!snapshot.period || snapshot.period === 'Current') {
      snapshot.period = joltsResult.data.period;
    }
  } else {
    warnings.push('Unable to fetch JOLTS data');
  }

  if (cpiResult.success) {
    snapshot.inflation = cpiResult.data.percentChange12Month || 0;
  } else {
    warnings.push('Unable to fetch CPI data');
  }

  // Determine market condition
  if (snapshot.nationalUnemploymentRate < 4 && snapshot.jobOpenings > 8000) {
    snapshot.marketCondition = 'strong';
    snapshot.highlights.push('Low unemployment indicates tight labor market');
    snapshot.highlights.push('High job openings suggest employer demand exceeds supply');
  } else if (snapshot.nationalUnemploymentRate > 6) {
    snapshot.marketCondition = 'weak';
    snapshot.highlights.push('Elevated unemployment signals economic challenges');
  } else {
    snapshot.marketCondition = 'moderate';
    snapshot.highlights.push('Labor market conditions are balanced');
  }

  if (snapshot.inflation > 3) {
    snapshot.highlights.push(
      `Inflation at ${snapshot.inflation.toFixed(1)}% may impact real wages`
    );
  }

  if (snapshot.quitsRate > 2.5) {
    snapshot.highlights.push('High quit rate suggests worker confidence in job prospects');
  }

  // Cache the result
  setCachedData(cacheKey, snapshot);

  return successResult(snapshot, warnings.length > 0 ? warnings : undefined);
}

/**
 * Compare wages for an occupation across multiple regions.
 * @param socCode - SOC occupation code
 * @param areaCodes - Array of area codes to compare
 * @returns Regional comparison data or error
 */
export async function compareRegionalWages(
  socCode: string,
  areaCodes: string[]
): Promise<BlsResult<RegionalComparison>> {
  if (!areaCodes || areaCodes.length === 0) {
    return failedResult(createError('INVALID_SERIES_ID', 'At least one area code is required'));
  }

  const cacheKey = buildCacheKey('regional_compare', `${socCode}_${areaCodes.join('-')}`);

  // Check cache first
  const cached = getCachedData<RegionalComparison>(cacheKey);
  if (cached) {
    return successResult(cached);
  }

  // Fetch wage data for all regions in parallel
  const wagePromises = areaCodes.map((areaCode) => getOccupationWages(socCode, areaCode));
  const nationalWagePromise = getOccupationWages(socCode, NATIONAL_AREA_CODE);

  const [nationalResult, ...regionalResults] = await Promise.all([
    nationalWagePromise,
    ...wagePromises,
  ]);

  const warnings: string[] = [];
  const successfulRegions: OesWageData[] = [];

  for (let i = 0; i < regionalResults.length; i++) {
    const result = regionalResults[i];
    if (result.success) {
      successfulRegions.push(result.data);
    } else {
      warnings.push(`Failed to fetch data for area ${areaCodes[i]}: ${result.error.message}`);
    }
  }

  if (successfulRegions.length === 0) {
    return failedResult(
      createError('NO_DATA_AVAILABLE', 'No wage data available for any of the specified regions')
    );
  }

  // Use first region as base
  const baseRegion = successfulRegions[0];
  const baseMedian = baseRegion.annual.median || 0;

  // Fetch employment data for base region
  const baseEmploymentResult = await getOccupationEmployment(socCode, baseRegion.areaCode);
  const baseEmployment = baseEmploymentResult.success
    ? baseEmploymentResult.data.employment || 0
    : 0;

  // Build comparisons
  const comparisons = successfulRegions.slice(1).map((region) => {
    const regionMedian = region.annual.median || 0;
    return {
      areaCode: region.areaCode,
      areaName: region.areaName,
      medianWage: regionMedian,
      wageDifference: regionMedian - baseMedian,
      wageDifferencePercent: baseMedian > 0 ? ((regionMedian - baseMedian) / baseMedian) * 100 : 0,
      employment: 0, // Would need separate fetch
    };
  });

  const nationalMedian =
    nationalResult.success && nationalResult.data.annual.median
      ? nationalResult.data.annual.median
      : baseMedian;

  const comparison: RegionalComparison = {
    socCode: formatSocCode(socCode),
    occupationTitle: baseRegion.occupationTitle,
    baseRegion: {
      areaCode: baseRegion.areaCode,
      areaName: baseRegion.areaName,
      medianWage: baseMedian,
      employment: baseEmployment,
    },
    comparisons,
    nationalAverage: {
      medianWage: nationalMedian,
      totalEmployment: 0, // Would need national employment fetch
    },
  };

  // Cache the result
  setCachedData(cacheKey, comparison);

  return successResult(comparison, warnings.length > 0 ? warnings : undefined);
}

/**
 * Get a user-friendly career outlook assessment for an occupation.
 * @param socCode - SOC occupation code
 * @returns Career outlook assessment or error
 */
export async function getCareerOutlook(socCode: string): Promise<BlsResult<CareerOutlook>> {
  const cacheKey = buildCacheKey('career_outlook', socCode);

  // Check cache first
  const cached = getCachedData<CareerOutlook>(cacheKey);
  if (cached) {
    return successResult(cached);
  }

  // Fetch market data
  const marketResult = await getOccupationMarketData(socCode);

  if (!marketResult.success) {
    return failedResult(marketResult.error);
  }

  const market = marketResult.data;
  const wages = market.wages;
  const employment = market.employment;

  // Calculate outlook score based on available data
  let outlookScore = 50; // Start at moderate

  // Adjust based on wages
  const medianWage = wages.annual.median || 0;
  if (medianWage > 100000) {
    outlookScore += 15;
  } else if (medianWage > 70000) {
    outlookScore += 10;
  } else if (medianWage > 50000) {
    outlookScore += 5;
  }

  // Adjust based on employment level
  const emp = employment.employment || 0;
  if (emp > 500000) {
    outlookScore += 10;
  } else if (emp > 100000) {
    outlookScore += 5;
  }

  // Determine overall outlook
  let overallOutlook: ProjectionOutlook;
  if (outlookScore >= 75) {
    overallOutlook = 'excellent';
  } else if (outlookScore >= 60) {
    overallOutlook = 'good';
  } else if (outlookScore >= 40) {
    overallOutlook = 'fair';
  } else if (outlookScore >= 25) {
    overallOutlook = 'limited';
  } else {
    overallOutlook = 'declining';
  }

  // Estimate salary levels based on percentiles
  const entryLevel = wages.annual.percentile10 || wages.annual.percentile25 || medianWage * 0.7;
  const midCareer = wages.annual.median || medianWage;
  const experienced = wages.annual.percentile90 || wages.annual.percentile75 || medianWage * 1.4;

  // Determine salary comparison
  let salaryComparison: 'above_average' | 'average' | 'below_average';
  // Approximate national median wage across all occupations
  const nationalMedian = 48000;
  if (medianWage > nationalMedian * 1.25) {
    salaryComparison = 'above_average';
  } else if (medianWage < nationalMedian * 0.85) {
    salaryComparison = 'below_average';
  } else {
    salaryComparison = 'average';
  }

  // Default requirements (would ideally come from Employment Projections data)
  const typicalEducation: EducationLevel =
    medianWage > 80000 ? 'bachelor_degree' : 'high_school_diploma';
  const typicalExperience: WorkExperience = medianWage > 100000 ? 'less_than_5_years' : 'none';
  const typicalTraining: OnTheJobTraining = 'short_term';

  const outlook: CareerOutlook = {
    socCode: formatSocCode(socCode),
    occupationTitle: market.occupationTitle,
    overallOutlook,
    outlookScore: Math.min(100, Math.max(0, outlookScore)),
    salary: {
      entryLevel,
      midCareer,
      experienced,
      comparison: salaryComparison,
    },
    jobAvailability: {
      currentOpenings: emp > 200000 ? 'high' : emp > 50000 ? 'moderate' : 'low',
      projectedGrowth: 'average', // Would need projections data
      annualOpenings: Math.round(emp * 0.05), // Rough estimate: 5% annual openings
      competition: outlookScore > 60 ? 'moderate' : 'high',
    },
    requirements: {
      education: typicalEducation,
      experience: typicalExperience,
      training: typicalTraining,
    },
    topLocations: [], // Would need regional data comparison
    outlookFactors: [
      {
        factor: 'Current wage levels',
        impact: medianWage > 60000 ? 'positive' : 'neutral',
        description:
          medianWage > 60000
            ? 'Above-average compensation attracts qualified candidates'
            : 'Wages are competitive with similar occupations',
      },
      {
        factor: 'Employment base',
        impact: emp > 100000 ? 'positive' : 'neutral',
        description:
          emp > 100000
            ? 'Large employment base offers many opportunities'
            : 'Moderate employment levels provide steady opportunities',
      },
    ],
    alternatives: [], // Would need related occupations data
    assessmentDate: new Date().toISOString(),
  };

  // Cache the result
  setCachedData(cacheKey, outlook);

  return successResult(outlook, marketResult.warnings);
}
