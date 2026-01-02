/**
 * Labor Market Provider Abstraction Layer
 *
 * Unified interface for regional labor market data sources.
 * Automatically routes to the correct provider based on user's location.
 *
 * Current providers:
 * - BLS (US): Bureau of Labor Statistics
 *
 * Future providers:
 * - Eurostat (EU): European Statistical Office
 * - Stats Canada (CA): Statistics Canada
 * - ONS (UK): Office for National Statistics
 * - ABS (AU): Australian Bureau of Statistics
 *
 * @module services/labor-market-provider
 */

import { getUserLocation, getLaborMarketProvider } from './geolocation';
import type { LaborMarketProvider as ProviderType, CountryCode } from './geolocation';
import * as bls from './bls';
import type { OesWageData } from '../types/bls.types';

// =============================================================================
// UNIFIED DATA TYPES
// =============================================================================

/**
 * Normalized occupation data across all providers
 */
export interface UnifiedOccupationData {
  /** Provider-specific code (SOC for BLS, ISCO for Eurostat, etc.) */
  code: string;
  /** Occupation title */
  title: string;
  /** Median annual wage (normalized to USD) */
  medianWageAnnual: number;
  /** Median hourly wage (if available) */
  medianWageHourly?: number;
  /** Wage percentiles */
  wagePercentiles?: {
    /** 10th percentile annual wage */
    p10: number;
    /** 25th percentile annual wage */
    p25: number;
    /** 75th percentile annual wage */
    p75: number;
    /** 90th percentile annual wage */
    p90: number;
  };
  /** Total employment count */
  employment?: number;
  /** 10-year growth projection (% change) */
  growthProjection?: number;
  /** Annual job openings estimate */
  annualOpenings?: number;
  /** Career outlook rating */
  outlook?: 'excellent' | 'good' | 'fair' | 'limited' | 'declining';
  /** Data provider that sourced this information */
  provider: ProviderType;
  /** Country or region this data represents */
  region: string;
  /** When data was fetched */
  fetchedAt: Date;
}

/**
 * Normalized market snapshot across all providers
 */
export interface UnifiedMarketSnapshot {
  /** National unemployment rate (percent) */
  unemploymentRate: number;
  /** Total job openings (thousands, if available) */
  jobOpenings?: number;
  /** Year-over-year inflation rate (percent, if available) */
  inflationRate?: number;
  /** Monthly hiring rate (percent, if available) */
  hiringRate?: number;
  /** Data provider that sourced this information */
  provider: ProviderType;
  /** Country or region this data represents */
  region: string;
  /** Date of the data */
  dataDate: Date;
}

/**
 * Result wrapper with success/error handling
 */
export interface ProviderResult<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Result data (if successful) */
  data?: T;
  /** Error message (if failed) */
  error?: string;
  /** Provider that handled the request */
  provider: ProviderType;
  /** Optional warning messages */
  warnings?: string[];
}

// =============================================================================
// PROVIDER INTERFACE
// =============================================================================

/**
 * Standard interface all providers must implement
 */
interface ILaborMarketProvider {
  /**
   * Get occupation data for a specific code
   * @param code - Occupation code (SOC, ISCO, etc.)
   * @param areaCode - Optional area/region code
   * @returns Unified occupation data or error
   */
  getOccupationData(
    code: string,
    areaCode?: string
  ): Promise<ProviderResult<UnifiedOccupationData>>;

  /**
   * Get current labor market snapshot
   * @returns Unified market snapshot or error
   */
  getMarketSnapshot(): Promise<ProviderResult<UnifiedMarketSnapshot>>;

  /**
   * Get wage data for an occupation
   * @param code - Occupation code
   * @param areaCode - Optional area code
   * @returns Wage data or error
   */
  getWageData(code: string, areaCode?: string): Promise<ProviderResult<OesWageData>>;
}

// =============================================================================
// BLS PROVIDER IMPLEMENTATION
// =============================================================================

/**
 * Bureau of Labor Statistics (US) provider implementation
 */
