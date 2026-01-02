/**
 * Bureau of Labor Statistics (BLS) API TypeScript Types
 *
 * Comprehensive type definitions for integrating with BLS API v2.
 * Covers OES (Occupational Employment Statistics), Employment Projections,
 * JOLTS (Job Openings and Labor Turnover Survey), LAU (Local Area Unemployment),
 * and CPI (Consumer Price Index) data.
 *
 * @see https://www.bls.gov/developers/
 * @module bls.types
 */

// =============================================================================
// BLS API Response Types
// =============================================================================

/**
 * Status of the BLS API request
 */
export type BlsRequestStatus = 'REQUEST_SUCCEEDED' | 'REQUEST_FAILED' | 'REQUEST_NOT_PROCESSED';

/**
 * Footnote attached to BLS data points
 */
export interface BlsFootnote {
  /** Footnote code identifier */
  code: string;
  /** Human-readable footnote text */
  text: string;
}

/**
 * Individual data point from BLS time series
 */
export interface BlsDataPoint {
  /** Year of the data point (e.g., "2024") */
  year: string;
  /** Period code (e.g., "M01" for January, "A01" for annual) */
  period: string;
  /** Human-readable period name (e.g., "January", "Annual") */
  periodName: string;
  /** The actual data value as a string (may need parsing) */
  value: string;
  /** Footnotes explaining data caveats or methodology */
  footnotes: BlsFootnote[];
  /** Whether this is the latest available data point */
  latest?: string;
  /** Calculations object (present when calculations=true in request) */
  calculations?: BlsCalculations;
  /** Aspects object for additional metadata */
  aspects?: BlsAspect[];
}

/**
 * Calculations provided by BLS API when requested
 */
export interface BlsCalculations {
  /** Net change from previous period */
  net_changes?: {
    /** 1-month change */
    1?: string;
    /** 3-month change */
    3?: string;
    /** 6-month change */
    6?: string;
    /** 12-month change */
    12?: string;
  };
  /** Percent change from previous period */
  pct_changes?: {
    /** 1-month percent change */
    1?: string;
    /** 3-month percent change */
    3?: string;
    /** 6-month percent change */
    6?: string;
    /** 12-month percent change */
    12?: string;
  };
}

/**
 * Additional aspects/metadata for data points
 */
export interface BlsAspect {
  /** Aspect type identifier */
  type: string;
  /** Aspect name */
  name: string;
  /** Aspect value */
  value: string;
}

/**
 * Individual series data returned from BLS API
 */
export interface BlsSeriesData {
  /** The BLS series ID (e.g., "OEUM000000000000011100003") */
  seriesID: string;
  /** Catalog metadata about the series (when catalog=true in request) */
  catalog?: BlsSeriesCatalog;
  /** Array of data points for this series */
  data: BlsDataPoint[];
}

/**
 * Catalog information for a BLS series
 */
export interface BlsSeriesCatalog {
  /** Human-readable series title */
  series_title?: string;
  /** BLS series ID */
  series_id?: string;
  /** Seasonality indicator */
  seasonality?: string;
  /** Survey name */
  survey_name?: string;
  /** Survey abbreviation */
  survey_abbreviation?: string;
  /** Area name */
  area_name?: string;
  /** Area code */
  area_code?: string;
  /** Industry title */
  industry_title?: string;
  /** Industry code */
  industry_code?: string;
  /** Occupation title */
  occupation_title?: string;
  /** Occupation code (SOC) */
  occupation_code?: string;
  /** Data type text */
  datatype_text?: string;
  /** Data type code */
  datatype_code?: string;
}

/**
 * Message from BLS API (errors, warnings, info)
 */
export interface BlsMessage {
  /** Message content */
  message: string;
}

/**
 * Complete response structure from BLS API v2
 */
export interface BlsApiResponse {
  /** Status of the request */
  status: BlsRequestStatus;
  /** HTTP-like response code */
  responseTime: number;
  /** Messages from the API (errors, warnings, info) */
  message: BlsMessage[];
  /** Results object containing series data */
  Results: {
    /** Array of series data */
    series: BlsSeriesData[];
  };
}

/**
 * BLS API v2 request parameters
 */
export interface BlsApiRequest {
  /** Array of series IDs to fetch (max 50 for registered users) */
  seriesid: string[];
  /** Start year for data range */
  startyear: string;
  /** End year for data range */
  endyear: string;
  /** Whether to include catalog metadata */
  catalog?: boolean;
  /** Whether to include calculations (net/percent changes) */
  calculations?: boolean;
  /** Whether to include annual averages */
  annualaverage?: boolean;
  /** Whether to include aspect data */
  aspects?: boolean;
  /** BLS API registration key (required for higher rate limits) */
  registrationkey?: string;
}

