/**
 * Industry Benchmarks for Job Search Analytics
 * Data sourced from BLS, recruiting industry research, and verified APIs
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { getLaborMarketSnapshot } from '../../../../services/bls';

/**
 * Application volume benchmarks
 */
export const APPLICATION_BENCHMARKS = {
  // Applications needed for single offer
  APPLICATIONS_FOR_OFFER: { min: 100, max: 200 },

  // Optimal application rate per week
  OPTIMAL_WEEKLY_APPLICATIONS: { min: 10, max: 15 },

  // Median job search duration in weeks
  MEDIAN_SEARCH_WEEKS: 10,

  // Average search duration including long-tail outliers (months)
  AVERAGE_SEARCH_MONTHS: 5,
} as const;

/**
 * Conversion rate benchmarks (as decimals)
 */
export const CONVERSION_BENCHMARKS = {
  // Application to interview rate (3-8%)
  APPLICATION_TO_INTERVIEW: { min: 0.03, max: 0.08 },

  // Interview to offer rate (27-36%)
  INTERVIEW_TO_OFFER: { min: 0.27, max: 0.36 },

  // Offer acceptance rate
  OFFER_ACCEPTANCE: 0.73,

  // Referral effectiveness multiplier
  REFERRAL_MULTIPLIER: 7, // 7x more likely to result in hire

  // Referral interview rate (40% higher than average)
  REFERRAL_INTERVIEW_BOOST: 0.4,
} as const;

/**
 * Response time benchmarks (in days)
 */
export const RESPONSE_TIME_BENCHMARKS = {
  // Job board applications
  JOB_BOARD: { min: 39, max: 55 },

  // Referral applications
  REFERRAL: 29,

  // Company career pages
  CAREER_PAGE: 35,

  // By industry
  BY_INDUSTRY: {
    construction: 13,
    hospitality: 21,
    technology: 24,
    finance: 24,
    healthcare: 49,
    engineering: 62,
    government: 41,
  },

  // Overall average
  OVERALL_AVERAGE: { min: 42, max: 47.5 },
} as const;

/**
 * Seasonal hiring activity scores (1-10 scale)
 */
export const SEASONAL_BENCHMARKS = {
  MONTHLY_SCORES: {
    january: 8,
    february: 10, // Best month
    march: 7,
    april: 6,
    may: 6,
    june: 5,
    july: 3, // Worst months
    august: 3,
    september: 9, // Second peak
    october: 7,
    november: 5,
    december: 4,
  },

  // Response rate improvement in peak months
  PEAK_RESPONSE_BOOST: { min: 0.15, max: 0.25 }, // 15-25% higher

  // Activity decrease in summer months
  SUMMER_ACTIVITY_DROP: { min: 0.4, max: 0.6 }, // 40-60% lower
} as const;

/**
 * Application strategy benchmarks
 */
export const STRATEGY_BENCHMARKS = {
  // Percentage of time that should go to networking vs applying
  NETWORKING_TIME_ALLOCATION: 0.8, // 80% networking, 20% applying

  // Jobs filled without public posting
  HIDDEN_JOB_MARKET: { min: 0.5, max: 0.8 }, // 50-80%

  // Jobs filled through connections
  CONNECTION_FILLED_JOBS: 0.85, // 85%

  // ATS filtering rate (candidates rejected before human review)
  ATS_REJECTION_RATE: 0.75, // 75%

  // Required keyword match rate
  KEYWORD_MATCH_TARGET: { min: 0.65, max: 0.75 }, // 65-75%

  // Generic application rejection speed multiplier
  GENERIC_REJECTION_SPEED: 0.75, // 75% faster rejection
} as const;

/**
 * Success probability calculation
 * Based on current metrics vs benchmarks
 */
export interface SuccessProbabilityFactors {
  applicationVolume: number; // Total applications submitted
  applicationRate: number; // Apps per week
  interviewRate: number; // % of apps that led to interview
  responseRate: number; // % of apps that got any response
  hasReferrals: boolean; // Whether user has any referral applications
  weeksActive: number; // How many weeks actively searching
}

/**
 * Calculate probability of success based on user's metrics
 * Returns a score from 0-1
 */