class BlsProvider implements ILaborMarketProvider {
  /**
   * Get occupation data from BLS
   */
  async getOccupationData(
    socCode: string,
    _areaCode?: string
  ): Promise<ProviderResult<UnifiedOccupationData>> {
    try {
      // Fetch career outlook data from BLS
      const result = await bls.getCareerOutlook(socCode);

      if (!result.success) {
        return {
          success: false,
          error: result.error.message || 'Failed to fetch BLS data',
          provider: 'bls',
        };
      }

      const data = result.data;

      // Build wage percentiles if available
      const wagePercentiles =
        data.salary.entryLevel && data.salary.experienced
          ? {
              p10: data.salary.entryLevel,
              p25: data.salary.entryLevel * 1.15,
              p75: data.salary.experienced * 0.85,
              p90: data.salary.experienced,
            }
          : undefined;

      return {
        success: true,
        data: {
          code: socCode,
          title: data.occupationTitle,
          medianWageAnnual: data.salary.midCareer,
          medianWageHourly: data.salary.midCareer / 2080, // Approximate hourly rate
          wagePercentiles,
          employment: undefined, // Would need separate employment fetch
          growthProjection: undefined, // Not directly available in career outlook
          annualOpenings: data.jobAvailability.annualOpenings,
          outlook: data.overallOutlook,
          provider: 'bls',
          region: 'US',
          fetchedAt: new Date(),
        },
        provider: 'bls',
        warnings: result.warnings,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'bls',
      };
    }
  }

  /**
   * Get labor market snapshot from BLS
   */
  async getMarketSnapshot(): Promise<ProviderResult<UnifiedMarketSnapshot>> {
    try {
      const result = await bls.getLaborMarketSnapshot();

      if (!result.success) {
        return {
          success: false,
          error: result.error.message || 'Failed to fetch BLS snapshot',
          provider: 'bls',
        };
      }

      const data = result.data;

      // Parse period string to extract date (format: "YYYY-MM")
      const parseDataDate = (period: string): Date => {
        try {
          const [year, month] = period.split('-').map((s) => parseInt(s));
          return new Date(year, month - 1);
        } catch {
          return new Date();
        }
      };

      return {
        success: true,
        data: {
          unemploymentRate: data.nationalUnemploymentRate,
          jobOpenings: data.jobOpenings,
          inflationRate: data.inflation,
          hiringRate: undefined, // BLS has quits rate, not hiring rate directly
          provider: 'bls',
          region: 'US',
          dataDate: parseDataDate(data.period),
        },
        provider: 'bls',
        warnings: result.warnings,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'bls',
      };
    }
  }

  /**
   * Get wage data from BLS
   */
  async getWageData(socCode: string, areaCode?: string): Promise<ProviderResult<OesWageData>> {
    try {
      const result = await bls.getOccupationWages(socCode, areaCode);

      if (!result.success) {
        return {
          success: false,
          error: result.error.message || 'Failed to fetch BLS wage data',
          provider: 'bls',
        };
      }

      return {
        success: true,
        data: result.data,
        provider: 'bls',
        warnings: result.warnings,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'bls',
      };
    }
  }
}

// =============================================================================
// NULL PROVIDER (for unsupported regions)
// =============================================================================

/**
 * Null provider for regions without data coverage
 * Returns graceful error messages indicating unavailability
 */
class NullProvider implements ILaborMarketProvider {
  async getOccupationData(): Promise<ProviderResult<UnifiedOccupationData>> {
    return {
      success: false,
      error: 'Labor market data not available for your region',
      provider: 'none',
    };
  }

  async getMarketSnapshot(): Promise<ProviderResult<UnifiedMarketSnapshot>> {
    return {
      success: false,
      error: 'Labor market data not available for your region',
      provider: 'none',
    };
  }

  async getWageData(): Promise<ProviderResult<OesWageData>> {
    return {
      success: false,
      error: 'Wage data not available for your region',
      provider: 'none',
    };
  }
}

// =============================================================================
// FUTURE PROVIDER STUBS
// =============================================================================