// =============================================================================
// Occupational Employment Statistics (OES) Types
// =============================================================================

/**
 * OES wage data including all percentile breakdowns
 * Values are typically annual wages unless hourly is specified
 */
export interface OesWageData {
  /** SOC (Standard Occupational Classification) code */
  socCode: string;
  /** Occupation title */
  occupationTitle: string;
  /** Geographic area code */
  areaCode: string;
  /** Geographic area name */
  areaName: string;
  /** Reference period (e.g., "May 2023") */
  period: string;
  /** Annual wages at various percentiles */
  annual: {
    /** 10th percentile annual wage */
    percentile10: number | null;
    /** 25th percentile annual wage */
    percentile25: number | null;
    /** Median (50th percentile) annual wage */
    median: number | null;
    /** 75th percentile annual wage */
    percentile75: number | null;
    /** 90th percentile annual wage */
    percentile90: number | null;
    /** Mean (average) annual wage */
    mean: number | null;
  };
  /** Hourly wages at various percentiles */
  hourly: {
    /** 10th percentile hourly wage */
    percentile10: number | null;
    /** 25th percentile hourly wage */
    percentile25: number | null;
    /** Median (50th percentile) hourly wage */
    median: number | null;
    /** 75th percentile hourly wage */
    percentile75: number | null;
    /** 90th percentile hourly wage */
    percentile90: number | null;
    /** Mean (average) hourly wage */
    mean: number | null;
  };
  /** Whether wage data is estimated (vs. observed) */
  isEstimated: boolean;
  /** Relative standard error (data quality indicator) */
  relativeStandardError?: number;
}

/**
 * OES employment level data for an occupation
 */
export interface OesEmploymentData {
  /** SOC code */
  socCode: string;
  /** Occupation title */
  occupationTitle: string;
  /** Geographic area code */
  areaCode: string;
  /** Geographic area name */
  areaName: string;
  /** Reference period */
  period: string;
  /** Total employment count */
  employment: number | null;
  /** Employment per 1,000 jobs in the area */
  employmentPer1000Jobs: number | null;
  /** Location quotient (concentration relative to national average) */
  locationQuotient: number | null;
  /** Relative standard error */
  relativeStandardError?: number;
}

/**
 * Complete OES data combining wages and employment
 */
export interface OesOccupationData extends OesWageData {
  /** Employment statistics */
  employment: OesEmploymentData;
}

/**
 * OES data type codes for series ID construction
 */
export type OesDataTypeCode =
  | '01' // Employment
  | '02' // Employment percent relative standard error
  | '03' // Hourly mean wage
  | '04' // Annual mean wage
  | '05' // Wage percent relative standard error
  | '06' // Hourly 10th percentile wage
  | '07' // Hourly 25th percentile wage
  | '08' // Hourly median wage
  | '09' // Hourly 75th percentile wage
  | '10' // Hourly 90th percentile wage
  | '11' // Annual 10th percentile wage
  | '12' // Annual 25th percentile wage
  | '13' // Annual median wage
  | '14' // Annual 75th percentile wage
  | '15' // Annual 90th percentile wage
  | '16' // Employment per 1,000 jobs
  | '17'; // Location quotient

// =============================================================================
// Employment Projections Types
// =============================================================================

/**
 * Qualitative outlook assessment for occupation
 */
export type ProjectionOutlook = 'excellent' | 'good' | 'fair' | 'limited' | 'declining';

/**
 * Education level typically required for entry
 */
export type EducationLevel =
  | 'no_formal_credential'
  | 'high_school_diploma'
  | 'some_college'
  | 'postsecondary_nondegree'
  | 'associate_degree'
  | 'bachelor_degree'
  | 'master_degree'
  | 'doctoral_professional_degree';

/**
 * Work experience typically required
 */
export type WorkExperience = 'none' | 'less_than_5_years' | '5_years_or_more';

/**
 * On-the-job training typically required
 */
export type OnTheJobTraining =
  | 'none'
  | 'short_term'
  | 'moderate_term'
  | 'long_term'
  | 'apprenticeship'
  | 'internship_residency';

/**
 * 10-year employment projections for an occupation
 */
