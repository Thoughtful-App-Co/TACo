/**
 * Sync Push API - Tempo
 *
 * Pushes user's Tempo data to R2 cloud storage.
 * Handles versioning, conflict detection, and history.
 *
 * POST /api/sync/tempo/push
 * Body: { data: object, deviceId: string, localVersion?: number }
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { validateAuth, type AuthEnv } from '../../../lib/auth-middleware';
import {
  syncLog,
  SyncMeta,
  generateChecksum,
  getSyncPaths,
  hasAppSyncSubscription,
  errorResponse,
  successResponse,
  corsResponse,
  MAX_SYNC_SIZE,
  MAX_VERSIONS,
} from '../../../lib/sync-helpers';

interface Env extends AuthEnv {
  BACKUPS: R2Bucket;
}

interface PushRequestBody {
  data: unknown;
  deviceId: string;
  localVersion?: number;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const app = 'tempo' as const;

  try {
    // Authenticate user
    const authResult = await validateAuth(request, env);

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

    // Parse request body
    const body = (await request.json().catch(() => ({}))) as PushRequestBody;
    const { data, deviceId, localVersion } = body;

    // Validate input
    if (!data || typeof data !== 'object') {
      return errorResponse('Invalid data', 'INVALID_DATA', 400);
    }

    if (!deviceId || typeof deviceId !== 'string') {
      return errorResponse('Device ID required', 'MISSING_DEVICE_ID', 400);
    }

    // Serialize and check size
    const serialized = JSON.stringify(data);
    if (serialized.length > MAX_SYNC_SIZE) {
      return errorResponse(
        `Data too large (max ${MAX_SYNC_SIZE / 1024 / 1024}MB)`,
        'DATA_TOO_LARGE',
        400
      );
    }

    const paths = getSyncPaths(auth.userId, app);

    // Get current server meta for conflict detection
    const existingMetaObj = await env.BACKUPS.get(paths.meta);
    let serverMeta: SyncMeta | null = null;

    if (existingMetaObj) {
      try {
        serverMeta = (await existingMetaObj.json()) as SyncMeta;
      } catch {
        syncLog.warn('Corrupted meta file, will overwrite', { userId: auth.userId, app });
      }
    }

    // Conflict detection: if client has older version than server
    if (serverMeta && localVersion !== undefined && localVersion < serverMeta.version) {
      return errorResponse('Conflict detected', 'CONFLICT', 409, {
        localVersion,
        serverVersion: serverMeta.version,
        serverModified: serverMeta.lastModified,
        serverDeviceId: serverMeta.deviceId,
      });
    }

    // Calculate new version
    const newVersion = serverMeta ? serverMeta.version + 1 : 1;
    const checksum = await generateChecksum(serialized);
    const now = new Date().toISOString();

    // Create new meta
    const newMeta: SyncMeta = {
      version: newVersion,
      lastModified: now,
      deviceId,
      checksum,
      size: serialized.length,
    };

    // Store history (copy current to history before overwriting)
    if (serverMeta) {
      const currentData = await env.BACKUPS.get(paths.current);
      if (currentData) {
        await env.BACKUPS.put(paths.history(serverMeta.version), await currentData.text(), {
          httpMetadata: { contentType: 'application/json' },
          customMetadata: {
            version: serverMeta.version.toString(),
            timestamp: serverMeta.lastModified,
          },
        });
      }

      // Prune old history versions
      const historyList = await env.BACKUPS.list({ prefix: paths.historyPrefix });
      const versions = historyList.objects
        .map((obj) => {
          const match = obj.key.match(/\/(\d+)\.json$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((v) => v > 0)
        .sort((a, b) => b - a);

      const toDelete = versions.slice(MAX_VERSIONS);
      for (const v of toDelete) {
        await env.BACKUPS.delete(paths.history(v));
      }
    }

    // Store current data
    await env.BACKUPS.put(paths.current, serialized, {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: {
        version: newVersion.toString(),
        timestamp: now,
        deviceId,
      },
    });

    // Store meta
    await env.BACKUPS.put(paths.meta, JSON.stringify(newMeta), {
      httpMetadata: { contentType: 'application/json' },
    });

    syncLog.info('Sync push successful', {
      userId: auth.userId,
      app,
      version: newVersion,
      size: serialized.length,
    });

    return successResponse({
      success: true,
      version: newVersion,
      checksum,
      timestamp: now,
    });
  } catch (error) {
    syncLog.error('Sync push error:', error);
    return errorResponse('Failed to sync data', 'SYNC_ERROR', 500);
  }
}

export async function onRequestOptions(): Promise<Response> {
  return corsResponse();
}
