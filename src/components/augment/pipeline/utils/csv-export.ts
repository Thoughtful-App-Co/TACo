/**
 * CSV Export Utilities - Export job applications to CSV format
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { JobApplication } from '../../../../schemas/pipeline.schema';
import { formatSalary } from './salary';

/**
 * Escape CSV field (handle quotes, commas, newlines)
 */
function escapeCSVField(value: any): string {
  if (value === null || value === undefined) return '';

  const stringValue = String(value);

  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Format date for CSV export
 */
function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Format date with time for CSV export
 */
function formatDateTime(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  // Format as: YYYY-MM-DD HH:MM
  const datePart = d.toISOString().split('T')[0];
  const timePart = d.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
  return `${datePart} ${timePart}`;
}

/**
 * Export applications to CSV string
 */
export function exportApplicationsToCSV(applications: JobApplication[]): string {
  // CSV Headers
  const headers = [
    'Company',
    'Role',
    'Status',
    'Location',
    'Location Type',
    'Department',
    'Salary',
    'Job URL',
    'Saved Date',
    'Applied Date',
    'Last Activity',
    'Notes',
    'Match Score',
    'Days in Status',
  ];

  // Build rows
  const rows = applications.map((app) => {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(app.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return [
      escapeCSVField(app.companyName),
      escapeCSVField(app.roleName),
      escapeCSVField(app.status),
      escapeCSVField(app.location),
      escapeCSVField(app.locationType),
      escapeCSVField(app.department),
      escapeCSVField(formatSalary(app.salary)),
      escapeCSVField(app.jobUrl),
      escapeCSVField(formatDate(app.savedAt)),
      escapeCSVField(formatDateTime(app.appliedAt)),
      escapeCSVField(formatDate(app.lastActivityAt)),
      escapeCSVField(app.notes),
      escapeCSVField(app.analysis?.overallScore),
      escapeCSVField(daysSinceActivity),
    ];
  });

  // Combine headers and rows
  const csvLines = [headers.join(','), ...rows.map((row) => row.join(','))];

  return csvLines.join('\n');
}

/**
 * Trigger browser download of CSV file
 */
export function downloadCSV(csvContent: string, filename: string = 'job-applications.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    // Create download link
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export applications and trigger download
 */
export function exportAndDownload(applications: JobApplication[]): void {
  const csv = exportApplicationsToCSV(applications);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `job-applications-${timestamp}.csv`;
  downloadCSV(csv, filename);
}
