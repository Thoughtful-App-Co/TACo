/**
 * Salary Utilities - Formatting and display helpers for salary data
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { SalaryRange } from '../../../../schemas/pipeline.schema';

/**
 * Currency symbols mapped by currency code
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: '$',
  AUD: '$',
  JPY: '¥',
  INR: '₹',
};

/**
 * Format a number with locale-specific thousands separators
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string (e.g., 1234567 -> "1,234,567")
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a number as currency with full number display and commas
 * @param num - The number to format
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string (e.g., 120000 -> "$120,000")
 */
export function formatCurrency(num: number, currency: string = 'USD'): string {
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format a number as a compact salary string (e.g., 120000 -> "120K")
 */
function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toString();
}

/**
 * Format salary range for display
 * Examples (compact=true, default):
 * - Single value annual: "$120K/yr"
 * - Range annual: "$100K-$140K/yr"
 * - Hourly: "$50/hr"
 * - Range hourly: "$40-$60/hr"
 *
 * Examples (compact=false):
 * - Single value annual: "$120,000/yr"
 * - Range annual: "$100,000-$140,000/yr"
 * - Hourly: "$50/hr"
 * - Range hourly: "$40-$60/hr"
 *
 * @param salary - The salary range to format
 * @param compact - Use compact K/M notation (default: true)
 */
export function formatSalary(
  salary: SalaryRange | undefined,
  compact: boolean = true
): string | null {
  if (!salary) return null;

  const symbol = CURRENCY_SYMBOLS[salary.currency] || salary.currency;
  const periodSuffix = salary.period === 'hourly' ? '/hr' : '/yr';

  // Determine if it's a range or single value
  const hasMin = salary.min !== undefined;
  const hasMax = salary.max !== undefined;

  if (!hasMin && !hasMax) return null;

  // Helper to format number based on compact flag
  const formatNum = (num: number): string => {
    if (salary.period === 'hourly') {
      // Hourly rates always shown with commas, no K/M notation
      return formatNumber(num, 0);
    }
    return compact ? formatCompactNumber(num) : formatNumber(num, 0);
  };

  // Single value (min === max, or only one is defined)
  if (salary.min === salary.max || (hasMin && !hasMax)) {
    const value = salary.min!;
    return `${symbol}${formatNum(value)}${periodSuffix}`;
  }

  if (hasMax && !hasMin) {
    const value = salary.max!;
    return `${symbol}${formatNum(value)}${periodSuffix}`;
  }

  // Range (both min and max defined and different)
  if (hasMin && hasMax && salary.min !== salary.max) {
    return `${symbol}${formatNum(salary.min!)}-${symbol}${formatNum(salary.max!)}${periodSuffix}`;
  }

  return null;
}

/**
 * Get the midpoint of a salary range for sorting/grouping
 */
export function getSalaryMidpoint(salary: SalaryRange | undefined): number | null {
  if (!salary) return null;

  const min = salary.min ?? 0;
  const max = salary.max ?? min;

  return (min + max) / 2;
}

/**
 * Normalize salary to annual for comparison purposes
 * (hourly salaries are multiplied by 2080 hours/year)
 */
export function normalizeToAnnual(salary: SalaryRange | undefined): number | null {
  const midpoint = getSalaryMidpoint(salary);
  if (midpoint === null) return null;

  return salary?.period === 'hourly' ? midpoint * 2080 : midpoint;
}

/**
 * Parse a formatted number string back to a number
 * Removes commas, currency symbols, and other formatting
 * @param value - The formatted string (e.g., "$120,000" or "120,000")
 * @returns The parsed number or NaN if invalid
 */
export function parseFormattedNumber(value: string): number {
  if (!value) return NaN;
  // Remove all non-numeric characters except decimal point and minus
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned);
}

/**
 * Format a number string for display in an input field (with commas)
 * Preserves cursor-friendly behavior by only formatting complete numbers
 * @param value - The input value (may contain partial numbers)
 * @returns Formatted string with commas
 */
export function formatNumberForInput(value: string): string {
  if (!value) return '';

  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.]/g, '');

  if (!cleaned) return '';

  // Parse and format
  const num = parseFloat(cleaned);
  if (isNaN(num)) return cleaned;

  // Format with commas (no decimal places for salary)
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}
