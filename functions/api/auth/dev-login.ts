/**
 * Dev Login API - LOCAL DEVELOPMENT ONLY
 *
 * Generates session tokens for test users without email verification.
 * This endpoint should NEVER be deployed to production.
 *
 * GET /api/auth/dev-login?user=premium|sync|free
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { SignJWT } from 'jose';
import { authLog } from '../../lib/logger';

interface Env {
  AUTH_DB: D1Database;
  BILLING_DB: D1Database;
  JWT_SECRET: string;
  TACO_ENV: string;
  FRONTEND_URL?: string;
}

// Test user configurations
const TEST_USERS: Record<string, { id: string; email: string }> = {
  premium: { id: 'test-user-premium', email: 'premium@test.local' },
  sync: { id: 'test-user-sync', email: 'sync@test.local' },
  free: { id: 'test-user-free', email: 'free@test.local' },
};

const SESSION_EXPIRY = '30d';

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const userType = url.searchParams.get('user') || 'free';
  const redirectTo = url.searchParams.get('redirect') || '/';

  // SECURITY: Only allow in explicit development/test environments (fail closed)
  if (env.TACO_ENV !== 'development' && env.TACO_ENV !== 'test') {
    authLog.error('Attempted dev-login in non-development environment!', { env: env.TACO_ENV });
    return new Response(JSON.stringify({ error: 'Not available in this environment' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate user type
  const testUser = TEST_USERS[userType];
  if (!testUser) {
    return new Response(
      JSON.stringify({
        error: 'Invalid user type',
        available: Object.keys(TEST_USERS),
        usage: '/api/auth/dev-login?user=premium|sync|free',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Check if user exists in database
    const user = await env.AUTH_DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(testUser.id)
      .first();

    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'Test user not found in database',
          hint: 'Run: pnpm run db:seed to create test users',
          userType,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update last login time
    await env.AUTH_DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
      .bind(Date.now(), testUser.id)
      .run();

    // Get user's active subscriptions from billing DB
    const subscriptions = await env.BILLING_DB.prepare(
      `
      SELECT product, status, current_period_end 
      FROM subscriptions 
      WHERE user_id = ? AND status IN ('active', 'trialing')
    `
    )
      .bind(testUser.id)
      .all();

    const activeProducts = subscriptions.results?.map((s: any) => s.product) || [];

    authLog.info(`Dev login for ${userType} user:`, {
      userId: testUser.id,
      email: testUser.email,
      subscriptions: activeProducts,
    });

    // Generate session token
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const sessionToken = await new SignJWT({
      userId: testUser.id,
      email: testUser.email,
      subscriptions: activeProducts,
      type: 'session',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(SESSION_EXPIRY)
      .setIssuedAt()
      .setJti(crypto.randomUUID())
      .sign(secret);

    // Build base URL for redirects
    const baseUrl = env.FRONTEND_URL || `${url.protocol}//${url.host}`;

    // Redirect to app with token (same flow as magic link verification)
    const redirectUrl = new URL(redirectTo, baseUrl);
    redirectUrl.searchParams.set('auth_token', sessionToken);

    authLog.info(`Dev login successful, redirecting to: ${redirectUrl.pathname}`);

    return Response.redirect(redirectUrl.toString(), 302);
  } catch (error) {
    authLog.error('Dev login error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate session',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * JSON endpoint for programmatic access (returns token instead of redirect)
 */
export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  // SECURITY: Only allow in explicit development/test environments (fail closed)
  if (env.TACO_ENV !== 'development' && env.TACO_ENV !== 'test') {
    return new Response(JSON.stringify({ error: 'Not available in this environment' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const userType = body.user || 'free';

    const testUser = TEST_USERS[userType];
    if (!testUser) {
      return new Response(
        JSON.stringify({
          error: 'Invalid user type',
          available: Object.keys(TEST_USERS),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user exists
    const user = await env.AUTH_DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(testUser.id)
      .first();

    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'Test user not found',
          hint: 'Run: pnpm run db:seed',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get subscriptions
    const subscriptions = await env.BILLING_DB.prepare(
      `SELECT product FROM subscriptions WHERE user_id = ? AND status IN ('active', 'trialing')`
    )
      .bind(testUser.id)
      .all();

    const activeProducts = subscriptions.results?.map((s: any) => s.product) || [];

    // Generate token
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const sessionToken = await new SignJWT({
      userId: testUser.id,
      email: testUser.email,
      subscriptions: activeProducts,
      type: 'session',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(SESSION_EXPIRY)
      .setIssuedAt()
      .setJti(crypto.randomUUID())
      .sign(secret);

    return new Response(
      JSON.stringify({
        success: true,
        token: sessionToken,
        user: {
          id: testUser.id,
          email: testUser.email,
          subscriptions: activeProducts,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to generate token',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
