/**
 * useTrendsData - SolidJS hook for trends analytics
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createMemo, Accessor } from 'solid-js';
import { JobApplication } from '../../../../../schemas/pipeline.schema';
import {
  TimeRange,
  TimeSeriesDataPoint,
  VelocityMetrics,
  ResponseTimeAnalytics,
  DistributionData,
  calculateTimeSeriesData,
  calculateVelocityMetrics,
  calculateResponseTimeAnalytics,
  calculateDistributionData,
} from '../trends-data';

export interface TrendsData {
  timeSeriesData: TimeSeriesDataPoint[];
  velocityMetrics: VelocityMetrics;
  responseTimeAnalytics: ResponseTimeAnalytics;
  distributionData: DistributionData;
  totalApplications: number;
  hasData: boolean;
}

/**
 * Hook to compute all trends data reactively
 */
export function useTrendsData(
  applications: Accessor<JobApplication[]>,
  timeRange: Accessor<TimeRange>
): Accessor<TrendsData> {
  return createMemo(() => {
    const apps = applications();
    const range = timeRange();

    // Calculate all metrics
    const timeSeriesData = calculateTimeSeriesData(apps, range);
    const velocityMetrics = calculateVelocityMetrics(apps, range);
    const responseTimeAnalytics = calculateResponseTimeAnalytics(apps);
    const distributionData = calculateDistributionData(apps);

    return {
      timeSeriesData,
      velocityMetrics,
      responseTimeAnalytics,
      distributionData,
      totalApplications: apps.length,
      hasData: apps.length > 0,
    };
  });
}
