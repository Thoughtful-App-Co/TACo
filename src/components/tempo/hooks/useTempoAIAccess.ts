/**
 * Unified Tempo AI Access Hook
 *
 * Handles access control for Tempo AI features (Brain Dump, session creation).
 * Users can access AI features through TWO paths:
 * 1. Bring Your Own Key (BYOK) - User provides their own Claude API key
 * 2. Tempo Extras Subscription - $12/mo managed access
 *
 * SECURITY NOTE: User API keys are stored in localStorage (unencrypted).
 * We do NOT store keys server-side - they are only passed through per-request.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createSignal, createMemo } from 'solid-js';
import { canUseTempoAI } from '../../../lib/feature-gates';
import { ApiConfigService } from '../services/api-config.service';
import { showNotification } from '../../../lib/notifications';
import { logger } from '../../../lib/logger';

const log = logger.create('TempoAIAccess');

export interface TempoAIAccessResult {
  /** Whether user has access via either path (own key OR subscription) */
  allowed: boolean;
  /** Whether user has their own API key configured */
  hasOwnKey: boolean;
  /** Whether user has active Tempo Extras subscription */
  hasSubscription: boolean;
  /** Access method being used */
  accessMethod: 'own-key' | 'subscription' | 'none';
  /** Reason why access is denied (if denied) */
  reason?: string;
}

export function useTempoAIAccess() {
  const [showPaywall, setShowPaywall] = createSignal(false);

  /**
   * Check current access status
   */
  const accessStatus = createMemo((): TempoAIAccessResult => {
    const hasOwnKey = ApiConfigService.hasApiKey();
    const subscriptionCheck = canUseTempoAI();
    const hasSubscription = subscriptionCheck.allowed;

    // User has access if they have EITHER their own key OR a subscription
    const allowed = hasOwnKey || hasSubscription;

    // Determine access method
    let accessMethod: 'own-key' | 'subscription' | 'none' = 'none';
    if (hasOwnKey) {
      accessMethod = 'own-key';
    } else if (hasSubscription) {
      accessMethod = 'subscription';
    }

    // Reason if denied
    const reason = !allowed
      ? 'To use AI features, add your Claude API key in Settings or subscribe to Tempo Extras ($12/mo)'
      : undefined;

    log.debug('Access check', {
      allowed,
      hasOwnKey,
      hasSubscription,
      accessMethod,
    });

    return {
      allowed,
      hasOwnKey,
      hasSubscription,
      accessMethod,
      reason,
    };
  });

  /**
   * Require access - show notification or paywall if denied
   * @param callback - Function to execute if access is granted
   * @param options - Notification options
   */
  const requireAccess = (
    callback: () => void,
    options?: {
      /** Show paywall modal in addition to toast notification */
      showPaywallModal?: boolean;
      /** Custom notification message */
      notificationMessage?: string;
      /** Skip toast notification (only show modal) */
      skipToast?: boolean;
    }
  ) => {
    const status = accessStatus();

    log.info('Access required', status);

    if (status.allowed) {
      log.info('Access granted, executing callback');
      callback();
      return;
    }

    log.warn('Access denied', {
      hasOwnKey: status.hasOwnKey,
      hasSubscription: status.hasSubscription,
      reason: status.reason,
    });

    // Access denied - ALWAYS show toast notification for immediate feedback
    if (!options?.skipToast) {
      log.info('Showing toast notification');
      try {
        showNotification({
          type: 'warning',
          message:
            options?.notificationMessage ||
            'To use AI features, add your Claude API key in Settings or subscribe to Tempo Extras ($12/mo)',
          duration: 8000,
          action: {
            label: 'Learn More',
            onClick: () => {
              window.location.href = '/pricing#tempo-extras';
            },
          },
        });
        log.info('Toast notification displayed');
      } catch (error) {
        log.error('Failed to show notification', error);
      }
    }

    // Also show paywall modal if requested
    if (options?.showPaywallModal) {
      log.info('Showing paywall modal');
      setShowPaywall(true);
    }
  };

  /**
   * Show a notification about access options
   * Useful for onboarding or when user first encounters the feature
   */
  const showAccessOptionsNotification = () => {
    const status = accessStatus();

    if (status.allowed) {
      // User already has access - show which method they're using
      if (status.accessMethod === 'own-key') {
        showNotification({
          type: 'info',
          message: 'Using your own Claude API key for AI features',
          duration: 4000,
        });
      } else {
        showNotification({
          type: 'info',
          message: 'Using Tempo Extras subscription for AI features',
          duration: 4000,
        });
      }
    } else {
      // User doesn't have access - explain both options
      showNotification({
        type: 'info',
        message:
          'Two ways to use AI: Add your Claude API key in Settings, or subscribe to Tempo Extras ($12/mo)',
        duration: 10000,
        action: {
          label: 'Learn More',
          onClick: () => {
            window.location.href = '/pricing#tempo-extras';
          },
        },
      });
    }
  };

  return {
    /**
     * Reactive access status - contains all access information
     */
    accessStatus,

    /**
     * Whether user has access (via either path)
     */
    canUseAI: () => accessStatus().allowed,

    /**
     * Whether user has their own API key
     */
    hasOwnKey: () => accessStatus().hasOwnKey,

    /**
     * Whether user has subscription
     */
    hasSubscription: () => accessStatus().hasSubscription,

    /**
     * Paywall modal state
     */
    showPaywall,
    setShowPaywall,

    /**
     * Require access - execute callback if allowed, show notification if denied
     */
    requireAccess,

    /**
     * Show informational notification about access options
     */
    showAccessOptionsNotification,
  };
}
