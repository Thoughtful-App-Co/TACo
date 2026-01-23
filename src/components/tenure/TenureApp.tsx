/**
 * Tenure - Eternal Career Companion
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying, modification,
 * or distribution of this code is strictly prohibited. The frontend logic is local-first
 * and protected intellectual property. No infringement or unauthorized use is permitted.
 */

import {
  Component,
  For,
  createSignal,
  onMount,
  onCleanup,
  Show,
  createMemo,
  createEffect,
  untrack,
} from 'solid-js';
import { useLocation, useNavigate } from '@solidjs/router';
import { JobMatch } from '../../schemas/tenure.schema';
import {
  XIcon,
  BinocularsIcon,
  CompassToolIcon,
  HammerIcon,
  FlowerLotusIcon,
  FlameIcon,
} from 'solid-phosphor/bold';
import {
  getInterestProfilerQuestions,
  getInterestProfilerResults,
  getInterestProfilerCareers,
  getCareerDetails,
  OnetQuestion,
  RiasecScoreWithDetails,
  OnetCareerMatch,
  OnetCareerDetails,
} from '../../services/onet';
import { formatSalary } from './pipeline/utils';
import { useMobile } from './lib/use-mobile';
import { maximalist } from '../../theme/maximalist';
import { PipelineView, pipelineStore, Sidebar, SidebarView } from './pipeline';
import { PrepareApp } from './prepare';

import { TenureThemeProvider } from './TenureThemeProvider';
import { ProsperView } from './prosper';
import { DiscoverView, DiscoverSubTab, ARCHETYPES } from './discover';
import {
  isRiasecCompleted,
  isOceanCompleted,
  isJungianCompleted,
  areAllAssessmentsCompleted,
} from '../../stores/assessment-store';

import { AppMenuTrigger } from '../common/AppMenuTrigger';
import { ProfileBadges } from '../common/ProfileBadges';
import { useAuth } from '../../lib/auth-context';
import { IconTrophy } from './pipeline/ui/Icons';
import { BottomNavBar, BottomNavItem } from './lib/BottomNavBar';

import { getTenureSyncManager, destroyTenureSyncManager } from '../../lib/sync/tenure-sync';
import { logger } from '../../lib/logger';

// Bottom Nav Icons
const IconCompass: Component<{ size?: number; color?: string; weight?: string }> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 256 256"
    fill={props.weight === 'fill' ? props.color || 'currentColor' : 'none'}
    stroke={props.weight === 'fill' ? 'none' : props.color || 'currentColor'}
    stroke-width="16"
  >
    <circle
      cx="128"
      cy="128"
      r="96"
      fill="none"
      stroke={props.color || 'currentColor'}
      stroke-width="16"
    />
    <polygon points="144 88 168 168 88 144 64 64 144 88" fill={props.color || 'currentColor'} />
  </svg>
);

const IconClipboard: Component<{ size?: number; color?: string; weight?: string }> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 256 256"
    fill={props.weight === 'fill' ? props.color || 'currentColor' : 'none'}
    stroke={props.color || 'currentColor'}
    stroke-width="16"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path
      d="M160,40H96a8,8,0,0,0-8,8V64H48a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H208a8,8,0,0,0,8-8V72a8,8,0,0,0-8-8H168V48A8,8,0,0,0,160,40Z"
      fill={props.weight === 'fill' ? props.color : 'none'}
    />
    <line x1="96" y1="152" x2="160" y2="152" />
    <line x1="96" y1="184" x2="160" y2="184" />
  </svg>
);

const IconKanban: Component<{ size?: number; color?: string; weight?: string }> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 256 256"
    fill={props.weight === 'fill' ? props.color || 'currentColor' : 'none'}
    stroke={props.color || 'currentColor'}
    stroke-width="16"
  >
    <rect
      x="32"
      y="48"
      width="56"
      height="160"
      rx="8"
      fill={props.weight === 'fill' ? props.color : 'none'}
    />
    <rect
      x="100"
      y="48"
      width="56"
      height="112"
      rx="8"
      fill={props.weight === 'fill' ? props.color : 'none'}
    />
    <rect
      x="168"
      y="48"
      width="56"
      height="80"
      rx="8"
      fill={props.weight === 'fill' ? props.color : 'none'}
    />
  </svg>
);

const IconTrendUp: Component<{ size?: number; color?: string; weight?: string }> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 256 256"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="16"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="232 56 136 152 96 112 24 184" />
    <polyline points="232 120 232 56 168 56" />
  </svg>
);

// Bottom navigation items for mobile
const TENURE_NAV_ITEMS: BottomNavItem[] = [
  { id: 'Discover', label: 'Discover', icon: IconCompass, ariaLabel: 'Discover - Assessments' },
  { id: 'Prepare', label: 'Prepare', icon: IconClipboard, ariaLabel: 'Prepare - Resume & skills' },
  { id: 'Prospect', label: 'Prospect', icon: IconKanban, ariaLabel: 'Prospect - Job pipeline' },
  { id: 'Prosper', label: 'Prosper', icon: IconTrendUp, ariaLabel: 'Prosper - Career growth' },
];

// Helper to get RGB string from hex
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
};

// Helper to determine contrasting text color (black or white)
const getContrastColor = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 'black';

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  // Calculate brightness (YIQ formula)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
};

// Dynamic Theme State
const [currentTheme, setCurrentTheme] = createSignal({
  colors: {
    primary: '#FFFFFF', // White for default
    secondary: '#A3A3A3', // Neutral 400
    accent: '#FFFFFF',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#F3F4F6',
    textMuted: '#9CA3AF',
    border: '#374151',
    textOnPrimary: 'black', // Default black on white
  },
  gradients: {
    primary: 'linear-gradient(135deg, #FFFFFF, #A3A3A3)',
  },
  shadows: {
    sm: '0 4px 12px rgba(255, 255, 255, 0.1), 0 2px 4px rgba(255, 255, 255, 0.05)',
    md: '0 8px 24px rgba(255, 255, 255, 0.15), 0 4px 8px rgba(255, 255, 255, 0.1)',
    lg: '0 16px 48px rgba(255, 255, 255, 0.2), 0 8px 16px rgba(255, 255, 255, 0.15)',
  },
});

