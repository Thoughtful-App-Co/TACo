/**
 * ProsperView - Main container for Prosper with sidebar navigation
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show, createMemo, createEffect } from 'solid-js';
import { useLocation, useNavigate } from '@solidjs/router';
import { prosperStore } from '../store';
import { prosperTenure } from '../theme/prosper-tenure';
import { liquidTenure } from '../../pipeline/theme/liquid-tenure';
import { ProsperSidebar, type ProsperSection } from './ProsperSidebar';
import { DashboardView } from './DashboardView';
import { YourWorthView } from './YourWorthView';
import { JournalView } from './JournalView';
import { ReviewsView } from './ReviewsView';
import { ExportView } from './ExportView';

interface ProsperViewProps {
  currentTheme?: () => any; // Accept any theme shape from TenureApp
}

export const ProsperView: Component<ProsperViewProps> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active section from URL path
  const activeSection = createMemo((): ProsperSection => {
    const path = location.pathname;

    // Extract section from path like /tenure/prosper/dashboard
    const match = path.match(/\/tenure\/prosper\/([^/]+)/);
    if (match) {
      const section = match[1] as ProsperSection;
      // Validate it's a known section
      if (['dashboard', 'your-worth', 'journal', 'reviews', 'export'].includes(section)) {
        return section;
      }
    }

    // Default to dashboard
    return 'dashboard';
  });

  // Redirect to default section if on base /tenure/prosper path
  createEffect(() => {
    const path = location.pathname;
    if (path === '/tenure/prosper' || path === '/tenure/prosper/') {
      navigate(`/tenure/prosper/dashboard`, { replace: true });
    }
  });

  // Merge provided theme with prosperTenure defaults
  const theme = () => {
    const provided = props.currentTheme?.() || {};
    return {
      ...prosperTenure,
      ...provided,
      colors: { ...prosperTenure.colors, ...(provided.colors || {}) },
      fonts: provided.fonts || prosperTenure.fonts,
      spacing: provided.spacing || prosperTenure.spacing,
      radii: { ...prosperTenure.radii, ...(provided.radii || {}) },
    } as typeof prosperTenure;
  };

  return (
    <div
      style={{
        display: 'flex',
        'min-height': '100vh',
        background: theme().colors.background,
        color: theme().colors.text,
        'font-family': theme().fonts.body,
      }}
    >
      {/* Left Sidebar Navigation */}
      <ProsperSidebar
        activeSection={activeSection()}
        onSectionChange={(section) => navigate(`/tenure/prosper/${section}`)}
        currentTheme={theme}
      />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          'min-width': 0, // Prevent flex overflow
          overflow: 'auto',
          background: theme().colors.background,
        }}
      >
        {/* Dashboard Section */}
        <Show when={activeSection() === 'dashboard'}>
          <DashboardView 
            currentTheme={theme}
            onNavigate={(section) => navigate(`/tenure/prosper/${section}`)}
          />
        </Show>

        {/* Your Worth Section */}
        <Show when={activeSection() === 'your-worth'}>
          <YourWorthView currentTheme={theme} />
        </Show>

        {/* Journal Section */}
        <Show when={activeSection() === 'journal'}>
          <JournalView currentTheme={theme} />
        </Show>

        {/* Reviews Section */}
        <Show when={activeSection() === 'reviews'}>
          <ReviewsView currentTheme={theme} />
        </Show>

        {/* Export Section */}
        <Show when={activeSection() === 'export'}>
          <ExportView currentTheme={theme} />
        </Show>
      </div>
    </div>
  );
};

export default ProsperView;
