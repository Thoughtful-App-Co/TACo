/**
 * Discover Navigation Constants
 *
 * Shared navigation icons and items for the Discover section.
 * Used by DiscoverView, DiscoverSubTabs, and MobileDrawer.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component } from 'solid-js';
import { MobileDrawerNavItem } from '../lib/mobile-menu-context';

// Import icons from pipeline UI (they're already defined there)
import { IconChartBar, IconTarget, IconBrain, IconMindmap } from '../pipeline/ui/Icons';

// ==========================================================================
// NAVIGATION ITEMS CONSTANT
// ==========================================================================

/**
 * Navigation items for the Discover mobile drawer.
 * Used consistently across all Discover views.
 */
export const DISCOVER_NAV_ITEMS: MobileDrawerNavItem[] = [
  { id: 'overview', label: 'Overview', icon: IconChartBar, ariaLabel: 'Overview - Assessment hub' },
  {
    id: 'interests',
    label: 'Interests',
    icon: IconTarget,
    ariaLabel: 'Interests - RIASEC results',
  },
  {
    id: 'personality',
    label: 'Personality',
    icon: IconBrain,
    ariaLabel: 'Personality - Big Five results',
  },
  {
    id: 'cognitive-style',
    label: 'Cognitive Style',
    icon: IconMindmap,
    ariaLabel: 'Cognitive Style - Jungian results',
  },
];

// Re-export the icons for convenience
export { IconChartBar, IconTarget, IconBrain, IconMindmap };
