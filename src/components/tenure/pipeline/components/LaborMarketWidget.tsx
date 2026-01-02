/**
 * LaborMarketWidget - Labor market intelligence panel for the Dashboard
 *
 * Displays current job market conditions, user's target occupation data,
 * and regional insights based on user preferences.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createResource, Show, For, createMemo, onMount } from 'solid-js';
import { FluidCard, Tooltip, StatTooltipContent } from '../ui';
import { liquidTenure, pipelineAnimations } from '../theme/liquid-tenure';
import { pipelineStore } from '../store';
import {
  FireIcon,
  SunIcon,
  SnowflakeIcon,
  TrendUpIcon,
  TrendDownIcon,
  ArrowRightIcon,
} from 'solid-phosphor/bold';
import {
  getLaborMarketSnapshot,
  compareRegionalWages,
  getCareerOutlook,
  clearBlsCache,
} from '../../../../services/bls';
import { buildStateAreaCode } from '../../../../data/geographic-codes';
import type {
  LaborMarketSnapshot,
  CareerOutlook,
  RegionalComparison,
  ProjectionOutlook,
} from '../../../../types/bls.types';
import { isV2FeatureEnabled } from '../../../../lib/feature-gates';

interface LaborMarketWidgetProps {
  currentTheme: () => typeof liquidTenure;
  compact?: boolean;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

interface ApiError {
  code?: string;
  message: string;
  details?: string;
  timestamp: Date;
}

// =============================================================================
// DEBUG MODE
// =============================================================================

/**
 * Check if debug mode is enabled via localStorage
 * Enable by setting: localStorage.setItem('taco_debug_labor_market', 'true')
 */
const isDebugMode = (): boolean => {
  try {
    return localStorage.getItem('taco_debug_labor_market') === 'true';
  } catch {
    return false;
  }
};

/**
 * Debug logger with [LaborMarket] prefix
 */
const debugLog = (message: string, data?: unknown): void => {
  if (isDebugMode()) {
    if (data !== undefined) {
      console.log(`[LaborMarket] ${message}`, data);
    } else {
      console.log(`[LaborMarket] ${message}`);
    }
  }
};

// =============================================================================
// OUTLOOK BADGE COLORS
// =============================================================================

const outlookColors: Record<ProjectionOutlook, { bg: string; border: string; text: string }> = {
  excellent: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#10B981' },
  good: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#3B82F6' },
  fair: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#F59E0B' },
  limited: { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.3)', text: '#F97316' },
  declining: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#EF4444' },
};

// =============================================================================
// MARKET TEMPERATURE CALCULATION
// =============================================================================

type MarketTemperature = 'hot' | 'warm' | 'cool';

function getMarketTemperature(snapshot: LaborMarketSnapshot): MarketTemperature {
  // Hot: low unemployment + high job openings
  if (snapshot.nationalUnemploymentRate < 4.5 && snapshot.jobOpenings > 7000) {
    return 'hot';
  }
  // Cool: high unemployment or low job openings
  if (snapshot.nationalUnemploymentRate > 6 || snapshot.jobOpenings < 4000) {
    return 'cool';
  }
  return 'warm';
}

const temperatureConfig: Record<
  MarketTemperature,
  { label: string; color: string; bg: string; icon: 'fire' | 'sun' | 'snowflake' }
> = {
  hot: {
    label: 'Hot Market',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    icon: 'fire',
  },
  warm: {
    label: 'Warm Market',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
    icon: 'sun',
  },
  cool: {
    label: 'Cool Market',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.15)',
    icon: 'snowflake',
  },
};

// =============================================================================
// ERROR MESSAGE HELPERS
// =============================================================================

/**
 * Get user-friendly error message based on error code/message
 */
function getErrorDisplayInfo(error: ApiError): {
  title: string;
  message: string;
  showSetupInstructions: boolean;
  showRetryTime: boolean;
  retryTimeMinutes?: number;
} {
  const errorMessage = error.message.toLowerCase();
  const errorCode = error.code?.toLowerCase() || '';

  // API key not configured
  if (
    errorMessage.includes('api key') ||
    errorMessage.includes('unauthorized') ||
    errorCode === 'unauthorized' ||
    errorCode === '401'
  ) {
    return {
      title: 'API Key Not Configured',
      message:
        'The BLS API key is not set up. Please configure your API key to access labor market data.',
      showSetupInstructions: true,
      showRetryTime: false,
    };
  }

  // Rate limit exceeded
  if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorCode === '429' ||
    errorCode === 'rate_limit'
  ) {
    return {
      title: 'Rate Limit Exceeded',
      message: 'Too many requests to the BLS API. Please wait before trying again.',
      showSetupInstructions: false,
      showRetryTime: true,
      retryTimeMinutes: 5,
    };
  }

  // Network error
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorCode === 'network_error'
  ) {
    return {
      title: 'Network Error',
      message:
        'Unable to connect to the BLS API. Please check your internet connection and try again.',
      showSetupInstructions: false,
      showRetryTime: false,
    };
  }

  // No data available
  if (
    errorMessage.includes('no data') ||
    errorMessage.includes('not found') ||
    errorMessage.includes('unavailable') ||
    errorCode === '404'
  ) {
    return {
      title: 'Data Unavailable',
      message:
        'Labor market data is temporarily unavailable. This may be due to BLS maintenance or data updates.',
      showSetupInstructions: false,
      showRetryTime: false,
    };
  }

  // Default error
  return {
    title: 'Unable to Load Data',
    message: error.message || 'An unexpected error occurred while fetching labor market data.',
    showSetupInstructions: false,
    showRetryTime: false,
  };
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * ErrorBanner - Displays errors in a friendly way with retry capability
 */
