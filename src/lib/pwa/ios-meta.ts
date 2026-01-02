/**
 * iOS Meta Tag Updater
 *
 * Dynamically updates iOS-specific meta tags based on the current app route.
 * This ensures proper branding when adding to home screen from different apps.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createEffect } from 'solid-js';
import { useLocation } from '@solidjs/router';

interface IOSAppConfig {
  path: string;
  title: string;
  touchIconPath: string;
}

const IOS_CONFIGS: IOSAppConfig[] = [
  {
    path: '/tempo',
    title: 'Tempo',
    touchIconPath: '/icons/tempo/apple-touch-icon.png',
  },
  {
    path: '/tenure',
    title: 'Tenure',
    touchIconPath: '/icons/tenure/apple-touch-icon.png',
  },
  {
    path: '/',
    title: 'TACo',
    touchIconPath: '/icons/taco/apple-touch-icon.png',
  },
];

/**
 * Hook to update iOS meta tags based on current route
 */
export function useIOSMetaUpdater() {
  const location = useLocation();

  createEffect(() => {
    const currentPath = location.pathname;

    const config =
      IOS_CONFIGS.filter((c) => currentPath.startsWith(c.path)).sort(
        (a, b) => b.path.length - a.path.length
      )[0] || IOS_CONFIGS.find((c) => c.path === '/')!;

    // Update apple-mobile-web-app-title
    const titleMeta = document.querySelector(
      'meta[name="apple-mobile-web-app-title"]'
    ) as HTMLMetaElement;
    if (titleMeta) {
      titleMeta.content = config.title;
    }

    // Update apple-touch-icon
    const touchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (touchIcon) {
      touchIcon.href = config.touchIconPath;
    }
  });
}

/**
 * Check if running as iOS PWA
 */
export function isIOSPWA(): boolean {
  return (navigator as any).standalone === true;
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}
