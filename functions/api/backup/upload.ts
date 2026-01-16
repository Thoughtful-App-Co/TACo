/**
 * Backup Upload API
 *
 * Uploads user's localStorage data to R2 for backup.
 * Requires authentication and sync subscription.
 *
 * POST /api/backup/upload
 * Body: { app: string, data: object }
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { jwtVerify } from 'jose';
import { backupLog } from '../../lib/logger';
import { getJwtSecretEncoded, type AuthEnv as JwtAuthEnv } from '../../lib/auth-config';

interface Env extends JwtAuthEnv {
  BILLING_DB: D1Database;
  BACKUPS: R2Bucket;
}

const VALID_APPS = ['tempo', 'tenure', 'nurture', 'all'];
const MAX_BACKUP_SIZE = 10 * 1024 * 1024; // 10MB max

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required', code: 'UNAUTHORIZED' }),
        { status: 401, headers }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = getJwtSecretEncoded(env);

    let userId: string;

    try {
      const { payload } = await jwtVerify(token, secret);
      userId = payload.userId as string;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid session', code: 'INVALID_SESSION' }), {
        status: 401,
        headers,
      });
    }

    // Check if user has sync subscription
    const subscriptions = await env.BILLING_DB.prepare(
      `
      SELECT product FROM subscriptions 
      WHERE user_id = ? AND status = 'active'
      AND (product = 'sync_all' OR product LIKE 'sync_%' OR product = 'taco_club')
    `
    )
      .bind(userId)
      .all();

    if (!subscriptions.results?.length) {
      return new Response(
        JSON.stringify({
          error: 'Sync subscription required',
          code: 'SUBSCRIPTION_REQUIRED',
          upgradeUrl: '/pricing',
        }),
        { status: 403, headers }
      );
    }

    // Parse request body
    const body = (await request.json().catch(() => ({}))) as {
      app?: string;
      data?: unknown;
    };

    const { app, data } = body;

    // Validate app
    if (!app || !VALID_APPS.includes(app)) {
      return new Response(JSON.stringify({ error: 'Invalid app specified', code: 'INVALID_APP' }), {
        status: 400,
        headers,
      });
    }

    // Validate data
    if (!data || typeof data !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid data', code: 'INVALID_DATA' }), {
        status: 400,
        headers,
      });
    }

    // Serialize and check size
    const serialized = JSON.stringify(data);
    if (serialized.length > MAX_BACKUP_SIZE) {
      return new Response(
        JSON.stringify({
          error: 'Backup too large (max 10MB)',
          code: 'BACKUP_TOO_LARGE',
        }),
        { status: 400, headers }
      );
    }

    // Create backup key
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const backupKey = `${userId}/${app}/${timestamp}.json`;
    const latestKey = `${userId}/${app}/latest.json`;

    // Upload to R2
    const metadata = {
      userId,
      app,
      timestamp: Date.now().toString(),
      size: serialized.length.toString(),
    };

    // Store dated backup
    await env.BACKUPS.put(backupKey, serialized, {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: metadata,
    });

    // Also update "latest" pointer
    await env.BACKUPS.put(latestKey, serialized, {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: metadata,
    });

    return new Response(
      JSON.stringify({
        success: true,
        key: backupKey,
        timestamp: metadata.timestamp,
        size: serialized.length,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    backupLog.error('Backup upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to upload backup', code: 'UPLOAD_ERROR' }),
      { status: 500, headers }
    );
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
