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
      console.log('[PWA] New version available');
      setPwaUpdateAvailable(true);
      // Store update info for changelog display
      localStorage.setItem('pwa_update_pending', Date.now().toString());
    },
    onOfflineReady() {
      console.log('[PWA] App ready to work offline');
      setPwaOfflineReady(true);
    },
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] Service worker registered:', swUrl);
      setPwaRegistered(true);

      // Check for updates every hour
      if (registration) {
        setInterval(
          () => {
            console.log('[PWA] Checking for updates...');
            registration.update();
          },
          60 * 60 * 1000
        );
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Service worker registration error:', error);
    },
  });

  console.log('[PWA] Initialization complete');
}

/**
 * Apply pending update and reload the app
 */
export function applyUpdate() {
  if (updateSWCallback) {
    console.log('[PWA] Applying update...');
    updateSWCallback(true);
  } else {
    console.warn('[PWA] No update callback available');
  }
}

/**
 * Dismiss the current update prompt
 * User will see it again on next session
 */
export function dismissUpdate() {
  setPwaUpdateAvailable(false);
  console.log('[PWA] Update dismissed');
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
