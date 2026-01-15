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
const REDIRECT_INTENT_KEY = 'taco_redirect_intent';

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
