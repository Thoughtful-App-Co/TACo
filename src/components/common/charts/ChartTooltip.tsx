/**
 * ChartTooltip - Portal-based tooltip with collision detection
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, JSX } from 'solid-js';
import { Portal } from 'solid-js/web';
import { ChartTheme, TooltipPosition } from './types';

interface ChartTooltipProps {
  show: boolean;
  position: TooltipPosition;
  theme: ChartTheme;
  accentColor?: string;
  children: JSX.Element;
}

export const ChartTooltip: Component<ChartTooltipProps> = (props) => {
  const accentColor = () => props.accentColor || props.theme.colors.primary;

  return (
    <Portal>
      <Show when={props.show}>
        <div
          style={{
            position: 'fixed',
            left: `${props.position.x}px`,
            top: `${props.position.y}px`,
            transform: props.position.isBelow ? 'translate(-50%, 0%)' : 'translate(-50%, -100%)',
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.9)',
            border: `1px solid ${accentColor()}40`,
            'border-radius': '6px',
            'pointer-events': 'none',
            'z-index': 10000,
            'white-space': 'nowrap',
            'font-family': props.theme.fonts.body,
          }}
        >
          {props.children}
        </div>
      </Show>
    </Portal>
  );
};

/**
 * Calculate tooltip position with collision detection
 */
export function calculateTooltipPosition(
  event: MouseEvent,
  tooltipHeight: number = 80,
  offset: number = 12
): TooltipPosition {
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  const spaceTop = mouseY;
  const isBelow = spaceTop < tooltipHeight + offset;

  return {
    x: mouseX,
    y: isBelow ? mouseY + offset : mouseY - offset,
    isBelow,
  };
}

export default ChartTooltip;