export interface EmploymentProjection {
  /** SOC code */
  socCode: string;
  /** Occupation title */
  occupationTitle: string;
  /** Base year of projection (e.g., 2022) */
  baseYear: number;
  /** Target year of projection (e.g., 2032) */
  projectedYear: number;
  /** Employment in base year (thousands) */
  baseYearEmployment: number;
  /** Projected employment in target year (thousands) */
  projectedYearEmployment: number;
  /** Numeric change in employment (thousands) */
  employmentChange: number;
  /** Percent change in employment */
  employmentChangePercent: number;
  /** Average annual job openings (thousands) */
  annualOpenings: number;
  /** Job openings from growth */
  openingsFromGrowth: number;
  /** Job openings from replacement needs */
  openingsFromReplacement: number;
  /** Median annual wage (for reference) */
  medianAnnualWage: number | null;
  /** Typical education needed for entry */
  typicalEducation: EducationLevel;
  /** Work experience in a related occupation */
  workExperience: WorkExperience;
  /** Typical on-the-job training */
  onTheJobTraining: OnTheJobTraining;
  /** Qualitative outlook assessment */
  outlook: ProjectionOutlook;
  /** Factors affecting job prospects */
  outlookFactors?: string[];
}

/**
 * Industry employment projections
 */
export interface IndustryProjection {
  /** NAICS industry code */
  naicsCode: string;
  /** Industry title */
  industryTitle: string;
  /** Base year employment (thousands) */
  baseYearEmployment: number;
  /** Projected year employment (thousands) */
  projectedYearEmployment: number;
  /** Employment change (thousands) */
  employmentChange: number;
  /** Employment change percent */
  employmentChangePercent: number;
  /** Annual compound growth rate */
  annualGrowthRate: number;
}

// =============================================================================
// JOLTS (Job Openings and Labor Turnover Survey) Types
// =============================================================================

/**
 * JOLTS data element types
 */
export type JoltsDataElement =
  | 'JO' // Job Openings
  | 'JOR' // Job Openings Rate
  | 'HI' // Hires
  | 'HIR' // Hires Rate
  | 'TS' // Total Separations
  | 'TSR' // Total Separations Rate
  | 'QU' // Quits
  | 'QUR' // Quits Rate
  | 'LD' // Layoffs and Discharges
  | 'LDR' // Layoffs and Discharges Rate
  | 'OS'; // Other Separations

/**
 * JOLTS rate type indicator
 */
export type JoltsRateType = 'L' | 'R'; // L = Level (count), R = Rate (percent)

/**
 * JOLTS data for a specific period
 */
export interface JoltsData {
  /** Reference period (e.g., "2024-01") */
  period: string;
  /** Year */
  year: number;
  /** Month (1-12) */
  month: number;
  /** Industry code (NAICS-based) */
  industryCode: string;
  /** Industry name */
  industryName: string;
  /** Geographic region */
  region: JoltsRegion;
  /** Job openings count (thousands) */
  jobOpenings: number | null;
  /** Job openings rate (percent) */
  jobOpeningsRate: number | null;
  /** Hires count (thousands) */
  hires: number | null;
  /** Hires rate (percent) */
  hiresRate: number | null;
  /** Total separations count (thousands) */
  totalSeparations: number | null;
  /** Total separations rate (percent) */
  totalSeparationsRate: number | null;
  /** Quits count (thousands) */
  quits: number | null;
  /** Quits rate (percent) */
  quitsRate: number | null;
  /** Layoffs and discharges count (thousands) */
  layoffsDischarges: number | null;
  /** Layoffs and discharges rate (percent) */
  layoffsDischargesRate: number | null;
  /** Other separations count (thousands) */
  otherSeparations: number | null;
  /** Seasonally adjusted indicator */
  seasonallyAdjusted: boolean;
}

/**
 * JOLTS geographic regions
 */
export type JoltsRegion = 'total_us' | 'northeast' | 'south' | 'midwest' | 'west';

/**
 * JOLTS data broken down by industry
 */
export interface JoltsIndustryData {
  /** Reference period */
  period: string;
  /** Array of industry-specific JOLTS data */
  industries: JoltsIndustryEntry[];
}

/**
 * Single industry entry in JOLTS data
 */
export interface JoltsIndustryEntry {
  /** NAICS-based industry code */
  industryCode: string;
  /** Industry name */
  industryName: string;
  /** Job openings (thousands) */
  jobOpenings: number | null;
  /** Job openings rate */
  jobOpeningsRate: number | null;
  /** Hires (thousands) */
  hires: number | null;
  /** Hires rate */
  hiresRate: number | null;
  /** Quits (thousands) */
  quits: number | null;
  /** Quits rate */
  quitsRate: number | null;
}

/**
 * JOLTS trend analysis
 */
export interface JoltsTrend {
  /** Metric being trended */
  metric: 'jobOpenings' | 'hires' | 'quits' | 'separations';
  /** Starting period */
  startPeriod: string;
  /** Ending period */
  endPeriod: string;
  /** Starting value */
  startValue: number;
  /** Ending value */
  endValue: number;
  /** Percent change over period */
  percentChange: number;
  /** Trend direction */
  direction: 'increasing' | 'decreasing' | 'stable';
}

// =============================================================================
// LAU (Local Area Unemployment) Types
// =============================================================================

