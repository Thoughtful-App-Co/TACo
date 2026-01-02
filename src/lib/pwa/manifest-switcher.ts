/**
 * Manifest Switcher
 *
 * Dynamically switches the PWA manifest based on the current route.
 * This allows each TACo app to have its own installable identity.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createEffect } from 'solid-js';
import { useLocation } from '@solidjs/router';

export interface ManifestConfig {
  path: string;
  manifestUrl: string;
  themeColor: string;
  backgroundColor: string;
  appleTitle: string;
}

/**
 * Manifest configurations for each app
 * Ordered by path length (longest first) for proper matching
 */
const MANIFEST_MAP: ManifestConfig[] = [
  {
    path: '/tempo',
    manifestUrl: '/tempo/manifest.json',
    themeColor: '#5E6AD2',
    backgroundColor: '#0D1117',
    appleTitle: 'Tempo',
  },
  {
    path: '/tenure',
    manifestUrl: '/tenure/manifest.json',
    themeColor: '#9333EA',
    backgroundColor: '#121212',
    appleTitle: 'Tenure',
  },
  // Default fallback to main TACo manifest
  {
    path: '/',
    manifestUrl: '/manifest.json',
    themeColor: '#FF6B6B',
    backgroundColor: '#0F0F1A',
    appleTitle: 'TACo',
  },
];

/**
 * Hook to automatically switch manifest based on current route
 * Call this in your root App component
 */
export function useManifestSwitcher() {
  const location = useLocation();

  createEffect(() => {
    const currentPath = location.pathname;

    // Find matching manifest (longest path match wins)
    const config =
      MANIFEST_MAP.filter((m) => currentPath.startsWith(m.path)).sort(
        (a, b) => b.path.length - a.path.length
      )[0] || MANIFEST_MAP.find((m) => m.path === '/')!;

    console.log(`[ManifestSwitcher] Switching to ${config.appleTitle} manifest`);

    // Update manifest link
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    if (manifestLink.href !== config.manifestUrl) {
      manifestLink.href = config.manifestUrl;
    }

    // Update theme-color meta
    let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = config.themeColor;

    // Update Apple title
    let appleTitleMeta = document.querySelector(
      'meta[name="apple-mobile-web-app-title"]'
    ) as HTMLMetaElement;
    if (!appleTitleMeta) {
      appleTitleMeta = document.createElement('meta');
      appleTitleMeta.name = 'apple-mobile-web-app-title';
      document.head.appendChild(appleTitleMeta);
    }
    appleTitleMeta.content = config.appleTitle;

    // Update document title if on app page
    if (config.path !== '/') {
      document.title = `${config.appleTitle} | Thoughtful App Co.`;
    }
  });
}

/**
 * Get current app configuration
 * Useful for UI components that need to know which app is active
 */
export function getCurrentAppConfig(): ManifestConfig {
  const path = window.location.pathname;
  return (
    MANIFEST_MAP.filter((m) => path.startsWith(m.path)).sort(
      (a, b) => b.path.length - a.path.length
    )[0] || MANIFEST_MAP.find((m) => m.path === '/')!
  );
}

/**
 * Get manifest config by path
 */
export function getManifestConfig(path: string): ManifestConfig {
  return (
    MANIFEST_MAP.filter((m) => path.startsWith(m.path)).sort(
      (a, b) => b.path.length - a.path.length
    )[0] || MANIFEST_MAP.find((m) => m.path === '/')!
  );
}

/**
 * Preload manifest for faster install prompt
 */
export function preloadManifest(path: string) {
  const config = getManifestConfig(path);
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'fetch';
  link.href = config.manifestUrl;
  link.setAttribute('crossorigin', 'anonymous');
  document.head.appendChild(link);
}
