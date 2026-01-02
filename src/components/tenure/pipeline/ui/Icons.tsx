/**
 * Pipeline Icons - SVG icon components for Pipeline UI
 * Following maximalist design language with duotone support
 *
 * Duotone Design Philosophy (based on monochroism.mdc):
 * - Primary color: Main strokes and dominant elements
 * - Secondary color: Accent fills and supporting elements
 * - Creates visual depth through constraint of two tones
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component } from 'solid-js';

interface IconProps {
  size?: number;
  color?: string;
  class?: string;
}

// Duotone icon props - supports two-color styling based on RIASEC theme
interface DuotoneIconProps extends IconProps {
  primaryColor?: string; // Main stroke color (derived from RIASEC primary)
  secondaryColor?: string; // Accent/fill color (derived from RIASEC secondary)
  opacity?: number; // Secondary color opacity for depth
}

// Pipeline / Target icon
export const IconPipeline: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// Briefcase / Job icon
export const IconBriefcase: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

// User / Profile icon
export const IconUser: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Plus / Add icon
export const IconPlus: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Sync / Refresh icon
export const IconSync: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

// Grid / Dashboard icon
export const IconGrid: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

// List icon
export const IconList: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

// Clock / Time icon
export const IconClock: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// Check / Success icon
export const IconCheck: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Check Circle icon - for success confirmations
export const IconCheckCircle: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

// X / Close icon
export const IconX: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Alert / Warning icon
export const IconAlert: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Send / Applied icon
export const IconSend: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// Sparkles / Magic icon - for Resume Wizard
export const IconSparkles: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M19 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
    <path d="M5 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
  </svg>
);

// Search / Screening icon
export const IconSearch: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// Message / Interview icon
export const IconMessage: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// Star / Offer icon
export const IconStar: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Bookmark / Saved icon
export const IconBookmark: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

// Download / Export icon
export const IconDownload: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// Upload / Import icon
export const IconUpload: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

// Copy icon
export const IconCopy: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

// Key / API icon
export const IconKey: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

// FileText / Document icon
export const IconFileText: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// Zap / Skills icon
export const IconZap: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

// TrendingUp / Score icon
export const IconTrendingUp: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

// ChevronRight icon
export const IconChevronRight: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Chevron left icon
export const IconChevronLeft: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// ChevronUp icon
export const IconChevronUp: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

// ChevronDown icon
export const IconChevronDown: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// External link icon
export const IconExternalLink: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// Lightbulb / Suggestion icon
export const IconLightbulb: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
  </svg>
);

// Link / URL icon
export const IconLink: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

// Edit / Pencil icon
export const IconEdit: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// Settings / Gear icon
export const IconSettings: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// Loader / Spinner icon
export const IconLoader: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);

// Trash / Delete icon
export const IconTrash: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

// =============================================================================
// DUOTONE ICONS - Use RIASEC primary/secondary colors for visual depth
// =============================================================================

// Duotone Pipeline / Target icon - concentric circles with depth
export const IconPipelineDuotone: Component<DuotoneIconProps> = (props) => {
  const primary = () => props.primaryColor || props.color || 'currentColor';
  const secondary = () => props.secondaryColor || primary();
  const opacity = () => props.opacity || 0.4;

  return (
    <svg
      width={props.size || 20}
      height={props.size || 20}
      viewBox="0 0 24 24"
      fill="none"
      class={props.class}
    >
      {/* Outer ring - secondary color with fill */}
      <circle
        cx="12"
        cy="12"
        r="10"
        fill={secondary()}
        fill-opacity={opacity()}
        stroke={primary()}
        stroke-width="2"
      />
      {/* Middle ring - primary stroke only */}
      <circle
        cx="12"
        cy="12"
        r="6"
        fill="none"
        stroke={primary()}
        stroke-width="2"
        stroke-opacity="0.8"
      />
      {/* Inner dot - primary filled */}
      <circle cx="12" cy="12" r="2" fill={primary()} />
    </svg>
  );
};

