/**
 * Sync Helpers - Shared utilities for sync API endpoints
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createLogger } from './logger';

export const syncLog = createLogger('Sync');

export const VALID_APPS = ['tenure', 'tempo'] as const;
export type SyncApp = (typeof VALID_APPS)[number];

export const MAX_SYNC_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VERSIONS = 5;

export const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Sync metadata stored alongside data
 */
export interface SyncMeta {
  version: number;
  lastModified: string;
  deviceId: string;
  checksum: string;
  size: number;
}

/**
 * Generate MD5-like checksum for data integrity
 * Uses SubtleCrypto for consistent hashing
 */
export async function generateChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Build R2 key paths for sync data
 */
export function getSyncPaths(userId: string, app: SyncApp) {
  const base = `sync/${userId}/${app}`;
  return {
    current: `${base}/current.json`,
    meta: `${base}/meta.json`,
    history: (version: number) => `${base}/history/${version}.json`,
    historyPrefix: `${base}/history/`,
  };
}

/**
 * Check if user has sync subscription for the given app
 */
export function hasAppSyncSubscription(subscriptions: string[], app: SyncApp): boolean {
  // TACo Club has access to everything
  if (subscriptions.includes('taco_club')) {
    return true;
  }

  // Check for sync_all or app-specific sync
  if (subscriptions.includes('sync_all')) {
    return true;
  }

  // Check for app-specific subscription
  return subscriptions.includes(`sync_${app}`);
}

/**
 * Standard error response helper
 */
export function errorResponse(
  message: string,
  code: string,
  status: number,
  extra?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      code,
      ...extra,
    }),
    { status, headers: CORS_HEADERS }
  );
}

/**
 * Standard success response helper
 */
export function successResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

/**
 * CORS preflight response
 */
export function corsResponse(): Response {
  return new Response(null, { headers: CORS_HEADERS });
}
