/**
 * Backup Download API
 *
 * Downloads user's backup data from R2.
 * Requires authentication and sync subscription.
 *
 * GET /api/backup/download?app=tenure&version=latest
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { jwtVerify } from 'jose';
import { backupLog } from '../../lib/logger';

interface Env {
  BILLING_DB: D1Database;
  BACKUPS: R2Bucket;
  JWT_SECRET: string;
}

const VALID_APPS = ['tempo', 'tenure', 'nurture', 'all'];

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    const secret = new TextEncoder().encode(env.JWT_SECRET);

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

    // Parse query params
    const url = new URL(request.url);
    const app = url.searchParams.get('app');
    const version = url.searchParams.get('version') || 'latest';

    // Validate app
    if (!app || !VALID_APPS.includes(app)) {
      return new Response(JSON.stringify({ error: 'Invalid app specified', code: 'INVALID_APP' }), {
        status: 400,
        headers,
      });
    }

    // Build key
    const backupKey =
      version === 'latest' ? `${userId}/${app}/latest.json` : `${userId}/${app}/${version}.json`;

    // Get from R2
    const object = await env.BACKUPS.get(backupKey);

    if (!object) {
      return new Response(
        JSON.stringify({
          error: 'No backup found',
          code: 'BACKUP_NOT_FOUND',
          app,
          version,
        }),
        { status: 404, headers }
      );
    }

    // Parse and return
    const data = await object.json();
    const metadata = object.customMetadata;

    return new Response(
      JSON.stringify({
        success: true,
        app,
        version,
        timestamp: metadata?.timestamp ? parseInt(metadata.timestamp) : null,
        data,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    backupLog.error('Backup download error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to download backup', code: 'DOWNLOAD_ERROR' }),
      { status: 500, headers }
    );
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
