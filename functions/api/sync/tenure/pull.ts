/**
 * Sync Pull API - Tenure
 *
 * Downloads user's Tenure data from R2 cloud storage.
 * Supports current version or specific history versions.
 *
 * GET /api/sync/tenure/pull?version=current
 * GET /api/sync/tenure/pull?version=3
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { validateAuth } from '../../../lib/auth-middleware';
import {
  syncLog,
  SyncMeta,
  getSyncPaths,
  hasAppSyncSubscription,
  errorResponse,
  successResponse,
  corsResponse,
} from '../../../lib/sync-helpers';

interface Env {
  BILLING_DB: D1Database;
  AUTH_DB: D1Database;
  BACKUPS: R2Bucket;
  JWT_SECRET: string;
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const app = 'tenure' as const;

  try {
    // Authenticate user
    const authResult = await validateAuth(request, {
      JWT_SECRET: env.JWT_SECRET,
      AUTH_DB: env.AUTH_DB,
      BILLING_DB: env.BILLING_DB,
    });

    if (!authResult.success) {
      return authResult.response;
    }

    const { auth } = authResult;

    // Check sync subscription
    if (!hasAppSyncSubscription(auth.subscriptions, app)) {
      return errorResponse('Sync subscription required', 'SUBSCRIPTION_REQUIRED', 403, {
        upgradeUrl: '/pricing#sync',
      });
    }

    // Parse query params
    const url = new URL(request.url);
    const versionParam = url.searchParams.get('version') || 'current';

    const paths = getSyncPaths(auth.userId, app);

    // Get meta
    const metaObj = await env.BACKUPS.get(paths.meta);
    if (!metaObj) {
      return errorResponse('No sync data found', 'NO_DATA', 404);
    }

    const meta = (await metaObj.json()) as SyncMeta;

    // Get available versions from history
    const historyList = await env.BACKUPS.list({ prefix: paths.historyPrefix });
    const availableVersions = historyList.objects
      .map((obj) => {
        const match = obj.key.match(/\/(\d+)\.json$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((v) => v > 0)
      .sort((a, b) => b - a);

    // Add current version
    availableVersions.unshift(meta.version);

    // Determine which version to fetch
    let dataKey: string;
    let requestedVersion: number;

    if (versionParam === 'current') {
      dataKey = paths.current;
      requestedVersion = meta.version;
    } else {
      requestedVersion = parseInt(versionParam, 10);
      if (isNaN(requestedVersion)) {
        return errorResponse('Invalid version parameter', 'INVALID_VERSION', 400);
      }

      if (requestedVersion === meta.version) {
        dataKey = paths.current;
      } else if (availableVersions.includes(requestedVersion)) {
        dataKey = paths.history(requestedVersion);
      } else {
        return errorResponse(`Version ${requestedVersion} not found`, 'VERSION_NOT_FOUND', 404, {
          availableVersions,
        });
      }
    }

    // Fetch data
    const dataObj = await env.BACKUPS.get(dataKey);
    if (!dataObj) {
      return errorResponse('Data not found', 'DATA_NOT_FOUND', 404);
    }

    const data = await dataObj.json();

    syncLog.info('Sync pull successful', {
      userId: auth.userId,
      app,
      version: requestedVersion,
    });

    return successResponse({
      success: true,
      data,
      meta: requestedVersion === meta.version ? meta : { version: requestedVersion },
      availableVersions,
    });
  } catch (error) {
    syncLog.error('Sync pull error:', error);
    return errorResponse('Failed to fetch sync data', 'SYNC_ERROR', 500);
  }
}

export async function onRequestOptions(): Promise<Response> {
  return corsResponse();
}
