/**
 * InfoTooltip - Hoverable info icon with explanatory tooltip
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { useTenureTheme } from '../../../TenureThemeProvider';

interface InfoTooltipProps {
  title: string;
  description: string;
  importance: string;
}

export const InfoTooltip: Component<InfoTooltipProps> = (props) => {
  const theme = useTenureTheme();
  const [isOpen, setIsOpen] = createSignal(false);
  const [buttonRef, setButtonRef] = createSignal<HTMLButtonElement>();
  const [tooltipPosition, setTooltipPosition] = createSignal({ x: 0, y: 0 });

  const updatePosition = () => {
    const button = buttonRef();
    if (button) {
      const rect = button.getBoundingClientRect();

      // Calculate center-biased position
      const viewportWidth = window.innerWidth;
      const centerX = viewportWidth / 2;

      // Element center position
      const elementCenterX = rect.left + rect.width / 2;

      // Tooltip dimensions
      const tooltipWidth = 320;

      // Check available space
      const spaceLeft = rect.left;
      const spaceRight = viewportWidth - rect.right;

      let x = elementCenterX;

      // Horizontal positioning: bias toward center
      if (elementCenterX < centerX) {
        // Element is on left side of screen - position toward center (right bias)
        if (spaceRight >= tooltipWidth / 2) {
          x = Math.min(elementCenterX + tooltipWidth / 4, centerX);
        }
      } else {
        // Element is on right side of screen - position toward center (left bias)
        if (spaceLeft >= tooltipWidth / 2) {
          x = Math.max(elementCenterX - tooltipWidth / 4, centerX);
        }
      }

      setTooltipPosition({
        x,
        y: rect.top,
      });
    }
  };

  return (
    <>
      {/* Info Icon Button */}
      <button
        ref={setButtonRef}
        onMouseEnter={(e) => {
          updatePosition();
          setIsOpen(true);
          e.currentTarget.style.background = `${theme.colors.primary}30`;
          e.currentTarget.style.borderColor = `${theme.colors.primary}99`;
        }}
        onMouseLeave={(e) => {
          setIsOpen(false);
          e.currentTarget.style.background = `${theme.colors.primary}20`;
          e.currentTarget.style.borderColor = `${theme.colors.primary}66`;
        }}
        onClick={() => {
          updatePosition();
          setIsOpen(!isOpen());
        }}
        aria-label="More information"
        style={{
          width: '20px',
          height: '20px',
          'border-radius': '50%',
          border: `1.5px solid ${theme.colors.primary}66`,
          background: `${theme.colors.primary}20`,
          color: theme.colors.primary,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          cursor: 'help',
          transition: `all ${theme.animations.fast}`,
          'font-size': '12px',
          'font-family': theme.fonts.body,
          'font-weight': '700',
          padding: 0,
        }}
      >
        i
      </button>

      {/* Tooltip Popup - rendered in portal to avoid clipping */}
      <Portal>
        <Show when={isOpen()}>
          <div
            style={{
              position: 'fixed',
              left: `${tooltipPosition().x}px`,
              top: `${tooltipPosition().y}px`,
              transform: 'translate(-50%, calc(-100% - 12px))',
              width: '320px',
              padding: '16px',
              background: 'rgba(10, 10, 15, 0.98)',
              border: `1px solid ${theme.colors.primary}50`,
              'border-radius': '12px',
              'box-shadow': `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px ${theme.colors.primary}30`,
              'backdrop-filter': 'blur(8px)',
              'z-index': 10000,
              animation: `tooltipFadeIn ${theme.animations.fast}`,
              'pointer-events': 'none',
            }}
          >
            {/* Arrow */}
            <div
              style={{
                position: 'absolute',
                bottom: '-6px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '12px',
                height: '12px',
                background: 'rgba(10, 10, 15, 0.98)',
                border: `1px solid ${theme.colors.primary}50`,
                'border-top': 'none',
                'border-left': 'none',
              }}
            />

            {/* Content */}
            <div style={{ position: 'relative', 'z-index': 1 }}>
              <h4
                style={{
                  margin: '0 0 8px',
                  'font-size': '14px',
                  'font-family': theme.fonts.heading,
                  'font-weight': '600',
                  color: theme.colors.primary,
                }}
              >
                {props.title}
              </h4>
              <p
                style={{
                  margin: '0 0 12px',
                  'font-size': '13px',
                  'font-family': theme.fonts.body,
                  color: theme.colors.text,
                  'line-height': '1.5',
                }}
              >
                {props.description}
              </p>
              <div
                style={{
                  padding: '8px 12px',
                  background: `${theme.colors.primary}15`,
                  border: `1px solid ${theme.colors.primary}30`,
                  'border-radius': '6px',
                }}
              >
                <div
                  style={{
                    'font-size': '11px',
                    'font-family': theme.fonts.body,
                    color: theme.colors.textMuted,
                    'margin-bottom': '4px',
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.5px',
                  }}
                >
                  Why it matters
                </div>
                <div
                  style={{
                    'font-size': '12px',
                    'font-family': theme.fonts.body,
                    color: theme.colors.text,
                    'line-height': '1.4',
                  }}
                >
                  {props.importance}
                </div>
              </div>
            </div>
          </div>
        </Show>
      </Portal>

      <style>
        {`
          @keyframes tooltipFadeIn {
            from {
              opacity: 0;
              transform: translate(-50%, calc(-100% - 12px)) translateY(5px);
            }
            to {
              opacity: 1;
              transform: translate(-50%, calc(-100% - 12px)) translateY(0);
            }
          }
        `}
      </style>
    </>
  );
};

export default InfoTooltip;