const JobDetailModal: Component<{ job: OnetCareerDetails; onClose: () => void }> = (props) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        'backdrop-filter': 'blur(5px)',
        'z-index': 100,
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        padding: '24px',
      }}
      onClick={props.onClose}
    >
      <div
        style={{
          background: '#1a1a1a',
          border: `2px solid ${currentTheme().colors.primary}`,
          'border-radius': '16px',
          padding: '32px',
          'max-width': '800px',
          width: '100%',
          'max-height': '90vh',
          overflow: 'auto',
          color: '#fff',
          position: 'relative',
          'box-shadow': `0 0 30px ${currentTheme().colors.primary}40`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={props.onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: '#fff',
            'font-size': '24px',
            cursor: 'pointer',
          }}
        >
          <XIcon width={24} height={24} />
        </button>

        <h2
          style={{
            'font-family': maximalist.fonts.heading,
            'font-size': '36px',
            'margin-bottom': '16px',
            color: currentTheme().colors.primary,
          }}
        >
          {props.job.title}
        </h2>

        <div style={{ 'margin-bottom': '24px' }}>
          <Show when={props.job.tags.bright_outlook}>
            <span
              style={{
                background: '#F59E0B',
                color: 'black',
                padding: '4px 8px',
                'border-radius': '4px',
                'font-weight': 'bold',
                'font-size': '15px',
                'margin-right': '8px',
              }}
            >
              Bright Outlook
            </span>
          </Show>
          <Show when={props.job.tags.green}>
            <span
              style={{
                background: '#10B981',
                color: 'black',
                padding: '4px 8px',
                'border-radius': '4px',
                'font-weight': 'bold',
                'font-size': '15px',
              }}
            >
              Green Economy
            </span>
          </Show>
        </div>

        <div style={{ 'margin-bottom': '32px' }}>
          <h3
            style={{
              'font-size': '20px',
              'margin-bottom': '8px',
              color: currentTheme().colors.accent,
            }}
          >
            What they do
          </h3>
          <p style={{ 'line-height': '1.6', 'font-size': '18px', color: '#ccc' }}>
            {props.job.what_they_do}
          </p>
        </div>

        <div style={{ 'margin-bottom': '32px' }}>
          <h3
            style={{
              'font-size': '20px',
              'margin-bottom': '8px',
              color: currentTheme().colors.secondary,
            }}
          >
            On the job
          </h3>
          <ul style={{ 'padding-left': '20px', color: '#ccc' }}>
            <For each={props.job.on_the_job}>
              {(item) => <li style={{ 'margin-bottom': '8px', 'line-height': '1.5' }}>{item}</li>}
            </For>
          </ul>
        </div>

        <Show when={props.job.also_called}>
          <div>
            <h3
              style={{
                'font-size': '20px',
                'margin-bottom': '8px',
                color: maximalist.colors.textMuted,
              }}
            >
              Also called
            </h3>
            <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '8px' }}>
              <For each={props.job.also_called}>
                {(item) => (
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      padding: '4px 12px',
                      'border-radius': '16px',
                      'font-size': '15px',
                      color: '#ccc',
                    }}
                  >
                    {item.title}
                  </span>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

