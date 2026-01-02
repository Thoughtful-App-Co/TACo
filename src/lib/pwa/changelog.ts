/**
 * Changelog Data
 *
 * Tracks version history for showing "What's New" after updates.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

export interface ChangelogEntry {
  version: string;
  date: string;
  highlights: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.1.0',
    date: '2025-01-01',
    highlights: [
      'PWA Support - Install TACo apps to your home screen!',
      'Offline mode for Tempo and Tenure',
      'Push notifications for task reminders',
    ],
  },
  {
    version: '1.0.0',
    date: '2024-12-15',
    highlights: [
      'Initial release of Tempo',
      'Initial release of Tenure',
      'Local-first data storage',
    ],
  },
];

export function getLatestVersion(): string {
  return CHANGELOG[0]?.version || '1.0.0';
}

export function getLatestChangelog(): ChangelogEntry | null {
  return CHANGELOG[0] || null;
}
