/**
 * Install Prompt Service
 *
 * Captures the beforeinstallprompt event and provides install functionality.
 * Uses smart triggers to show install prompt at the right time.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createSignal } from 'solid-js';
import { logger } from '../logger';

// BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

// Capture the deferred prompt
let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Reactive signals
export const [canInstall, setCanInstall] = createSignal(false);
export const [isInstalled, setIsInstalled] = createSignal(false);

/**
 * Check if app is already installed
 */
function checkInstalled(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if ((navigator as any).standalone === true) return true;
  return false;
}

/**
 * Initialize install prompt capture
 * Call this once on app startup
 */
export function initInstallPrompt() {
  setIsInstalled(checkInstalled());

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    setCanInstall(true);
    logger.pwa.info('Install prompt captured');
  });

  window.addEventListener('appinstalled', () => {
    logger.pwa.info('App installed');
    setIsInstalled(true);
    setCanInstall(false);
    deferredPrompt = null;
  });

  window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
    setIsInstalled(e.matches);
  });
}

/**
 * Trigger the native install prompt
 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) {
    logger.pwa.info('No install prompt available');
    return 'unavailable';
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  logger.pwa.info(`Install outcome: ${outcome}`);

  if (outcome === 'accepted') {
    setCanInstall(false);
    deferredPrompt = null;
  }

  return outcome;
}

// Dismiss tracking
const DISMISS_KEY = 'pwa_install_dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function isDismissed(): boolean {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;

  const timestamp = parseInt(dismissed, 10);
  if (Date.now() - timestamp > DISMISS_DURATION) {
    localStorage.removeItem(DISMISS_KEY);
    return false;
  }
  return true;
}

export function dismissInstallPrompt() {
  localStorage.setItem(DISMISS_KEY, Date.now().toString());
}

// Smart trigger tracking
const VISIT_KEY = 'pwa_visit_count';

export function trackVisit() {
  const count = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10);
  localStorage.setItem(VISIT_KEY, (count + 1).toString());
}

export function shouldShowInstallPrompt(): boolean {
  if (isInstalled() || !canInstall() || isDismissed()) return false;
  const visits = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10);
  return visits >= 3; // Show after 3rd visit
}