const JobCard: Component<{ job: JobMatch }> = (props) => {
  return (
    <div
      style={{
        background: maximalist.colors.surface,
        'border-radius': maximalist.radii.lg,
        overflow: 'hidden',
        border: `2px solid ${maximalist.colors.border}`,
        'box-shadow': currentTheme().shadows.md,
      }}
    >
      {/* Gradient header */}
      <div
        style={{
          background: currentTheme().gradients.primary,
          padding: '20px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '20px',
            width: '80px',
            height: '80px',
            background: 'rgba(255,255,255,0.1)',
            'border-radius': '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30px',
            right: '80px',
            width: '60px',
            height: '60px',
            background: 'rgba(255,255,255,0.08)',
            'border-radius': '50%',
          }}
        />

        <div style={{ position: 'relative', 'z-index': 1 }}>
          <div
            style={{
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'flex-start',
            }}
          >
            <div>
              <h3
                style={{
                  margin: '0 0 4px 0',
                  'font-family': maximalist.fonts.heading,
                  'font-size': '22px',
                  'font-weight': '700',
                  color: 'white',
                }}
              >
                {props.job.role}
              </h3>
              <p
                style={{
                  margin: 0,
                  'font-size': '17px',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                {props.job.company} • {props.job.location}
              </p>
            </div>

            {/* Overall score - prominent display */}
            <div
              style={{
                background: 'rgba(255,255,255,0.2)',
                'backdrop-filter': 'blur(10px)',
                'border-radius': '12px',
                padding: '12px 16px',
                'text-align': 'center',
              }}
            >
              <div
                style={{
                  'font-family': maximalist.fonts.heading,
                  'font-size': '32px',
                  'font-weight': '700',
                  color: currentTheme().colors.textOnPrimary,
                  'line-height': '1',
                }}
              >
                {props.job.overallScore}%
              </div>
              <div
                style={{
                  'font-size': '10px',
                  color:
                    currentTheme().colors.textOnPrimary === 'white'
                      ? 'rgba(255,255,255,0.7)'
                      : 'rgba(0,0,0,0.5)',
                  'text-transform': 'uppercase',
                  'letter-spacing': '1px',
                }}
              >
                Match
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Fit scores - dual bars */}
        <div
          style={{
            display: 'grid',
            'grid-template-columns': '1fr 1fr',
            gap: '16px',
            'margin-bottom': '20px',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                'justify-content': 'space-between',
                'margin-bottom': '6px',
                'font-size': '15px',
              }}
            >
              <span style={{ color: maximalist.colors.textMuted }}>Strength Fit</span>
              <span style={{ color: currentTheme().colors.primary, 'font-weight': '600' }}>
                {props.job.strengthFitScore}%
              </span>
            </div>
            <div
              style={{
                height: '8px',
                background: `${currentTheme().colors.primary}25`,
                'border-radius': '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${props.job.strengthFitScore}%`,
                  height: '100%',
                  background: currentTheme().gradients.primary,
                  'border-radius': '4px',
                }}
              />
            </div>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                'justify-content': 'space-between',
                'margin-bottom': '6px',
                'font-size': '15px',
              }}
            >
              <span style={{ color: maximalist.colors.textMuted }}>Culture Fit</span>
              <span style={{ color: currentTheme().colors.secondary, 'font-weight': '600' }}>
                {props.job.cultureFitScore}%
              </span>
            </div>
            <div
              style={{
                height: '8px',
                background: `${currentTheme().colors.secondary}25`,
                'border-radius': '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${props.job.cultureFitScore}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${currentTheme().colors.secondary}, ${currentTheme().colors.accent})`,
                  'border-radius': '4px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Matched values - decorative pills */}
        <div style={{ display: 'flex', gap: '8px', 'flex-wrap': 'wrap', 'margin-bottom': '20px' }}>
          <For each={props.job.matchedStrengths}>
            {(strength) => (
              <span
                style={{
                  padding: '6px 14px',
                  background: currentTheme().gradients.primary,
                  'border-radius': '20px',
                  'font-size': '15px',
                  color: currentTheme().colors.textOnPrimary,
                  'font-weight': '500',
                }}
              >
                {strength}
              </span>
            )}
          </For>
          <For each={props.job.matchedValues}>
            {(value) => (
              <span
                style={{
                  padding: '6px 14px',
                  background: `${maximalist.colors.border}`,
                  'border-radius': '20px',
                  'font-size': '15px',
                  color: maximalist.colors.text,
                  'font-weight': '500',
                }}
              >
                {value}
              </span>
            )}
          </For>
        </div>

        {/* Salary if available */}
        <Show when={props.job.salary}>
          <div
            style={{
              padding: '12px 16px',
              background: `${currentTheme().colors.accent}15`,
              'border-radius': maximalist.radii.sm,
              'margin-bottom': '20px',
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={currentTheme().colors.accent}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
            </svg>
            <span
              style={{
                'font-family': maximalist.fonts.body,
                'font-size': '17px',
                color: maximalist.colors.text,
              }}
            >
              {formatSalary(
                props.job.salary ? { ...props.job.salary, period: 'annual' as const } : undefined
              )}
            </span>
          </div>
        </Show>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{
              flex: 1,
              padding: '14px 20px',
              background: currentTheme().gradients.primary,
              border: 'none',
              'border-radius': maximalist.radii.md,
              color: currentTheme().colors.textOnPrimary,
              'font-size': '17px',
              'font-weight': '600',
              cursor: 'pointer',
              'box-shadow': currentTheme().shadows.sm,
            }}
          >
            View Details
          </button>
          <button
            style={{
              padding: '14px 20px',
              background: 'transparent',
              border: `2px solid ${maximalist.colors.border}`,
              'border-radius': maximalist.radii.md,
              color: maximalist.colors.text,
              'font-size': '17px',
              'font-weight': '600',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Feature ID to Tab name mapping
type FeatureId = 'discover' | 'prepare' | 'prospect' | 'prosper';
type TabName = 'Discover' | 'Prepare' | 'Prospect' | 'Prosper' | 'Matches';

const featureIdToTab: Record<FeatureId, TabName> = {
  discover: 'Discover',
  prepare: 'Prepare',
  prospect: 'Prospect',
  prosper: 'Prosper',
};

const tabToFeatureId: Record<TabName, FeatureId | null> = {
  Discover: 'discover',
  Prepare: 'prepare',
  Prospect: 'prospect',
  Prosper: 'prosper',
  Matches: null, // Matches doesn't have a dedicated route
};

export const TenureApp: Component = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const isMobile = useMobile();

  // Reactive accessor for current pathname
  const pathname = () => location.pathname;

  // Extract featureId from pathname (e.g., /tenure/discover -> discover)
  const featureIdFromPath = createMemo((): FeatureId | null => {
    const path = pathname();
    const match = path.match(/^\/tenure\/(\w+)/);
    return match ? (match[1].toLowerCase() as FeatureId) : null;
  });

  // Extract discover sub-tab from pathname (e.g., /tenure/discover/personality -> personality)
  const discoverSubTabFromPath = createMemo((): DiscoverSubTab | null => {
    const path = pathname();
    const match = path.match(/^\/tenure\/discover\/([a-z-]+)/);
    if (match) {
      const subTab = match[1] as DiscoverSubTab;
      // Validate it's a valid sub-tab
      if (['overview', 'interests', 'personality', 'cognitive-style'].includes(subTab)) {
        return subTab;
      }
    }
    return null;
  });

  // Get the user's configured default landing tab from settings
  const getDefaultLandingTab = (): TabName => {
    const defaultTab = pipelineStore.state.settings.defaultLandingTab || 'discover';
    return featureIdToTab[defaultTab] || 'Discover';
  };

  // Derive initial tab from URL, falling back to user's default landing tab
  const getInitialTab = (): TabName => {
    const featureId = featureIdFromPath();
    if (featureId && featureIdToTab[featureId]) {
      return featureIdToTab[featureId];
    }
    return getDefaultLandingTab();
  };

  const [activeTab, setActiveTab] = createSignal<TabName>(getInitialTab());
  const [jobs, setJobs] = createSignal<JobMatch[]>([]);

  // Sync tab with URL when pathname changes
  createEffect(() => {
    const path = pathname(); // Track pathname reactively
    const featureId = featureIdFromPath();

    if (featureId && featureIdToTab[featureId]) {
      setActiveTab(featureIdToTab[featureId]);
    } else if (path === '/tenure' || path === '/tenure/') {
      // If no featureId in URL, redirect to the user's default landing tab
      const defaultTab = pipelineStore.state.settings.defaultLandingTab || 'discover';
      navigate(`/tenure/${defaultTab}`, { replace: true });
    }
  });

  // Sync discover sub-tab with URL when pathname changes
  createEffect(() => {
    const path = pathname();
    const featureId = featureIdFromPath();
    const subTab = discoverSubTabFromPath();

    // If we're on /tenure/discover without a sub-tab, redirect to /overview
    if (featureId === 'discover' && !subTab && path === '/tenure/discover') {
      navigate('/tenure/discover/overview', { replace: true });
      return;
    }

    // Sync state with URL
    if (subTab && subTab !== discoverSubTab()) {
      setDiscoverSubTab(subTab);

      // Also restore assessment state based on completion
      if (subTab === 'interests' && isRiasecCompleted()) {
        setAssessmentState('results');
      } else if (subTab === 'personality' && isOceanCompleted()) {
        setOceanAssessmentState('results');
      } else if (subTab === 'cognitive-style' && isJungianCompleted()) {
        setJungianAssessmentState('results');
      }
    }
  });

  // Navigate when tab changes
  const handleTabChange = (tab: TabName) => {
    const featureId = tabToFeatureId[tab];
    if (featureId) {
      navigate(`/tenure/${featureId}`);
    } else {
      // For tabs without routes (like Matches), stay on /tenure
      navigate('/tenure');
    }
  };

  // Sidebar state
  const [sidebarView, setSidebarView] = createSignal<SidebarView>(null);
  const isSidebarOpen = () => sidebarView() !== null;

  // Feature flags from Pipeline store
  const featureFlags = () => pipelineStore.state.featureFlags;

  // Assessment State
  const [assessmentState, setAssessmentState] = createSignal<'intro' | 'questions' | 'results'>(
    'intro'
  );
  const [questions, setQuestions] = createSignal<OnetQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = createSignal(0);
  const [answers, setAnswers] = createSignal<string[]>(new Array(60).fill('?')); // '?' is default for unsure/unanswered
  const [riasecScore, setRiasecScore] = createSignal<RiasecScoreWithDetails | null>(null);
  const [careerMatches, setCareerMatches] = createSignal<OnetCareerMatch[]>([]);
  const [selectedJob, setSelectedJob] = createSignal<OnetCareerDetails | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [isJobLoading, setIsJobLoading] = createSignal(false);

  // Discover Panel State - Initialize from URL or default to 'overview'
  const getInitialDiscoverSubTab = (): DiscoverSubTab => {
    const subTab = discoverSubTabFromPath();
    return subTab || 'overview';
  };
  const [discoverSubTab, setDiscoverSubTab] = createSignal<DiscoverSubTab>(
    getInitialDiscoverSubTab()
  );

  // OCEAN Assessment State
  const [oceanAssessmentState, setOceanAssessmentState] = createSignal<
    'intro' | 'questions' | 'results'
  >('intro');

  // Jungian Assessment State
  const [jungianAssessmentState, setJungianAssessmentState] = createSignal<
    'intro' | 'questions' | 'results'
  >('intro');

  // Completion tracking signals (for reactive UI updates)
  const [oceanCompleted, setOceanCompleted] = createSignal(isOceanCompleted());
  const [jungianCompleted, setJungianCompleted] = createSignal(isJungianCompleted());

  // Celebration state for all assessments complete
  const [showCelebration, setShowCelebration] = createSignal(false);

  // Effect to sync Assessment State with Scores
  createEffect(() => {
    if (riasecScore()) {
      setAssessmentState('results');
    }
  });

  // Effect to Update Global Theme based on Score
  createEffect(() => {
    const scores = riasecScore();
    if (scores) {
      const sorted = Object.entries(scores)
        .map(([key, value]) => ({ key, ...value }))
        .sort((a, b) => b.score - a.score);

      const top1 = sorted[0].key;
      const top2 = sorted[1]?.key || sorted[0].key;

      const pColor = (maximalist.riasec as any)[top1];
      const sColor = (maximalist.riasec as any)[top2];

      const pRgb = hexToRgb(pColor);
      const sRgb = hexToRgb(sColor);

      const current = untrack(() => currentTheme());

      setCurrentTheme({
        colors: {
          ...current.colors,
          primary: pColor,
          secondary: sColor,
          accent: sColor,
          textOnPrimary: getContrastColor(pColor),
        },
        gradients: {
          primary: `linear-gradient(135deg, ${pColor}, ${sColor})`,
        },
        shadows: {
          sm: `0 4px 12px rgba(${pRgb}, 0.2), 0 2px 4px rgba(${sRgb}, 0.1)`,
          md: `0 8px 24px rgba(${pRgb}, 0.3), 0 4px 8px rgba(${sRgb}, 0.2)`,
          lg: `0 16px 48px rgba(${pRgb}, 0.4), 0 8px 16px rgba(${sRgb}, 0.3)`,
        },
      });
    }
  });

  // Computed values for Results
  const sortedScores = createMemo(() => {
    const scores = riasecScore();
    if (!scores) return [];
    return Object.entries(scores)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.score - a.score);
  });

  const hybridArchetype = createMemo(() => {
    const sorted = sortedScores();
    if (sorted.length < 2) return null;

    const top1 = sorted[0];
    const top2 = sorted[1];

    // Sort keys alphabetically to match ARCHETYPES map
    const key = [top1.key, top2.key].sort().join('-');
    const archetype = ARCHETYPES[key];

    if (archetype) {
      return {
        title: archetype.title,
        description: archetype.description,
        score: Math.round((top1.score + top2.score) / 2),
        types: [top1.key, top2.key],
      };
    }

    // Fallback to primary if map missing or tie
    return {
      title: `The ${top1.title}`,
      description: top1.description,
      score: top1.score,
      types: [top1.key, top1.key],
    };
  });

  // Enrich careers with details for the Matches tab
  const enrichCareers = async (careers: OnetCareerMatch[]) => {
    const topCareers = careers.slice(0, 10);
    const enriched = await Promise.all(
      topCareers.map(async (c, i) => {
        const details = await getCareerDetails(c.code);
        return {
          id: c.code,
          userId: '1',
          jobId: c.code,
          company: 'O*NET Data', // Placeholder as O*NET doesn't provide specific job listings with companies
          role: c.title,
          location: 'Remote / US',
          salary: details?.salary
            ? {
                min: details.salary.annual_median * 0.8,
                max: details.salary.annual_median * 1.2,
                currency: 'USD',
              }
            : undefined,
          strengthFitScore: 95 - i * 2, // Mock score based on rank
          cultureFitScore: 90 - (i % 5), // Mock score
          overallScore: 95 - i, // Mock score based on rank
          matchedStrengths: details?.skills
            ? details.skills.slice(0, 3)
            : ['Analytical', 'Creative'],
          matchedValues: c.tags.green
            ? ['Green Economy']
            : c.tags.bright_outlook
              ? ['High Growth']
              : ['Stability'],
          status: 'discovered',
        } as JobMatch;
      })
    );
    setJobs(enriched);
  };

  // Load saved state on mount
  onMount(async () => {
    // Initialize sync manager for cross-device sync
    const syncManager = getTenureSyncManager();
    if (syncManager) {
      syncManager.init().catch((err) => {
        // Log but don't block - sync is best-effort
        logger.sync.warn('Sync init failed:', err);
      });
    }

    // Load local storage
    const savedAnswers = localStorage.getItem('augment_answers');
    if (savedAnswers) {
      const parsed = JSON.parse(savedAnswers);
      setAnswers(parsed);
      // Determine if we should be in 'questions' or 'results'
      const answeredCount = parsed.filter((a: string) => a !== '?').length;
      if (answeredCount === 60) {
        // Fetch results if complete
        const scores = await getInterestProfilerResults(parsed.join(''));
        if (scores) {
          setRiasecScore(scores);
          // assessmentState is set by effect
          // setActiveTab('assess'); // Removed, let it default or stay on RIASEC

          // Fetch careers
          setIsLoading(true);
          const careers = await getInterestProfilerCareers(scores);
          setCareerMatches(careers);
          enrichCareers(careers); // Pre-fetch details for Matches tab
          setIsLoading(false);
        }
      } else if (answeredCount > 0) {
        setAssessmentState('questions');
        const qs = await getInterestProfilerQuestions(1, 60);
        setQuestions(qs);
        // Find first unanswered question
        const firstUnanswered = parsed.findIndex((a: string) => a === '?');
        setCurrentQuestionIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
        setActiveTab('Discover');
      }
    }
  });

  // Cleanup sync manager on unmount
  onCleanup(() => {
    destroyTenureSyncManager();
  });

  const startAssessment = async () => {
    setIsLoading(true);
    const qs = await getInterestProfilerQuestions(1, 60);
    setQuestions(qs);
    setAssessmentState('questions');
    setIsLoading(false);
  };

  const handleAnswer = async (value: number) => {
    const newAnswers = [...answers()];
    newAnswers[currentQuestionIndex()] = value.toString();
    setAnswers(newAnswers);
    localStorage.setItem('augment_answers', JSON.stringify(newAnswers));

    if (currentQuestionIndex() < 59) {
      setCurrentQuestionIndex(currentQuestionIndex() + 1);
    } else {
      // Finished
      setIsLoading(true);
      const scores = await getInterestProfilerResults(newAnswers.join(''));
      if (scores) {
        setRiasecScore(scores);
        setAssessmentState('results');
        setActiveTab('Discover');

        // Fetch careers
        const careers = await getInterestProfilerCareers(scores);
        setCareerMatches(careers);
        enrichCareers(careers);
      }
      setIsLoading(false);
    }
  };

  const handleJobClick = async (code: string) => {
    setIsJobLoading(true);
    const details = await getCareerDetails(code);
    if (details) {
      setSelectedJob(details);
    }
    setIsJobLoading(false);
  };

  // OCEAN Assessment Handlers
  const handleStartOcean = () => {
    setOceanAssessmentState('questions');
    navigate('/tenure/discover/personality');
  };

  const handleOceanComplete = () => {
    setOceanAssessmentState('results');
    navigate('/tenure/discover/personality');
    setOceanCompleted(true);
    // Check if all assessments are now complete
    if (areAllAssessmentsCompleted()) {
      setShowCelebration(true);
    }
  };

  const handleOceanCancel = () => {
    setOceanAssessmentState('intro');
    navigate('/tenure/discover/overview');
  };

  const handleRetakeOcean = () => {
    setOceanAssessmentState('questions');
  };

  // Jungian Assessment Handlers
  const handleStartJungian = () => {
    setJungianAssessmentState('questions');
    navigate('/tenure/discover/cognitive-style');
  };

  const handleJungianComplete = () => {
    setJungianAssessmentState('results');
    navigate('/tenure/discover/cognitive-style');
    setJungianCompleted(true);
    // Check if all assessments are now complete
    if (areAllAssessmentsCompleted()) {
      setShowCelebration(true);
    }
  };

  const handleJungianCancel = () => {
    setJungianAssessmentState('intro');
    navigate('/tenure/discover/overview');
  };

  const handleRetakeJungian = () => {
    setJungianAssessmentState('questions');
  };

  // Discover Navigation Handlers
  const handleStartRiasec = () => {
    setAssessmentState('intro');
    navigate('/tenure/discover/interests');
  };

  const handleViewRiasecResults = () => {
    setAssessmentState('results');
    navigate('/tenure/discover/interests');
  };

  const handleViewOceanResults = () => {
    setOceanAssessmentState('results');
    navigate('/tenure/discover/personality');
  };

  const handleViewJungianResults = () => {
    setJungianAssessmentState('results');
    navigate('/tenure/discover/cognitive-style');
  };

  const handleDiscoverSubTabChange = (tab: DiscoverSubTab) => {
    // Navigate to the new URL - the sync effect will update state and assessment views
    navigate(`/tenure/discover/${tab}`);
  };

  // Dynamic SVG Patterns
  const dynamicPatterns = createMemo(() => {
    const color = currentTheme().colors.primary.replace('#', '%23');
    return {
      zigzag: `url("data:image/svg+xml,%3Csvg width='40' height='12' viewBox='0 0 40 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6 L10 0 L20 6 L30 0 L40 6 L40 12 L30 6 L20 12 L10 6 L0 12' fill='${color}' fill-opacity='0.1'/%3E%3C/svg%3E")`,
      dots: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='${color}' fill-opacity='0.3'/%3E%3C/svg%3E")`,
    };
  });

  const resetAssessment = () => {
    setAssessmentState('intro');
    setAnswers(new Array(60).fill('?'));
    setCurrentQuestionIndex(0);
    setRiasecScore(null);
    localStorage.removeItem('augment_answers');
    // Reset theme to default
    setCurrentTheme({
      colors: {
        primary: '#FFFFFF',
        secondary: '#A3A3A3',
        accent: '#FFFFFF',
        background: '#121212',
        surface: '#1E1E1E',
        text: '#F3F4F6',
        textMuted: '#9CA3AF',
        border: '#374151',
        textOnPrimary: 'black',
      },
      gradients: {
        primary: 'linear-gradient(135deg, #FFFFFF, #A3A3A3)',
      },
      shadows: {
        sm: '0 4px 12px rgba(255, 255, 255, 0.1), 0 2px 4px rgba(255, 255, 255, 0.05)',
        md: '0 8px 24px rgba(255, 255, 255, 0.15), 0 4px 8px rgba(255, 255, 255, 0.1)',
        lg: '0 16px 48px rgba(255, 255, 255, 0.2), 0 8px 16px rgba(255, 255, 255, 0.15)',
      },
    });
  };

  return (
    <TenureThemeProvider>
      <div
        style={{
          'min-height': '100vh',
          background: maximalist.colors.background,
          'font-family': maximalist.fonts.body,
          color: maximalist.colors.text,
          position: 'relative',
          'overflow-x': 'hidden',
        }}
      >
        {/* Aurora background - liquid glass effect */}
        <Show
          when={riasecScore()}
          fallback={
            <>
              {/* Multi-color aurora - Dampened for readability, focused on header */}

              {/* BACKGROUND LAYER - Very subtle atmospheric fill (header region) */}
              {/* Top-right corner: Conventional (Cyan) */}
              <div
                class="aurora-orb aurora-background"
                style={{
                  position: 'fixed',
                  top: '-8%',
                  right: '-10%',
                  width: '35%',
                  height: '35%',
                  background: `radial-gradient(ellipse 100% 100% at 70% 30%, ${maximalist.riasec!.conventional}05 0%, transparent 70%)`,
                  'border-radius': '50%',
                  filter: 'blur(110px)',
                  'pointer-events': 'none',
                  animation: 'aurora-drift-1 28.8s ease-in-out infinite',
                  opacity: 0.7,
                }}
              />
              {/* Top-left accent: Realistic (Orange) - moved from bottom */}
              <div
                class="aurora-orb aurora-background"
                style={{
                  position: 'fixed',
                  top: '-5%',
                  left: '-12%',
                  width: '32%',
                  height: '32%',
                  background: `radial-gradient(ellipse 100% 100% at 30% 30%, ${maximalist.riasec!.realistic}05 0%, transparent 70%)`,
                  'border-radius': '50%',
                  filter: 'blur(105px)',
                  'pointer-events': 'none',
                  animation: 'aurora-drift-2 28.8s ease-in-out infinite reverse',
                  opacity: 0.7,
                }}
              />

              {/* MID LAYER - Atmospheric support (upper-middle viewport) */}
              {/* Top center area: Social (Green) - moved up from 61.8% */}
              <div
                class="aurora-orb aurora-mid"
                style={{
                  position: 'fixed',
                  top: '15%',
                  right: '-8%',
                  width: '40%',
                  height: '40%',
                  background: `radial-gradient(ellipse 110% 110% at 80% 40%, ${maximalist.riasec!.social}07 0%, transparent 65%)`,
                  'border-radius': '50%',
                  filter: 'blur(95px)',
                  'pointer-events': 'none',
                  animation: 'aurora-drift-3 36s ease-in-out infinite',
                  opacity: 0.75,
                }}
              />
              {/* Header area: Investigative (Purple) */}
              <div
                class="aurora-orb aurora-mid"
                style={{
                  position: 'fixed',
                  top: '-12%',
                  left: '38.2%',
                  width: '42%',
                  height: '42%',
                  background: `radial-gradient(ellipse 105% 105% at 50% 35%, ${maximalist.riasec!.investigative}06 0%, transparent 65%)`,
                  'border-radius': '50%',
                  filter: 'blur(100px)',
                  'pointer-events': 'none',
                  animation: 'aurora-drift-4 32s ease-in-out infinite',
                  opacity: 0.75,
                }}
              />

              {/* FOREGROUND LAYER - Primary focal points (header focus area) */}
              {/* Hero (Header left - Golden ratio): Artistic (Pink) - PRIMARY */}
              <div
                class="aurora-orb aurora-hero"
                style={{
                  position: 'fixed',
                  top: '8%',
                  left: '-18%',
                  width: '58%',
                  height: '58%',
                  background: `radial-gradient(ellipse 120% 120% at 28% 40%, ${maximalist.riasec!.artistic}09 0%, transparent 60%)`,
                  'border-radius': '50%',
                  filter: 'blur(85px)',
                  'pointer-events': 'none',
                  animation: 'aurora-drift-1 24s ease-in-out infinite',
                  opacity: 0.8,
                }}
              />
              {/* Secondary focal (Header right): Enterprising (Yellow) */}
              <div
                class="aurora-orb aurora-secondary"
                style={{
                  position: 'fixed',
                  top: '5%',
                  right: '25%',
                  width: '48%',
                  height: '48%',
                  background: `radial-gradient(ellipse 115% 115% at 65% 45%, ${maximalist.riasec!.enterprising}08 0%, transparent 60%)`,
                  'border-radius': '50%',
                  filter: 'blur(90px)',
                  'pointer-events': 'none',
                  animation: 'aurora-drift-2 36s ease-in-out infinite',
                  opacity: 0.8,
                }}
              />
            </>
          }
        >
          {/* Personalized duotone aurora - A-Grade design with focused identity */}

          {/* PRIMARY COLOR LAYERS (60% visual dominance) - Dampened, header-focused */}
          {/* Hero - Header area left: PRIMARY FOCUS */}
          <div
            class="aurora-orb aurora-primary-hero"
            style={{
              position: 'fixed',
              top: '6%',
              left: '-20%',
              width: '62%',
              height: '62%',
              background: `radial-gradient(ellipse 125% 125% at 28% 38%, ${currentTheme().colors.primary}12 0%, transparent 60%)`,
              'border-radius': '50%',
              filter: 'blur(90px)',
              'pointer-events': 'none',
              animation: 'aurora-drift-1 24s ease-in-out infinite',
              opacity: 0.8,
            }}
          />
          {/* Support - Top-right area */}
          <div
            class="aurora-orb aurora-primary-support"
            style={{
              position: 'fixed',
              top: '-10%',
              right: '-12%',
              width: '38%',
              height: '38%',
              background: `radial-gradient(ellipse 110% 110% at 68% 35%, ${currentTheme().colors.primary}08 0%, transparent 65%)`,
              'border-radius': '50%',
              filter: 'blur(100px)',
              'pointer-events': 'none',
              animation: 'aurora-drift-3 36s ease-in-out infinite',
              opacity: 0.7,
            }}
          />
          {/* Ambient - Header center atmospheric fill */}
          <div
            class="aurora-orb aurora-primary-ambient"
            style={{
              position: 'fixed',
              top: '-6%',
              left: '30%',
              width: '32%',
              height: '32%',
              background: `radial-gradient(ellipse 100% 100% at 50% 30%, ${currentTheme().colors.primary}05 0%, transparent 70%)`,
              'border-radius': '50%',
              filter: 'blur(105px)',
              'pointer-events': 'none',
              animation: 'aurora-drift-2 42s ease-in-out infinite',
              opacity: 0.65,
            }}
          />

          {/* SECONDARY COLOR LAYERS (40% visual support) - Header complement */}
          {/* Focal - Header right area */}
          <div
            class="aurora-orb aurora-secondary-focal"
            style={{
              position: 'fixed',
              top: '10%',
              right: '-10%',
              width: '50%',
              height: '50%',
              background: `radial-gradient(ellipse 120% 120% at 72% 42%, ${currentTheme().colors.secondary}10 0%, transparent 62%)`,
              'border-radius': '50%',
              filter: 'blur(95px)',
              'pointer-events': 'none',
              animation: 'aurora-drift-2 30s ease-in-out infinite',
              opacity: 0.75,
            }}
          />
          {/* Accent - Upper left complement */}
          <div
            class="aurora-orb aurora-secondary-accent"
            style={{
              position: 'fixed',
              top: '-8%',
              left: '-10%',
              width: '36%',
              height: '36%',
              background: `radial-gradient(ellipse 105% 105% at 32% 32%, ${currentTheme().colors.secondary}06 0%, transparent 68%)`,
              'border-radius': '50%',
              filter: 'blur(110px)',
              'pointer-events': 'none',
              animation: 'aurora-drift-4 48s ease-in-out infinite',
              opacity: 0.68,
            }}
          />
        </Show>

        <div style={{ position: 'relative', 'z-index': 1 }}>
          {/* Header - hidden on mobile */}
          <Show when={!isMobile()}>
            <header
              style={{
                padding: '24px 32px 32px',
                display: 'flex',
                'justify-content': 'space-between',
                'align-items': 'center',
              }}
            >
              <div style={{ display: 'flex', 'align-items': 'center', gap: '16px' }}>
                {/* Logo with dynamic colored border */}
                <AppMenuTrigger>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      'border-radius': '16px',
                      background: 'transparent',
                      border: `2px solid ${currentTheme().colors.primary}`,
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'box-shadow': currentTheme().shadows.md,
                    }}
                  >
                    <div
                      style={{
                        height: '52px',
                        width: '52px',
                        'background-color': currentTheme().colors.primary,
                        '-webkit-mask': 'url(/tenure/tenure_logo.png) center/contain no-repeat',
                        mask: 'url(/tenure/tenure_logo.png) center/contain no-repeat',
                      }}
                    />

                    {/* OPTION 2: "T" Upward Arrow - T shape integrated with growth arrow
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16"
                  stroke={currentTheme().colors.primary}
                  stroke-width="3"
                  stroke-linecap="round"
                />
                <path
                  d="M12 7v11"
                  stroke={currentTheme().colors.primary}
                  stroke-width="3"
                  stroke-linecap="round"
                />
                <path
                  d="M8 14l4-3 4 3"
                  stroke={currentTheme().colors.primary}
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="none"
                />
                <path
                  d="M9 17l3-2.5 3 2.5"
                  stroke={currentTheme().colors.primary}
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="none"
                  opacity="0.6"
                />
                <circle cx="12" cy="20" r="2" fill={currentTheme().colors.primary} />
              </svg>
              */}

                    {/* OPTION 3: "T" Staircase - T with ascending steps on vertical stem
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="5" width="16" height="3" rx="1.5" fill={currentTheme().colors.primary} />
                <path
                  d="M10 8v3h4v-3M10 11v3h4v-3M10 14v3h4v-3M10 17v4h4v-4"
                  stroke={currentTheme().colors.primary}
                  stroke-width="0"
                  fill={currentTheme().colors.primary}
                  fill-opacity="0.3"
                />
                <rect x="10" y="8" width="1.5" height="13" fill={currentTheme().colors.primary} />
                <rect x="12.5" y="8" width="1.5" height="13" fill={currentTheme().colors.primary} />
                <path
                  d="M8 11h2M8 14h2M8 17h2M14 11h2M14 14h2M14 17h2"
                  stroke={currentTheme().colors.primary}
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
              */}
                  </div>
                </AppMenuTrigger>
                <div>
                  <h1
                    style={{
                      margin: 0,
                      'font-family': maximalist.fonts.heading,
                      'font-size': '32px',
                      'font-weight': '700',
                      'background-image': currentTheme().gradients.primary,
                      '-webkit-background-clip': 'text',
                      'background-clip': 'text',
                      color: 'transparent',
                      display: 'inline-block',
                      '-webkit-text-fill-color': 'transparent',
                    }}
                  >
                    Tenure
                  </h1>
                </div>
              </div>

              {/* Tab Navigation in Header */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '6px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  'border-radius': '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <For
                  each={(() => {
                    const tabs: ('Discover' | 'Prepare' | 'Prospect' | 'Prosper' | 'Matches')[] =
                      [];
                    if (featureFlags().showDiscover) tabs.push('Discover');
                    if (featureFlags().showPrepare) tabs.push('Prepare');
                    if (featureFlags().showProspect) tabs.push('Prospect');
                    if (featureFlags().showProsper) tabs.push('Prosper');
                    if (featureFlags().showMatches) tabs.push('Matches');
                    return tabs;
                  })()}
                >
                  {(tab) => {
                    const getIcon = () => {
                      if (tab === 'Discover') return <BinocularsIcon width={18} height={18} />;
                      if (tab === 'Prepare') return <CompassToolIcon width={18} height={18} />;
                      if (tab === 'Prospect') return <HammerIcon width={18} height={18} />;
                      if (tab === 'Prosper') return <FlowerLotusIcon width={18} height={18} />;
                      if (tab === 'Matches') return <FlameIcon width={18} height={18} />;
                      return null;
                    };

                    return (
                      <button
                        onClick={() => handleTabChange(tab)}
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          gap: '8px',
                          padding: '12px 24px',
                          background:
                            activeTab() === tab ? currentTheme().gradients.primary : 'transparent',
                          border: 'none',
                          'border-radius': '9px',
                          color:
                            activeTab() === tab
                              ? currentTheme().colors.textOnPrimary
                              : maximalist.colors.textMuted,
                          'font-size': '15px',
                          'font-weight': '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          outline: 'none',
                          transform: 'scale(1)',
                        }}
                        onMouseEnter={(e) => {
                          if (activeTab() !== tab) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.transform = 'scale(1.02)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab() !== tab) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        {getIcon()}
                        {tab}
                      </button>
                    );
                  }}
                </For>
              </div>

              <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
                {/* Profile button with status badges */}
                <ProfileBadges
                  isAuthenticated={auth.isAuthenticated()}
                  hasExtras={auth.hasAppExtras('tenure')}
                  isTacoClub={auth.isTacoClubMember()}
                  size={44}
                >
                  <button
                    onClick={() => setSidebarView(sidebarView() === 'profile' ? null : 'profile')}
                    class="header-icon-btn"
                    style={{
                      width: '44px',
                      height: '44px',
                      'border-radius': '12px',
                      background:
                        sidebarView() === 'profile' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      border:
                        sidebarView() === 'profile'
                          ? `1px solid ${currentTheme().colors.primary}`
                          : `1px solid ${maximalist.colors.border}`,
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      cursor: 'pointer',
                      color:
                        sidebarView() === 'profile'
                          ? currentTheme().colors.primary
                          : maximalist.colors.textMuted,
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (sidebarView() !== 'profile') {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = currentTheme().colors.primary;
                        e.currentTarget.style.color = currentTheme().colors.text;
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (sidebarView() !== 'profile') {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = maximalist.colors.border;
                        e.currentTarget.style.color = maximalist.colors.textMuted;
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                    title="Profile"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </button>
                </ProfileBadges>

                {/* Settings button */}
                <button
                  onClick={() => setSidebarView(sidebarView() === 'settings' ? null : 'settings')}
                  class="header-icon-btn"
                  style={{
                    width: '44px',
                    height: '44px',
                    'border-radius': '12px',
                    background:
                      sidebarView() === 'settings' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    border:
                      sidebarView() === 'settings'
                        ? `1px solid ${currentTheme().colors.primary}`
                        : `1px solid ${maximalist.colors.border}`,
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    cursor: 'pointer',
                    color:
                      sidebarView() === 'settings'
                        ? currentTheme().colors.primary
                        : maximalist.colors.textMuted,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (sidebarView() !== 'settings') {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = currentTheme().colors.primary;
                      e.currentTarget.style.color = currentTheme().colors.text;
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (sidebarView() !== 'settings') {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = maximalist.colors.border;
                      e.currentTarget.style.color = maximalist.colors.textMuted;
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                  title="Settings"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              </div>
            </header>
          </Show>

          {/* Tab navigation - maximalist pills */}
          {/* Main content */}
          <main
            style={{
              padding:
                activeTab() === 'Prospect' || activeTab() === 'Prosper' ? '0' : '0 32px 48px',
              'max-width':
                activeTab() === 'Prospect' || activeTab() === 'Prosper' ? 'none' : '1400px',
              margin: activeTab() === 'Prospect' || activeTab() === 'Prosper' ? '0' : '0 auto',
              height:
                activeTab() === 'Prospect' || activeTab() === 'Prosper'
                  ? 'calc(100vh - 100px)'
                  : 'auto',
            }}
          >
            <Show when={activeTab() === 'Matches'}>
              <>
                <div style={{ 'margin-bottom': '32px' }}>
                  <h2
                    style={{
                      margin: '0 0 8px 0',
                      'font-family': maximalist.fonts.heading,
                      'font-size': '36px',
                      'font-weight': '700',
                    }}
                  >
                    Matched Opportunities
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      'font-size': '18px',
                      color: maximalist.colors.textMuted,
                    }}
                  >
                    Jobs that amplify your natural strengths and align with your values
                  </p>
                </div>

                <Show
                  when={jobs().length > 0}
                  fallback={
                    <div
                      style={{
                        padding: '48px',
                        'text-align': 'center',
                        color: maximalist.colors.textMuted,
                      }}
                    >
                      <p>Complete the Discover assessment to see your matched opportunities.</p>
                      <button
                        onClick={() => handleTabChange('Discover')}
                        style={{
                          'margin-top': '16px',
                          padding: '12px 24px',
                          background: currentTheme().gradients.primary,
                          color: currentTheme().colors.textOnPrimary,
                          border: 'none',
                          'border-radius': maximalist.radii.md,
                          'font-weight': 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        Go to Assessment
                      </button>
                    </div>
                  }
                >
                  <div
                    style={{
                      display: 'grid',
                      'grid-template-columns': 'repeat(auto-fill, minmax(400px, 1fr))',
                      gap: '24px',
                    }}
                  >
                    <For each={jobs()}>{(job) => <JobCard job={job} />}</For>
                  </div>
                </Show>
              </>
            </Show>

            <Show when={activeTab() === 'Discover'}>
              <DiscoverView
                currentTheme={currentTheme}
                assessmentState={assessmentState}
                questions={questions}
                currentQuestionIndex={currentQuestionIndex}
                riasecScore={riasecScore}
                careerMatches={careerMatches}
                isLoading={isLoading}
                isJobLoading={isJobLoading}
                onStartAssessment={startAssessment}
                onAnswer={handleAnswer}
                onResetAssessment={resetAssessment}
                onJobClick={handleJobClick}
                discoverSubTab={discoverSubTab}
                onDiscoverSubTabChange={handleDiscoverSubTabChange}
                oceanAssessmentState={oceanAssessmentState}
                oceanCompleted={oceanCompleted}
                onStartOcean={handleStartOcean}
                onOceanComplete={handleOceanComplete}
                onOceanCancel={handleOceanCancel}
                onRetakeOcean={handleRetakeOcean}
                onViewOceanResults={handleViewOceanResults}
                jungianAssessmentState={jungianAssessmentState}
                jungianCompleted={jungianCompleted}
                onStartJungian={handleStartJungian}
                onJungianComplete={handleJungianComplete}
                onJungianCancel={handleJungianCancel}
                onRetakeJungian={handleRetakeJungian}
                onViewJungianResults={handleViewJungianResults}
                onStartRiasec={handleStartRiasec}
                onViewRiasecResults={handleViewRiasecResults}
                sortedScores={sortedScores}
                hybridArchetype={hybridArchetype}
              />
            </Show>

            {/* Prepare Tab - Resume Builder */}
            <Show when={activeTab() === 'Prepare'}>
              <PrepareApp
                currentTheme={() => ({
                  colors: {
                    ...currentTheme().colors,
                    surface: 'rgba(255, 255, 255, 0.02)',
                    success: '#10b981',
                    error: '#ef4444',
                  },
                  fonts: maximalist.fonts,
                  gradients: currentTheme().gradients,
                })}
              />
            </Show>

            {/* Prospect Tab - Job Pipeline */}
            <Show when={activeTab() === 'Prospect'}>
              <PipelineView
                currentTheme={() => ({
                  colors: {
                    ...currentTheme().colors,
                    surfaceLight: 'rgba(255, 255, 255, 0.03)',
                    surfaceMedium: 'rgba(255, 255, 255, 0.06)',
                    surfaceHover: 'rgba(255, 255, 255, 0.08)',
                  },
                  fonts: maximalist.fonts,
                  spacing: maximalist.spacing,
                })}
              />
            </Show>

            {/* Prosper Tab - Career Journal & Compensation */}
            <Show when={activeTab() === 'Prosper'}>
              <ProsperView
                currentTheme={() => ({
                  colors: {
                    ...currentTheme().colors,
                    surfaceLight: 'rgba(255, 255, 255, 0.03)',
                    surfaceMedium: 'rgba(255, 255, 255, 0.06)',
                    surfaceHover: 'rgba(255, 255, 255, 0.08)',
                  },
                  fonts: maximalist.fonts,
                  spacing: maximalist.spacing,
                })}
              />
            </Show>
          </main>

          {/* Mobile Bottom Navigation */}
          <BottomNavBar
            items={TENURE_NAV_ITEMS}
            activeId={activeTab()}
            onSelect={(id) => handleTabChange(id as TabName)}
            theme={() => ({
              colors: {
                primary: currentTheme().colors.primary,
                text: currentTheme().colors.text,
                textMuted: currentTheme().colors.textMuted,
              },
            })}
          />

          <Show when={selectedJob()}>
            <JobDetailModal job={selectedJob()!} onClose={() => setSelectedJob(null)} />
          </Show>
        </div>

        {/* All Assessments Complete Celebration Modal */}
        <Show when={showCelebration()}>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              'z-index': 9999,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              animation: 'fadeIn 0.3s ease-out',
            }}
            onClick={() => setShowCelebration(false)}
          >
            {/* Confetti particles */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                'pointer-events': 'none',
              }}
            >
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  style={{
                    position: 'absolute',
                    width: `${8 + Math.random() * 8}px`,
                    height: `${8 + Math.random() * 8}px`,
                    background: [
                      currentTheme().colors.primary,
                      currentTheme().colors.secondary,
                      '#FFD700',
                      '#FF6B6B',
                      '#4ECDC4',
                      '#A78BFA',
                    ][i % 6],
                    'border-radius': Math.random() > 0.5 ? '50%' : '2px',
                    left: `${Math.random() * 100}%`,
                    top: '-20px',
                    animation: `confettiFall ${2 + Math.random() * 3}s linear ${Math.random() * 2}s infinite`,
                    opacity: 0.9,
                  }}
                />
              ))}
            </div>

            <div
              style={{
                background: maximalist.colors.surface,
                'border-radius': maximalist.radii.lg,
                padding: '48px',
                'max-width': '500px',
                width: '90%',
                'text-align': 'center',
                border: `2px solid ${currentTheme().colors.primary}`,
                'box-shadow': `0 0 60px ${currentTheme().colors.primary}40`,
                position: 'relative',
                animation: 'scaleIn 0.4s ease-out',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Trophy icon */}
              <div
                style={{
                  'margin-bottom': '24px',
                  animation: 'bounce 1s ease infinite',
                }}
              >
                <IconTrophy size={72} color={currentTheme().colors.primary} />
              </div>

              <h2
                style={{
                  'font-family': maximalist.fonts.heading,
                  'font-size': '32px',
                  'font-weight': '700',
                  'margin-bottom': '16px',
                  color: currentTheme().colors.primary,
                }}
              >
                Profile Complete!
              </h2>

              <p
                style={{
                  'font-size': '18px',
                  color: maximalist.colors.text,
                  'line-height': '1.6',
                  'margin-bottom': '24px',
                }}
              >
                Congratulations! You've completed all three assessments and built your comprehensive
                career profile.
              </p>

              <div
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  'border-radius': maximalist.radii.md,
                  padding: '20px',
                  'margin-bottom': '24px',
                  border: `1px solid ${maximalist.colors.border}`,
                }}
              >
                <p
                  style={{
                    'font-size': '14px',
                    color: maximalist.colors.textMuted,
                    margin: '0 0 8px 0',
                  }}
                >
                  Premium Feature Coming Soon
                </p>
                <p
                  style={{
                    'font-size': '16px',
                    color: maximalist.colors.text,
                    margin: 0,
                    'font-weight': '600',
                  }}
                >
                  Extended Profile Report
                </p>
                <p
                  style={{
                    'font-size': '14px',
                    color: maximalist.colors.textMuted,
                    margin: '8px 0 0 0',
                  }}
                >
                  A comprehensive analysis combining your interests, personality, and cognitive
                  style into actionable career insights.
                </p>
              </div>

              <button
                onClick={() => setShowCelebration(false)}
                style={{
                  padding: '14px 32px',
                  background: currentTheme().gradients.primary,
                  border: 'none',
                  'border-radius': maximalist.radii.md,
                  color: currentTheme().colors.textOnPrimary,
                  'font-size': '16px',
                  'font-weight': '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = currentTheme().shadows.md;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Explore Your Profile
              </button>
            </div>
          </div>
        </Show>

        {/* Sidebar for Profile/Settings */}
        <Sidebar
          isOpen={isSidebarOpen()}
          view={sidebarView()}
          onClose={() => setSidebarView(null)}
          currentTheme={() =>
            ({
              ...currentTheme(),
              colors: {
                ...currentTheme().colors,
                background: maximalist.colors.background,
                surface: maximalist.colors.surface,
                border: maximalist.colors.border,
                text: maximalist.colors.text,
                textMuted: maximalist.colors.textMuted,
              },
              fonts: maximalist.fonts,
              spacing: maximalist.spacing,
              radii: maximalist.radii,
            }) as any
          }
        />

        {/* Responsive styles for archetype hero section */}
        <style>{`
        /* Mobile responsive layout */
        @media (max-width: 768px) {
          .archetype-hero-section {
            padding: 24px !important;
          }

          .archetype-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }

          .radar-column {
            display: flex;
            justify-content: center;
          }

          .archetype-info-column {
            text-align: center !important;
          }

          .archetype-info-column h2 {
            justify-content: center !important;
          }

          .archetype-info-column h1 {
            font-size: 36px !important;
          }

          .archetype-info-column p {
            font-size: 16px !important;
          }
        }

        /* Tablet-specific adjustments */
        @media (min-width: 769px) and (max-width: 1024px) {
          .archetype-hero-grid {
            gap: 32px !important;
          }

          .archetype-info-column h1 {
            font-size: 42px !important;
          }
        }

        /* Celebration animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      </div>
    </TenureThemeProvider>
  );
};

export default TenureApp;
