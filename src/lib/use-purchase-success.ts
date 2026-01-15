/**
 * Purchase Success Hook
 *
 * Handles the post-purchase flow when user returns from Stripe checkout.
 * Polls for subscription updates and clears URL params.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createSignal, onMount } from 'solid-js';
import { useAuth } from './auth-context';
import { clearSubscriptionCache } from './feature-gates';
import { logger } from './logger';

export interface UsePurchaseSuccessOptions {
  /** Callback when purchase is detected */
  onSuccess?: () => void;
  /** Callback when purchase was canceled */
  onCanceled?: () => void;
  /** Max polling attempts (default: 5) */
  maxAttempts?: number;
  /** Polling interval in ms (default: 2000) */
  pollInterval?: number;
}

export interface UsePurchaseSuccessResult {
  /** Whether we're currently polling for subscription */
  isPolling: () => boolean;
  /** Whether a purchase success was detected */
  purchaseDetected: () => boolean;
  /** Whether purchase was canceled */
  purchaseCanceled: () => boolean;
}

/**
 * Hook to handle post-purchase subscription polling.
 *
 * Automatically detects `?purchase_success=true` or `?purchase_canceled=true`
 * URL params and handles the post-checkout flow.
 *
 * @example
 * ```tsx
 * const { purchaseDetected, isPolling } = usePurchaseSuccess({
 *   onSuccess: () => {
 *     // Show success message, close paywall, etc.
 *   }
 * });
 * ```
 */
export function usePurchaseSuccess(
  options: UsePurchaseSuccessOptions = {}
): UsePurchaseSuccessResult {
  const { onSuccess, onCanceled, maxAttempts = 5, pollInterval = 2000 } = options;

  const auth = useAuth();
  const [isPolling, setIsPolling] = createSignal(false);
  const [purchaseDetected, setPurchaseDetected] = createSignal(false);
  const [purchaseCanceled, setPurchaseCanceled] = createSignal(false);

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('purchase_success') === 'true';
    const canceled = urlParams.get('purchase_canceled') === 'true';

    // Clean up URL params immediately
    if (success || canceled) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

    if (success) {
      logger.billing.info('Purchase success detected, polling for subscription...');
      setPurchaseDetected(true);
      setIsPolling(true);

      let attempts = 0;

      const pollForSubscription = async () => {
        attempts++;
        logger.billing.debug(`Polling for subscription, attempt ${attempts}/${maxAttempts}`);

        // Clear cache and refresh session to get fresh subscription data
        clearSubscriptionCache();

        if (auth.refreshSession) {
          await auth.refreshSession();
        }

        // Check if we have subscriptions now
        const user = auth.user();
        const hasSubscriptions = user?.subscriptions && user.subscriptions.length > 0;

        if (hasSubscriptions) {
          logger.billing.info('Subscription detected!', { subscriptions: user.subscriptions });
          setIsPolling(false);
          onSuccess?.();
        } else if (attempts < maxAttempts) {
          // Keep polling
          setTimeout(pollForSubscription, pollInterval);
        } else {
          // Max attempts reached - subscription might still be processing
          logger.billing.warn('Max polling attempts reached, subscription may still be processing');
          setIsPolling(false);
          // Still call onSuccess - webhook might be delayed
          onSuccess?.();
        }
      };

      // Start polling after a brief delay to let webhook process
      setTimeout(pollForSubscription, 1500);
    }

    if (canceled) {
      logger.billing.info('Purchase was canceled');
      setPurchaseCanceled(true);
      onCanceled?.();
    }
  });

  return {
    isPolling,
    purchaseDetected,
    purchaseCanceled,
  };
}