const ErrorBanner: Component<{
  title: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  variant?: 'error' | 'warning' | 'info';
}> = (props) => {
  const [showDetails, setShowDetails] = createSignal(false);

  const variantStyles = () => {
    switch (props.variant) {
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.1)',
          border: 'rgba(245, 158, 11, 0.3)',
          iconColor: '#F59E0B',
          titleColor: '#F59E0B',
        };
      case 'info':
        return {
          bg: 'rgba(59, 130, 246, 0.1)',
          border: 'rgba(59, 130, 246, 0.3)',
          iconColor: '#3B82F6',
          titleColor: '#3B82F6',
        };
      case 'error':
      default:
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.3)',
          iconColor: '#EF4444',
          titleColor: '#EF4444',
        };
    }
  };

  const styles = variantStyles();

  return (
    <div
      style={{
        padding: '16px',
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        'border-radius': '12px',
        'font-family': "'Space Grotesk', system-ui, sans-serif",
      }}
    >
      {/* Header with icon and title */}
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: '10px',
          'margin-bottom': '8px',
        }}
      >
        {/* Warning/Error Icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={styles.iconColor}
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span
          style={{
            'font-size': '14px',
            'font-weight': '600',
            color: styles.titleColor,
          }}
        >
          {props.title}
        </span>
      </div>

      {/* Message */}
      <p
        style={{
          margin: '0 0 12px 30px',
          'font-size': '13px',
          color: 'rgba(255, 255, 255, 0.7)',
          'line-height': '1.5',
        }}
      >
        {props.message}
      </p>

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: '12px',
          'margin-left': '30px',
        }}
      >
        <Show when={props.onRetry}>
          <button
            onClick={props.onRetry}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              'border-radius': '8px',
              color: 'rgba(255, 255, 255, 0.9)',
              'font-size': '12px',
              'font-weight': '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            Retry
          </button>
        </Show>

        <Show when={props.details}>
          <button
            onClick={() => setShowDetails(!showDetails())}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              'font-size': '12px',
              cursor: 'pointer',
              'text-decoration': 'underline',
            }}
          >
            {showDetails() ? 'Hide Details' : 'Show Details'}
          </button>
        </Show>
      </div>

      {/* Expandable details section */}
      <Show when={showDetails() && props.details}>
        <div
          style={{
            'margin-top': '12px',
            'margin-left': '30px',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.2)',
            'border-radius': '8px',
            'font-family': 'monospace',
            'font-size': '11px',
            color: 'rgba(255, 255, 255, 0.6)',
            'white-space': 'pre-wrap',
            'word-break': 'break-all',
            'max-height': '150px',
            overflow: 'auto',
          }}
        >
          {props.details}
        </div>
      </Show>
    </div>
  );
};

/**
 * DebugPanel - Shows API call status and timing information
 */
const DebugPanel: Component<{
  title: string;
  status: 'loading' | 'success' | 'error' | 'idle';
  cacheHit?: boolean;
  timing?: number;
  error?: ApiError | null;
}> = (props) => {
  const statusColors = {
    loading: '#F59E0B',
    success: '#10B981',
    error: '#EF4444',
    idle: '#6B7280',
  };

  return (
    <div
      style={{
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.3)',
        'border-radius': '6px',
        'font-family': 'monospace',
        'font-size': '11px',
        'margin-bottom': '8px',
      }}
    >
      <div style={{ display: 'flex', 'align-items': 'center', gap: '8px', 'margin-bottom': '4px' }}>
        <span
          style={{
            width: '8px',
            height: '8px',
            'border-radius': '50%',
            background: statusColors[props.status],
          }}
        />
        <span style={{ color: 'rgba(255, 255, 255, 0.8)', 'font-weight': '600' }}>
          {props.title}
        </span>
        <span style={{ color: statusColors[props.status], 'text-transform': 'uppercase' }}>
          {props.status}
        </span>
      </div>
      <div style={{ 'padding-left': '16px', color: 'rgba(255, 255, 255, 0.5)' }}>
        <Show when={props.cacheHit !== undefined}>
          <div>Cache: {props.cacheHit ? 'HIT' : 'MISS'}</div>
        </Show>
        <Show when={props.timing !== undefined}>
          <div>Timing: {props.timing}ms</div>
        </Show>
        <Show when={props.error}>
          <div style={{ color: '#EF4444' }}>
            Error: {props.error?.code || 'unknown'} - {props.error?.message}
          </div>
        </Show>
      </div>
    </div>
  );
};

const SkeletonLoader: Component<{ width?: string; height?: string }> = (props) => (
  <div
    style={{
      width: props.width || '100%',
      height: props.height || '20px',
      background:
        'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
      'background-size': '200% 100%',
      animation: 'shimmer 1.5s infinite',
      'border-radius': '6px',
    }}
  />
);

const TrendArrow: Component<{ trend: 'up' | 'down' | 'neutral'; value?: number }> = (props) => {
  const color = () => {
    if (props.trend === 'up') return '#10B981';
    if (props.trend === 'down') return '#EF4444';
    return '#9CA3AF';
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        'align-items': 'center',
        gap: '4px',
        color: color(),
        'font-weight': '600',
        'font-size': '13px',
      }}
    >
      {props.trend === 'up' && <TrendUpIcon width={14} height={14} />}
      {props.trend === 'down' && <TrendDownIcon width={14} height={14} />}
      {props.trend === 'neutral' && <ArrowRightIcon width={14} height={14} />}
      <Show when={props.value !== undefined}>
        <span>{props.value}%</span>
      </Show>
    </span>
  );
};

const OutlookBadge: Component<{ outlook: ProjectionOutlook }> = (props) => {
  const colors = () => outlookColors[props.outlook];
  const label = () => props.outlook.charAt(0).toUpperCase() + props.outlook.slice(1);

  return (
    <span
      style={{
        display: 'inline-flex',
        'align-items': 'center',
        padding: '4px 10px',
        background: colors().bg,
        border: `1px solid ${colors().border}`,
        'border-radius': '9999px',
        'font-size': '11px',
        'font-weight': '600',
        color: colors().text,
        'text-transform': 'uppercase',
        'letter-spacing': '0.05em',
      }}
    >
      {label()}
    </span>
  );
};

