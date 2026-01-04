/**
 * PWA Registration Service
 *
 * Handles service worker registration, updates, and offline detection.
 * Provides reactive signals for UI components to respond to PWA state.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { registerSW } from 'virtual:pwa-register';
import { createSignal } from 'solid-js';
import { logger } from '../logger';

export interface PWAUpdateInfo {
  hasUpdate: boolean;
  updateSW: ((reload?: boolean) => Promise<void>) | undefined;
}

// Reactive signals for PWA state
export const [pwaUpdateAvailable, setPwaUpdateAvailable] = createSignal(false);
export const [pwaOfflineReady, setPwaOfflineReady] = createSignal(false);
export const [pwaRegistered, setPwaRegistered] = createSignal(false);

let updateSWCallback: ((reload?: boolean) => Promise<void>) | undefined;

/**
 * Initialize PWA service worker registration
 * Call this once in your app's entry point
 */
export function initPWA() {
  updateSWCallback = registerSW({
    immediate: true,
    onNeedRefresh() {
      logger.pwa.info('New version available');
      setPwaUpdateAvailable(true);
      // Store update info for changelog display
      localStorage.setItem('pwa_update_pending', Date.now().toString());
    },
    onOfflineReady() {
      logger.pwa.info('App ready to work offline');
      setPwaOfflineReady(true);
    },
    onRegisteredSW(swUrl, registration) {
      logger.pwa.info('Service worker registered:', swUrl);
      setPwaRegistered(true);

      // Check for updates every hour
      if (registration) {
        setInterval(
          () => {
            logger.pwa.info('Checking for updates...');
            registration.update();
          },
          60 * 60 * 1000
        );
      }
    },
    onRegisterError(error) {
      logger.pwa.error('Service worker registration error:', error);
    },
  });

  logger.pwa.info('Initialization complete');
}

/**
 * Apply pending update and reload the app
 */
export function applyUpdate() {
  if (updateSWCallback) {
    logger.pwa.info('Applying update...');
    updateSWCallback(true);
  } else {
    logger.pwa.warn('No update callback available');
  }
}

/**
 * Dismiss the current update prompt
 * User will see it again on next session
 */
export function dismissUpdate() {
  setPwaUpdateAvailable(false);
  logger.pwa.info('Update dismissed');
}

/**
 * Check if running in standalone PWA mode
 */
export function isPWA(): boolean {
  // Check display-mode media query
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  // iOS standalone check
  if ((navigator as any).standalone === true) {
    return true;
  }
  // Check if launched from installed app
  if (document.referrer.includes('android-app://')) {
    return true;
  }
  return false;
}

/**
 * Get PWA installation status
 */
export function getPWAStatus() {
  return {
    isInstalled: isPWA(),
    isRegistered: pwaRegistered(),
    hasUpdate: pwaUpdateAvailable(),
    isOfflineReady: pwaOfflineReady(),
  };
}
