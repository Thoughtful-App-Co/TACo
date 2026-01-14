/**
 * Request Magic Link API
 *
 * Sends a magic link email to the user for passwordless authentication.
 * Rate limited to 10 requests per hour per email.
 *
 * POST /api/auth/request-magic-link
 * Body: { email: string }
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Resend } from 'resend';
import { SignJWT } from 'jose';
import { authLog } from '../../lib/logger';
import { getJwtSecretEncoded, type AuthEnv } from '../../lib/auth-config';

interface Env extends AuthEnv {
  AUTH_DB: D1Database;
  RATE_LIMIT: KVNamespace;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL?: string;
  FRONTEND_URL?: string;
}

const RATE_LIMIT_MAX = 10; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60; // 1 hour in seconds
const MAGIC_LINK_EXPIRY = '15m';

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const email = (body as { email?: string }).email?.toLowerCase().trim();

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address', code: 'INVALID_EMAIL' }),
        { status: 400, headers }
      );
    }

    // Rate limiting
    const rateLimitKey = `auth:magic-link:${email}`;
    const currentCount = parseInt((await env.RATE_LIMIT.get(rateLimitKey)) || '0');

    if (currentCount >= RATE_LIMIT_MAX) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMITED',
        }),
        { status: 429, headers }
      );
    }

    // Increment rate limit counter
    await env.RATE_LIMIT.put(rateLimitKey, String(currentCount + 1), {
      expirationTtl: RATE_LIMIT_WINDOW,
    });

    // Find or create user
    let user = await env.AUTH_DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

    if (!user) {
      // Create new user
      const userId = crypto.randomUUID();
      await env.AUTH_DB.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)')
        .bind(userId, email, Date.now())
        .run();

      user = { id: userId, email };
    }

    // Generate magic link token (15 minute expiry)
    const secret = getJwtSecretEncoded(env);
    const token = await new SignJWT({
      userId: user.id,
      email,
      type: 'magic-link',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(MAGIC_LINK_EXPIRY)
      .setIssuedAt()
      .setJti(crypto.randomUUID())
      .sign(secret);

    // Build magic link URL
    const url = new URL(request.url);
    // Use FRONTEND_URL if set (for local dev), otherwise use current host (production)
    const baseUrl = env.FRONTEND_URL || `${url.protocol}//${url.host}`;
    const magicLink = `${baseUrl}/api/auth/verify?token=${token}`;

    // Send magic link email via Resend
    const resend = new Resend(env.RESEND_API_KEY);
    const fromEmail = env.RESEND_FROM_EMAIL || 'Thoughtful App Co <auth@thoughtfulapp.co>';

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your login link for Thoughtful App Co',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <!--[if mso]>
          <style type="text/css">
            .button { background-color: #FF6B6B !important; }
          </style>
          <![endif]-->
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
          <!-- Preheader (hidden preview text) -->
          <div style="display: none; max-height: 0; overflow: hidden;">
            Your secure login link for Thoughtful App Co - expires in 15 minutes
          </div>
          
          <!-- Logo Section -->
          <div style="text-align: center; margin-bottom: 32px;">
            <img 
              src="${baseUrl}/icons/taco/apple-touch-icon.png" 
              alt="Thoughtful App Co Logo" 
              width="56" 
              height="56" 
              style="display: block; margin: 0 auto 16px; border-radius: 14px;"
            />
            <h1 style="color: #1F2937; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">
              Thoughtful App Co
            </h1>
          </div>
          
          <!-- Main Message -->
          <p style="color: #374151; font-size: 16px; line-height: 1.6; text-align: center; margin: 0 0 32px 0;">
            Click the button below to sign in to your account.<br>
            This link will expire in <strong>15 minutes</strong>.
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${magicLink}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="17%" strokecolor="#FF6B6B" fillcolor="#FF6B6B">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Sign In</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${magicLink}" 
               class="button"
               style="display: inline-block; 
                      background-color: #FF6B6B;
                      background-image: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%); 
                      color: #ffffff; 
                      text-decoration: none; 
                      padding: 14px 40px; 
                      border-radius: 8px; 
                      font-weight: 600; 
                      font-size: 16px;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Sign In
            </a>
            <!--<![endif]-->
          </div>
          
          <!-- Security Notice -->
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; text-align: center; margin: 0;">
            If you didn't request this email, you can safely ignore it.
          </p>
          
          <!-- Divider & Fallback URL -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
            <p style="color: #9CA3AF; font-size: 12px; line-height: 1.6; text-align: center; margin: 0;">
              Or copy and paste this URL into your browser:
            </p>
            <p style="color: #6B7280; font-size: 12px; line-height: 1.6; text-align: center; margin: 8px 0 0 0; word-break: break-all;">
              ${magicLink}
            </p>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 40px; text-align: center;">
            <p style="color: #9CA3AF; font-size: 11px; line-height: 1.5; margin: 0;">
              © ${new Date().getFullYear()} Thoughtful App Co<br>
              <a href="${baseUrl}/privacy-policy" style="color: #9CA3AF; text-decoration: underline;">Privacy Policy</a>
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Sign in to Thoughtful App Co\n\nClick this link to sign in (expires in 15 minutes):\n${magicLink}\n\nIf you didn't request this email, you can safely ignore it.`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Check your email for a login link',
      }),
      { status: 200, headers }
    );
  } catch (error) {
    authLog.error('Magic link error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to send login link',
        code: 'INTERNAL_ERROR',
      }),
      { status: 500, headers }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
