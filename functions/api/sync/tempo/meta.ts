/**
 * Sync Meta API - Tempo
 *
 * Lightweight endpoint to check sync status without downloading data.
 *
 * GET /api/sync/tempo/meta
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { validateAuth, type AuthEnv } from '../../../lib/auth-middleware';
import {
  syncLog,
  SyncMeta,
  getSyncPaths,
  hasAppSyncSubscription,
  errorResponse,
  successResponse,
  corsResponse,
} from '../../../lib/sync-helpers';

interface Env extends AuthEnv {
  BACKUPS: R2Bucket;
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const app = 'tempo' as const;

  try {
    const authResult = await validateAuth(request, env);

    if (!authResult.success) {
      return authResult.response;
    }

    const { auth } = authResult;

    if (!hasAppSyncSubscription(auth.subscriptions, app)) {
      return errorResponse('Sync subscription required', 'SUBSCRIPTION_REQUIRED', 403, {
        upgradeUrl: '/pricing#sync',
      });
    }

    const paths = getSyncPaths(auth.userId, app);

    const metaObj = await env.BACKUPS.get(paths.meta);
    if (!metaObj) {
      return successResponse({
        success: true,
        exists: false,
        meta: null,
        availableVersions: [],
      });
    }

    const meta = (await metaObj.json()) as SyncMeta;

    const historyList = await env.BACKUPS.list({ prefix: paths.historyPrefix });
    const availableVersions = historyList.objects
      .map((obj) => {
        const match = obj.key.match(/\/(\d+)\.json$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((v) => v > 0)
      .sort((a, b) => b - a);

    availableVersions.unshift(meta.version);

    syncLog.debug('Sync meta check', {
      userId: auth.userId,
      app,
      version: meta.version,
    });

    return successResponse({
      success: true,
      exists: true,
      meta,
      availableVersions,
    });
  } catch (error) {
    syncLog.error('Sync meta error:', error);
    return errorResponse('Failed to fetch sync meta', 'SYNC_ERROR', 500);
  }
}

export async function onRequestOptions(): Promise<Response> {
  return corsResponse();
}
