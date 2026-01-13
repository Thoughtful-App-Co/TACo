import { Component, JSX } from 'solid-js';

/**
 * DoodleIcons - Hand-drawn style icons inspired by Khushmeen's Doodle Icons
 * https://khushmeen.com/icons.html
 *
 * These are custom SVG implementations with a sketchy, hand-drawn aesthetic
 * that matches the TACo brand philosophy of human-first, artistic design.
 */

interface IconProps {
  size?: number;
  color?: string;
  style?: JSX.CSSProperties;
  class?: string;
}

// Heart icon - for Human Good / Community
export const DoodleHeart: Component<IconProps> = (props) => {
  const size = () => props.size || 24;
  return (
    <svg
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      style={props.style}
      class={props.class}
    >
      <path
        d="M12 21C12 21 3 14 3 8.5C3 5 5.5 3 8 3C9.5 3 11 4 12 5.5C13 4 14.5 3 16 3C18.5 3 21 5 21 8.5C21 14 12 21 12 21Z"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
        style={{ 'stroke-dasharray': '0.5 0', 'stroke-linecap': 'round' }}
      />
      <path
        d="M12 5.5C12.2 5.8 12.5 6.2 12.3 6.5"
        stroke={props.color || 'currentColor'}
        stroke-width="1"
        stroke-linecap="round"
        opacity="0.6"
      />
    </svg>
  );
};

// Shield/Lock icon - for Local-First / Privacy
export const DoodleShield: Component<IconProps> = (props) => {
  const size = () => props.size || 24;
  return (
    <svg
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      style={props.style}
      class={props.class}
    >
      <path
        d="M12 3L4 7V12C4 16.5 7.5 20.5 12 21.5C16.5 20.5 20 16.5 20 12V7L12 3Z"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <path
        d="M9 12L11 14L15 10"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M12 3.2C12.1 3.1 12.3 3.2 12.2 3.3"
        stroke={props.color || 'currentColor'}
        stroke-width="0.8"
        stroke-linecap="round"
        opacity="0.4"
      />
    </svg>
  );
};

// Sparkle/Magic icon - for Anti-Dark Patterns / Good Design
export const DoodleSparkle: Component<IconProps> = (props) => {
  const size = () => props.size || 24;
  return (
    <svg
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      style={props.style}
      class={props.class}
    >
      <path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <path
        d="M19 15L19.5 17L21.5 17.5L19.5 18L19 20L18.5 18L16.5 17.5L18.5 17L19 15Z"
        stroke={props.color || 'currentColor'}
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <path
        d="M5 18L5.3 19.3L6.5 19.5L5.3 19.7L5 21L4.7 19.7L3.5 19.5L4.7 19.3L5 18Z"
        stroke={props.color || 'currentColor'}
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
    </svg>
  );
};

// People/Community icon - for Open Contribution
export const DoodlePeople: Component<IconProps> = (props) => {
  const size = () => props.size || 24;
  return (
    <svg
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      style={props.style}
      class={props.class}
    >
      {/* Person 1 */}
      <circle
        cx="8"
        cy="7"
        r="3"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        fill="none"
      />
      <path
        d="M3 21V18C3 16 5 14 8 14C11 14 13 16 13 18V21"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        fill="none"
      />
      {/* Person 2 */}
      <circle
        cx="17"
        cy="8"
        r="2.5"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        fill="none"
      />
      <path
        d="M14 21V19C14 17.5 15 16 17 15.5C19 16 20 17.5 20 19V21"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        fill="none"
      />
      {/* Sketchy accent */}
      <path
        d="M8 4.2C8.1 4.1 8.2 4.2 8.1 4.3"
        stroke={props.color || 'currentColor'}
        stroke-width="0.6"
        opacity="0.3"
      />
    </svg>
  );
};

// Lightbulb icon - for Ideas / Innovation
export const DoodleLightbulb: Component<IconProps> = (props) => {
  const size = () => props.size || 24;
  return (
    <svg
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      style={props.style}
      class={props.class}
    >
      <path
        d="M12 2C8 2 5 5 5 9C5 12 7 14 8 15.5V18C8 19.5 9.5 21 12 21C14.5 21 16 19.5 16 18V15.5C17 14 19 12 19 9C19 5 16 2 12 2Z"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <path
        d="M9 18H15"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <path
        d="M10 21H14"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
      />
      {/* Rays */}
      <path
        d="M12 0V1M4 9H3M21 9H20M5.5 3.5L4.5 2.5M18.5 3.5L19.5 2.5"
        stroke={props.color || 'currentColor'}
        stroke-width="1.2"
        stroke-linecap="round"
        opacity="0.7"
      />
    </svg>
  );
};

// Rocket icon - for Launch / Progress
export const DoodleRocket: Component<IconProps> = (props) => {
  const size = () => props.size || 24;
  return (
    <svg
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      style={props.style}
      class={props.class}
    >
      <path
        d="M12 2C12 2 8 6 8 14L5 17L7 19L10 16C10 16 11 18 12 22C13 18 14 16 14 16L17 19L19 17L16 14C16 6 12 2 12 2Z"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <circle
        cx="12"
        cy="10"
        r="2"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        fill="none"
      />
      {/* Exhaust */}
      <path
        d="M10 19C10 20 11 21 12 21.5C13 21 14 20 14 19"
        stroke={props.color || 'currentColor'}
        stroke-width="1"
        stroke-linecap="round"
        opacity="0.6"
      />
    </svg>
  );
};

