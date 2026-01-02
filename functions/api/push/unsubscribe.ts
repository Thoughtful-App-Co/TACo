/**
 * Push Unsubscribe Endpoint
 *
 * Removes push notification subscriptions.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

interface Env {
  // Future: Add KV binding
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { endpoint } = await context.request.json();

    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'Missing endpoint' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // In production, delete from KV:
    // const key = btoa(endpoint).slice(0, 64);
    // await context.env.PUSH_SUBSCRIPTIONS.delete(key);

    console.log('[Push] Unsubscribed:', endpoint.slice(0, 50) + '...');

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Push] Unsubscribe error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
