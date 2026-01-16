/**
 * Authentication Context
 *
 * Solid.js context provider for authentication state.
 * Handles session persistence, validation, and subscription checks.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import {
  createContext,
  useContext,
  createSignal,
  onMount,
  ParentComponent,
  Accessor,
} from 'solid-js';

import { logger } from './logger';

import {
  User,
  SubscriptionProduct,
  handleAuthCallback,
  validateSession,
  requestMagicLink,
  logout as authLogout,
  hasSubscription,
  hasSyncSubscription,
  hasAppSync,
  hasAppExtras,
  isTacoClubMember,
  getAndClearRedirectIntent,
} from './auth';
import { clearSubscriptionCache, initializeSubscriptionCache } from './feature-gates';

// ============================================================================
// TYPES
// ============================================================================

interface AuthContextValue {
  // State
  user: Accessor<User | null>;
  isLoading: Accessor<boolean>;
  isAuthenticated: Accessor<boolean>;

  // Actions
  login: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: (redirectTo?: string) => void;
  refreshSession: () => Promise<void>;

  // Subscription checks
  hasSubscription: (product: SubscriptionProduct) => boolean;
  hasSyncSubscription: () => boolean;
  hasAppSync: (app: 'tempo' | 'tenure' | 'nurture') => boolean;
  hasAppExtras: (app: 'tempo' | 'tenure') => boolean;
  isTacoClubMember: () => boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextValue>();

// ============================================================================
// PROVIDER
// ============================================================================

export const AuthProvider: ParentComponent = (props) => {
  const [user, setUser] = createSignal<User | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);

  // Derived state
  const isAuthenticated = () => user() !== null;

  /**
   * Initialize auth state on mount
   */
  onMount(async () => {
    try {
      // First, check for auth callback (user clicking magic link)
      const wasCallback = handleAuthCallback();

      // Validate existing session
      const sessionUser = await validateSession();
      setUser(sessionUser);

      // Initialize subscription cache so sync feature checks work immediately
      if (sessionUser) {
        await initializeSubscriptionCache();
      }

      // If we just processed a callback and got a valid session,
      // show a success notification and handle redirect
      if (wasCallback && sessionUser) {
        logger.auth.info('Successfully logged in as:', sessionUser.email);

        // Show a temporary success notification
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="
            position: fixed;
            top: 80px;
            right: 24px;
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            font-family: 'DM Sans', system-ui, sans-serif;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Signed in as ${sessionUser.email}</span>
          </div>
          <style>
            @keyframes slideIn {
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

        // Remove after 4 seconds
        setTimeout(() => {
          notification.style.animation = 'slideIn 0.3s ease reverse';
          setTimeout(() => notification.remove(), 300);
        }, 4000);

        // Handle redirect based on stored intent
        const redirectPath = getAndClearRedirectIntent();
        const currentPath = window.location.pathname;

        if (redirectPath && redirectPath !== currentPath) {
          // User was somewhere specific when they logged in - take them back there
          logger.auth.debug('Redirecting to stored intent:', redirectPath);
          window.location.href = redirectPath;
        } else if (currentPath === '/') {
          // User logged in from landing page - send them to app home
          logger.auth.debug('Redirecting to /home after landing page login');
          window.location.href = '/home';
        }
        // Otherwise, stay on current page (e.g., already in an app)
      }
    } catch (error) {
      logger.auth.error('Auth initialization error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  });

  /**
   * Request magic link login
   */
  async function login(email: string) {
    return requestMagicLink(email);
  }

  /**
   * Log out and optionally redirect
   */
  function logout(redirectTo?: string) {
    setUser(null);
    authLogout(redirectTo);
  }

  /**
   * Refresh session (re-validate token, get fresh subscription data)
   */
  async function refreshSession() {
    setIsLoading(true);
    try {
      // Clear the feature-gates subscription cache so fresh data is fetched
      clearSubscriptionCache();

      const sessionUser = await validateSession();
      setUser(sessionUser);
    } catch (error) {
      logger.auth.error('Session refresh error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  // Subscription check helpers (bound to current user)
  const checkHasSubscription = (product: SubscriptionProduct) => hasSubscription(user(), product);

  const checkHasSyncSubscription = () => hasSyncSubscription(user());

  const checkHasAppSync = (app: 'tempo' | 'tenure' | 'nurture') => hasAppSync(user(), app);

  const checkHasAppExtras = (app: 'tempo' | 'tenure') => hasAppExtras(user(), app);

  const checkIsTacoClubMember = () => isTacoClubMember(user());

  const value: AuthContextValue = {
    // State
    user,
    isLoading,
    isAuthenticated,

    // Actions
    login,
    logout,
    refreshSession,

    // Subscription checks
    hasSubscription: checkHasSubscription,
    hasSyncSubscription: checkHasSyncSubscription,
    hasAppSync: checkHasAppSync,
    hasAppExtras: checkHasAppExtras,
    isTacoClubMember: checkIsTacoClubMember,
  };

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access authentication state and actions
 *
 * @example
 * ```tsx
 * const auth = useAuth();
 *
 * if (auth.isAuthenticated()) {
 *   console.log('User:', auth.user()?.email);
 * }
 *
 * if (auth.hasAppExtras('tenure')) {
 *   // Show premium features
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Component that only renders children if user is authenticated
 */
export const AuthenticatedOnly: ParentComponent<{
  fallback?: any;
}> = (props) => {
  const auth = useAuth();

  return <>{auth.isLoading() ? null : auth.isAuthenticated() ? props.children : props.fallback}</>;
};

/**
 * Component that only renders children if user is NOT authenticated
 */
export const UnauthenticatedOnly: ParentComponent = (props) => {
  const auth = useAuth();

  return <>{auth.isLoading() ? null : !auth.isAuthenticated() ? props.children : null}</>;
};

/**
 * Component that only renders children if user has a specific subscription
 */
export const SubscribedOnly: ParentComponent<{
  product: SubscriptionProduct;
  fallback?: any;
}> = (props) => {
  const auth = useAuth();

  return (
    <>
      {auth.isLoading()
        ? null
        : auth.hasSubscription(props.product)
          ? props.children
          : props.fallback}
    </>
  );
};