export function calculateSuccessProbability(factors: SuccessProbabilityFactors): number {
  let score = 0;

  // Volume factor (0-0.3)
  const volumeTarget = APPLICATION_BENCHMARKS.APPLICATIONS_FOR_OFFER.min;
  const volumeProgress = Math.min(factors.applicationVolume / volumeTarget, 1);
  score += volumeProgress * 0.3;

  // Rate factor (0-0.2)
  const optimalRate = APPLICATION_BENCHMARKS.OPTIMAL_WEEKLY_APPLICATIONS.min;
  const rateScore = Math.min(factors.applicationRate / optimalRate, 1);
  score += rateScore * 0.2;

  // Interview conversion factor (0-0.3)
  const minInterviewRate = CONVERSION_BENCHMARKS.APPLICATION_TO_INTERVIEW.min;
  const maxInterviewRate = CONVERSION_BENCHMARKS.APPLICATION_TO_INTERVIEW.max;
  const normalizedInterview = Math.min(
    Math.max((factors.interviewRate - minInterviewRate) / (maxInterviewRate - minInterviewRate), 0),
    1
  );
  score += normalizedInterview * 0.3;

  // Referral bonus (0-0.1)
  if (factors.hasReferrals) {
    score += 0.1;
  }

  // Time factor penalty (0 to -0.1)
  // Longer searches without success reduce probability
  if (factors.weeksActive > APPLICATION_BENCHMARKS.MEDIAN_SEARCH_WEEKS * 2) {
    score -= 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Get seasonal recommendation for current month
 */
export function getSeasonalRecommendation(month: number): {
  score: number;
  message: string;
  action: string;
} {
  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ] as const;

  const monthName = months[month];
  const score = SEASONAL_BENCHMARKS.MONTHLY_SCORES[monthName];

  if (score >= 9) {
    return {
      score,
      message: 'Peak hiring season! Maximize your applications now.',
      action: 'Increase activity to 15-20 applications per week',
    };
  } else if (score >= 7) {
    return {
      score,
      message: 'Strong hiring activity. Good time to apply.',
      action: 'Maintain 10-15 applications per week',
    };
  } else if (score >= 5) {
    return {
      score,
      message: 'Moderate hiring activity. Focus on quality over quantity.',
      action: 'Target 8-12 tailored applications per week',
    };
  } else {
    return {
      score,
      message: 'Slower hiring season. Focus on networking and preparation.',
      action: 'Spend 80% of time networking, maintain 5-8 applications/week',
    };
  }
}

/**
 * Calculate estimated weeks to offer based on current velocity
 */
export function estimateWeeksToOffer(
  currentApplications: number,
  applicationsPerWeek: number,
  currentInterviewRate: number
): number | null {
  if (applicationsPerWeek === 0) return null;

  // Use user's interview rate if available, otherwise use benchmark minimum
  const interviewRate =
    currentInterviewRate > 0
      ? currentInterviewRate
      : CONVERSION_BENCHMARKS.APPLICATION_TO_INTERVIEW.min;

  const interviewToOfferRate = CONVERSION_BENCHMARKS.INTERVIEW_TO_OFFER.min;
  const overallConversion = interviewRate * interviewToOfferRate;

  // Applications needed
  const appsNeeded = 1 / overallConversion;

  // Apps remaining
  const appsRemaining = Math.max(0, appsNeeded - currentApplications);

  // Weeks remaining
  const weeksRemaining = appsRemaining / applicationsPerWeek;

  return Math.ceil(weeksRemaining);
}

/**
 * Get velocity status and recommendation
 */
export function getVelocityStatus(applicationsPerWeek: number): {
  status: 'low' | 'optimal' | 'high';
  color: string;
  message: string;
} {
  const { min, max } = APPLICATION_BENCHMARKS.OPTIMAL_WEEKLY_APPLICATIONS;

  if (applicationsPerWeek < min) {
    return {
      status: 'low',
      color: '#F59E0B',
      message: 'Below optimal velocity. Consider increasing application rate.',
    };
  } else if (applicationsPerWeek <= max) {
    return {
      status: 'optimal',
      color: '#10B981',
      message: "Great velocity! You're in the optimal range.",
    };
  } else {
    return {
      status: 'high',
      color: '#3B82F6',
      message: "High velocity. Ensure quality isn't sacrificed for quantity.",
    };
  }
}

// =============================================================================
// Live BLS Data Integration
// =============================================================================

/**
 * Live labor market benchmarks from BLS
 */
export interface LiveMarketBenchmarks {
  /** Current national unemployment rate */
  unemploymentRate: number;
  /** Year-over-year unemployment change */
  unemploymentTrend: 'up' | 'down' | 'stable';
  /** Total job openings (thousands) */
  jobOpenings: number;
  /** Job openings trend */
  openingsTrend: 'up' | 'down' | 'stable';
  /** Current CPI inflation rate */
  inflationRate: number;
  /** Hiring rate */
  hiringRate: number;
  /** Quits rate (voluntary separations) */
  quitsRate: number;
  /** Market assessment */
  marketCondition: 'hot' | 'warm' | 'cool' | 'cold';
  /** Data freshness */
  dataDate: Date;
  /** Whether this is live or fallback data */
  isLive: boolean;
}

/** Fallback static benchmarks when BLS data unavailable */
export const STATIC_MARKET_BENCHMARKS: LiveMarketBenchmarks = {
  unemploymentRate: 4.2,
  unemploymentTrend: 'stable',
  jobOpenings: 7500,
  openingsTrend: 'stable',
  inflationRate: 3.2,
  hiringRate: 3.8,
  quitsRate: 2.3,
  marketCondition: 'warm',
  dataDate: new Date('2024-01-01'),
  isLive: false,
};

/**
 * Fetch live labor market benchmarks from BLS
 * Falls back to static data if fetch fails
 */
export async function getLiveMarketBenchmarks(): Promise<LiveMarketBenchmarks> {
  try {
    const snapshot = await getLaborMarketSnapshot();

    if (!snapshot.success || !snapshot.data) {
      return STATIC_MARKET_BENCHMARKS;
    }

    const data = snapshot.data;

    // Determine market condition based on metrics
    const marketCondition = determineMarketCondition(
      data.nationalUnemploymentRate,
      data.jobOpenings,
      data.laborForceParticipationRate
    );

    // Determine trends
    const unemploymentTrend = determineTrend(data.unemploymentRateChange);
    const openingsTrend = determineTrend(data.monthlyJobChange);

    return {
      unemploymentRate: data.nationalUnemploymentRate,
      unemploymentTrend,
      jobOpenings: data.jobOpenings,
      openingsTrend,
      inflationRate: data.inflation || STATIC_MARKET_BENCHMARKS.inflationRate,
      hiringRate: STATIC_MARKET_BENCHMARKS.hiringRate, // Not directly available from snapshot
      quitsRate: data.quitsRate || STATIC_MARKET_BENCHMARKS.quitsRate,
      marketCondition,
      dataDate: new Date(),
      isLive: true,
    };
  } catch (error) {
    console.warn('Failed to fetch live market benchmarks, using static fallback:', error);
    return STATIC_MARKET_BENCHMARKS;
  }
}

function determineTrend(change: number | undefined): 'up' | 'down' | 'stable' {
  if (change === undefined || Math.abs(change) < 0.2) return 'stable';
  return change > 0 ? 'up' : 'down';
}

function determineMarketCondition(
  unemploymentRate: number,
  jobOpenings: number,
  hiringRate: number
): 'hot' | 'warm' | 'cool' | 'cold' {
  // Hot: Low unemployment (<4%), high openings (>8M), high hiring (>4%)
  if (unemploymentRate < 4 && jobOpenings > 8000 && hiringRate > 4) {
    return 'hot';
  }
  // Cold: High unemployment (>6%), low openings (<5M)
  if (unemploymentRate > 6 || jobOpenings < 5000) {
    return 'cold';
  }
  // Cool: Elevated unemployment or reduced openings
  if (unemploymentRate > 5 || jobOpenings < 6000) {
    return 'cool';
  }
  // Warm: Everything else (balanced market)
  return 'warm';
}

/**
 * Adjusted conversion benchmarks with numeric values
 */
export interface AdjustedConversionBenchmarks {
  APPLICATION_TO_INTERVIEW: { min: number; max: number };
  INTERVIEW_TO_OFFER: { min: number; max: number };
  OFFER_ACCEPTANCE: number;
  REFERRAL_MULTIPLIER: number;
  REFERRAL_INTERVIEW_BOOST: number;
}

/**
 * Get conversion rate benchmarks adjusted for current market conditions
 */
export function getMarketAdjustedConversionBenchmarks(
  marketCondition: LiveMarketBenchmarks['marketCondition']
): AdjustedConversionBenchmarks {
  const adjustments: Record<typeof marketCondition, number> = {
    hot: 1.2, // 20% better conversion in hot market
    warm: 1.0, // Baseline
    cool: 0.85, // 15% worse in cool market
    cold: 0.7, // 30% worse in cold market
  };

  const multiplier = adjustments[marketCondition];

  return {
    APPLICATION_TO_INTERVIEW: {
      min: CONVERSION_BENCHMARKS.APPLICATION_TO_INTERVIEW.min * multiplier,
      max: CONVERSION_BENCHMARKS.APPLICATION_TO_INTERVIEW.max * multiplier,
    },
    INTERVIEW_TO_OFFER: {
      min: CONVERSION_BENCHMARKS.INTERVIEW_TO_OFFER.min * multiplier,
      max: CONVERSION_BENCHMARKS.INTERVIEW_TO_OFFER.max * multiplier,
    },
    OFFER_ACCEPTANCE: CONVERSION_BENCHMARKS.OFFER_ACCEPTANCE,
    REFERRAL_MULTIPLIER: CONVERSION_BENCHMARKS.REFERRAL_MULTIPLIER,
    REFERRAL_INTERVIEW_BOOST: CONVERSION_BENCHMARKS.REFERRAL_INTERVIEW_BOOST,
  };
}

/**
 * Adjusted response time benchmarks with numeric values
 */
export interface AdjustedResponseTimeBenchmarks {
  JOB_BOARD: { min: number; max: number };
  REFERRAL: number;
  CAREER_PAGE: number;
  BY_INDUSTRY: {
    construction: number;
    hospitality: number;
    technology: number;
    finance: number;
    healthcare: number;
    engineering: number;
    government: number;
  };
  OVERALL_AVERAGE: { min: number; max: number };
}

/**
 * Get response time benchmarks adjusted for current market conditions
 */
export function getMarketAdjustedResponseTimes(
  marketCondition: LiveMarketBenchmarks['marketCondition']
): AdjustedResponseTimeBenchmarks {
  const adjustments: Record<typeof marketCondition, number> = {
    hot: 0.8, // 20% faster responses in hot market
    warm: 1.0, // Baseline
    cool: 1.2, // 20% slower in cool market
    cold: 1.5, // 50% slower in cold market
  };

  const multiplier = adjustments[marketCondition];

  return {
    JOB_BOARD: {
      min: Math.round(RESPONSE_TIME_BENCHMARKS.JOB_BOARD.min * multiplier),
      max: Math.round(RESPONSE_TIME_BENCHMARKS.JOB_BOARD.max * multiplier),
    },
    REFERRAL: Math.round(RESPONSE_TIME_BENCHMARKS.REFERRAL * multiplier),
    CAREER_PAGE: Math.round(RESPONSE_TIME_BENCHMARKS.CAREER_PAGE * multiplier),
    BY_INDUSTRY: {
      construction: Math.round(RESPONSE_TIME_BENCHMARKS.BY_INDUSTRY.construction * multiplier),
      hospitality: Math.round(RESPONSE_TIME_BENCHMARKS.BY_INDUSTRY.hospitality * multiplier),
      technology: Math.round(RESPONSE_TIME_BENCHMARKS.BY_INDUSTRY.technology * multiplier),
      finance: Math.round(RESPONSE_TIME_BENCHMARKS.BY_INDUSTRY.finance * multiplier),
      healthcare: Math.round(RESPONSE_TIME_BENCHMARKS.BY_INDUSTRY.healthcare * multiplier),
      engineering: Math.round(RESPONSE_TIME_BENCHMARKS.BY_INDUSTRY.engineering * multiplier),
      government: Math.round(RESPONSE_TIME_BENCHMARKS.BY_INDUSTRY.government * multiplier),
    },
    OVERALL_AVERAGE: {
      min: RESPONSE_TIME_BENCHMARKS.OVERALL_AVERAGE.min * multiplier,
      max: RESPONSE_TIME_BENCHMARKS.OVERALL_AVERAGE.max * multiplier,
    },
  };
}

/**
 * Calculate success probability with live market data
 */
export async function calculateLiveSuccessProbability(
  factors: SuccessProbabilityFactors
): Promise<{ probability: number; marketAdjustment: number; marketCondition: string }> {
  const benchmarks = await getLiveMarketBenchmarks();
  const baseProbability = calculateSuccessProbability(factors);

  // Adjust based on market conditions
  const marketAdjustments: Record<typeof benchmarks.marketCondition, number> = {
    hot: 0.15, // +15% in hot market
    warm: 0, // No adjustment
    cool: -0.1, // -10% in cool market
    cold: -0.2, // -20% in cold market
  };

  const adjustment = marketAdjustments[benchmarks.marketCondition];
  const adjustedProbability = Math.max(0, Math.min(1, baseProbability + adjustment));

  return {
    probability: adjustedProbability,
    marketAdjustment: adjustment,
    marketCondition: benchmarks.marketCondition,
  };
}