/**
 * Eurostat (EU) provider - Future implementation
 *
 * @example
 * class EurostatProvider implements ILaborMarketProvider {
 *   async getOccupationData(iscoCode: string) {
 *     // Fetch from Eurostat API
 *     // Map ISCO codes to SOC-like structure
 *     // Convert EUR to USD for consistency
 *     return { success: true, data: { ... }, provider: 'eurostat' };
 *   }
 *   async getMarketSnapshot() { ... }
 *   async getWageData() { ... }
 * }
 */

/**
 * Statistics Canada provider - Future implementation
 *
 * @example
 * class StatsCanadaProvider implements ILaborMarketProvider {
 *   async getOccupationData(nocCode: string) {
 *     // Fetch from Statistics Canada API
 *     // Map NOC codes to unified format
 *     // Convert CAD to USD
 *     return { success: true, data: { ... }, provider: 'stats-canada' };
 *   }
 *   async getMarketSnapshot() { ... }
 *   async getWageData() { ... }
 * }
 */

/**
 * Office for National Statistics (UK) provider - Future implementation
 *
 * @example
 * class OnsProvider implements ILaborMarketProvider {
 *   async getOccupationData(socCode: string) {
 *     // Fetch from ONS API
 *     // Convert GBP to USD
 *     return { success: true, data: { ... }, provider: 'ons' };
 *   }
 *   async getMarketSnapshot() { ... }
 *   async getWageData() { ... }
 * }
 */

/**
 * Australian Bureau of Statistics provider - Future implementation
 *
 * @example
 * class AbsProvider implements ILaborMarketProvider {
 *   async getOccupationData(anscoCode: string) {
 *     // Fetch from ABS API
 *     // Map ANSCO codes to unified format
 *     // Convert AUD to USD
 *     return { success: true, data: { ... }, provider: 'abs' };
 *   }
 *   async getMarketSnapshot() { ... }
 *   async getWageData() { ... }
 * }
 */

// =============================================================================
// PROVIDER FACTORY
// =============================================================================

/**
 * Get the appropriate provider for a country
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Provider implementation
 */
