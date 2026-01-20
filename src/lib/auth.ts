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

/**
 * Detailed subscription information for a single product
 * Used to display payment progress, status, etc.
 */
export interface SubscriptionDetail {
  status: string;
  lifetimeAccess: boolean;
  totalPayments: number | null;
  maxPayments: number | null;
  totalPaidCents: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
}

export interface User {
  userId: string;
  email: string;
  subscriptions: string[];
  /** Detailed subscription info keyed by product name (e.g., 'taco_club', 'tenure_extras') */
  subscriptionDetails?: Record<string, SubscriptionDetail>;
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
const REDIRECT_INTENT_KEY = 'taco_redirect_intent';
const USER_CACHE_KEY = 'taco_user_cache';
const USER_CACHE_TIMESTAMP_KEY = 'taco_user_cache_timestamp';

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
// JWT UTILITIES (Client-Side)
// ============================================================================

/**
 * JWT payload structure (matches server-side token)
 */
interface JwtPayload {
  userId: string;
  email: string;
  subscriptions: string[];
  type: string;
  exp: number;
  iat: number;
  jti: string;
}

/**
 * Decode a JWT token without verification (client-side only)
 * This is safe because we only use it for UX decisions, not authorization.
 * Server always re-validates the full token on API calls.
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    // Decode base64url to base64, then to string
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(payload);
    return JSON.parse(decoded) as JwtPayload;
  } catch (error) {
    logger.auth.warn('Failed to decode JWT payload:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired (client-side check)
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return true; // Treat missing exp as expired
  }
  // exp is in seconds, Date.now() is in milliseconds
  const now = Math.floor(Date.now() / 1000);
  return now >= payload.exp;
}

/**
 * Get time until token expires (in seconds)
 * Returns 0 if expired or invalid
 */
export function getTokenTimeRemaining(token: string | null): number {
  if (!token) return 0;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return 0;
  const now = Math.floor(Date.now() / 1000);
  const remaining = payload.exp - now;
  return remaining > 0 ? remaining : 0;
}

// ============================================================================
// USER CACHE (for offline support)
// ============================================================================

/**
 * Cache user data to localStorage for offline access
 */
function cacheUserData(user: User): void {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    localStorage.setItem(USER_CACHE_TIMESTAMP_KEY, Date.now().toString());
    logger.auth.debug('User data cached for offline access');
  } catch (error) {
    logger.auth.warn('Failed to cache user data:', error);
  }
}

/**
 * Get cached user data from localStorage
 */
function getCachedUserData(): User | null {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached) as User;
  } catch {
    return null;
  }
}

/**
 * Clear cached user data
 */
function clearCachedUserData(): void {
  try {
    localStorage.removeItem(USER_CACHE_KEY);
    localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
  } catch (error) {
    logger.auth.warn('Failed to clear cached user data:', error);
  }
}

/**
 * Build a User object from JWT payload and cached data
 * Used when offline to maintain authentication state
 */
function buildUserFromToken(token: string): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  // Try to get richer data from cache
  const cached = getCachedUserData();

  return {
    userId: payload.userId,
    email: payload.email,
    // Prefer cached subscriptions (more up-to-date) but fall back to JWT
    subscriptions: cached?.subscriptions ?? payload.subscriptions ?? [],
    subscriptionDetails: cached?.subscriptionDetails,
    stripeCustomerId: cached?.stripeCustomerId ?? null,
    createdAt: cached?.createdAt ?? payload.iat * 1000,
  };
}

/**
 * Store the redirect intent (where user was before login)
 */
export function storeRedirectIntent(path: string): void {
  try {
    localStorage.setItem(REDIRECT_INTENT_KEY, path);
  } catch (error) {
    logger.auth.error('Failed to store redirect intent:', error);
  }
}

/**
 * Get and clear the stored redirect intent
 * @returns The stored redirect path, or null if none exists
 */
export function getAndClearRedirectIntent(): string | null {
  try {
    const intent = localStorage.getItem(REDIRECT_INTENT_KEY);
    if (intent) {
      localStorage.removeItem(REDIRECT_INTENT_KEY);
      return intent;
    }
    return null;
  } catch (error) {
    logger.auth.error('Failed to get redirect intent:', error);
    return null;
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
      url.searchParams.delete('auth_error'); // Also clean up any error params
      window.history.replaceState({}, '', url.pathname + url.search);

      return true;
    }

    // Check for error in URL (from failed verification)
    const authError = params.get('auth_error');
    if (authError) {
      logger.auth.warn('Auth error:', authError);

      // Show error notification to user
      showAuthErrorNotification(authError);

      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('auth_error');
      window.history.replaceState({}, '', url.pathname + url.search);
    }

    return false;
  } catch (error) {
    logger.auth.error('Error handling auth callback:', error);
    return false;
  }
}

/**
 * Show an auth error notification to the user
 * @param errorType - The error type from URL params
 */
function showAuthErrorNotification(errorType: string): void {
  const errorMessages: Record<string, string> = {
    missing_token: 'No authentication token provided',
    invalid_token: 'Invalid or corrupted sign-in link',
    expired_token: 'Sign-in link has expired. Please request a new one.',
  };

  const message = errorMessages[errorType] || 'Authentication failed. Please try again.';

  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 80px;
      right: 24px;
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      animation: authErrorSlideIn 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: 400px;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>${message}</span>
    </div>
    <style>
      @keyframes authErrorSlideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    </style>
  `;
  document.body.appendChild(notification);

  // Remove after 6 seconds (longer for error messages)
  setTimeout(() => {
    notification.style.animation = 'authErrorSlideIn 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 6000);
}

/**
 * Validate the current session and get user info
 *
 * Works offline by:
 * 1. Checking JWT expiration client-side (no network needed)
 * 2. Returning cached user data when offline
 * 3. Refreshing from server when online for latest subscription data
 *
 * @returns User object if session is valid, null otherwise
 */
export async function validateSession(): Promise<User | null> {
  const token = getStoredToken();

  if (!token) {
    return null;
  }

  // First, check if token is expired (client-side, no network needed)
  if (isTokenExpired(token)) {
    logger.auth.info('Session token expired (client-side check)');
    clearToken();
    clearCachedUserData();
    return null;
  }

  // Try to validate with server for fresh subscription data
  try {
    const response = await fetch('/api/auth/validate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Server says token is invalid - trust server over client
      logger.auth.info('Session invalid (server rejected)');
      clearToken();
      clearCachedUserData();
      return null;
    }

    const user = (await response.json()) as User;

    // Cache user data for offline access
    cacheUserData(user);

    return user;
  } catch (error) {
    // Network error - we're offline
    logger.auth.info('Network unavailable, using offline authentication');

    // Token is valid (not expired), return user from token + cache
    const offlineUser = buildUserFromToken(token);
    if (offlineUser) {
      logger.auth.debug('Returning offline user:', { email: offlineUser.email });
      return offlineUser;
    }

    // Couldn't build user from token
    logger.auth.error('Failed to build offline user from token');
    return null;
  }
}

/**
 * Log out the current user
 * Clears local token, cached user data, and optionally redirects
 *
 * @param redirectTo - Optional URL to redirect to after logout
 */
export function logout(redirectTo?: string): void {
  clearToken();
  clearCachedUserData();

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