/**
 * Unemployment data for a geographic area
 */
export interface UnemploymentData {
  /** Geographic area code (FIPS-based) */
  areaCode: string;
  /** Geographic area name */
  areaName: string;
  /** Geographic level */
  geographicLevel: GeographicLevel;
  /** Reference period */
  period: string;
  /** Year */
  year: number;
  /** Month (1-12, or null for annual) */
  month: number | null;
  /** Unemployment rate (percent) */
  unemploymentRate: number;
  /** Total civilian labor force */
  laborForce: number;
  /** Number employed */
  employed: number;
  /** Number unemployed */
  unemployed: number;
  /** Seasonally adjusted indicator */
  seasonallyAdjusted: boolean;
}

/**
 * LAU measure codes
 */
export type LauMeasureCode =
  | '03' // Unemployment rate
  | '04' // Unemployment
  | '05' // Employment
  | '06'; // Labor force

/**
 * Local area unemployment data with additional context
 */
export interface LocalAreaData extends UnemploymentData {
  /** Comparison to national rate */
  comparisonToNational: {
    /** Difference from national rate (percentage points) */
    rateDifference: number;
    /** Whether area is above/below national average */
    relativeTo: 'above' | 'below' | 'equal';
  };
  /** Year-over-year change */
  yearOverYearChange?: {
    /** Change in unemployment rate (percentage points) */
    rateChange: number;
    /** Direction of change */
    direction: 'improving' | 'worsening' | 'stable';
  };
}

/**
 * State-level unemployment summary
 */
export interface StateUnemploymentSummary {
  /** State FIPS code */
  stateCode: StateFipsCode;
  /** State name */
  stateName: string;
  /** Current unemployment rate */
  currentRate: number;
  /** National rank (1 = lowest unemployment) */
  nationalRank: number;
  /** 12-month trend */
  trend: 'improving' | 'worsening' | 'stable';
}

// =============================================================================
// CPI (Consumer Price Index) Types
// =============================================================================

/**
 * CPI data for a specific period
 */
export interface CpiData {
  /** Reference period (e.g., "2024-01") */
  period: string;
  /** Year */
  year: number;
  /** Month (1-12) */
  month: number;
  /** CPI item code */
  itemCode: string;
  /** Item description */
  itemDescription: string;
  /** Geographic area */
  area: CpiArea;
  /** Index value (base period = 100) */
  indexValue: number;
  /** 1-month percent change */
  percentChange1Month: number | null;
  /** 12-month percent change (year-over-year) */
  percentChange12Month: number | null;
  /** Whether seasonally adjusted */
  seasonallyAdjusted: boolean;
}

/**
 * CPI geographic areas
 */
export type CpiArea = 'U.S. city average' | 'Northeast' | 'Midwest' | 'South' | 'West' | string; // Specific MSAs

/**
 * CPI base periods
 */
export type CpiBasePeriod = '1982-84=100' | '1967=100' | 'December 1997=100' | 'December 2007=100';

/**
 * Inflation adjustment calculation
 */
export interface InflationAdjustment {
  /** Original dollar amount */
  originalAmount: number;
  /** Year of original amount */
  originalYear: number;
  /** Target year for adjustment */
  targetYear: number;
  /** Adjusted dollar amount */
  adjustedAmount: number;
  /** CPI index for original year */
  originalYearCpi: number;
  /** CPI index for target year */
  targetYearCpi: number;
  /** Total inflation over period (percent) */
  totalInflation: number;
  /** Average annual inflation rate */
  averageAnnualInflation: number;
}

/**
 * CPI item categories for series selection
 */
export type CpiItemCategory =
  | 'all_items' // SA0
  | 'food' // SAF
  | 'food_at_home' // SAF11
  | 'food_away_from_home' // SAFR
  | 'energy' // SA0E
  | 'all_items_less_food_energy' // SA0L1E (core CPI)
  | 'shelter' // SAH1
  | 'medical_care' // SAM
  | 'transportation' // SAT
  | 'apparel' // SAA
  | 'education'; // SAE

// =============================================================================
// Geographic Types
// =============================================================================

/**
 * Geographic hierarchy levels
 */
export type GeographicLevel = 'national' | 'state' | 'msa' | 'county' | 'division' | 'region';

/**
 * FIPS state codes with state names
 */
