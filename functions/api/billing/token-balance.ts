/**
 * Token Balance API
 *
 * Returns the user's current token balance and transaction history.
 * Requires authentication.
 *
 * GET /api/billing/token-balance
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { validateAuth, getTokenBalance } from '../../lib/auth-middleware';
import { billingLog } from '../../lib/logger';

interface Env {
  JWT_SECRET: string;
  AUTH_DB: any;
  BILLING_DB: any;
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Validate authentication
  const authResult = await validateAuth(request, env);
  if (!authResult.success) {
    return authResult.response;
  }

  const { userId, subscriptions } = authResult.auth;

  try {
    // TACo Club members have unlimited tokens
    if (subscriptions.includes('taco_club')) {
      return new Response(
        JSON.stringify({
          balance: 'unlimited',
          isTacoClub: true,
          lifetimePurchased: null,
          lifetimeUsed: null,
        }),
        { status: 200, headers }
      );
    }

    // Get token balance and stats
    const balance = await getTokenBalance(userId, env);
    const stats = await env.BILLING_DB.prepare(
      'SELECT lifetime_purchased, lifetime_used FROM credits WHERE user_id = ?'
    )
      .bind(userId)
      .first();

    // Get recent transactions (last 10)
    const transactions = await env.BILLING_DB.prepare(
      `SELECT type, amount, balance_after, description, created_at 
       FROM credit_transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`
    )
      .bind(userId)
      .all();

    return new Response(
      JSON.stringify({
        balance,
        isTacoClub: false,
        lifetimePurchased: stats?.lifetime_purchased || 0,
        lifetimeUsed: stats?.lifetime_used || 0,
        recentTransactions: transactions.results || [],
      }),
      { status: 200, headers }
    );
  } catch (error) {
    billingLog.error('Token balance error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch token balance',
        code: 'BALANCE_ERROR',
      }),
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
