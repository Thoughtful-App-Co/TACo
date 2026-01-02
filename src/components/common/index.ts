/**
 * Common Components - Shared UI components across the application
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

export {
  RegionUnavailableMessage,
  isLaborMarketAvailable,
  getSupportedRegionName,
  type RegionUnavailableMessageProps,
} from './RegionUnavailableMessage';

// Chart components
export { LineChart, ChartTooltip, calculateTooltipPosition } from './charts';
export type {
  ChartTheme,
  LineChartDataPoint,
  LineChartConfig,
  OverlayLine,
  TooltipPosition,
} from './charts';
