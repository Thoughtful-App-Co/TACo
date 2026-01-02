/**
 * RegionUnavailableMessage - User-friendly notice for unavailable labor market data
 *
 * Displays a helpful, non-intrusive message when labor market features aren't
 * available for a user's region. Provides transparency about current coverage
 * and future expansion plans.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show } from 'solid-js';
import { semanticColors } from '../../theme/semantic-colors';

// ============================================================================
// TYPES
// ============================================================================

export interface RegionUnavailableMessageProps {
  /** User's country code (ISO 3166-1 alpha-2) */
  countryCode: string;
  /** User's country name for display */
  countryName: string;
  /** Compact mode for inline display */
  compact?: boolean;
  /** Custom message override */
  customMessage?: string;
  /** Show supported regions list (default: true in full mode) */
  showSupportedRegions?: boolean;
  /** Additional CSS class for customization */
  class?: string;
}

// ============================================================================
// SUPPORTED REGIONS DATA
// ============================================================================

/**
 * Currently supported regions with data providers
 */
const SUPPORTED_REGIONS = [
  {
    name: 'United States',
    code: 'US',
    provider: 'Bureau of Labor Statistics (BLS)',
    available: true,
  },
] as const;

/**
 * Regions in development pipeline
 */
const COMING_SOON_REGIONS = [
  {
    name: 'European Union',
    provider: 'Eurostat',
  },
  {
    name: 'Canada',
    provider: 'Statistics Canada',
  },
  {
    name: 'United Kingdom',
    provider: 'Office for National Statistics',
  },
  {
    name: 'Australia',
    provider: 'Australian Bureau of Statistics',
  },
] as const;

// ============================================================================
// COMPONENT
// ============================================================================

export const RegionUnavailableMessage: Component<RegionUnavailableMessageProps> = (props) => {
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const showRegionsList = () => {
    if (props.compact) return false;
    return props.showSupportedRegions ?? true;
  };

  const message = () => {
    if (props.customMessage) return props.customMessage;

    if (props.compact) {
      return `Labor market data not available for ${props.countryName}. Currently US only.`;
    }

    return `We don't currently have labor market data for ${props.countryName}. We're working on expanding our coverage globally.`;
  };

  // ============================================================================
  // STYLES
  // ============================================================================

  const containerStyles = () => ({
    display: 'flex',
    'flex-direction': 'column' as const,
    gap: props.compact ? '0' : '16px',
    padding: props.compact ? '10px 14px' : '18px 20px',
    background: semanticColors.info.bg,
    border: `1px solid ${semanticColors.info.border}`,
    'border-radius': props.compact ? '8px' : '12px',
    color: semanticColors.info.dark,
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-size': props.compact ? '13px' : '14px',
    'line-height': '1.5',
  });

  const headerStyles = {
    display: 'flex',
    'align-items': 'center',
    gap: '10px',
    'font-weight': '600',
    'font-size': '15px',
    color: semanticColors.info.base,
    margin: '0',
  } as const;

  const iconStyles = {
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'flex-shrink': '0',
  } as const;

  const messageStyles = {
    color: semanticColors.info.dark,
    margin: '0',
    'line-height': '1.6',
  } as const;

  const sectionTitleStyles = {
    'font-weight': '600',
    'font-size': '13px',
    color: semanticColors.info.dark,
    'margin-top': '8px',
    'margin-bottom': '8px',
    'text-transform': 'uppercase' as const,
    'letter-spacing': '0.025em',
    opacity: '0.9',
  } as const;

  const listStyles = {
    display: 'flex',
    'flex-direction': 'column' as const,
    gap: '6px',
    margin: '0',
    padding: '0 0 0 6px',
    'list-style': 'none',
  } as const;

  const listItemStyles = {
    display: 'flex',
    'align-items': 'flex-start',
    gap: '10px',
    'font-size': '13px',
    'line-height': '1.5',
  } as const;

  const bulletStyles = {
    display: 'flex',
    'align-items': 'center',
    'margin-top': '2px',
    'flex-shrink': '0',
  } as const;

  const providerStyles = {
    color: semanticColors.info.base,
    opacity: '0.75',
    'font-size': '12px',
  } as const;

  const compactContainerStyles = () => ({
    display: 'flex',
    'align-items': 'center',
    gap: '8px',
    padding: '10px 14px',
    background: semanticColors.info.bg,
    border: `1px solid ${semanticColors.info.border}`,
    'border-radius': '8px',
    color: semanticColors.info.dark,
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-size': '13px',
    'line-height': '1.5',
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Show
      when={!props.compact}
      fallback={
        <div
          class={props.class}
          style={compactContainerStyles()}
          role="status"
          aria-live="polite"
          aria-label="Region availability notice"
        >
          <span style={iconStyles} aria-hidden="true">
            ℹ️
          </span>
          <span>{message()}</span>
        </div>
      }
    >
      <div
        class={props.class}
        style={containerStyles()}
        role="status"
        aria-live="polite"
        aria-labelledby="region-unavailable-heading"
      >
        {/* Header */}
        <h3 id="region-unavailable-heading" style={headerStyles}>
          <span style={iconStyles} aria-hidden="true">
            🌍
          </span>
          Labor Market Data Not Yet Available
        </h3>

        {/* Message */}
        <p style={messageStyles}>{message()}</p>

        {/* Supported Regions List */}
        <Show when={showRegionsList()}>
          {/* Currently Supported */}
          <div>
            <div style={sectionTitleStyles}>Currently Supported:</div>
            <ul style={listStyles}>
              {SUPPORTED_REGIONS.map((region) => (
                <li style={listItemStyles}>
                  <span style={bulletStyles} aria-hidden="true">
                    <svg
                      width="6"
                      height="6"
                      viewBox="0 0 6 6"
                      fill={semanticColors.info.base}
                      aria-hidden="true"
                    >
                      <circle cx="3" cy="3" r="3" />
                    </svg>
                  </span>
                  <div>
                    <strong>{region.name}</strong>
                    <div style={providerStyles}>({region.provider})</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Coming Soon */}
          <div>
            <div style={sectionTitleStyles}>Coming Soon:</div>
            <ul style={listStyles}>
              {COMING_SOON_REGIONS.map((region) => (
                <li style={listItemStyles}>
                  <span style={bulletStyles} aria-hidden="true">
                    <svg
                      width="6"
                      height="6"
                      viewBox="0 0 6 6"
                      fill={semanticColors.info.light}
                      opacity="0.5"
                      aria-hidden="true"
                    >
                      <circle cx="3" cy="3" r="3" />
                    </svg>
                  </span>
                  <div>
                    <span style={{ opacity: '0.85' }}>{region.name}</span>
                    <div style={providerStyles}>({region.provider})</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Show>
      </div>
    </Show>
  );
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if labor market data is available for a country code
 */
export function isLaborMarketAvailable(countryCode: string): boolean {
  return SUPPORTED_REGIONS.some(
    (region) => region.code === countryCode.toUpperCase() && region.available
  );
}

/**
 * Get human-readable name for supported region
 */
export function getSupportedRegionName(countryCode: string): string | null {
  const region = SUPPORTED_REGIONS.find((r) => r.code === countryCode.toUpperCase());
  return region ? region.name : null;
}

export default RegionUnavailableMessage;
