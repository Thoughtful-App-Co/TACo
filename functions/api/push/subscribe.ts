/**
 * Push Subscription Endpoint
 *
 * Stores push notification subscriptions.
 * For now, just logs them - in production you'd store in KV or D1.
 *
 * SECURITY: Requires valid JWT authentication to prevent abuse.
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
  // SECURITY: Validate authentication to prevent spam/abuse
  const authResult = await validateAuth(context.request, context.env);
  if (!authResult.success) {
    return authResult.response;
  }

  const { auth } = authResult;

  try {
    const { subscription, timestamp } = await context.request.json();

    if (!subscription?.endpoint) {
      return new Response(JSON.stringify({ error: 'Invalid subscription' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log for now - in production, store in KV:
    // const key = `push:${auth.userId}:${btoa(subscription.endpoint).slice(0, 64)}`;
    // await context.env.PUSH_SUBSCRIPTIONS.put(key, JSON.stringify({ subscription, timestamp, userId: auth.userId }));

    pushLog.info('New subscription:', {
      userId: auth.userId,
      endpoint: subscription.endpoint.slice(0, 50) + '...',
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    pushLog.error('Subscribe error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
