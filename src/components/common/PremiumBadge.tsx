/**
 * @file PremiumBadge.tsx
 * @description Visual indicator for premium features with multiple display variants
 * @copyright 2025 Shupp Technologies. All rights reserved.
 */

import { Component, Show, createMemo, JSX } from 'solid-js';

interface PremiumBadgeProps {
  feature: 'tenure_extras' | 'tempo_extras' | 'sync';
  variant?: 'badge' | 'overlay' | 'inline';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  onClick?: () => void;
}

const FEATURE_LABELS: Record<PremiumBadgeProps['feature'], string> = {
  tenure_extras: 'Tenure Pro',
  tempo_extras: 'Tempo Pro',
  sync: 'Sync Pro',
};

const LockIcon: Component<{ size: number }> = (props) => (
  <svg
    width={props.size}
    height={props.size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z"
      fill="currentColor"
      opacity="0.3"
    />
    <path
      d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
  </svg>
);

export const PremiumBadge: Component<PremiumBadgeProps> = (props) => {
  const variant = createMemo(() => props.variant ?? 'badge');
  const size = createMemo(() => props.size ?? 'sm');
  const showLabel = createMemo(() => props.showLabel ?? true);

  const iconSize = createMemo(() => (size() === 'sm' ? 12 : 16));
  const fontSize = createMemo(() => (size() === 'sm' ? '10px' : '12px'));
  const padding = createMemo(() => (size() === 'sm' ? '2px 6px' : '4px 10px'));

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (props.onClick) {
      props.onClick();
    }
  };

  const badgeStyles = createMemo(
    (): JSX.CSSProperties => ({
      display: 'inline-flex',
      'align-items': 'center',
      gap: size() === 'sm' ? '3px' : '5px',
      padding: padding(),
      'border-radius': '9999px',
      background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(99, 102, 241, 0.15))',
      border: '1px solid transparent',
      'background-clip': 'padding-box',
      position: 'relative',
      cursor: 'pointer',
      'font-size': fontSize(),
      'font-weight': '600',
      color: 'rgba(255, 255, 255, 0.8)',
      transition: 'all 0.2s ease',
    })
  );

  const badgeGradientBorder: JSX.CSSProperties = {
    position: 'absolute',
    inset: '-1px',
    'border-radius': '9999px',
    padding: '1px',
    background: 'linear-gradient(135deg, #9333EA, #6366F1)',
    '-webkit-mask': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    'mask-composite': 'exclude',
    'pointer-events': 'none',
  };

  const overlayStyles: JSX.CSSProperties = {
    position: 'absolute',
    inset: '0',
    display: 'flex',
    'flex-direction': 'column',
    'align-items': 'center',
    'justify-content': 'center',
    gap: '8px',
    background: 'rgba(0, 0, 0, 0.7)',
    'backdrop-filter': 'blur(4px)',
    'border-radius': '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    'z-index': '10',
  };

  const inlineStyles = createMemo(
    (): JSX.CSSProperties => ({
      display: 'inline-flex',
      'align-items': 'center',
      gap: size() === 'sm' ? '3px' : '5px',
      cursor: 'pointer',
      'font-size': fontSize(),
      'font-weight': '500',
      color: '#9333EA',
      transition: 'all 0.2s ease',
    })
  );

  const iconWrapperStyles: JSX.CSSProperties = {
    color: '#9333EA',
    display: 'flex',
    'align-items': 'center',
  };

  return (
    <>
      <Show when={variant() === 'badge'}>
        <span
          style={badgeStyles()}
          onClick={handleClick}
          title={`Upgrade to ${FEATURE_LABELS[props.feature]}`}
          role="button"
          tabindex="0"
        >
          <span style={badgeGradientBorder} />
          <span style={iconWrapperStyles}>
            <LockIcon size={iconSize()} />
          </span>
          <Show when={showLabel()}>
            <span>Pro</span>
          </Show>
        </span>
      </Show>

      <Show when={variant() === 'overlay'}>
        <div style={overlayStyles} onClick={handleClick} role="button" tabindex="0">
          <span style={{ color: '#9333EA' }}>
            <LockIcon size={32} />
          </span>
          <span
            style={{
              'font-size': '14px',
              'font-weight': '600',
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            Upgrade to unlock
          </span>
          <span
            style={{
              'font-size': '12px',
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            {FEATURE_LABELS[props.feature]}
          </span>
        </div>
      </Show>

      <Show when={variant() === 'inline'}>
        <span
          style={inlineStyles()}
          onClick={handleClick}
          title={`Upgrade to ${FEATURE_LABELS[props.feature]}`}
          role="button"
          tabindex="0"
        >
          <LockIcon size={iconSize()} />
          <Show when={showLabel()}>
            <span>Pro</span>
          </Show>
        </span>
      </Show>
    </>
  );
};

export default PremiumBadge;
