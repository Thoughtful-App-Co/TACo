/**
 * Authentication Library
 *
 * Client-side utilities for magic link authentication.
 * Works with the /api/auth/* endpoints.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { logger } from './logger';

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  userId: string;
  email: string;
  subscriptions: string[];
  stripeCustomerId: string | null;
  createdAt: number;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export type SubscriptionProduct =
  | 'sync_all'
  | 'sync_tempo'
  | 'sync_tenure'
  | 'sync_nurture'
  | 'tempo_extras'
  | 'tenure_extras'
  | 'taco_club';

// ============================================================================
// CONSTANTS
// ============================================================================

const TOKEN_STORAGE_KEY = 'taco_session_token';
const AUTH_CALLBACK_PARAM = 'auth_token';

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Get the stored session token
 */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Store the session token
 */
export function storeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    logger.auth.error('Failed to store auth token:', error);
  }
}

/**
 * Clear the stored session token
 */
export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    logger.auth.error('Failed to clear auth token:', error);
  }
}

// ============================================================================
// AUTH FLOW
// ============================================================================

/**
 * Request a magic link email
 *
 * @param email - User's email address
 * @returns Promise resolving to success status
 * @throws Error if request fails
 */
export async function requestMagicLink(
  email: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/auth/request-magic-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to send magic link');
  }

  return data;
}

/**
 * Handle the auth callback when user returns from magic link
 * Extracts token from URL and stores it
 *
 * @returns true if a token was found and stored
 */
export function handleAuthCallback(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get(AUTH_CALLBACK_PARAM);

    if (token) {
      // Store the token
      storeToken(token);

      // Clean up URL (remove auth_token param)
      const url = new URL(window.location.href);
      url.searchParams.delete(AUTH_CALLBACK_PARAM);
      url.searchParams.delete('error'); // Also clean up any error params
      window.history.replaceState({}, '', url.pathname + url.search);

      return true;
    }

    // Check for error in URL (from failed verification)
    const error = params.get('error');
    if (error) {
      logger.auth.warn('Auth error:', error);
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.pathname + url.search);
    }

    return false;
  } catch (error) {
    logger.auth.error('Error handling auth callback:', error);
    return false;
  }
}

/**
 * Validate the current session and get user info
 *
 * @returns User object if session is valid, null otherwise
 */
export async function validateSession(): Promise<User | null> {
  const token = getStoredToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch('/api/auth/validate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Token is invalid or expired - clear it
      clearToken();
      return null;
    }

    const user = await response.json();
    return user as User;
  } catch (error) {
    logger.auth.error('Session validation error:', error);
    return null;
  }
}

/**
 * Log out the current user
 * Clears local token and optionally redirects
 *
 * @param redirectTo - Optional URL to redirect to after logout
 */
export function logout(redirectTo?: string): void {
  clearToken();

  if (redirectTo) {
    window.location.href = redirectTo;
  }
}

// ============================================================================
// SUBSCRIPTION HELPERS
// ============================================================================

/**
 * Check if user has a specific subscription
 */
export function hasSubscription(user: User | null, product: SubscriptionProduct): boolean {
  if (!user) return false;
  return user.subscriptions.includes(product);
}

/**
 * Check if user has any sync subscription (all or individual app)
 */
export function hasSyncSubscription(user: User | null): boolean {
  if (!user) return false;
  return user.subscriptions.some((sub) => sub === 'sync_all' || sub.startsWith('sync_'));
}

/**
 * Check if user has sync for a specific app
 */
export function hasAppSync(user: User | null, app: 'tempo' | 'tenure' | 'nurture'): boolean {
  if (!user) return false;
  return user.subscriptions.includes('sync_all') || user.subscriptions.includes(`sync_${app}`);
}

/**
 * Check if user has extras for a specific app
 */
export function hasAppExtras(user: User | null, app: 'tempo' | 'tenure'): boolean {
  if (!user) return false;
  return user.subscriptions.includes(`${app}_extras`) || user.subscriptions.includes('taco_club');
}

/**
 * Check if user is a TACo Club member
 */
export function isTacoClubMember(user: User | null): boolean {
  if (!user) return false;
  return user.subscriptions.includes('taco_club');
}

// ============================================================================
// API HELPERS
// ============================================================================

/**
 * Get authorization headers for authenticated API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Make an authenticated API request
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();

  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
