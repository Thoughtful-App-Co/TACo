/**
 * InsightsView - Analytics and insights section with Flow, Analytics, and Trends tabs
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { liquidTenure, pipelineAnimations } from '../theme/liquid-tenure';
import { SankeyView } from './SankeyView';
import { IconTrendingUp, IconPipeline, IconClock } from '../ui/Icons';
import { JobApplication } from '../../../../schemas/pipeline.schema';

interface InsightsViewProps {
  currentTheme: () => Partial<typeof liquidTenure> & typeof liquidTenure;
  onSelectJob: (job: JobApplication) => void;
}

type InsightsTab = 'flow' | 'analytics' | 'trends';

export const InsightsView: Component<InsightsViewProps> = (props) => {
  const theme = () => props.currentTheme();
  const [activeTab, setActiveTab] = createSignal<InsightsTab>('flow');

  const tabs = [
    { id: 'flow' as InsightsTab, label: 'Flow', icon: IconPipeline },
    { id: 'analytics' as InsightsTab, label: 'Analytics', icon: IconTrendingUp },
    { id: 'trends' as InsightsTab, label: 'Trends', icon: IconClock },
  ];

  return (
    <div style={{ padding: '32px', 'max-width': '1400px' }}>
      {/* Header */}
      <div style={{ 'margin-bottom': '24px' }}>
        <h1
          style={{
            margin: '0 0 8px',
            'font-size': '32px',
            'font-family': "'Playfair Display', Georgia, serif",
            'font-weight': '700',
            color: theme().colors.text,
          }}
        >
          Insights
        </h1>
        <p
          style={{
            margin: 0,
            'font-size': '15px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: theme().colors.textMuted,
          }}
        >
          Analyze your pipeline performance and trends
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          background: 'linear-gradient(135deg, rgba(15, 15, 18, 0.95), rgba(10, 10, 12, 0.98))',
          padding: '5px',
          'border-radius': '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          'box-shadow': 'inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 4px 12px rgba(0, 0, 0, 0.2)',
          'margin-bottom': '24px',
          width: 'fit-content',
        }}
      >
        {tabs.map((tab) => (
          <button
            class="pipeline-btn"
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              padding: '10px 20px',
              background:
                activeTab() === tab.id
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))'
                  : 'transparent',
              color: '#FFFFFF',
              border:
                activeTab() === tab.id
                  ? '1px solid rgba(255, 255, 255, 0.2)'
                  : '1px solid transparent',
              'border-radius': '8px',
              cursor: 'pointer',
              'font-size': '14px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'font-weight': activeTab() === tab.id ? '600' : '400',
              opacity: activeTab() === tab.id ? 1 : 0.6,
              transition: `all ${pipelineAnimations.fast}`,
              'box-shadow':
                activeTab() === tab.id ? 'inset 0 1px 0 rgba(255, 255, 255, 0.1)' : 'none',
            }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        <Show when={activeTab() === 'flow'}>
          <SankeyView currentTheme={theme} onSelectJob={props.onSelectJob} />
        </Show>

        <Show when={activeTab() === 'analytics'}>
          <AnalyticsTab theme={theme} />
        </Show>

        <Show when={activeTab() === 'trends'}>
          <TrendsTab theme={theme} />
        </Show>
      </div>
    </div>
  );
};

// Analytics Tab Component
interface TabProps {
  theme: () => typeof liquidTenure;
}

const AnalyticsTab: Component<TabProps> = (props) => {
  const theme = () => props.theme();

  return (
    <div
      style={{
        padding: '40px',
        background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.9), rgba(20, 20, 25, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        'border-radius': '16px',
        'text-align': 'center',
        'min-height': '400px',
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 24px',
          background: 'rgba(59, 130, 246, 0.1)',
          'border-radius': '20px',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        }}
      >
        <IconTrendingUp size={40} color="#60A5FA" />
      </div>
      <h3
        style={{
          margin: '0 0 12px',
          'font-size': '24px',
          'font-family': "'Playfair Display', Georgia, serif",
          'font-weight': '600',
          color: theme().colors.text,
        }}
      >
        Analytics Coming Soon
      </h3>
      <p
        style={{
          margin: 0,
          'max-width': '400px',
          'font-size': '15px',
          'font-family': "'Space Grotesk', system-ui, sans-serif",
          color: theme().colors.textMuted,
          'line-height': '1.6',
        }}
      >
        Conversion funnel visualization, stage-by-stage metrics, and success rate analysis will
        appear here.
      </p>
      <div
        style={{
          'margin-top': '24px',
          padding: '12px 20px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          'border-radius': '8px',
          'font-size': '13px',
          'font-family': "'Space Grotesk', system-ui, sans-serif",
          color: '#60A5FA',
        }}
      >
        🚧 Under Construction
      </div>
    </div>
  );
};

// Trends Tab Component
const TrendsTab: Component<TabProps> = (props) => {
  const theme = () => props.theme();

  return (
    <div
      style={{
        padding: '40px',
        background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.9), rgba(20, 20, 25, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        'border-radius': '16px',
        'text-align': 'center',
        'min-height': '400px',
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 24px',
          background: 'rgba(139, 92, 246, 0.1)',
          'border-radius': '20px',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          border: '1px solid rgba(139, 92, 246, 0.3)',
        }}
      >
        <IconClock size={40} color="#A78BFA" />
      </div>
      <h3
        style={{
          margin: '0 0 12px',
          'font-size': '24px',
          'font-family': "'Playfair Display', Georgia, serif",
          'font-weight': '600',
          color: theme().colors.text,
        }}
      >
        Trends Coming Soon
      </h3>
      <p
        style={{
          margin: 0,
          'max-width': '400px',
          'font-size': '15px',
          'font-family': "'Space Grotesk', system-ui, sans-serif",
          color: theme().colors.textMuted,
          'line-height': '1.6',
        }}
      >
        Application volume over time, rejection analysis by stage, and activity heatmaps will appear
        here.
      </p>
      <div
        style={{
          'margin-top': '24px',
          padding: '12px 20px',
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          'border-radius': '8px',
          'font-size': '13px',
          'font-family': "'Space Grotesk', system-ui, sans-serif",
          color: '#A78BFA',
        }}
      >
        🚧 Under Construction
      </div>
    </div>
  );
};

export default InsightsView;
