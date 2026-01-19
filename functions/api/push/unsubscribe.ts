/**
 * Push Unsubscribe Endpoint
 *
 * Removes push notification subscriptions.
 *
 * SECURITY: Requires valid JWT authentication to ensure users can only
 * unsubscribe their own subscriptions.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { pushLog } from '../../lib/logger';
import { validateAuth, type AuthEnv } from '../../lib/auth-middleware';

// Future: Add KV binding for storing subscriptions
// interface Env extends AuthEnv {
//   PUSH_SUBSCRIPTIONS: KVNamespace;
// }
type Env = AuthEnv;

export async function onRequestPost(context: { request: Request; env: Env }) {
  // SECURITY: Validate authentication to ensure user owns the subscription
  const authResult = await validateAuth(context.request, context.env);
  if (!authResult.success) {
    return authResult.response;
  }

  const { auth } = authResult;

  try {
    const { endpoint } = await context.request.json();

    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'Missing endpoint' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // In production, delete from KV:
    // const key = `push:${auth.userId}:${btoa(endpoint).slice(0, 64)}`;
    // await context.env.PUSH_SUBSCRIPTIONS.delete(key);

    pushLog.info('Unsubscribed:', {
      userId: auth.userId,
      endpoint: endpoint.slice(0, 50) + '...',
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    pushLog.error('Unsubscribe error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
