/**
 * Reusable Chart Types
 * Theme-agnostic interfaces for chart components
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

/**
 * Minimal theme interface that works with any theme system
 * (TenureTheme, ProsperTenure, liquid, etc.)
 */
export interface ChartTheme {
  colors: {
    primary: string;
    text: string;
    textMuted: string;
    background: string;
    border: string;
  };
  fonts: {
    body: string;
    heading: string;
  };
  animations: {
    fast: string;
    normal: string;
  };
}

/**
 * Generic data point for line charts
 */
export interface LineChartDataPoint<T = unknown> {
  x: Date | number;
  y: number;
  label?: string;
  data?: T; // Original data for tooltip/click handlers
}

/**
 * Line chart configuration
 */
export interface LineChartConfig {
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  showArea?: boolean; // Fill area under line
  showPoints?: boolean; // Show data point circles
  showGrid?: boolean; // Show horizontal grid lines
  curveSmooth?: boolean; // Use curveMonotoneX vs linear
  yAxisLabel?: string;
  xAxisLabel?: string;
  formatXTick?: (value: Date | number) => string;
  formatYTick?: (value: number) => string;
  lineColor?: string; // Override theme primary
  areaGradientOpacity?: [number, number]; // [top, bottom] e.g., [0.4, 0.05]
}

/**
 * Multi-line support for overlays (e.g., market comparison lines)
 */
export interface OverlayLine {
  id: string;
  data: LineChartDataPoint[];
  color: string;
  strokeWidth?: number;
  strokeDasharray?: string; // e.g., "6,3" for dashed
  label?: string;
}

/**
 * Tooltip position with collision info
 */
export interface TooltipPosition {
  x: number;
  y: number;
  isBelow: boolean;
}
