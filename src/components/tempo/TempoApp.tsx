/**
 * Tempo - Time-Block Task Management App
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying, modification,
 * or distribution of this code is strictly prohibited. The frontend logic is local-first
 * and protected intellectual property. No infringement or unauthorized use is permitted.
 */

import { Component, createSignal, Show, createMemo, onMount, createEffect } from 'solid-js';
import { useNavigate, useLocation, useParams } from '@solidjs/router';
import { BrainDump } from './brain-dump';
import { CaretRight, Gear } from 'phosphor-solid';
import { QueueView } from './queue';
import { tempoDesign } from './theme/tempo-design';
import { TempoLogo } from './ui/logo';
import { Button } from './ui/button';
import { SettingsSidebar } from './ui/settings-sidebar';
import { Tabs, type Tab } from './ui/tabs';
import { SessionsList } from './session-manager/components/sessions-list';
import { SessionView } from './session-manager/components/session-view';
import { ApiConfigService } from './services/api-config.service';
import { AppMenuTrigger } from '../common/AppMenuTrigger';
import { TempoNotificationService, type NotificationState } from './services/notification.service';

interface Stats {
  totalTasks: number;
  totalDuration: number;
  totalStories: number;
  totalFrogs: number;
}

// Add responsive grid styles
const responsiveStyles = document.createElement('style');
responsiveStyles.textContent = `
  @media (max-width: 1024px) {
    .tempo-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 768px) {
    .tempo-main {
      padding: 16px !important;
    }
    
    .tempo-header {
      margin-bottom: 24px !important;
      padding-bottom: 16px !important;
    }

    .tempo-grid {
      gap: 16px !important;
    }
  }

  @media (max-width: 640px) {
    .tempo-main {
      padding: 12px !important;
    }

    .tempo-header {
      margin-bottom: 16px !important;
    }
  }
`;
document.head.appendChild(responsiveStyles);

