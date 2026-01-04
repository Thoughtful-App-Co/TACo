/**
 * Verify Magic Link API
 *
 * Verifies the magic link token and creates a session.
 * Redirects user back to the app with a session token.
 *
 * GET /api/auth/verify?token=xxx
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { jwtVerify, SignJWT } from 'jose';
import { authLog } from '../../lib/logger';

interface Env {
  AUTH_DB: D1Database;
  BILLING_DB: D1Database;
  JWT_SECRET: string;
  FRONTEND_URL?: string; // URL of the frontend app (for redirects after auth)
}

const SESSION_EXPIRY = '30d';

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const redirectTo = url.searchParams.get('redirect') || '/';

  // Build base URL for redirects
  // Use FRONTEND_URL if set (for local dev), otherwise use current host (production)
  const baseUrl = env.FRONTEND_URL || `${url.protocol}//${url.host}`;

  if (!token) {
    return Response.redirect(`${baseUrl}/login?error=missing_token`, 302);
  }

  try {
    // Verify magic link token
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Validate token type
    if (payload.type !== 'magic-link') {
      return Response.redirect(`${baseUrl}/login?error=invalid_token`, 302);
    }

    const userId = payload.userId as string;
    const email = payload.email as string;

    // Update last login time
    await env.AUTH_DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
      .bind(Date.now(), userId)
      .run();

    // Get user's active subscriptions from billing DB
    const subscriptions = await env.BILLING_DB.prepare(
      `
      SELECT product, status, current_period_end 
      FROM subscriptions 
      WHERE user_id = ? AND status IN ('active', 'trialing')
    `
    )
      .bind(userId)
      .all();

    const activeProducts = subscriptions.results?.map((s: any) => s.product) || [];

    // Generate session token (30 day expiry)
    const sessionToken = await new SignJWT({
      userId,
      email,
      subscriptions: activeProducts,
      type: 'session',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(SESSION_EXPIRY)
      .setIssuedAt()
      .setJti(crypto.randomUUID())
      .sign(secret);

    // Redirect to app with token
    // The client will extract the token from URL and store it
    const redirectUrl = new URL(redirectTo, baseUrl);
    redirectUrl.searchParams.set('auth_token', sessionToken);

    return Response.redirect(redirectUrl.toString(), 302);
  } catch (error) {
    authLog.error('Token verification error:', error);

    // Check if it's an expiration error
    if (error instanceof Error && error.message.includes('exp')) {
      return Response.redirect(`${baseUrl}/login?error=expired_token`, 302);
    }

    return Response.redirect(`${baseUrl}/login?error=invalid_token`, 302);
  }
}
