/**
 * Paper Trail - Category Icons
 * Geometric SVG icons matching construction paper pop aesthetic
 * Bold, sharp angles, high contrast, no curves
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component } from 'solid-js';

interface IconProps {
  size?: number;
  color?: string;
}

// Tech - Circuit board / Chip
export const TechIcon: Component<IconProps> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || '#000000'}
    stroke-width="2"
    stroke-linecap="square"
  >
    <rect x="6" y="6" width="12" height="12" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    <path d="M9 9h6v6H9z" fill={props.color || '#000000'} />
  </svg>
);

// Politics - Building / Capitol
export const PoliticsIcon: Component<IconProps> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || '#000000'}
    stroke-width="2"
    stroke-linecap="square"
  >
    <path d="M3 21h18M6 21V9l6-6 6 6v12" />
    <path d="M9 14h6v7H9z" fill={props.color || '#000000'} />
    <rect x="9" y="9" width="2" height="2" fill={props.color || '#000000'} />
    <rect x="13" y="9" width="2" height="2" fill={props.color || '#000000'} />
  </svg>
);

// Economy - Bar chart / Graph
export const EconomyIcon: Component<IconProps> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || '#000000'}
    stroke-width="2"
    stroke-linecap="square"
  >
    <path d="M3 3v18h18" />
    <rect x="7" y="12" width="3" height="6" fill={props.color || '#000000'} />
    <rect x="12" y="8" width="3" height="10" fill={props.color || '#000000'} />
    <rect x="17" y="5" width="3" height="13" fill={props.color || '#000000'} />
  </svg>
);

// Climate - Globe / Earth
export const ClimateIcon: Component<IconProps> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || '#000000'}
    stroke-width="2"
    stroke-linecap="square"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v18M3 12h18" />
    <path d="M7 7l10 10M17 7L7 17" stroke-width="1" />
  </svg>
);

// Health - Cross / Medical
export const HealthIcon: Component<IconProps> = (props) => (
  <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none">
    <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" fill={props.color || '#000000'} />
  </svg>
);

// War - Shield / Defense
export const WarIcon: Component<IconProps> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || '#000000'}
    stroke-width="2"
    stroke-linecap="square"
  >
    <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z" />
    <path d="M12 7v10M7 12h10" stroke-width="1.5" />
  </svg>
);

// Space - Rocket
export const SpaceIcon: Component<IconProps> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || '#000000'}
    stroke-width="2"
    stroke-linecap="square"
  >
    <path d="M12 2L8 10h8l-4-8z" fill={props.color || '#000000'} />
    <rect x="10" y="10" width="4" height="8" fill={props.color || '#000000'} />
    <path d="M7 18H5l2 4 5-2M17 18h2l-2 4-5-2" />
  </svg>
);

// Sports - Trophy / Medal
export const SportsIcon: Component<IconProps> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || '#000000'}
    stroke-width="2"
    stroke-linecap="square"
  >
    <path d="M6 8h12v4c0 3.3-2.7 6-6 6s-6-2.7-6-6V8z" />
    <path d="M8 6h8M11 18v3h2v-3M8 21h8" />
    <circle cx="12" cy="10" r="2" fill={props.color || '#000000'} />
  </svg>
);

// Entertainment - Film / Camera
export const EntertainmentIcon: Component<IconProps> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || '#000000'}
    stroke-width="2"
    stroke-linecap="square"
  >
    <rect x="2" y="6" width="20" height="12" />
    <path d="M7 6V3M12 6V3M17 6V3M7 18v3M12 18v3M17 18v3" />
    <rect x="7" y="9" width="10" height="6" fill={props.color || '#000000'} />
  </svg>
);

// Science - Beaker / Flask
export const ScienceIcon: Component<IconProps> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || '#000000'}
    stroke-width="2"
    stroke-linecap="square"
  >
    <path d="M9 3h6M10 3v7l-4 8h12l-4-8V3" />
    <path d="M6 18h12" />
    <circle cx="9" cy="15" r="1" fill={props.color || '#000000'} />
    <circle cx="15" cy="14" r="1" fill={props.color || '#000000'} />
  </svg>
);

// Default / Other - Document
export const DefaultIcon: Component<IconProps> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || '#000000'}
    stroke-width="2"
    stroke-linecap="square"
  >
    <path d="M14 2H6v20h12V8l-4-6z" />
    <path d="M14 2v6h6M9 12h6M9 16h6" />
  </svg>
);

// External Link Icon - Arrow pointing out
export const ExternalLinkIcon: Component<IconProps> = (props) => (
  <svg
    width={props.size || 16}
    height={props.size || 16}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2.5"
    stroke-linecap="square"
    stroke-linejoin="miter"
  >
    <path d="M18 13v6H6V7h6M15 3h6v6M10 14L21 3" />
  </svg>
);

// Icon map for easy access
export const CATEGORY_ICONS: Record<string, Component<IconProps>> = {
  'AI & Tech': TechIcon,
  Politics: PoliticsIcon,
  Economy: EconomyIcon,
  Climate: ClimateIcon,
  Health: HealthIcon,
  'War & Conflict': WarIcon,
  Space: SpaceIcon,
  Sports: SportsIcon,
  Entertainment: EntertainmentIcon,
  Science: ScienceIcon,
  Other: DefaultIcon,
};