export type StateFipsCode =
  | '01' // Alabama
  | '02' // Alaska
  | '04' // Arizona
  | '05' // Arkansas
  | '06' // California
  | '08' // Colorado
  | '09' // Connecticut
  | '10' // Delaware
  | '11' // District of Columbia
  | '12' // Florida
  | '13' // Georgia
  | '15' // Hawaii
  | '16' // Idaho
  | '17' // Illinois
  | '18' // Indiana
  | '19' // Iowa
  | '20' // Kansas
  | '21' // Kentucky
  | '22' // Louisiana
  | '23' // Maine
  | '24' // Maryland
  | '25' // Massachusetts
  | '26' // Michigan
  | '27' // Minnesota
  | '28' // Mississippi
  | '29' // Missouri
  | '30' // Montana
  | '31' // Nebraska
  | '32' // Nevada
  | '33' // New Hampshire
  | '34' // New Jersey
  | '35' // New Mexico
  | '36' // New York
  | '37' // North Carolina
  | '38' // North Dakota
  | '39' // Ohio
  | '40' // Oklahoma
  | '41' // Oregon
  | '42' // Pennsylvania
  | '44' // Rhode Island
  | '45' // South Carolina
  | '46' // South Dakota
  | '47' // Tennessee
  | '48' // Texas
  | '49' // Utah
  | '50' // Vermont
  | '51' // Virginia
  | '53' // Washington
  | '54' // West Virginia
  | '55' // Wisconsin
  | '56' // Wyoming
  | '72'; // Puerto Rico

/**
 * State information with FIPS code
 */
export interface StateInfo {
  /** FIPS state code */
  fipsCode: StateFipsCode;
  /** State name */
  name: string;
  /** State abbreviation */
  abbreviation: string;
  /** Census region */
  region: CensusRegion;
  /** Census division */
  division: CensusDivision;
}

/**
 * Census regions
 */
export type CensusRegion = 'Northeast' | 'Midwest' | 'South' | 'West';

/**
 * Census divisions
 */
export type CensusDivision =
  | 'New England'
  | 'Middle Atlantic'
  | 'East North Central'
  | 'West North Central'
  | 'South Atlantic'
  | 'East South Central'
  | 'West South Central'
  | 'Mountain'
  | 'Pacific';

/**
 * Metropolitan Statistical Area (MSA) code
 * Format: 5-digit CBSA (Core Based Statistical Area) code
 */
export type MsaCode = string;

/**
 * MSA information
 */
export interface MsaInfo {
  /** CBSA code */
  code: MsaCode;
  /** MSA title (e.g., "New York-Newark-Jersey City, NY-NJ-PA") */
  title: string;
  /** Primary state */
  primaryState: StateFipsCode;
  /** All states the MSA spans */
  states: StateFipsCode[];
  /** Metropolitan or Micropolitan designation */
  type: 'metropolitan' | 'micropolitan';
  /** Population (from most recent census) */
  population?: number;
}

/**
 * County FIPS code (state + county)
 */
export type CountyFipsCode = string; // 5-digit: 2-digit state + 3-digit county

/**
 * Union type for all geographic area codes
 */
export type AreaCode =
  | { type: 'national'; code: '0000000' }
  | { type: 'state'; code: StateFipsCode }
  | { type: 'msa'; code: MsaCode }
  | { type: 'county'; code: CountyFipsCode };

/**
 * Simple area code string (for BLS series IDs)
 */
export type AreaCodeString = string;

// =============================================================================
// Cached Data Types
// =============================================================================

/**
 * Generic wrapper for cached BLS data
 */
export interface CachedBlsData<T> {
  /** The cached data payload */
  data: T;
  /** ISO timestamp when data was fetched */
  fetchedAt: string;
  /** ISO timestamp when cache expires */
  expiresAt: string;
  /** BLS series ID(s) used to fetch this data */
  seriesIds: string[];
  /** Whether this data is stale (past expiry but still usable) */
  isStale: boolean;
  /** Cache key used for storage */
  cacheKey: BlsCacheKey;
  /** Data version for cache invalidation */
  version: number;
}

/**
 * Cache key patterns for different BLS data types
 */
export type BlsCacheKey =
  | `oes:${string}:${string}` // oes:{socCode}:{areaCode}
  | `projection:${string}` // projection:{socCode}
  | `jolts:${string}:${string}` // jolts:{industryCode}:{period}
  | `lau:${string}:${string}` // lau:{areaCode}:{period}
  | `cpi:${string}:${string}` // cpi:{itemCode}:{period}
  | `market:${string}:${string}` // market:{socCode}:{areaCode} (composite)
  | string; // Fallback for custom keys

/**
 * Cache configuration options
 */
export interface BlsCacheConfig {
  /** Time-to-live in milliseconds */
  ttlMs: number;
  /** Whether to serve stale data while revalidating */
  staleWhileRevalidate: boolean;
  /** Maximum age of stale data to serve (ms) */
  maxStaleMs: number;
  /** Storage backend */
  storage: 'memory' | 'localStorage' | 'indexedDB';
}

/**
 * Default TTL values for different data types (in milliseconds)
 */