export const TempoApp: Component = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ date?: string }>();

  const [stats, setStats] = createSignal<Stats>({
    totalTasks: 0,
    totalDuration: 0,
    totalStories: 0,
    totalFrogs: 0,
  });

  const [showSettings, setShowSettings] = createSignal(false);

  // Check if API key is configured
  const [hasApiKey, setHasApiKey] = createSignal(ApiConfigService.hasApiKey());

  // Notification state for tab badges
  const [notifications, setNotifications] = createSignal<NotificationState>({
    sessions: { count: 0, hasUrgent: false, scheduledForToday: 0, overdueSessions: 0 },
    queue: { count: 0, hasOverdue: false, overdueCount: 0 },
  });

  // Load notification state
  const refreshNotifications = async () => {
    const state = await TempoNotificationService.getNotificationState();
    setNotifications(state);
  };

  // Load notifications on mount and when route changes
  onMount(refreshNotifications);

  // Refresh notifications when tab changes
  createEffect(() => {
    // Track activeTab to trigger refresh on tab change
    const _tab = activeTab();
    refreshNotifications();
  });

  // Determine active tab from current route
  const activeTab = createMemo(() => {
    const path = location.pathname;
    if (path.includes('/sessions')) return 'sessions';
    if (path.includes('/queue')) return 'backlog';
    return 'tasks';
  });

  // Check if we're viewing a specific session
  const isViewingSession = createMemo(() => {
    return location.pathname.includes('/sessions/') && params.date;
  });

  const handleTasksProcessed = (
    stories: { tasks: { isFrog?: boolean; duration?: number }[]; estimatedDuration?: number }[]
  ) => {
    const totalTasks = stories.reduce((acc, story) => acc + story.tasks.length, 0);
    const totalDuration = stories.reduce((acc, story) => {
      // Ensure we're using the correct duration field and handling potential undefined values
      const storyDuration =
        story.estimatedDuration ||
        story.tasks.reduce((taskSum: number, task) => taskSum + (task.duration || 0), 0) ||
        0;
      return acc + storyDuration;
    }, 0);
    const totalFrogs = stories.reduce(
      (acc, story) => acc + story.tasks.filter((task) => task.isFrog).length,
      0
    );

    setStats({
      totalTasks,
      totalDuration: Math.round(totalDuration), // Ensure integer duration
      totalStories: stories.length,
      totalFrogs,
    });
  };

  const handleSettingsSave = () => {
    setHasApiKey(ApiConfigService.hasApiKey());
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === 'tasks') {
      navigate('/tempo/create');
    } else if (tabId === 'sessions') {
      navigate('/tempo/sessions');
    } else if (tabId === 'backlog') {
      navigate('/tempo/queue');
    }
  };

  // Build tabs with dynamic badge data
  const tabs = createMemo((): Tab[] => {
    const notifs = notifications();
    return [
      { id: 'tasks', label: 'Create Tasks' },
      {
        id: 'sessions',
        label: 'Your Sessions',
        badge:
          notifs.sessions.count > 0
            ? {
                count: notifs.sessions.count,
                variant: notifs.sessions.hasUrgent ? 'urgent' : 'default',
              }
            : undefined,
      },
      {
        id: 'backlog',
        label: 'The Queue',
        badge:
          notifs.queue.count > 0
            ? {
                count: notifs.queue.count,
                variant: notifs.queue.hasOverdue ? 'warning' : 'default',
              }
            : undefined,
      },
    ];
  });

  return (
    <main
      class="tempo-main"
      style={{
        flex: 1,
        'max-width': '1280px',
        margin: '0 auto',
        padding: '24px',
        'font-family': tempoDesign.typography.fontFamily,
        background: tempoDesign.colors.background,
        color: tempoDesign.colors.foreground,
        'min-height': '100vh',
        display: 'flex',
        'flex-direction': 'column',
      }}
    >
      {/* Header */}
      <header
        class="tempo-header"
        style={{
          'margin-bottom': '32px',
          'padding-bottom': '24px',
          'border-bottom': `1px solid ${tempoDesign.colors.border}`,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
        }}
      >
        <AppMenuTrigger>
          <TempoLogo size={48} />
        </AppMenuTrigger>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(true)}
          style={{
            height: '40px',
            width: '40px',
            'border-radius': tempoDesign.radius.full,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
          }}
          title="Settings"
        >
          <Gear size={20} />
        </Button>
      </header>

      {/* Settings Sidebar */}
      <SettingsSidebar
        isOpen={showSettings()}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
      />

      {/* API Key Warning */}
      <Show when={!hasApiKey()}>
        <div
          style={{
            'background-color': `${tempoDesign.colors.amber[600]}10`,
            border: `1px solid ${tempoDesign.colors.amber[600]}30`,
            'border-radius': tempoDesign.radius.lg,
            padding: '12px 16px',
            'margin-bottom': '16px',
            'font-size': tempoDesign.typography.sizes.sm,
            color: tempoDesign.colors.amber[700],
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
            gap: '12px',
          }}
        >
          <span>Please configure your Claude API key in settings to use Tempo</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            style={{
              color: tempoDesign.colors.amber[600],
              'text-decoration': 'underline',
              'white-space': 'nowrap',
            }}
          >
            Configure Now
          </Button>
        </div>
      </Show>

      {/* Tab Navigation - Only show when not viewing a session */}
      <Show when={!isViewingSession()}>
        <Tabs tabs={tabs()} defaultTab={activeTab()} onChange={handleTabChange} />
      </Show>

      {/* Content Area */}
      <Show
        when={isViewingSession()}
        fallback={
          <Show
            when={activeTab() === 'tasks'}
            fallback={
              <Show
                when={activeTab() === 'sessions'}
                fallback={
                  /* The Queue View */
                  <div
                    style={{
                      'margin-top': '24px',
                    }}
                  >
                    <QueueView />
                  </div>
                }
              >
                {/* Sessions View */}
                <div
                  style={{
                    'margin-top': '24px',
                    display: 'flex',
                    'flex-direction': 'column',
                    gap: '16px',
                  }}
                >
                  <SessionsList />
                </div>
              </Show>
            }
          >
            <div
              class="tempo-grid"
              style={{
                display: 'grid',
                gap: '24px',
                'grid-template-columns': '1.5fr 1fr',
                'margin-top': '24px',
              }}
            >
              <BrainDump onTasksProcessed={handleTasksProcessed} />

              <Show when={stats().totalTasks > 0}>
                <div
                  style={{
                    'border-radius': tempoDesign.radius.lg,
                    border: `1px solid ${tempoDesign.colors.cardBorder}`,
                    background: tempoDesign.colors.card,
                    'box-shadow': tempoDesign.shadows.sm,
                    height: 'fit-content',
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      'flex-direction': 'row',
                      'align-items': 'center',
                      'justify-content': 'space-between',
                      padding: '24px 24px 8px',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          'font-size': tempoDesign.typography.sizes.lg,
                          'font-weight': tempoDesign.typography.weights.medium,
                          margin: 0,
                          color: tempoDesign.colors.foreground,
                        }}
                      >
                        Session Preview
                      </h3>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        'align-items': 'center',
                        gap: '4px',
                        'font-size': tempoDesign.typography.sizes.xs,
                        color: tempoDesign.colors.mutedForeground,
                      }}
                    >
                      <CaretRight style={{ width: '12px', height: '12px' }} />
                      <span>Optimize workflow</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '24px 24px', 'padding-top': 0 }}>
                    <dl style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          'justify-content': 'space-between',
                          'align-items': 'baseline',
                        }}
                      >
                        <dt
                          style={{
                            color: tempoDesign.colors.mutedForeground,
                            'font-size': tempoDesign.typography.sizes.sm,
                          }}
                        >
                          Tasks
                        </dt>
                        <dd
                          style={{
                            'font-size': tempoDesign.typography.sizes['2xl'],
                            'font-weight': tempoDesign.typography.weights.medium,
                            margin: 0,
                          }}
                        >
                          {stats().totalTasks}
                        </dd>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          'justify-content': 'space-between',
                          'align-items': 'baseline',
                        }}
                      >
                        <dt
                          style={{
                            color: tempoDesign.colors.mutedForeground,
                            'font-size': tempoDesign.typography.sizes.sm,
                          }}
                        >
                          Estimated Time
                        </dt>
                        <dd
                          style={{
                            'font-size': tempoDesign.typography.sizes['2xl'],
                            'font-weight': tempoDesign.typography.weights.medium,
                            margin: 0,
                          }}
                        >
                          {stats().totalDuration > 59
                            ? `${Math.floor(stats().totalDuration / 60)}h ${stats().totalDuration % 60}m`
                            : `${stats().totalDuration}m`}
                        </dd>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          'justify-content': 'space-between',
                          'align-items': 'baseline',
                        }}
                      >
                        <dt
                          style={{
                            color: tempoDesign.colors.mutedForeground,
                            'font-size': tempoDesign.typography.sizes.sm,
                          }}
                        >
                          Focus Stories
                        </dt>
                        <dd
                          style={{
                            'font-size': tempoDesign.typography.sizes['2xl'],
                            'font-weight': tempoDesign.typography.weights.medium,
                            margin: 0,
                          }}
                        >
                          {stats().totalStories}
                        </dd>
                      </div>
                      <Show when={stats().totalFrogs > 0}>
                        <div
                          style={{
                            display: 'flex',
                            'justify-content': 'space-between',
                            'align-items': 'baseline',
                          }}
                        >
                          <dt
                            style={{
                              color: tempoDesign.colors.mutedForeground,
                              'font-size': tempoDesign.typography.sizes.sm,
                              display: 'flex',
                              'align-items': 'center',
                              gap: '4px',
                            }}
                          >
                            <span>Frogs</span>
                          </dt>
                          <dd
                            style={{
                              'font-size': tempoDesign.typography.sizes['2xl'],
                              'font-weight': tempoDesign.typography.weights.medium,
                              color: tempoDesign.colors.primary,
                              margin: 0,
                            }}
                          >
                            {stats().totalFrogs}
                          </dd>
                        </div>
                      </Show>
                    </dl>
                  </div>
                </div>
              </Show>
            </div>
          </Show>
        }
      >
        {/* Session View */}
        <div style={{ 'margin-top': '24px' }}>
          <SessionView />
        </div>
      </Show>
    </main>
  );
};
