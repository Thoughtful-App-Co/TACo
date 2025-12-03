/**
 * Tempo - Time-Block Task Management App
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying, modification,
 * or distribution of this code is strictly prohibited. The frontend logic is local-first
 * and protected intellectual property. No infringement or unauthorized use is permitted.
 */

import { Component, createSignal, Show, createEffect } from 'solid-js';
import { BrainDump } from './brain-dump';
import { CaretRight } from 'phosphor-solid';
import { tempoDesign } from './theme/tempo-design';
import { TempoLogo } from './ui/logo';

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
  const [stats, setStats] = createSignal<Stats>({
    totalTasks: 0,
    totalDuration: 0,
    totalStories: 0,
    totalFrogs: 0,
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
        <TempoLogo size={48} />
      </header>

      <div
        class="tempo-grid"
        style={{
          display: 'grid',
          gap: '24px',
          'grid-template-columns': '1.5fr 1fr',
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
                <p
                  style={{
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.mutedForeground,
                    margin: '4px 0 0 0',
                  }}
                >
                  Productivity metrics
                </p>
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
                      <span style={{ 'font-size': tempoDesign.typography.sizes.base }}>🐸</span>
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
    </main>
  );
};