export const BLS_CACHE_TTL = {
  /** OES data updates annually (cache for 30 days) */
  OES: 30 * 24 * 60 * 60 * 1000,
  /** Projections update every 2 years (cache for 90 days) */
  PROJECTIONS: 90 * 24 * 60 * 60 * 1000,
  /** JOLTS updates monthly (cache for 7 days) */
  JOLTS: 7 * 24 * 60 * 60 * 1000,
  /** LAU updates monthly (cache for 7 days) */
  LAU: 7 * 24 * 60 * 60 * 1000,
  /** CPI updates monthly (cache for 7 days) */
  CPI: 7 * 24 * 60 * 60 * 1000,
} as const;

// =============================================================================
// Composite/High-Level Types
// =============================================================================

/**
 * Combined market data for an occupation
 */
export interface OccupationMarketData {
  /** SOC code */
  socCode: string;
  /** Occupation title */
  occupationTitle: string;
  /** SOC occupation group/family */
  occupationGroup: string;
  /** OES wage data (national or regional) */
  wages: OesWageData;
  /** OES employment data */
  employment: OesEmploymentData;
  /** 10-year employment projections */
  projection: EmploymentProjection | null;
  /** Regional wage comparisons */
  regionalWages?: OesWageData[];
  /** Top-paying states for this occupation */
  topPayingStates?: Array<{
    state: StateInfo;
    medianWage: number;
    employment: number;
  }>;
  /** Top employing states for this occupation */
  topEmployingStates?: Array<{
    state: StateInfo;
    employment: number;
    locationQuotient: number;
  }>;
  /** Related occupations */
  relatedOccupations?: Array<{
    socCode: string;
    title: string;
    medianWage: number;
    similarity: number;
  }>;
  /** Data freshness information */
  dataAsOf: string;
}

/**
 * High-level snapshot of labor market conditions
 */
export interface LaborMarketSnapshot {
  /** Reference period */
  period: string;
  /** National unemployment rate */
  nationalUnemploymentRate: number;
  /** Change from previous month (percentage points) */
  unemploymentRateChange: number;
  /** Total nonfarm payroll employment (thousands) */
  totalEmployment: number;
  /** Monthly job gains/losses (thousands) */
  monthlyJobChange: number;
  /** Labor force participation rate */
  laborForceParticipationRate: number;
  /** JOLTS job openings (thousands) */
  jobOpenings: number;
  /** JOLTS quits rate */
  quitsRate: number;
  /** CPI year-over-year inflation */
  inflation: number;
  /** Overall market assessment */
  marketCondition: 'strong' | 'moderate' | 'weak' | 'uncertain';
  /** Key trends and observations */
  highlights: string[];
}

/**
 * Comparison of wages/employment across regions
 */
export interface RegionalComparison {
  /** SOC code being compared */
  socCode: string;
  /** Occupation title */
  occupationTitle: string;
  /** Base region for comparison */
  baseRegion: {
    areaCode: string;
    areaName: string;
    medianWage: number;
    employment: number;
  };
  /** Comparison regions */
  comparisons: Array<{
    areaCode: string;
    areaName: string;
    medianWage: number;
    /** Wage difference from base (dollars) */
    wageDifference: number;
    /** Wage difference percent */
    wageDifferencePercent: number;
    employment: number;
    /** Cost of living adjustment factor (if available) */
    costOfLivingAdjustment?: number;
    /** Adjusted wage accounting for COL */
    adjustedWage?: number;
  }>;
  /** National averages for context */
  nationalAverage: {
    medianWage: number;
    totalEmployment: number;
  };
}

/**
 * User-facing career outlook assessment
 */
export interface CareerOutlook {
  /** SOC code */
  socCode: string;
  /** Occupation title */
  occupationTitle: string;
  /** Overall outlook rating */
  overallOutlook: ProjectionOutlook;
  /** Outlook score (0-100) */
  outlookScore: number;
  /** Salary assessment */
  salary: {
    /** Entry-level salary estimate */
    entryLevel: number;
    /** Mid-career salary estimate */
    midCareer: number;
    /** Experienced salary estimate */
    experienced: number;
    /** How this compares to similar occupations */
    comparison: 'above_average' | 'average' | 'below_average';
  };
  /** Job availability assessment */
  jobAvailability: {
    /** Current openings estimate */
    currentOpenings: 'high' | 'moderate' | 'low';
    /** Projected growth */
    projectedGrowth: 'rapid' | 'faster_than_average' | 'average' | 'slower' | 'declining';
    /** Annual openings */
    annualOpenings: number;
    /** Competition level */
    competition: 'high' | 'moderate' | 'low';
  };
  /** Requirements summary */
  requirements: {
    education: EducationLevel;
    experience: WorkExperience;
    training: OnTheJobTraining;
    /** Common certifications or licenses */
    commonCredentials?: string[];
  };
  /** Geographic hotspots */
  topLocations: Array<{
    areaName: string;
    areaCode: string;
    reason: 'high_wages' | 'high_employment' | 'high_growth' | 'high_concentration';
  }>;
  /** Key factors affecting outlook */
  outlookFactors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }>;
  /** Related occupations to consider */
  alternatives: Array<{
    socCode: string;
    title: string;
    outlookScore: number;
    medianWage: number;
    transitionDifficulty: 'easy' | 'moderate' | 'difficult';
  }>;
  /** When this assessment was generated */
  assessmentDate: string;
}

