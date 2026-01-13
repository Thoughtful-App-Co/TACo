/**
 * Founding Member Statistics API
 *
 * Returns real-time statistics about LocoTaco founding memberships.
 * Public endpoint (no auth required) - returns aggregate counts only.
 *
 * GET /api/billing/founding-stats
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { billingLog } from '../../lib/logger';

interface Env {
  BILLING_DB: D1Database;
}

const FOUNDING_MEMBER_LIMIT = 10000;
const NEAR_LIMIT_THRESHOLD = 9500;
const WARNING_THRESHOLD = 500;

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
  };

  try {
    // Query total active LocoTaco memberships
    // Include 'active' and 'trialing' statuses (exclude 'cancelled', 'past_due')
    const totalQuery = await env.BILLING_DB.prepare(
      `SELECT COUNT(*) as count 
       FROM subscriptions 
       WHERE product = 'taco_club' 
       AND status IN ('active', 'trialing')
       AND (lifetime_access = 1 OR stripe_subscription_id IS NOT NULL)`
    ).first();

    const total = (totalQuery?.count as number) || 0;

    // Get breakdown by type (monthly vs lifetime)
    const monthlyQuery = await env.BILLING_DB.prepare(
      `SELECT COUNT(*) as count 
       FROM subscriptions 
       WHERE product = 'taco_club' 
       AND status IN ('active', 'trialing')
       AND lifetime_access = 0
       AND stripe_subscription_id NOT LIKE 'one_time_%'`
    ).first();

    const lifetimeQuery = await env.BILLING_DB.prepare(
      `SELECT COUNT(*) as count 
       FROM subscriptions 
       WHERE product = 'taco_club' 
       AND (lifetime_access = 1 OR stripe_subscription_id LIKE 'one_time_%')`
    ).first();

    const monthly = (monthlyQuery?.count as number) || 0;
    const lifetime = (lifetimeQuery?.count as number) || 0;

    // Calculate derived stats
    const remaining = Math.max(0, FOUNDING_MEMBER_LIMIT - total);
    const percentFilled = (total / FOUNDING_MEMBER_LIMIT) * 100;
    const nearLimit = total >= NEAR_LIMIT_THRESHOLD;
    const atLimit = total >= FOUNDING_MEMBER_LIMIT;
    const showWarning = remaining <= WARNING_THRESHOLD && remaining > 0;

    const stats = {
      total,
      remaining,
      limit: FOUNDING_MEMBER_LIMIT,
      percentFilled: Math.round(percentFilled * 100) / 100, // Round to 2 decimals
      breakdown: {
        monthly,
        lifetime,
      },
      nearLimit,
      atLimit,
      showWarning,
      lastUpdated: new Date().toISOString(),
    };

    billingLog.debug('Founding stats fetched:', stats);

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers,
    });
  } catch (error) {
    billingLog.error('Failed to fetch founding stats:', error);

    // Return graceful fallback data
    return new Response(
      JSON.stringify({
        total: 0,
        remaining: FOUNDING_MEMBER_LIMIT,
        limit: FOUNDING_MEMBER_LIMIT,
        percentFilled: 0,
        breakdown: { monthly: 0, lifetime: 0 },
        nearLimit: false,
        atLimit: false,
        showWarning: false,
        error: 'Failed to fetch stats',
        lastUpdated: new Date().toISOString(),
      }),
      { status: 200, headers }
    ); // Return 200 with fallback data for graceful degradation
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