// Duotone Briefcase icon - body and handle with two tones
export const IconBriefcaseDuotone: Component<DuotoneIconProps> = (props) => {
  const primary = () => props.primaryColor || props.color || 'currentColor';
  const secondary = () => props.secondaryColor || primary();
  const opacity = () => props.opacity || 0.3;

  return (
    <svg
      width={props.size || 20}
      height={props.size || 20}
      viewBox="0 0 24 24"
      fill="none"
      class={props.class}
    >
      {/* Main body - secondary fill */}
      <rect
        x="2"
        y="7"
        width="20"
        height="14"
        rx="2"
        ry="2"
        fill={secondary()}
        fill-opacity={opacity()}
        stroke={primary()}
        stroke-width="2"
      />
      {/* Handle - primary stroke */}
      <path
        d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
        stroke={primary()}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

// Duotone User icon - body and head with depth
export const IconUserDuotone: Component<DuotoneIconProps> = (props) => {
  const primary = () => props.primaryColor || props.color || 'currentColor';
  const secondary = () => props.secondaryColor || primary();
  const opacity = () => props.opacity || 0.35;

  return (
    <svg
      width={props.size || 20}
      height={props.size || 20}
      viewBox="0 0 24 24"
      fill="none"
      class={props.class}
    >
      {/* Body - secondary fill */}
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        fill={secondary()}
        fill-opacity={opacity()}
        stroke={primary()}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      {/* Head - primary stroke and fill */}
      <circle
        cx="12"
        cy="7"
        r="4"
        fill={secondary()}
        fill-opacity={opacity() * 1.5}
        stroke={primary()}
        stroke-width="2"
      />
    </svg>
  );
};

// Duotone Star icon - filled with glow effect
export const IconStarDuotone: Component<DuotoneIconProps> = (props) => {
  const primary = () => props.primaryColor || props.color || 'currentColor';
  const secondary = () => props.secondaryColor || primary();
  const opacity = () => props.opacity || 0.4;

  return (
    <svg
      width={props.size || 20}
      height={props.size || 20}
      viewBox="0 0 24 24"
      fill="none"
      class={props.class}
    >
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        fill={secondary()}
        fill-opacity={opacity()}
        stroke={primary()}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

// Duotone Send/Applied icon
export const IconSendDuotone: Component<DuotoneIconProps> = (props) => {
  const primary = () => props.primaryColor || props.color || 'currentColor';
  const secondary = () => props.secondaryColor || primary();
  const opacity = () => props.opacity || 0.35;

  return (
    <svg
      width={props.size || 20}
      height={props.size || 20}
      viewBox="0 0 24 24"
      fill="none"
      class={props.class}
    >
      <polygon
        points="22 2 15 22 11 13 2 9 22 2"
        fill={secondary()}
        fill-opacity={opacity()}
        stroke={primary()}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <line
        x1="22"
        y1="2"
        x2="11"
        y2="13"
        stroke={primary()}
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  );
};

// Duotone Message/Interview icon
export const IconMessageDuotone: Component<DuotoneIconProps> = (props) => {
  const primary = () => props.primaryColor || props.color || 'currentColor';
  const secondary = () => props.secondaryColor || primary();
  const opacity = () => props.opacity || 0.35;

  return (
    <svg
      width={props.size || 20}
      height={props.size || 20}
      viewBox="0 0 24 24"
      fill="none"
      class={props.class}
    >
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        fill={secondary()}
        fill-opacity={opacity()}
        stroke={primary()}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

// Duotone Clock/Time icon
export const IconClockDuotone: Component<DuotoneIconProps> = (props) => {
  const primary = () => props.primaryColor || props.color || 'currentColor';
  const secondary = () => props.secondaryColor || primary();
  const opacity = () => props.opacity || 0.25;

  return (
    <svg
      width={props.size || 20}
      height={props.size || 20}
      viewBox="0 0 24 24"
      fill="none"
      class={props.class}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill={secondary()}
        fill-opacity={opacity()}
        stroke={primary()}
        stroke-width="2"
      />
      <polyline
        points="12 6 12 12 16 14"
        stroke={primary()}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

// Duotone TrendingUp/Flow icon
export const IconTrendingUpDuotone: Component<DuotoneIconProps> = (props) => {
  const primary = () => props.primaryColor || props.color || 'currentColor';
  const secondary = () => props.secondaryColor || primary();

  return (
    <svg
      width={props.size || 20}
      height={props.size || 20}
      viewBox="0 0 24 24"
      fill="none"
      class={props.class}
    >
      {/* Arrow head - secondary */}
      <polyline
        points="17 6 23 6 23 12"
        stroke={secondary()}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-opacity="0.7"
      />
      {/* Main line - primary */}
      <polyline
        points="23 6 13.5 15.5 8.5 10.5 1 18"
        stroke={primary()}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

// Duotone Zap/Skills icon
export const IconZapDuotone: Component<DuotoneIconProps> = (props) => {
  const primary = () => props.primaryColor || props.color || 'currentColor';
  const secondary = () => props.secondaryColor || primary();
  const opacity = () => props.opacity || 0.4;

  return (
    <svg
      width={props.size || 20}
      height={props.size || 20}
      viewBox="0 0 24 24"
      fill="none"
      class={props.class}
    >
      <polygon
        points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
        fill={secondary()}
        fill-opacity={opacity()}
        stroke={primary()}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

// Duotone Settings/Gear icon
export const IconSettingsDuotone: Component<DuotoneIconProps> = (props) => {
  const primary = () => props.primaryColor || props.color || 'currentColor';
  const secondary = () => props.secondaryColor || primary();
  const opacity = () => props.opacity || 0.3;

  return (
    <svg
      width={props.size || 20}
      height={props.size || 20}
      viewBox="0 0 24 24"
      fill="none"
      class={props.class}
    >
      {/* Center circle - secondary fill */}
      <circle
        cx="12"
        cy="12"
        r="3"
        fill={secondary()}
        fill-opacity={opacity() * 2}
        stroke={primary()}
        stroke-width="2"
      />
      {/* Gear teeth - primary */}
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={primary()}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill={secondary()}
        fill-opacity={opacity()}
      />
    </svg>
  );
};

// =============================================================================
// SORT AND FILTER ICONS
// =============================================================================

// Sort Ascending icon
export const IconSortAsc: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M11 5h10" />
    <path d="M11 9h7" />
    <path d="M11 13h4" />
    <path d="M3 17l3 3 3-3" />
    <path d="M6 18V4" />
  </svg>
);

// Sort Descending icon
export const IconSortDesc: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M11 5h4" />
    <path d="M11 9h7" />
    <path d="M11 13h10" />
    <path d="M3 7l3-3 3 3" />
    <path d="M6 6v14" />
  </svg>
);

// Arrow Up Down icon (for sort toggle)
export const IconArrowUpDown: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="m21 16-4 4-4-4" />
    <path d="M17 20V4" />
    <path d="m3 8 4-4 4 4" />
    <path d="M7 4v16" />
  </svg>
);

// Filter icon
export const IconFilter: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

// GripVertical / Drag Handle icon
export const IconGripVertical: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);

// Chart Bar / Analytics icon
export const IconChartBar: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

// Target / Bullseye icon
export const IconTarget: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// Brain / Intelligence icon
export const IconBrain: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);

// Mindmap / Network icon
export const IconMindmap: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <circle cx="12" cy="12" r="2" />
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="6" r="2" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
    <line x1="12" y1="10" x2="12" y2="14" />
    <line x1="10.59" y1="10.59" x2="7.41" y2="7.41" />
    <line x1="13.41" y1="10.59" x2="16.59" y2="7.41" />
    <line x1="10.59" y1="13.41" x2="7.41" y2="16.59" />
    <line x1="13.41" y1="13.41" x2="16.59" y2="16.59" />
  </svg>
);

// Compass / Navigation icon
export const IconCompass: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

// Trophy / Achievement icon
export const IconTrophy: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

// Users / Team icon
export const IconUsers: Component<IconProps> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default {
  IconPipeline,
  IconBriefcase,
  IconUser,
  IconPlus,
  IconSync,
  IconGrid,
  IconList,
  IconClock,
  IconCheck,
  IconCheckCircle,
  IconX,
  IconAlert,
  IconSend,
  IconSearch,
  IconMessage,
  IconStar,
  IconBookmark,
  IconDownload,
  IconUpload,
  IconCopy,
  IconKey,
  IconFileText,
  IconZap,
  IconTrendingUp,
  IconChevronRight,
  IconChevronLeft,
  IconChevronUp,
  IconChevronDown,
  IconExternalLink,
  IconLightbulb,
  IconLink,
  IconEdit,
  IconSettings,
  IconLoader,
  IconTrash,
  IconSortAsc,
  IconSortDesc,
  IconArrowUpDown,
  IconFilter,
  IconGripVertical,
  IconSparkles,
  IconChartBar,
  IconTarget,
  IconBrain,
  IconMindmap,
  IconCompass,
  IconTrophy,
  IconUsers,
};