const ProgressBar: Component<{ value: number; max?: number; color?: string }> = (props) => {
  const percentage = () => Math.min(100, Math.max(0, (props.value / (props.max || 100)) * 100));

  return (
    <div
      style={{
        width: '100%',
        height: '6px',
        background: 'rgba(255, 255, 255, 0.1)',
        'border-radius': '3px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${percentage()}%`,
          height: '100%',
          background: props.color || '#8B5CF6',
          'border-radius': '3px',
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const LaborMarketWidget: Component<LaborMarketWidgetProps> = (props) => {
  // Feature gate: BLS integration is deferred to v2
  if (!isV2FeatureEnabled('BLS_INTEGRATION')) {
    return null;
  }

  const theme = () => props.currentTheme();
  const profile = () => pipelineStore.state.profile;
  const [isRefreshing, setIsRefreshing] = createSignal(false);

  // Error state signals
  const [marketSnapshotError, setMarketSnapshotError] = createSignal<ApiError | null>(null);
  const [occupationDataError, setOccupationDataError] = createSignal<ApiError | null>(null);
  const [regionalDataError, setRegionalDataError] = createSignal<ApiError | null>(null);

  // Debug timing state
  const [snapshotTiming, setSnapshotTiming] = createSignal<number | undefined>(undefined);
  const [occupationTiming, setOccupationTiming] = createSignal<number | undefined>(undefined);
  const [regionalTiming, setRegionalTiming] = createSignal<number | undefined>(undefined);
  const [snapshotCacheHit, setSnapshotCacheHit] = createSignal<boolean | undefined>(undefined);

  // Computed values for profile checks
  const hasTargetOccupations = createMemo(() => (profile()?.targetOccupations?.length ?? 0) > 0);

  const hasLocationPreferences = createMemo(() => {
    const prefs = profile()?.locationPreferences;
    return prefs?.current?.state && prefs?.targetLocations?.states?.length;
  });

  // Mount logging
  onMount(() => {
    console.log('[LaborMarket] Widget mounted');
    console.log(`[LaborMarket] Profile has target occupations: ${hasTargetOccupations()}`);
    console.log(`[LaborMarket] Profile has location preferences: ${!!hasLocationPreferences()}`);

    if (isDebugMode()) {
      console.log('[LaborMarket] Debug mode is ENABLED');
      console.log('[LaborMarket] Profile data:', profile());
    }

    // Force resource to trigger by reading it
    console.log('[LaborMarket] Triggering market snapshot fetch...');

    try {
      const snapshotValue = marketSnapshot();
      console.log('[LaborMarket] Market snapshot value:', snapshotValue);
      console.log('[LaborMarket] Market snapshot loading:', marketSnapshot.loading);
      console.log('[LaborMarket] Market snapshot state:', marketSnapshot.state);
      console.log('[LaborMarket] Market snapshot error:', marketSnapshotError());
    } catch (error) {
      console.error('[LaborMarket] Error reading market snapshot:', error);
    }

    // Also trigger the other resources
    try {
      console.log('[LaborMarket] Occupation data value:', targetOccupationData());
      console.log('[LaborMarket] Regional data value:', regionalData());
    } catch (error) {
      console.error('[LaborMarket] Error reading other resources:', error);
    }
  });

  // Fetch market snapshot with error handling
  const fetchMarketSnapshot = async (): Promise<LaborMarketSnapshot | null> => {
    console.log('[LaborMarket] fetchMarketSnapshot() CALLED');
    const startTime = performance.now();
    setMarketSnapshotError(null);
    debugLog('Fetching market snapshot...');

    try {
      console.log('[LaborMarket] About to call getLaborMarketSnapshot()...');
      const result = await getLaborMarketSnapshot();
      console.log('[LaborMarket] getLaborMarketSnapshot() returned');
      console.log('[LaborMarket] Result type:', typeof result);
      console.log('[LaborMarket] Result.success:', result?.success);
      console.log('[LaborMarket] Full result:', JSON.stringify(result, null, 2));

      const timing = Math.round(performance.now() - startTime);
      setSnapshotTiming(timing);

      if (result.success) {
        console.log('[LaborMarket] SUCCESS - Market snapshot fetched:', {
          timing,
          unemployment: result.data.nationalUnemploymentRate,
          jobOpenings: result.data.jobOpenings,
          inflation: result.data.inflation,
        });
        debugLog('Market snapshot fetched successfully', { timing, data: result.data });
        // Cache status is determined by timing - fast responses likely from cache
        setSnapshotCacheHit(timing < 100);
        return result.data;
      }

      // Handle error case
      console.error('[LaborMarket] API call succeeded but result.success is false:', result.error);
      const errorDetails: ApiError = {
        code: result.error?.code || 'unknown',
        message: result.error?.message || 'Failed to fetch market snapshot',
        details: JSON.stringify(result.error, null, 2),
        timestamp: new Date(),
      };

      console.error('[LaborMarket] Failed to fetch market snapshot:', {
        error: result.error,
        timing,
      });
      setMarketSnapshotError(errorDetails);
      return null;
    } catch (error) {
      console.error('[LaborMarket] EXCEPTION in fetchMarketSnapshot:', error);
      const timing = Math.round(performance.now() - startTime);
      setSnapshotTiming(timing);

      const errorDetails: ApiError = {
        code: 'exception',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : String(error),
        timestamp: new Date(),
      };

      console.error('[LaborMarket] Exception while fetching market snapshot:', {
        error,
        timing,
      });
      setMarketSnapshotError(errorDetails);
      return null;
    }
  };

  const [marketSnapshot, { refetch: refetchSnapshot }] = createResource(fetchMarketSnapshot);

  // Fetch target occupation data with error handling
  const fetchOccupationData = async (
    targetOccupations: { socCode: string; title: string }[] | undefined
  ): Promise<CareerOutlook[] | null> => {
    if (!targetOccupations || targetOccupations.length === 0) {
      debugLog('No target occupations to fetch');
      return null;
    }

    const startTime = performance.now();
    setOccupationDataError(null);
    debugLog(
      'Fetching occupation data for:',
      targetOccupations.map((o) => o.title)
    );

    const results: CareerOutlook[] = [];
    const errors: string[] = [];

    // Fetch up to 3 occupations
    const occupationsToFetch = targetOccupations.slice(0, 3);

    for (const occ of occupationsToFetch) {
      try {
        debugLog(`Fetching career outlook for ${occ.title} (${occ.socCode})`);
        const result = await getCareerOutlook(occ.socCode);

        if (result.success) {
          results.push(result.data);
          debugLog(`Successfully fetched data for ${occ.title}`);
        } else {
          errors.push(`${occ.title}: ${result.error?.message || 'Unknown error'}`);
          console.error(
            `[LaborMarket] Failed to fetch occupation data for ${occ.title}:`,
            result.error
          );
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${occ.title}: ${errorMsg}`);
        console.error(`[LaborMarket] Exception fetching occupation data for ${occ.title}:`, error);
      }
    }

    const timing = Math.round(performance.now() - startTime);
    setOccupationTiming(timing);

    // If all requests failed, set error state
    if (results.length === 0 && errors.length > 0) {
      setOccupationDataError({
        code: 'fetch_failed',
        message: 'Unable to load occupation data',
        details: errors.join('\n'),
        timestamp: new Date(),
      });
      return null;
    }

    // If some requests failed, log warning but return partial results
    if (errors.length > 0) {
      console.warn('[LaborMarket] Some occupation fetches failed:', errors);
    }

    debugLog('Occupation data fetch complete', { timing, resultsCount: results.length, errors });
    return results.length > 0 ? results : null;
  };

  const [targetOccupationData, { refetch: refetchOccupations }] = createResource(
    () => profile()?.targetOccupations,
    fetchOccupationData
  );

  // Fetch regional comparison data with error handling
  const fetchRegionalData = async (): Promise<RegionalComparison | null> => {
    const userProfile = profile();
    if (!userProfile?.targetOccupations?.[0] || !userProfile?.locationPreferences) {
      debugLog('Missing profile data for regional comparison');
      return null;
    }

    const prefs = userProfile.locationPreferences;
    if (!prefs.current?.state || !prefs.targetLocations?.states?.length) {
      debugLog('Missing location preferences for regional comparison');
      return null;
    }

    const startTime = performance.now();
    setRegionalDataError(null);

    // Convert state abbreviations to BLS area codes (e.g., "CA" -> "S0600000")
    const stateAbbrevs = [prefs.current.state, ...prefs.targetLocations.states.slice(0, 2)];
    const areaCodes = stateAbbrevs
      .map((abbrev) => {
        try {
          return buildStateAreaCode(abbrev);
        } catch (e) {
          debugLog(`Failed to convert state abbreviation: ${abbrev}`, e);
          return null;
        }
      })
      .filter((code): code is string => code !== null);

    if (areaCodes.length === 0) {
      debugLog('No valid area codes after conversion');
      return null;
    }
    debugLog('Fetching regional data for areas:', areaCodes);

    try {
      const result = await compareRegionalWages(
        userProfile.targetOccupations[0].socCode,
        areaCodes
      );
      const timing = Math.round(performance.now() - startTime);
      setRegionalTiming(timing);

      if (result.success) {
        debugLog('Regional data fetched successfully', { timing, data: result.data });
        return result.data;
      }

      const errorDetails: ApiError = {
        code: result.error?.code || 'unknown',
        message: result.error?.message || 'Failed to fetch regional data',
        details: JSON.stringify(result.error, null, 2),
        timestamp: new Date(),
      };

      console.error('[LaborMarket] Failed to fetch regional data:', {
        error: result.error,
        timing,
      });
      setRegionalDataError(errorDetails);
      return null;
    } catch (error) {
      const timing = Math.round(performance.now() - startTime);
      setRegionalTiming(timing);

      const errorDetails: ApiError = {
        code: 'exception',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : String(error),
        timestamp: new Date(),
      };

      console.error('[LaborMarket] Exception while fetching regional data:', {
        error,
        timing,
      });
      setRegionalDataError(errorDetails);
      return null;
    }
  };

  const [regionalData, { refetch: refetchRegional }] = createResource(
    () => ({
      targetOcc: profile()?.targetOccupations?.[0],
      prefs: profile()?.locationPreferences,
    }),
    fetchRegionalData
  );

  const lastUpdated = createMemo(() => {
    if (!marketSnapshot()) return null;
    // Approximate last update based on cache (24h TTL)
    return 'Recently updated';
  });

  // Refresh handler
  const handleRefresh = async () => {
    debugLog('Refresh triggered');
    setIsRefreshing(true);
    clearBlsCache();
    setSnapshotCacheHit(false);

    try {
      await Promise.all([refetchSnapshot(), refetchOccupations?.(), refetchRegional?.()]);
      debugLog('Refresh complete');
    } catch (error) {
      console.error('[LaborMarket] Error during refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Retry handlers for individual sections
  const handleRetrySnapshot = async () => {
    debugLog('Retrying market snapshot fetch');
    setMarketSnapshotError(null);
    await refetchSnapshot();
  };

  const handleRetryOccupations = async () => {
    debugLog('Retrying occupation data fetch');
    setOccupationDataError(null);
    await refetchOccupations?.();
  };

  const handleRetryRegional = async () => {
    debugLog('Retrying regional data fetch');
    setRegionalDataError(null);
    await refetchRegional?.();
  };

  // Format currency
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format employment/labor numbers (stored as actual values, e.g., 163741000 = 163.7M people)
  const formatEmploymentNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '—';

    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  // Format job openings (stored in thousands from JOLTS, e.g., 7670 = 7.67M openings)
  const formatJobOpenings = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '—';
    // JOLTS data is in thousands, so multiply to get actual count
    const actual = value * 1000;
    if (actual >= 1_000_000) {
      return `${(actual / 1_000_000).toFixed(1)}M`;
    }
    if (actual >= 1_000) {
      return `${(actual / 1_000).toFixed(0)}K`;
    }
    return actual.toFixed(0);
  };

  // Get resource status for debug panel
  const getResourceStatus = (
    loading: boolean,
    data: unknown,
    error: ApiError | null
  ): 'loading' | 'success' | 'error' | 'idle' => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (data) return 'success';
    return 'idle';
  };

  return (
    <FluidCard
      variant="elevated"
      style={{
        padding: props.compact ? '16px' : '24px',
        display: 'flex',
        'flex-direction': 'column',
        gap: props.compact ? '16px' : '24px',
      }}
    >
      {/* Debug Panel - Only shown when debug mode is enabled */}
      <Show when={isDebugMode()}>
        <div
          style={{
            padding: '12px',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            'border-radius': '8px',
            'margin-bottom': '8px',
          }}
        >
          <div
            style={{
              'font-size': '12px',
              'font-weight': '600',
              color: '#A78BFA',
              'margin-bottom': '8px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
            }}
          >
            DEBUG MODE ENABLED
          </div>
          <DebugPanel
            title="Market Snapshot"
            status={getResourceStatus(
              marketSnapshot.loading,
              marketSnapshot(),
              marketSnapshotError()
            )}
            cacheHit={snapshotCacheHit()}
            timing={snapshotTiming()}
            error={marketSnapshotError()}
          />
          <DebugPanel
            title="Occupation Data"
            status={getResourceStatus(
              targetOccupationData.loading,
              targetOccupationData(),
              occupationDataError()
            )}
            timing={occupationTiming()}
            error={occupationDataError()}
          />
          <DebugPanel
            title="Regional Data"
            status={getResourceStatus(regionalData.loading, regionalData(), regionalDataError())}
            timing={regionalTiming()}
            error={regionalDataError()}
          />
        </div>
      </Show>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          'margin-bottom': '4px',
        }}
      >
        <div>
          <h2
            style={{
              margin: '0 0 4px',
              'font-size': props.compact ? '16px' : '18px',
              'font-family': "'Playfair Display', Georgia, serif",
              'font-weight': '600',
              color: theme().colors.text,
            }}
          >
            Labor Market Intelligence
          </h2>
          <p
            style={{
              margin: 0,
              'font-size': '12px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: theme().colors.textMuted,
            }}
          >
            Real-time data from Bureau of Labor Statistics
          </p>
        </div>

        {/* Market Temperature Badge */}
        <Show when={marketSnapshot() && !marketSnapshot.loading && !marketSnapshotError()}>
          {(() => {
            const temp = getMarketTemperature(marketSnapshot()!);
            const config = temperatureConfig[temp];
            return (
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: config.bg,
                  border: `1px solid ${config.color}30`,
                  'border-radius': '20px',
                  'font-size': '12px',
                  'font-weight': '600',
                  color: config.color,
                }}
              >
                <Show when={config.icon === 'fire'}>
                  <FireIcon width={14} height={14} />
                </Show>
                <Show when={config.icon === 'sun'}>
                  <SunIcon width={14} height={14} />
                </Show>
                <Show when={config.icon === 'snowflake'}>
                  <SnowflakeIcon width={14} height={14} />
                </Show>
                <span>{config.label}</span>
              </div>
            );
          })()}
        </Show>
      </div>

      {/* Market Snapshot Section */}
      <div>
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
            'margin-bottom': '12px',
          }}
        >
          <div
            style={{
              width: '4px',
              height: '16px',
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              'border-radius': '2px',
            }}
          />
          <span
            style={{
              'font-size': '13px',
              'font-weight': '600',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: theme().colors.text,
              'text-transform': 'uppercase',
              'letter-spacing': '0.05em',
            }}
          >
            Market Snapshot
          </span>
        </div>

        {/* Error state for market snapshot */}
        <Show when={marketSnapshotError() && !marketSnapshot.loading}>
          {(() => {
            const error = marketSnapshotError()!;
            const displayInfo = getErrorDisplayInfo(error);
            return (
              <div style={{ 'margin-bottom': '16px' }}>
                <ErrorBanner
                  title={displayInfo.title}
                  message={displayInfo.message}
                  details={error.details}
                  onRetry={handleRetrySnapshot}
                  variant="error"
                />
                <Show when={displayInfo.showSetupInstructions}>
                  <div
                    style={{
                      'margin-top': '12px',
                      padding: '12px 16px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      'border-radius': '8px',
                      'font-size': '12px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    <strong style={{ color: '#60A5FA' }}>Setup Instructions:</strong>
                    <ol style={{ margin: '8px 0 0', 'padding-left': '20px', 'line-height': '1.6' }}>
                      <li>Register for a free API key at bls.gov/developers</li>
                      <li>Add the key to your environment variables as BLS_API_KEY</li>
                      <li>Restart the application</li>
                    </ol>
                  </div>
                </Show>
                <Show when={displayInfo.showRetryTime}>
                  <div
                    style={{
                      'margin-top': '8px',
                      'font-size': '12px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: theme().colors.textMuted,
                    }}
                  >
                    Please wait {displayInfo.retryTimeMinutes} minutes before retrying.
                  </div>
                </Show>
              </div>
            );
          })()}
        </Show>

        <Show
          when={!marketSnapshot.loading && marketSnapshot() && !marketSnapshotError()}
          fallback={
            <Show when={!marketSnapshotError()}>
              <div
                style={{
                  display: 'grid',
                  'grid-template-columns': 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '12px',
                }}
              >
                <For each={[1, 2, 3, 4]}>
                  {() => (
                    <div
                      style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        'border-radius': '12px',
                      }}
                    >
                      <SkeletonLoader height="24px" width="60%" />
                      <div style={{ 'margin-top': '8px' }}>
                        <SkeletonLoader height="14px" width="80%" />
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          }
        >
          <div
            style={{
              display: 'grid',
              'grid-template-columns': props.compact
                ? 'repeat(2, 1fr)'
                : 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Unemployment Rate */}
            <Tooltip
              content={
                <StatTooltipContent
                  title="Unemployment Rate"
                  metrics={[
                    {
                      label: 'Current rate',
                      value: `${marketSnapshot()!.nationalUnemploymentRate.toFixed(1)}%`,
                    },
                    {
                      label: 'Labor force participation',
                      value: `${marketSnapshot()!.laborForceParticipationRate.toFixed(1)}%`,
                    },
                  ]}
                  insight="Lower unemployment generally means more competition for talent"
                />
              }
              position="bottom"
            >
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  'border-radius': '12px',
                  cursor: 'pointer',
                  transition: `all ${pipelineAnimations.fast}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                    'margin-bottom': '4px',
                  }}
                >
                  <span
                    style={{
                      'font-size': '24px',
                      'font-weight': '700',
                      'font-family': "'Playfair Display', Georgia, serif",
                      color: '#60A5FA',
                    }}
                  >
                    {marketSnapshot()!.nationalUnemploymentRate.toFixed(1)}%
                  </span>
                  <TrendArrow
                    trend={
                      marketSnapshot()!.unemploymentRateChange < 0
                        ? 'down'
                        : marketSnapshot()!.unemploymentRateChange > 0
                          ? 'up'
                          : 'neutral'
                    }
                  />
                </div>
                <span
                  style={{
                    'font-size': '11px',
                    color: theme().colors.textMuted,
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.05em',
                  }}
                >
                  Unemployment
                </span>
              </div>
            </Tooltip>

            {/* Job Openings */}
            <Tooltip
              content={
                <StatTooltipContent
                  title="Job Openings (JOLTS)"
                  metrics={[
                    {
                      label: 'Total openings',
                      value: formatJobOpenings(marketSnapshot()!.jobOpenings),
                    },
                    {
                      label: 'Quits rate',
                      value: `${marketSnapshot()!.quitsRate.toFixed(1)}%`,
                      color: marketSnapshot()!.quitsRate > 2.5 ? '#10B981' : undefined,
                    },
                  ]}
                  insight="High quits rate indicates worker confidence in finding new jobs"
                />
              }
              position="bottom"
            >
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  'border-radius': '12px',
                  cursor: 'pointer',
                  transition: `all ${pipelineAnimations.fast}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                    'margin-bottom': '4px',
                  }}
                >
                  <span
                    style={{
                      'font-size': '24px',
                      'font-weight': '700',
                      'font-family': "'Playfair Display', Georgia, serif",
                      color: '#10B981',
                    }}
                  >
                    {formatJobOpenings(marketSnapshot()!.jobOpenings)}
                  </span>
                </div>
                <span
                  style={{
                    'font-size': '11px',
                    color: theme().colors.textMuted,
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.05em',
                  }}
                >
                  Job Openings
                </span>
              </div>
            </Tooltip>

            {/* Inflation */}
            <Tooltip
              content={
                <StatTooltipContent
                  title="Inflation (CPI)"
                  metrics={[
                    {
                      label: 'Year-over-year',
                      value: `${marketSnapshot()!.inflation.toFixed(1)}%`,
                      color: marketSnapshot()!.inflation > 3 ? '#F59E0B' : '#10B981',
                    },
                  ]}
                  insight={
                    marketSnapshot()!.inflation > 3
                      ? 'High inflation may erode real wage gains'
                      : 'Moderate inflation is healthy for wage growth'
                  }
                />
              }
              position="bottom"
            >
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  'border-radius': '12px',
                  cursor: 'pointer',
                  transition: `all ${pipelineAnimations.fast}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                    'margin-bottom': '4px',
                  }}
                >
                  <span
                    style={{
                      'font-size': '24px',
                      'font-weight': '700',
                      'font-family': "'Playfair Display', Georgia, serif",
                      color: marketSnapshot()!.inflation > 3 ? '#F59E0B' : '#A78BFA',
                    }}
                  >
                    {marketSnapshot()!.inflation.toFixed(1)}%
                  </span>
                  <TrendArrow trend={marketSnapshot()!.inflation > 3 ? 'up' : 'neutral'} />
                </div>
                <span
                  style={{
                    'font-size': '11px',
                    color: theme().colors.textMuted,
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.05em',
                  }}
                >
                  Inflation (YoY)
                </span>
              </div>
            </Tooltip>

            {/* Total Employment */}
            <Show when={!props.compact}>
              <Tooltip
                content={
                  <StatTooltipContent
                    title="Total Employment"
                    metrics={[
                      {
                        label: 'Total employed',
                        value: formatEmploymentNumber(marketSnapshot()!.totalEmployment),
                      },
                      {
                        label: 'Monthly change',
                        value: `${marketSnapshot()!.monthlyJobChange > 0 ? '+' : ''}${marketSnapshot()!.monthlyJobChange.toLocaleString()}`,
                        trend: marketSnapshot()!.monthlyJobChange > 0 ? 'up' : 'down',
                      },
                    ]}
                    insight="Monthly job gains indicate economic health"
                  />
                }
                position="bottom"
              >
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    'border-radius': '12px',
                    cursor: 'pointer',
                    transition: `all ${pipelineAnimations.fast}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'space-between',
                      'margin-bottom': '4px',
                    }}
                  >
                    <span
                      style={{
                        'font-size': '24px',
                        'font-weight': '700',
                        'font-family': "'Playfair Display', Georgia, serif",
                        color: '#EC4899',
                      }}
                    >
                      {formatEmploymentNumber(marketSnapshot()!.totalEmployment)}
                    </span>
                  </div>
                  <span
                    style={{
                      'font-size': '11px',
                      color: theme().colors.textMuted,
                      'text-transform': 'uppercase',
                      'letter-spacing': '0.05em',
                    }}
                  >
                    Total Employed
                  </span>
                </div>
              </Tooltip>
            </Show>
          </div>
        </Show>
      </div>

      {/* Target Occupations Section */}
      <div>
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
            'margin-bottom': '12px',
          }}
        >
          <div
            style={{
              width: '4px',
              height: '16px',
              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
              'border-radius': '2px',
            }}
          />
          <span
            style={{
              'font-size': '13px',
              'font-weight': '600',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: theme().colors.text,
              'text-transform': 'uppercase',
              'letter-spacing': '0.05em',
            }}
          >
            Your Target Occupations
          </span>
        </div>

        <Show
          when={hasTargetOccupations()}
          fallback={
            <div
              style={{
                padding: '24px',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                'border-radius': '12px',
                'text-align': 'center',
              }}
            >
              <p
                style={{
                  margin: 0,
                  'font-size': '14px',
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  color: theme().colors.textMuted,
                }}
              >
                Add target occupations in your profile to see personalized market data
              </p>
            </div>
          }
        >
          {/* Error state for occupation data */}
          <Show when={occupationDataError() && !targetOccupationData.loading}>
            {(() => {
              const error = occupationDataError()!;
              const displayInfo = getErrorDisplayInfo(error);
              return (
                <ErrorBanner
                  title={displayInfo.title}
                  message={displayInfo.message}
                  details={error.details}
                  onRetry={handleRetryOccupations}
                  variant="warning"
                />
              );
            })()}
          </Show>

          <Show
            when={!targetOccupationData.loading && targetOccupationData() && !occupationDataError()}
            fallback={
              <Show when={!occupationDataError()}>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
                  <For each={[1, 2, 3]}>
                    {() => (
                      <div
                        style={{
                          padding: '16px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          'border-radius': '12px',
                        }}
                      >
                        <SkeletonLoader height="18px" width="70%" />
                        <div
                          style={{
                            display: 'flex',
                            gap: '24px',
                            'margin-top': '12px',
                          }}
                        >
                          <SkeletonLoader height="14px" width="100px" />
                          <SkeletonLoader height="14px" width="80px" />
                          <SkeletonLoader height="14px" width="60px" />
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            }
          >
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
              <For each={targetOccupationData()!}>
                {(outlook) => (
                  <div
                    style={{
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      'border-radius': '12px',
                    }}
                  >
                    {/* Occupation Header */}
                    <div
                      style={{
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'space-between',
                        'margin-bottom': '12px',
                      }}
                    >
                      <span
                        style={{
                          'font-size': '15px',
                          'font-weight': '600',
                          'font-family': "'Space Grotesk', system-ui, sans-serif",
                          color: theme().colors.text,
                        }}
                      >
                        {outlook.occupationTitle}
                      </span>
                      <OutlookBadge outlook={outlook.overallOutlook} />
                    </div>

                    {/* Stats Row */}
                    <div
                      style={{
                        display: 'grid',
                        'grid-template-columns': props.compact
                          ? 'repeat(2, 1fr)'
                          : 'repeat(4, 1fr)',
                        gap: '16px',
                      }}
                    >
                      {/* Median Wage */}
                      <div>
                        <span
                          style={{
                            'font-size': '11px',
                            color: theme().colors.textMuted,
                            'text-transform': 'uppercase',
                            'letter-spacing': '0.05em',
                            display: 'block',
                            'margin-bottom': '4px',
                          }}
                        >
                          Median Wage
                        </span>
                        <span
                          style={{
                            'font-size': '16px',
                            'font-weight': '700',
                            color: '#10B981',
                          }}
                        >
                          {formatCurrency(outlook.salary.midCareer)}
                        </span>
                      </div>

                      {/* Annual Openings */}
                      <div>
                        <span
                          style={{
                            'font-size': '11px',
                            color: theme().colors.textMuted,
                            'text-transform': 'uppercase',
                            'letter-spacing': '0.05em',
                            display: 'block',
                            'margin-bottom': '4px',
                          }}
                        >
                          Annual Openings
                        </span>
                        <span
                          style={{
                            'font-size': '16px',
                            'font-weight': '700',
                            color: theme().colors.text,
                          }}
                        >
                          {outlook.jobAvailability.annualOpenings.toLocaleString()}
                        </span>
                      </div>

                      {/* Competition */}
                      <Show when={!props.compact}>
                        <div>
                          <span
                            style={{
                              'font-size': '11px',
                              color: theme().colors.textMuted,
                              'text-transform': 'uppercase',
                              'letter-spacing': '0.05em',
                              display: 'block',
                              'margin-bottom': '4px',
                            }}
                          >
                            Competition
                          </span>
                          <span
                            style={{
                              'font-size': '14px',
                              'font-weight': '600',
                              color:
                                outlook.jobAvailability.competition === 'low'
                                  ? '#10B981'
                                  : outlook.jobAvailability.competition === 'high'
                                    ? '#EF4444'
                                    : '#F59E0B',
                            }}
                          >
                            {outlook.jobAvailability.competition.charAt(0).toUpperCase() +
                              outlook.jobAvailability.competition.slice(1)}
                          </span>
                        </div>
                      </Show>

                      {/* Outlook Score */}
                      <Show when={!props.compact}>
                        <div>
                          <span
                            style={{
                              'font-size': '11px',
                              color: theme().colors.textMuted,
                              'text-transform': 'uppercase',
                              'letter-spacing': '0.05em',
                              display: 'block',
                              'margin-bottom': '4px',
                            }}
                          >
                            Outlook Score
                          </span>
                          <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                            <ProgressBar
                              value={outlook.outlookScore}
                              color={
                                outlook.outlookScore >= 60
                                  ? '#10B981'
                                  : outlook.outlookScore >= 40
                                    ? '#F59E0B'
                                    : '#EF4444'
                              }
                            />
                            <span
                              style={{
                                'font-size': '14px',
                                'font-weight': '600',
                                color: theme().colors.text,
                              }}
                            >
                              {outlook.outlookScore}
                            </span>
                          </div>
                        </div>
                      </Show>
                    </div>
                  </div>
                )}
              </For>

              {/* View All Link */}
              <Show when={(profile()?.targetOccupations?.length ?? 0) > 3}>
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: theme().colors.primary,
                    'font-size': '13px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    'font-weight': '500',
                    cursor: 'pointer',
                    padding: '8px',
                    'text-align': 'center',
                  }}
                >
                  View all {profile()?.targetOccupations?.length} occupations{' '}
                  <ArrowRightIcon
                    width={14}
                    height={14}
                    style={{ 'vertical-align': 'middle', 'margin-left': '4px' }}
                  />
                </button>
              </Show>
            </div>
          </Show>
        </Show>
      </div>

      {/* Regional Comparison Section */}
      <Show when={!props.compact}>
        <div>
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              'margin-bottom': '12px',
            }}
          >
            <div
              style={{
                width: '4px',
                height: '16px',
                background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                'border-radius': '2px',
              }}
            />
            <span
              style={{
                'font-size': '13px',
                'font-weight': '600',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                color: theme().colors.text,
                'text-transform': 'uppercase',
                'letter-spacing': '0.05em',
              }}
            >
              Regional Insights
            </span>
          </div>

          <Show
            when={hasLocationPreferences()}
            fallback={
              <div
                style={{
                  padding: '24px',
                  background: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  'border-radius': '12px',
                  'text-align': 'center',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    'font-size': '14px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    color: theme().colors.textMuted,
                  }}
                >
                  Set your location in profile for regional insights
                </p>
              </div>
            }
          >
            {/* Error state for regional data */}
            <Show when={regionalDataError() && !regionalData.loading}>
              {(() => {
                const error = regionalDataError()!;
                const displayInfo = getErrorDisplayInfo(error);
                return (
                  <ErrorBanner
                    title={displayInfo.title}
                    message={displayInfo.message}
                    details={error.details}
                    onRetry={handleRetryRegional}
                    variant="warning"
                  />
                );
              })()}
            </Show>

            <Show
              when={!regionalData.loading && regionalData() && !regionalDataError()}
              fallback={
                <Show when={!regionalDataError()}>
                  <div
                    style={{
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      'border-radius': '12px',
                    }}
                  >
                    <SkeletonLoader height="120px" />
                  </div>
                </Show>
              }
            >
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  'border-radius': '12px',
                }}
              >
                {/* Base Region */}
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                    'padding-bottom': '12px',
                    'border-bottom': '1px solid rgba(255, 255, 255, 0.1)',
                    'margin-bottom': '12px',
                  }}
                >
                  <div>
                    <span
                      style={{
                        'font-size': '13px',
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                        color: theme().colors.textMuted,
                        display: 'block',
                        'margin-bottom': '4px',
                      }}
                    >
                      Your Location
                    </span>
                    <span
                      style={{
                        'font-size': '15px',
                        'font-weight': '600',
                        color: theme().colors.text,
                      }}
                    >
                      {regionalData()!.baseRegion.areaName}
                    </span>
                  </div>
                  <div style={{ 'text-align': 'right' }}>
                    <span
                      style={{
                        'font-size': '11px',
                        color: theme().colors.textMuted,
                        'text-transform': 'uppercase',
                        display: 'block',
                        'margin-bottom': '2px',
                      }}
                    >
                      Median Wage
                    </span>
                    <span
                      style={{
                        'font-size': '18px',
                        'font-weight': '700',
                        color: '#10B981',
                      }}
                    >
                      {formatCurrency(regionalData()!.baseRegion.medianWage)}
                    </span>
                  </div>
                </div>

                {/* Comparisons */}
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '10px' }}>
                  <For each={regionalData()!.comparisons}>
                    {(comparison) => (
                      <div
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'space-between',
                          padding: '10px 12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          'border-radius': '8px',
                        }}
                      >
                        <span
                          style={{
                            'font-size': '14px',
                            color: theme().colors.text,
                          }}
                        >
                          {comparison.areaName}
                        </span>
                        <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
                          <span
                            style={{
                              'font-size': '14px',
                              'font-weight': '600',
                              color: theme().colors.text,
                            }}
                          >
                            {formatCurrency(comparison.medianWage)}
                          </span>
                          <span
                            style={{
                              'font-size': '13px',
                              'font-weight': '600',
                              color:
                                comparison.wageDifferencePercent > 0
                                  ? '#10B981'
                                  : comparison.wageDifferencePercent < 0
                                    ? '#EF4444'
                                    : theme().colors.textMuted,
                            }}
                          >
                            {comparison.wageDifferencePercent > 0 ? '+' : ''}
                            {comparison.wageDifferencePercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </For>
                </div>

                {/* National Average */}
                <div
                  style={{
                    'margin-top': '12px',
                    'padding-top': '12px',
                    'border-top': '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                  }}
                >
                  <span
                    style={{
                      'font-size': '13px',
                      color: theme().colors.textMuted,
                    }}
                  >
                    National Average
                  </span>
                  <span
                    style={{
                      'font-size': '14px',
                      'font-weight': '600',
                      color: theme().colors.text,
                    }}
                  >
                    {formatCurrency(regionalData()!.nationalAverage.medianWage)}
                  </span>
                </div>
              </div>
            </Show>
          </Show>
        </div>
      </Show>

      {/* Footer with Source and Refresh */}
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          'padding-top': '12px',
          'border-top': '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '16px',
            'font-size': '11px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: theme().colors.textMuted,
          }}
        >
          <Show when={lastUpdated()}>
            <span>Data updated: {lastUpdated()}</span>
          </Show>
          <span>Source: Bureau of Labor Statistics</span>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing()}
          class="pipeline-btn"
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '6px',
            padding: '6px 12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${theme().colors.border}`,
            'border-radius': '8px',
            color: theme().colors.textMuted,
            'font-size': '12px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            cursor: isRefreshing() ? 'not-allowed' : 'pointer',
            opacity: isRefreshing() ? 0.6 : 1,
            transition: `all ${pipelineAnimations.fast}`,
          }}
          aria-label="Refresh labor market data"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            style={{
              animation: isRefreshing() ? 'spin 1s linear infinite' : 'none',
            }}
          >
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          {isRefreshing() ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Keyframes for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </FluidCard>
  );
};

export default LaborMarketWidget;
