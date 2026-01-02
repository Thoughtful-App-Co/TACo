/**
 * Trends Data Layer - Time-series aggregation and analytics computations
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
  subDays,
  subMonths,
  differenceInDays,
  isWithinInterval,
} from 'date-fns';
import { JobApplication, ApplicationStatus } from '../../../../schemas/pipeline.schema';

export type TimeRange = '7d' | '30d' | '90d' | 'all';
export type TimeGranularity = 'day' | 'week' | 'month';

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  date: Date;
  count: number;
  applications: JobApplication[];
  label: string; // Formatted date string
}

/**
 * Velocity metrics for a time period
 */
export interface VelocityMetrics {
  applicationsPerWeek: number;
  currentWeek: number;
  previousWeek: number;
  trend: 'up' | 'down' | 'stable';
  weeklyData: TimeSeriesDataPoint[];
}

/**
 * Response time analytics
 */
export interface ResponseTimeAnalytics {
  overall: {
    average: number | null;
    median: number | null;
    fastest: number | null;
    slowest: number | null;
  };
  byCompany: Array<{
    company: string;
    average: number;
    count: number;
  }>;
  distribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Application distribution data
 */
export interface DistributionData {
  byCompany: Array<{
    company: string;
    count: number;
    percentage: number;
  }>;
  byLocation: Array<{
    type: 'remote' | 'hybrid' | 'onsite' | 'unspecified';
    count: number;
    percentage: number;
  }>;
  byStatus: Array<{
    status: ApplicationStatus;
    count: number;
    percentage: number;
  }>;
}

/**
 * Get date range for time selection
 */
export function getDateRangeForTimeRange(range: TimeRange): {
  start: Date;
  end: Date;
  granularity: TimeGranularity;
} {
  const end = endOfDay(new Date());
  let start: Date;
  let granularity: TimeGranularity;

  switch (range) {
    case '7d':
      start = startOfDay(subDays(end, 6)); // Last 7 days including today
      granularity = 'day';
      break;
    case '30d':
      start = startOfDay(subDays(end, 29)); // Last 30 days
      granularity = 'day';
      break;
    case '90d':
      start = startOfDay(subDays(end, 89)); // Last 90 days
      granularity = 'week';
      break;
    case 'all':
      // Start from earliest application, or 6 months ago if no data
      start = startOfDay(subMonths(end, 6));
      granularity = 'month';
      break;
  }

  return { start, end, granularity };
}

/**
 * Generate time buckets based on granularity
 */
export function generateTimeBuckets(start: Date, end: Date, granularity: TimeGranularity): Date[] {
  switch (granularity) {
    case 'day':
      return eachDayOfInterval({ start, end });
    case 'week':
      return eachWeekOfInterval({ start, end }, { weekStartsOn: 0 }); // Sunday
    case 'month':
      return eachMonthOfInterval({ start, end });
  }
}

/**
 * Get bucket start date for a given date and granularity
 */
export function getBucketStart(date: Date, granularity: TimeGranularity): Date {
  switch (granularity) {
    case 'day':
      return startOfDay(date);
    case 'week':
      return startOfWeek(date, { weekStartsOn: 0 });
    case 'month':
      return startOfMonth(date);
  }
}

/**
 * Format date label based on granularity
 */
export function formatDateLabel(date: Date, granularity: TimeGranularity): string {
  switch (granularity) {
    case 'day':
      return format(date, 'MMM d');
    case 'week':
      return format(date, 'MMM d');
    case 'month':
      return format(date, 'MMM yyyy');
  }
}

/**
 * Calculate time series data for applications
 */
export function calculateTimeSeriesData(
  applications: JobApplication[],
  range: TimeRange
): TimeSeriesDataPoint[] {
  const { start, end, granularity } = getDateRangeForTimeRange(range);

  // Adjust start date if we have earlier applications in 'all' mode
  let actualStart = start;
  if (range === 'all' && applications.length > 0) {
    const earliestApp = applications.reduce((earliest, app) => {
      const appDate = new Date(app.createdAt);
      return appDate < earliest ? appDate : earliest;
    }, new Date());
    actualStart = startOfDay(earliestApp);
  }

  const buckets = generateTimeBuckets(actualStart, end, granularity);

  // Create map of bucket -> applications
  const bucketMap = new Map<string, JobApplication[]>();
  buckets.forEach((bucket) => {
    bucketMap.set(bucket.toISOString(), []);
  });

  // Assign applications to buckets
  applications.forEach((app) => {
    const appDate = new Date(app.createdAt);
    const bucketDate = getBucketStart(appDate, granularity);
    const key = bucketDate.toISOString();
    const bucket = bucketMap.get(key);
    if (bucket) {
      bucket.push(app);
    }
  });

  // Convert to time series data points
  return buckets.map((date) => {
    const apps = bucketMap.get(date.toISOString()) || [];
    return {
      date,
      count: apps.length,
      applications: apps,
      label: formatDateLabel(date, granularity),
    };
  });
}

/**
 * Calculate velocity metrics
 */
export function calculateVelocityMetrics(
  applications: JobApplication[],
  range: TimeRange
): VelocityMetrics {
  const { start, end } = getDateRangeForTimeRange(range);

  // Get weekly buckets
  const weekBuckets = generateTimeBuckets(start, end, 'week');
  const weeklyData: TimeSeriesDataPoint[] = weekBuckets.map((weekStart) => {
    const weekEnd = endOfDay(subDays(weekStart, -6)); // End of week
    const appsInWeek = applications.filter((app) => {
      const appDate = new Date(app.createdAt);
      return isWithinInterval(appDate, { start: weekStart, end: weekEnd });
    });

    return {
      date: weekStart,
      count: appsInWeek.length,
      applications: appsInWeek,
      label: formatDateLabel(weekStart, 'week'),
    };
  });

  // Calculate apps per week (average)
  const totalWeeks = weeklyData.length || 1;
  const totalApps = weeklyData.reduce((sum, week) => sum + week.count, 0);
  const applicationsPerWeek = totalApps / totalWeeks;

  // Get current and previous week counts
  const currentWeek = weeklyData[weeklyData.length - 1]?.count || 0;
  const previousWeek = weeklyData[weeklyData.length - 2]?.count || 0;

  // Determine trend
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (currentWeek > previousWeek * 1.1) {
    trend = 'up';
  } else if (currentWeek < previousWeek * 0.9) {
    trend = 'down';
  }

  return {
    applicationsPerWeek,
    currentWeek,
    previousWeek,
    trend,
    weeklyData,
  };
}

/**
 * Calculate response time analytics
 */
export function calculateResponseTimeAnalytics(
  applications: JobApplication[]
): ResponseTimeAnalytics {
  // Filter to applications that have responses (moved beyond 'applied')
  const respondedApps = applications.filter((app) => {
    if (!app.appliedAt) return false;
    const hasResponse =
      app.status !== 'saved' && app.status !== 'applied' && app.status !== 'withdrawn';
    return hasResponse;
  });

  const responseTimes: number[] = [];
  const companyResponseTimes = new Map<string, number[]>();

  respondedApps.forEach((app) => {
    if (!app.appliedAt) return;

    // Find first response in status history
    const appliedDate = new Date(app.appliedAt);
    const statusHistory = app.statusHistory || [];

    // Find first status after 'applied'
    const appliedIndex = statusHistory.findIndex((h) => h.status === 'applied');
    if (appliedIndex === -1 || appliedIndex === statusHistory.length - 1) return;

    const firstResponse = statusHistory[appliedIndex + 1];
    const responseDate = new Date(firstResponse.timestamp);
    const daysToResponse = differenceInDays(responseDate, appliedDate);

    if (daysToResponse >= 0) {
      responseTimes.push(daysToResponse);

      // Track by company
      const company = app.companyName || 'Unknown';
      if (!companyResponseTimes.has(company)) {
        companyResponseTimes.set(company, []);
      }
      companyResponseTimes.get(company)!.push(daysToResponse);
    }
  });

  // Calculate overall metrics
  const overall = {
    average:
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : null,
    median: responseTimes.length > 0 ? calculateMedian(responseTimes) : null,
    fastest: responseTimes.length > 0 ? Math.min(...responseTimes) : null,
    slowest: responseTimes.length > 0 ? Math.max(...responseTimes) : null,
  };

  // Calculate by company (top 10)
  const byCompany = Array.from(companyResponseTimes.entries())
    .map(([company, times]) => ({
      company,
      average: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      count: times.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Distribution buckets (0-7, 8-14, 15-30, 31-60, 60+)
  const distributionBuckets = [
    { range: '0-7 days', min: 0, max: 7 },
    { range: '8-14 days', min: 8, max: 14 },
    { range: '15-30 days', min: 15, max: 30 },
    { range: '31-60 days', min: 31, max: 60 },
    { range: '60+ days', min: 61, max: Infinity },
  ];

  const distribution = distributionBuckets.map((bucket) => {
    const count = responseTimes.filter((time) => time >= bucket.min && time <= bucket.max).length;
    return {
      range: bucket.range,
      count,
      percentage: responseTimes.length > 0 ? (count / responseTimes.length) * 100 : 0,
    };
  });

  return { overall, byCompany, distribution };
}

/**
 * Calculate distribution data
 */
export function calculateDistributionData(applications: JobApplication[]): DistributionData {
  const total = applications.length || 1;

  // By company (top 10)
  const companyMap = new Map<string, number>();
  applications.forEach((app) => {
    const company = app.companyName || 'Unknown';
    companyMap.set(company, (companyMap.get(company) || 0) + 1);
  });

  const byCompany = Array.from(companyMap.entries())
    .map(([company, count]) => ({
      company,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // By location type
  const locationMap = new Map<string, number>();
  applications.forEach((app) => {
    const type = app.locationType || 'unspecified';
    locationMap.set(type, (locationMap.get(type) || 0) + 1);
  });

  const byLocation = (['remote', 'hybrid', 'onsite', 'unspecified'] as const).map((type) => ({
    type,
    count: locationMap.get(type) || 0,
    percentage: ((locationMap.get(type) || 0) / total) * 100,
  }));

  // By status
  const statusMap = new Map<ApplicationStatus, number>();
  applications.forEach((app) => {
    statusMap.set(app.status, (statusMap.get(app.status) || 0) + 1);
  });

  const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
    percentage: (count / total) * 100,
  }));

  return { byCompany, byLocation, byStatus };
}

/**
 * Helper: Calculate median
 */
function calculateMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}