// Phone icon - for Phone as Server
export const DoodlePhone: Component<IconProps> = (props) => {
  const size = () => props.size || 24;
  return (
    <svg
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      style={props.style}
      class={props.class}
    >
      <rect
        x="6"
        y="2"
        width="12"
        height="20"
        rx="2"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        fill="none"
      />
      <path
        d="M10 5H14"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <circle
        cx="12"
        cy="18"
        r="1.5"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        fill="none"
      />
      {/* Arrows pointing outward - "serving" */}
      <path
        d="M3 10L5 12L3 14M21 10L19 12L21 14"
        stroke={props.color || 'currentColor'}
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.7"
      />
    </svg>
  );
};

// Palette icon - for Design / Artistic
export const DoodlePalette: Component<IconProps> = (props) => {
  const size = () => props.size || 24;
  return (
    <svg
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      style={props.style}
      class={props.class}
    >
      <path
        d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C13.5 22 14.5 21 14.5 19.5C14.5 18.8 14.2 18.2 13.8 17.8C13.4 17.4 13.1 16.8 13.1 16.2C13.1 14.7 14.3 13.5 15.8 13.5H18C20.2 13.5 22 11.7 22 9.5C22 5.4 17.5 2 12 2Z"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      {/* Paint dots */}
      <circle cx="7.5" cy="11" r="1.5" fill={props.color || 'currentColor'} opacity="0.8" />
      <circle cx="10" cy="7" r="1.5" fill={props.color || 'currentColor'} opacity="0.6" />
      <circle cx="15" cy="7" r="1.5" fill={props.color || 'currentColor'} opacity="0.7" />
      <circle cx="7.5" cy="15" r="1.5" fill={props.color || 'currentColor'} opacity="0.5" />
    </svg>
  );
};

// Compass icon - for Blue Ocean / Direction
export const DoodleCompass: Component<IconProps> = (props) => {
  const size = () => props.size || 24;
  return (
    <svg
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      style={props.style}
      class={props.class}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        fill="none"
      />
      <path
        d="M16.5 7.5L14 14L7.5 16.5L10 10L16.5 7.5Z"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <circle
        cx="12"
        cy="12"
        r="1.5"
        stroke={props.color || 'currentColor'}
        stroke-width="1.2"
        fill="none"
      />
      {/* Direction marks */}
      <path
        d="M12 4V5M12 19V20M4 12H5M19 12H20"
        stroke={props.color || 'currentColor'}
        stroke-width="1"
        stroke-linecap="round"
        opacity="0.5"
      />
    </svg>
  );
};

// Handshake icon - for Partnership / Sponsors
export const DoodleHandshake: Component<IconProps> = (props) => {
  const size = () => props.size || 24;
  return (
    <svg
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      style={props.style}
      class={props.class}
    >
      <path
        d="M2 11L6 7L10 9L14 5L18 7L22 11"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <path
        d="M6 11V17L10 19L14 17V11"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <path
        d="M14 11V17L18 15V11"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      {/* Clasp detail */}
      <path
        d="M10 13L12 15L14 13"
        stroke={props.color || 'currentColor'}
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

// Code/Terminal icon - for Open Source
export const DoodleCode: Component<IconProps> = (props) => {
  const size = () => props.size || 24;
  return (
    <svg
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      style={props.style}
      class={props.class}
    >
      <path
        d="M8 6L3 12L8 18"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <path
        d="M16 6L21 12L16 18"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <path
        d="M14 4L10 20"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        fill="none"
      />
      {/* Sketchy accents */}
      <path
        d="M3.2 12.1C3.1 12 3.2 12.2 3.1 12.1"
        stroke={props.color || 'currentColor'}
        stroke-width="0.5"
        opacity="0.3"
      />
    </svg>
  );
};

// Leaf/Plant icon - for Growth / Natural lifecycle
export const DoodleLeaf: Component<IconProps> = (props) => {
  const size = () => props.size || 24;
  return (
    <svg
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      style={props.style}
      class={props.class}
    >
      <path
        d="M12 22V12M12 12C12 12 6 14 4 8C4 8 10 4 12 2C14 4 20 8 20 8C18 14 12 12 12 12Z"
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      {/* Leaf veins */}
      <path
        d="M12 8L9 11M12 8L15 11"
        stroke={props.color || 'currentColor'}
        stroke-width="1"
        stroke-linecap="round"
        opacity="0.6"
      />
    </svg>
  );
};

// Export all icons
export const DoodleIcons = {
  Heart: DoodleHeart,
  Shield: DoodleShield,
  Sparkle: DoodleSparkle,
  People: DoodlePeople,
  Lightbulb: DoodleLightbulb,
  Rocket: DoodleRocket,
  Phone: DoodlePhone,
  Palette: DoodlePalette,
  Compass: DoodleCompass,
  Handshake: DoodleHandshake,
  Code: DoodleCode,
  Leaf: DoodleLeaf,
};

export default DoodleIcons;