// =============================================================================
// Series ID Builder Types
// =============================================================================

/**
 * BLS survey/program prefixes
 */
export type BlsSurveyPrefix =
  | 'OE' // Occupational Employment Statistics
  | 'EP' // Employment Projections
  | 'JT' // JOLTS
  | 'LA' // Local Area Unemployment
  | 'CU' // CPI - All Urban Consumers
  | 'CW' // CPI - Urban Wage Earners
  | 'CE' // Current Employment Statistics
  | 'EN'; // Employment Cost Index

/**
 * Data type enum for series selection
 */
export enum BlsDataType {
  // OES data types
  OES_EMPLOYMENT = 'OES_EMPLOYMENT',
  OES_HOURLY_MEAN_WAGE = 'OES_HOURLY_MEAN_WAGE',
  OES_ANNUAL_MEAN_WAGE = 'OES_ANNUAL_MEAN_WAGE',
  OES_HOURLY_MEDIAN_WAGE = 'OES_HOURLY_MEDIAN_WAGE',
  OES_ANNUAL_MEDIAN_WAGE = 'OES_ANNUAL_MEDIAN_WAGE',
  OES_HOURLY_10PCT_WAGE = 'OES_HOURLY_10PCT_WAGE',
  OES_HOURLY_25PCT_WAGE = 'OES_HOURLY_25PCT_WAGE',
  OES_HOURLY_75PCT_WAGE = 'OES_HOURLY_75PCT_WAGE',
  OES_HOURLY_90PCT_WAGE = 'OES_HOURLY_90PCT_WAGE',
  OES_ANNUAL_10PCT_WAGE = 'OES_ANNUAL_10PCT_WAGE',
  OES_ANNUAL_25PCT_WAGE = 'OES_ANNUAL_25PCT_WAGE',
  OES_ANNUAL_75PCT_WAGE = 'OES_ANNUAL_75PCT_WAGE',
  OES_ANNUAL_90PCT_WAGE = 'OES_ANNUAL_90PCT_WAGE',
  OES_LOCATION_QUOTIENT = 'OES_LOCATION_QUOTIENT',

  // JOLTS data types
  JOLTS_JOB_OPENINGS = 'JOLTS_JOB_OPENINGS',
  JOLTS_JOB_OPENINGS_RATE = 'JOLTS_JOB_OPENINGS_RATE',
  JOLTS_HIRES = 'JOLTS_HIRES',
  JOLTS_HIRES_RATE = 'JOLTS_HIRES_RATE',
  JOLTS_QUITS = 'JOLTS_QUITS',
  JOLTS_QUITS_RATE = 'JOLTS_QUITS_RATE',
  JOLTS_SEPARATIONS = 'JOLTS_SEPARATIONS',
  JOLTS_SEPARATIONS_RATE = 'JOLTS_SEPARATIONS_RATE',

  // LAU data types
  LAU_UNEMPLOYMENT_RATE = 'LAU_UNEMPLOYMENT_RATE',
  LAU_UNEMPLOYMENT = 'LAU_UNEMPLOYMENT',
  LAU_EMPLOYMENT = 'LAU_EMPLOYMENT',
  LAU_LABOR_FORCE = 'LAU_LABOR_FORCE',

  // CPI data types
  CPI_ALL_ITEMS = 'CPI_ALL_ITEMS',
  CPI_CORE = 'CPI_CORE',
  CPI_FOOD = 'CPI_FOOD',
  CPI_ENERGY = 'CPI_ENERGY',
  CPI_SHELTER = 'CPI_SHELTER',
}

/**
 * Components needed to construct an OES series ID
 */
export interface OesSeriesIdComponents {
  /** Survey prefix (always 'OE' for OES) */
  surveyPrefix: 'OE';
  /** Seasonal adjustment code (U = unadjusted) */
  seasonalAdjustment: 'U';
  /** Area type code */
  areaType: OesAreaType;
  /** Area code */
  areaCode: string;
  /** Industry code (6 digits, use 000000 for cross-industry) */
  industryCode: string;
  /** Occupation code (6-digit SOC) */
  occupationCode: string;
  /** Data type code */
  dataType: OesDataTypeCode;
}

