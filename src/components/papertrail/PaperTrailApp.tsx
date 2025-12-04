/**
 * Paper Trail - Non-Linear Living News
 *
 * BAM! A bold, construction-paper-pop news experience.
 * High contrast. Thick lines. Electric yellow that POPS.
 *
 * Core Philosophy:
 * - Non-linear: Stories evolve and resurface
 * - Living: Every story shows its history and corrections
 * - Connected: Entity graphs reveal how stories interrelate
 *
 * News is fetched server-side - no user API keys needed!
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { papertrail, yellowScale, papertrailCSS, kineticAnimations } from '../../theme/papertrail';
import { useNews } from './hooks/useNews';
import { useChangelog } from './hooks/useChangelog';
import { useEntities } from './hooks/useEntities';
import { Tabs } from './ui/tabs';
import { Button } from './ui/button';
import { SettingsModal } from './ui/settings-modal';
import { NewsFeed } from './components/NewsFeed';
import { DiffView } from './components/DiffView';
import { SimpleGraph } from './components/SimpleGraph';
import { AIOnboarding } from './components/AIOnboarding';

type TabId = 'feed' | 'changes' | 'graph';

export const PaperTrailApp: Component = () => {
  // State
  const [activeTab, setActiveTab] = createSignal<TabId>('feed');
  const [showSettings, setShowSettings] = createSignal(false);

  // Hooks
  const news = useNews();
  const changelog = useChangelog();
  const entities = useEntities();

  // Handle settings save
  const handleSettingsSave = () => {
    // Rebuild graph after AI config changes
    if (news.articles().length > 0) {
      entities.buildGraph(news.articles());
    }
  };

  // Handle AI setup from onboarding
  const handleSetupAI = () => {
    setShowSettings(true);
  };

  // Handle view changes from article card
  const handleViewChanges = (_articleId: string) => {
    setActiveTab('changes');
  };

  // Handle graph build
  const handleBuildGraph = async () => {
    await entities.buildGraph(news.articles());
  };

  // Tab configuration
  const tabs = () => [
    { id: 'feed', label: 'Feed', count: news.articles().length },
    { id: 'changes', label: 'Changes', count: changelog.changelog().length },
    { id: 'graph', label: 'Graph', count: entities.entities().length },
  ];

  return (
    <div
      style={{
        'min-height': '100vh',
        background: papertrail.colors.background,
        'font-family': papertrail.fonts.body,
        color: papertrail.colors.text,
      }}
    >
      {/* Inject CSS variables and kinetic animations */}
      <style>{papertrailCSS}</style>
      <style>{kineticAnimations}</style>

      {/* HEADER - Bold construction paper masthead */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          'z-index': 50,
          background: '#FFFFFF',
          'border-bottom': '4px solid #000000',
        }}
      >
        {/* Electric yellow accent bar */}
        <div
          style={{
            height: '8px',
            background: yellowScale[500],
          }}
        />

        <div
          style={{
            'max-width': '1200px',
            margin: '0 auto',
            padding: '24px 24px 16px',
          }}
        >
          {/* Masthead Row */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
              'margin-bottom': '20px',
            }}
          >
            {/* Logo/Masthead */}
            <div style={{ display: 'flex', 'align-items': 'center', gap: '16px' }}>
              {/* Icon - construction paper lifted style */}
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background: yellowScale[500],
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  border: '3px solid #000000',
                  'box-shadow': '4px 4px 0 #000000',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#000000">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
              </div>

              {/* Title */}
              <div>
                <h1
                  style={{
                    margin: 0,
                    'font-family': papertrail.fonts.heading,
                    'font-size': '36px',
                    'font-weight': 900,
                    'letter-spacing': '-0.02em',
                    'text-transform': 'uppercase',
                    color: '#000000',
                    'line-height': 1,
                  }}
                >
                  PAPER TRAIL
                </h1>
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '10px',
                    'margin-top': '6px',
                  }}
                >
                  {/* LIVE badge - construction paper style */}
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      background: yellowScale[500],
                      border: '2px solid #000000',
                      'font-family': papertrail.fonts.heading,
                      'font-size': '11px',
                      'font-weight': 800,
                      'text-transform': 'uppercase',
                      'letter-spacing': '0.1em',
                      color: '#000000',
                    }}
                  >
                    LIVE
                  </span>
                  <p
                    style={{
                      margin: 0,
                      'font-family': papertrail.fonts.heading,
                      'font-size': '12px',
                      'font-weight': 600,
                      color: papertrail.colors.textMuted,
                      'text-transform': 'uppercase',
                      'letter-spacing': '0.08em',
                    }}
                  >
                    Non-Linear Living News
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Button */}
            <Button variant="outline" size="icon" onClick={() => setShowSettings(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </Button>
          </div>

          {/* Thick divider */}
          <div
            style={{
              height: '2px',
              background: '#000000',
              'margin-bottom': '16px',
            }}
          />

          {/* Tabs */}
          <Tabs
            tabs={tabs()}
            activeTab={activeTab()}
            onTabChange={(id) => setActiveTab(id as TabId)}
          />
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          'max-width': '1200px',
          margin: '0 auto',
          padding: '24px',
        }}
      >
        {/* Feed Tab */}
        <Show when={activeTab() === 'feed'}>
          <NewsFeed
            articles={news.articles()}
            isLoading={news.isLoading()}
            error={news.error()}
            lastFetchedAt={news.lastFetchedAt()}
            onRefresh={() => news.refresh()}
            onViewChanges={handleViewChanges}
          />
        </Show>

        {/* Changes Tab */}
        <Show when={activeTab() === 'changes'}>
          <DiffView changelog={changelog.changelog()} stats={changelog.stats()} />
        </Show>

        {/* Graph Tab */}
        <Show when={activeTab() === 'graph'}>
          <AIOnboarding onSetupAI={handleSetupAI} />
          <SimpleGraph
            entities={entities.entities()}
            relations={entities.relations()}
            isBuilding={entities.isBuilding()}
            onBuildGraph={handleBuildGraph}
          />
        </Show>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings()}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
      />
    </div>
  );
};