function getProvider(countryCode: CountryCode): ILaborMarketProvider {
  const providerType = getLaborMarketProvider(countryCode);

  switch (providerType) {
    case 'bls':
      return new BlsProvider();
    // Future providers:
    // case 'eurostat':
    //   return new EurostatProvider();
    // case 'stats-canada':
    //   return new StatsCanadaProvider();
    // case 'ons':
    //   return new OnsProvider();
    // case 'abs':
    //   return new AbsProvider();
    default:
      return new NullProvider();
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get occupation data using the user's regional provider
 *
 * @param code - Occupation code (SOC for US, ISCO for EU, etc.)
 * @param areaCode - Optional area/region code
 * @returns Unified occupation data or error
 *
 * @example
 * ```typescript
 * const result = await getOccupationData('15-1252');
 * if (result.success) {
 *   console.log(`${result.data.title}: $${result.data.medianWageAnnual}/year`);
 *   console.log(`Outlook: ${result.data.outlook}`);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function getOccupationData(
  code: string,
  areaCode?: string
): Promise<ProviderResult<UnifiedOccupationData>> {
  const location = await getUserLocation();
  const provider = getProvider(location.countryCode);
  return provider.getOccupationData(code, areaCode);
}

/**
 * Get market snapshot using the user's regional provider
 *
 * @returns Unified market snapshot or error
 *
 * @example
 * ```typescript
 * const result = await getMarketSnapshot();
 * if (result.success) {
 *   console.log(`Unemployment: ${result.data.unemploymentRate}%`);
 *   console.log(`Job Openings: ${result.data.jobOpenings}k`);
 *   console.log(`Inflation: ${result.data.inflationRate}%`);
 * }
 * ```
 */
export async function getMarketSnapshot(): Promise<ProviderResult<UnifiedMarketSnapshot>> {
  const location = await getUserLocation();
  const provider = getProvider(location.countryCode);
  return provider.getMarketSnapshot();
}

/**
 * Get wage data using the user's regional provider
 *
 * @param code - Occupation code
 * @param areaCode - Optional area code
 * @returns Wage data or error
 *
 * @example
 * ```typescript
 * const result = await getWageData('15-1252', 'S06'); // California
 * if (result.success) {
 *   console.log(`Median: $${result.data.annual.median}/year`);
 *   console.log(`Range: $${result.data.annual.percentile10} - $${result.data.annual.percentile90}`);
 * }
 * ```
 */
export async function getWageData(
  code: string,
  areaCode?: string
): Promise<ProviderResult<OesWageData>> {
  const location = await getUserLocation();
  const provider = getProvider(location.countryCode);
  return provider.getWageData(code, areaCode);
}

/**
 * Get the active provider for the user's location
 *
 * @returns Provider type ('bls', 'eurostat', 'none', etc.)
 *
 * @example
 * ```typescript
 * const provider = await getActiveProvider();
 * if (provider === 'none') {
 *   console.log('No labor market data available for your region');
 * } else {
 *   console.log(`Using ${provider} data provider`);
 * }
 * ```
 */
export async function getActiveProvider(): Promise<ProviderType> {
  const location = await getUserLocation();
  return getLaborMarketProvider(location.countryCode);
}

/**
 * Check if labor market data is available for the user's location
 *
 * @returns True if data is available, false otherwise
 *
 * @example
 * ```typescript
 * const hasData = await isDataAvailable();
 * if (!hasData) {
 *   showUnavailableMessage();
 * }
 * ```
 */
export async function isDataAvailable(): Promise<boolean> {
  const provider = await getActiveProvider();
  return provider !== 'none';
}

/**
 * Get a list of all supported country codes
 *
 * @returns Array of country codes with labor market data
 *
 * @example
 * ```typescript
 * const supported = getSupportedCountries();
 * console.log('Data available for:', supported.join(', '));
 * ```
 */
export function getSupportedCountries(): CountryCode[] {
  // Currently only US is supported
  return ['US'];

  // Future expansion:
  // return ['US', 'CA', 'GB', 'AU', ...EU_COUNTRIES];
}

/**
 * Get information about a specific provider
 *
 * @param provider - Provider type
 * @returns Provider metadata
 *
 * @example
 * ```typescript
 * const info = getProviderInfo('bls');
 * console.log(info.name); // "Bureau of Labor Statistics"
 * console.log(info.countries); // ["US"]
 * ```
 */
export function getProviderInfo(provider: ProviderType): {
  name: string;
  description: string;
  countries: CountryCode[];
  dataTypes: string[];
  updateFrequency: string;
  source: string;
} {
  switch (provider) {
    case 'bls':
      return {
        name: 'Bureau of Labor Statistics',
        description:
          'U.S. Department of Labor statistics on employment, wages, and economic indicators',
        countries: ['US'],
        dataTypes: ['wages', 'employment', 'unemployment', 'job openings', 'inflation'],
        updateFrequency: 'Monthly',
        source: 'https://www.bls.gov/',
      };
    case 'eurostat':
      return {
        name: 'Eurostat',
        description: 'European Union statistical office',
        countries: [], // Future implementation
        dataTypes: ['wages', 'employment', 'unemployment'],
        updateFrequency: 'Quarterly',
        source: 'https://ec.europa.eu/eurostat',
      };
    case 'stats-canada':
      return {
        name: 'Statistics Canada',
        description: 'Canadian government statistical agency',
        countries: [], // Future implementation
        dataTypes: ['wages', 'employment', 'unemployment'],
        updateFrequency: 'Monthly',
        source: 'https://www.statcan.gc.ca/',
      };
    case 'ons':
      return {
        name: 'Office for National Statistics',
        description: 'UK government statistical service',
        countries: [], // Future implementation
        dataTypes: ['wages', 'employment', 'unemployment'],
        updateFrequency: 'Monthly',
        source: 'https://www.ons.gov.uk/',
      };
    case 'abs':
      return {
        name: 'Australian Bureau of Statistics',
        description: 'Australian government statistical agency',
        countries: [], // Future implementation
        dataTypes: ['wages', 'employment', 'unemployment'],
        updateFrequency: 'Quarterly',
        source: 'https://www.abs.gov.au/',
      };
    case 'none':
    default:
      return {
        name: 'No Provider',
        description: 'Labor market data not available for this region',
        countries: [],
        dataTypes: [],
        updateFrequency: 'N/A',
        source: '',
      };
  }
}