/**
 * OES area type codes
 */
export type OesAreaType =
  | 'N' // National
  | 'S' // State
  | 'M'; // Metropolitan area

/**
 * Components needed to construct a JOLTS series ID
 */
export interface JoltsSeriesIdComponents {
  /** Survey prefix (always 'JT' for JOLTS) */
  surveyPrefix: 'JT';
  /** Seasonal adjustment (S = seasonally adjusted, U = unadjusted) */
  seasonalAdjustment: 'S' | 'U';
  /** Industry code */
  industryCode: string;
  /** Region code */
  regionCode: JoltsRegionCode;
  /** Data element */
  dataElement: JoltsDataElement;
  /** Rate or level */
  rateLevel: JoltsRateType;
}

/**
 * JOLTS region codes
 */
export type JoltsRegionCode =
  | '00' // Total US
  | '10' // Northeast
  | '20' // South
  | '30' // Midwest
  | '40'; // West

/**
 * Components needed to construct a LAU series ID
 */
export interface LauSeriesIdComponents {
  /** Survey prefix (always 'LA' for LAU) */
  surveyPrefix: 'LA';
  /** Seasonal adjustment (S = seasonally adjusted, U = unadjusted) */
  seasonalAdjustment: 'S' | 'U';
  /** Area type code */
  areaType: LauAreaType;
  /** Area code (FIPS) */
  areaCode: string;
  /** Measure code */
  measureCode: LauMeasureCode;
}

/**
 * LAU area type codes
 */
export type LauAreaType =
  | 'ST' // State
  | 'MT' // Metropolitan area
  | 'CT' // County
  | 'CS' // City
  | 'CN'; // Census region/division

/**
 * Components needed to construct a CPI series ID
 */
export interface CpiSeriesIdComponents {
  /** Survey prefix ('CU' for all urban consumers, 'CW' for wage earners) */
  surveyPrefix: 'CU' | 'CW';
  /** Seasonal adjustment (S = seasonally adjusted, U = unadjusted) */
  seasonalAdjustment: 'S' | 'U';
  /** Periodicity (R = monthly, S = semi-annual) */
  periodicity: 'R' | 'S';
  /** Area code */
  areaCode: CpiAreaCode;
  /** Item code */
  itemCode: string;
}

/**
 * CPI area codes
 */
export type CpiAreaCode =
  | '0000' // U.S. city average
  | '0100' // Northeast urban
  | '0200' // Midwest urban
  | '0300' // South urban
  | '0400' // West urban
  | string; // Specific MSAs

/**
 * Union type for all series ID components
 */
export type SeriesIdComponents =
  | OesSeriesIdComponents
  | JoltsSeriesIdComponents
  | LauSeriesIdComponents
  | CpiSeriesIdComponents;

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Result type for BLS API operations
 */
export type BlsResult<T> =
  | { success: true; data: T; warnings?: string[] }
  | { success: false; error: BlsError };

/**
 * BLS API error information
 */
export interface BlsError {
  /** Error code */
  code: BlsErrorCode;
  /** Human-readable error message */
  message: string;
  /** Original BLS API messages if available */
  apiMessages?: string[];
  /** Series IDs that failed */
  failedSeries?: string[];
}

/**
 * BLS error codes
 */
export type BlsErrorCode =
  | 'INVALID_SERIES_ID'
  | 'SERIES_NOT_FOUND'
  | 'NO_DATA_AVAILABLE'
  | 'RATE_LIMITED'
  | 'INVALID_DATE_RANGE'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'CACHE_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Time range for data queries
 */
export interface BlsTimeRange {
  /** Start year (YYYY format) */
  startYear: number;
  /** End year (YYYY format) */
  endYear: number;
}

/**
 * Pagination info for large result sets
 */
export interface BlsPagination {
  /** Total number of items */
  total: number;
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  perPage: number;
  /** Total pages */
  totalPages: number;
  /** Whether there are more pages */
  hasMore: boolean;
}

/**
 * Sort options for list queries
 */
export interface BlsSortOptions {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Filter options for queries
 */
export interface BlsFilterOptions {
  /** Geographic filter */
  geography?: {
    level?: GeographicLevel;
    codes?: string[];
  };
  /** Time period filter */
  period?: BlsTimeRange;
  /** Occupation filter (SOC codes) */
  occupations?: string[];
  /** Industry filter (NAICS codes) */
  industries?: string[];
  /** Minimum wage threshold */
  minWage?: number;
  /** Maximum wage threshold */
  maxWage?: number;
  /** Minimum employment threshold */
  minEmployment?: number;
}
