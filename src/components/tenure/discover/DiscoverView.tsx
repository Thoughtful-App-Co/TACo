/**
 * DiscoverView - Main container for the Discover section
 *
 * Displays personality and career assessments:
 * - Overview hub
 * - RIASEC Interest Profiler
 * - OCEAN Personality Assessment
 * - Jungian Cognitive Style Assessment
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show, Accessor } from 'solid-js';
import {
  SmileyAngryIcon,
  SmileySadIcon,
  SmileyMehIcon,
  SmileyIcon,
  HeartIcon,
} from 'solid-phosphor/bold';

import { maximalist, maxPalette } from '../../../theme/maximalist';
import { OnetQuestion, RiasecScoreWithDetails, OnetCareerMatch } from '../../../services/onet';
import { useMobile } from '../lib/use-mobile';
import { MobileMenuProvider, MobileDrawer } from '../lib/mobile-menu-context';
import { MobileHeader, MOBILE_HEADER_HEIGHT, BreadcrumbItem } from '../lib/MobileHeader';

import {
  DISCOVER_NAV_ITEMS,
  IconChartBar,
  IconTarget,
  IconBrain,
  IconMindmap,
} from './discover-navigation';
import { RadarChart } from './RadarChart';
import { CartoonBadge } from './CartoonBadge';
import {
  DiscoverOverview,
  DiscoverSubTabs,
  DiscoverSubTab,
  OceanAssessment,
  OceanResults,
  JungianAssessment,
  JungianResults,
} from './index';
import { loadOceanProfile } from '../services/ocean';
import { loadJungianProfile } from '../services/jungian';

// =============================================================================
// TYPES
// =============================================================================

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  textOnPrimary: string;
  textMuted: string;
  text: string;
  border: string;
}

interface Theme {
  colors: ThemeColors;
  gradients: { primary: string };
  shadows: { sm: string; md: string; lg: string };
}

interface SortedScore {
  key: string;
  score: number;
  title: string;
  description: string;
}

interface HybridArchetype {
  title: string;
  description: string;
  score: number;
  types: string[];
}

export interface DiscoverViewProps {
  // Theme
  currentTheme: Accessor<Theme>;

  // RIASEC Assessment State
  assessmentState: Accessor<'intro' | 'questions' | 'results'>;
  questions: Accessor<OnetQuestion[]>;
  currentQuestionIndex: Accessor<number>;
  riasecScore: Accessor<RiasecScoreWithDetails | null>;
  careerMatches: Accessor<OnetCareerMatch[]>;
  isLoading: Accessor<boolean>;
  isJobLoading: Accessor<boolean>;

  // RIASEC Handlers
  onStartAssessment: () => void;
  onAnswer: (value: number) => void;
  onResetAssessment: () => void;
  onJobClick: (code: string) => void;

  // Discover Sub-tab State
  discoverSubTab: Accessor<DiscoverSubTab>;
  onDiscoverSubTabChange: (tab: DiscoverSubTab) => void;

  // OCEAN Assessment
  oceanAssessmentState: Accessor<'intro' | 'questions' | 'results'>;
  oceanCompleted: Accessor<boolean>;
  onStartOcean: () => void;
  onOceanComplete: () => void;
  onOceanCancel: () => void;
  onRetakeOcean: () => void;
  onViewOceanResults: () => void;

  // Jungian Assessment
  jungianAssessmentState: Accessor<'intro' | 'questions' | 'results'>;
  jungianCompleted: Accessor<boolean>;
  onStartJungian: () => void;
  onJungianComplete: () => void;
  onJungianCancel: () => void;
  onRetakeJungian: () => void;
  onViewJungianResults: () => void;

  // Navigation helpers
  onStartRiasec: () => void;
  onViewRiasecResults: () => void;

  // Computed values
  sortedScores: Accessor<SortedScore[]>;
  hybridArchetype: Accessor<HybridArchetype | null>;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const DiscoverView: Component<DiscoverViewProps> = (props) => {
  const isMobile = useMobile();

  // Build breadcrumb items based on what sections are available
  const breadcrumbItems = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ id: 'overview', label: 'Overview', icon: IconChartBar }];

    if (props.riasecScore()) {
      items.push({ id: 'interests', label: 'Interests', icon: IconTarget });
    }

    if (props.riasecScore() || props.oceanCompleted()) {
      items.push({ id: 'personality', label: 'Personality', icon: IconBrain });
    }

    if (props.jungianCompleted()) {
      items.push({ id: 'cognitive-style', label: 'Cognitive', icon: IconMindmap });
    }

    return items;
  };

  return (
    <MobileMenuProvider>
      {/* Mobile Header - only on mobile */}
      <Show when={isMobile()}>
        <MobileHeader
          title="Discover"
          theme={() => ({
            colors: {
              primary: props.currentTheme().colors.primary,
              text: props.currentTheme().colors.text,
              textMuted: props.currentTheme().colors.textMuted,
              border: props.currentTheme().colors.border,
              background: 'rgba(15, 15, 18, 0.75)',
            },
          })}
          breadcrumbItems={breadcrumbItems()}
          activeBreadcrumb={props.discoverSubTab()}
          onBreadcrumbSelect={(id) => props.onDiscoverSubTabChange(id as DiscoverSubTab)}
        />
      </Show>

      <div style={{ 'padding-top': isMobile() ? MOBILE_HEADER_HEIGHT : '24px' }}>
        {/* Sub-tabs - Desktop only */}
        <Show when={!isMobile()}>
          <DiscoverSubTabs
            activeTab={props.discoverSubTab()}
            onTabChange={props.onDiscoverSubTabChange}
            showInterests={!!props.riasecScore()}
            showPersonality={!!props.riasecScore() || props.oceanCompleted()}
            showCognitiveStyle={props.jungianCompleted()}
            currentThemeGradient={props.currentTheme().gradients.primary}
          />
        </Show>

        {/* Overview Tab - Hub showing all assessments */}
        <Show when={props.discoverSubTab() === 'overview'}>
          <DiscoverOverview
            onStartRiasec={props.onStartRiasec}
            onStartOcean={props.onStartOcean}
            onStartJungian={props.onStartJungian}
            onViewRiasecResults={props.onViewRiasecResults}
            onViewOceanResults={props.onViewOceanResults}
            onViewJungianResults={props.onViewJungianResults}
            currentThemeGradient={props.currentTheme().gradients.primary}
            currentThemePrimary={props.currentTheme().colors.primary}
            currentThemeTextOnPrimary={props.currentTheme().colors.textOnPrimary}
          />
        </Show>

        {/* RIASEC Assessment Tab */}
        <Show when={props.discoverSubTab() === 'interests'}>
          <div
            style={{
              'max-width': '800px',
              margin: '0 auto',
              'padding-top': '24px',
            }}
          >
            {/* Intro State */}
            <Show when={props.assessmentState() === 'intro'}>
              <div style={{ 'text-align': 'center' }}>
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    'border-radius': '50%',
                    background: props.currentTheme().gradients.primary,
                    margin: '0 auto 32px',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'box-shadow': props.currentTheme().shadows.lg,
                  }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
                  </svg>
                </div>

                <h2
                  style={{
                    margin: '0 0 16px 0',
                    'font-family': maximalist.fonts.heading,
                    'font-size': '32px',
                    'font-weight': '700',
                  }}
                >
                  Discover Your Interests
                </h2>

                <p
                  style={{
                    margin: '0 0 32px 0',
                    'font-size': '18px',
                    color: maximalist.colors.textMuted,
                    'line-height': '1.6',
                  }}
                >
                  Take the O*NET Interest Profiler to uncover your unique strengths profile. This
                  60-question assessment provides personalized insights into your work interests.
                </p>

                <button
                  onClick={() => props.onStartAssessment()}
                  disabled={props.isLoading()}
                  style={{
                    padding: '18px 48px',
                    background: props.currentTheme().gradients.primary,
                    border: 'none',
                    'border-radius': maximalist.radii.md,
                    color: props.currentTheme().colors.textOnPrimary,
                    'font-size': '18px',
                    'font-weight': '700',
                    cursor: props.isLoading() ? 'wait' : 'pointer',
                    'box-shadow': props.currentTheme().shadows.md,
                    display: 'inline-flex',
                    'align-items': 'center',
                    gap: '12px',
                    opacity: props.isLoading() ? 0.7 : 1,
                  }}
                >
                  <Show when={!props.isLoading()} fallback="Loading...">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Start Assessment
                  </Show>
                </button>
              </div>
            </Show>

            {/* Questions State */}
            <Show when={props.assessmentState() === 'questions' && props.questions().length > 0}>
              <div
                style={{
                  background: maximalist.colors.surface,
                  padding: '40px',
                  'border-radius': maximalist.radii.lg,
                  border: `2px solid ${maximalist.colors.border}`,
                  'box-shadow': props.currentTheme().shadows.lg,
                }}
              >
                <div
                  style={{
                    'margin-bottom': '24px',
                    display: 'flex',
                    'justify-content': 'space-between',
                    'align-items': 'center',
                  }}
                >
                  <span style={{ color: maximalist.colors.textMuted, 'font-size': '17px' }}>
                    Question {props.currentQuestionIndex() + 1} of 60
                  </span>
                  <span style={{ color: maximalist.colors.accent, 'font-weight': '600' }}>
                    {Math.round((props.currentQuestionIndex() / 60) * 100)}% Complete
                  </span>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    height: '6px',
                    background: 'rgba(255,255,255,0.1)',
                    'border-radius': '3px',
                    'margin-bottom': '40px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(props.currentQuestionIndex() / 60) * 100}%`,
                      background: props.currentTheme().gradients.primary,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                <h3
                  style={{
                    'font-family': maximalist.fonts.heading,
                    'font-size': '28px',
                    'margin-bottom': '48px',
                    'text-align': 'center',
                    'line-height': '1.4',
                  }}
                >
                  {props.questions()[props.currentQuestionIndex()].text}
                </h3>

                <div
                  style={{
                    display: 'grid',
                    'grid-template-columns': 'repeat(5, 1fr)',
                    gap: '12px',
                    'margin-bottom': '24px',
                  }}
                >
                  <For
                    each={[
                      { val: 1, label: 'Strongly Dislike', color: '#EF4444' },
                      { val: 2, label: 'Dislike', color: '#F87171' },
                      { val: 3, label: 'Unsure', color: '#9CA3AF' },
                      { val: 4, label: 'Like', color: '#34D399' },
                      { val: 5, label: 'Strongly Like', color: '#10B981' },
                    ]}
                  >
                    {(opt) => (
                      <button
                        onClick={() => props.onAnswer(opt.val)}
                        style={{
                          padding: '16px 8px',
                          background: 'rgba(255,255,255,0.05)',
                          border: `2px solid ${opt.color}`,
                          'border-radius': maximalist.radii.md,
                          color: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          'flex-direction': 'column',
                          'align-items': 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = `${opt.color}20`)}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')
                        }
                      >
                        <span
                          style={{
                            'font-size': '24px',
                            'font-weight': 'bold',
                            color: opt.color,
                          }}
                        >
                          <Show
                            when={opt.val === 1}
                            fallback={
                              opt.val === 2 ? (
                                <SmileySadIcon
                                  width={24}
                                  height={24}
                                  style={{ color: '#F97316' }}
                                />
                              ) : opt.val === 3 ? (
                                <SmileyMehIcon
                                  width={24}
                                  height={24}
                                  style={{ color: '#EAB308' }}
                                />
                              ) : opt.val === 4 ? (
                                <SmileyIcon width={24} height={24} style={{ color: '#22C55E' }} />
                              ) : (
                                <HeartIcon width={24} height={24} style={{ color: '#10B981' }} />
                              )
                            }
                          >
                            <SmileyAngryIcon width={24} height={24} style={{ color: '#EF4444' }} />
                          </Show>
                        </span>
                        <span style={{ 'font-size': '15px', 'text-align': 'center' }}>
                          {opt.label}
                        </span>
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            {/* Results State */}
            <Show when={props.assessmentState() === 'results' && props.riasecScore()}>
              <div
                style={{
                  'max-width': '1000px',
                  margin: '0 auto',
                  'text-align': 'left',
                }}
              >
                {/* Archetype Hero Section - Two Column Layout */}
                <div
                  class="archetype-hero-section"
                  style={{
                    background: props.currentTheme().gradients.primary,
                    'border-radius': maximalist.radii.lg,
                    padding: '40px',
                    'margin-bottom': '40px',
                    position: 'relative',
                    overflow: 'hidden',
                    'box-shadow': props.currentTheme().shadows.lg,
                    border: `1px solid ${maximalist.colors.border}`,
                  }}
                >
                  <div
                    class="archetype-hero-grid"
                    style={{
                      display: 'grid',
                      'grid-template-columns': '300px 1fr',
                      gap: '40px',
                      'align-items': 'center',
                    }}
                  >
                    {/* Left Column: Radar Chart */}
                    <div class="radar-column" style={{ 'flex-shrink': 0 }}>
                      <RadarChart scores={props.riasecScore()!} />
                    </div>

                    {/* Right Column: Archetype Info */}
                    <div class="archetype-info-column" style={{ 'text-align': 'left' }}>
                      <h2
                        style={{
                          color: 'rgba(255, 255, 255, 0.8)',
                          'font-size': '15px',
                          'text-transform': 'uppercase',
                          'letter-spacing': '2px',
                          'margin-bottom': '8px',
                          'font-weight': '600',
                          display: 'flex',
                          'align-items': 'center',
                          gap: '12px',
                        }}
                      >
                        <span>{props.hybridArchetype()!.types[0]}</span>
                        <span style={{ opacity: 0.6 }}>+</span>
                        <span>{props.hybridArchetype()!.types[1]}</span>
                      </h2>

                      <h1
                        style={{
                          'font-family': maximalist.fonts.heading,
                          'font-size': '48px',
                          'margin-bottom': '16px',
                          'font-weight': '700',
                          color: 'rgba(255, 255, 255, 0.95)',
                          'line-height': '1.1',
                        }}
                      >
                        {props.hybridArchetype()?.title}
                      </h1>

                      <p
                        style={{
                          color: 'rgba(255, 255, 255, 0.85)',
                          'font-size': '18px',
                          'line-height': '1.6',
                          margin: 0,
                        }}
                      >
                        {props.hybridArchetype()?.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <h3
                  style={{
                    'font-family': maximalist.fonts.heading,
                    'font-size': '32px',
                    'margin-bottom': '24px',
                    color: maximalist.colors.text,
                  }}
                >
                  Full Profile Breakdown
                </h3>

                <div
                  style={{
                    display: 'grid',
                    'grid-template-columns': 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    'margin-bottom': '48px',
                  }}
                >
                  <For each={props.sortedScores()}>
                    {(item) => {
                      const riasecColor = (maximalist.riasec as Record<string, string>)[item.key];
                      return (
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: '24px',
                            'border-radius': maximalist.radii.lg,
                            border: `1px solid ${riasecColor}40`,
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'transform 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          <div
                            style={{
                              display: 'flex',
                              'justify-content': 'space-between',
                              'align-items': 'center',
                              'margin-bottom': '16px',
                            }}
                          >
                            <h4
                              style={{
                                'font-size': '20px',
                                'font-weight': '700',
                                color: riasecColor,
                                margin: 0,
                                'font-family': maximalist.fonts.heading,
                                'text-transform': 'uppercase',
                                'letter-spacing': '1px',
                              }}
                            >
                              {item.title}
                            </h4>
                            <div
                              style={{
                                'font-size': '24px',
                                'font-weight': 'bold',
                                color: 'white',
                              }}
                            >
                              {item.score}
                            </div>
                          </div>

                          {/* Bar */}
                          <div
                            style={{
                              height: '4px',
                              background: 'rgba(255,255,255,0.1)',
                              'border-radius': '2px',
                              'margin-bottom': '16px',
                            }}
                          >
                            <div
                              style={{
                                width: `${(item.score / 40) * 100}%`,
                                height: '100%',
                                background: riasecColor,
                                'box-shadow': `0 0 10px ${riasecColor}`,
                              }}
                            />
                          </div>

                          <p
                            style={{
                              color: maximalist.colors.textMuted,
                              'font-size': '17px',
                              'line-height': '1.5',
                              margin: 0,
                            }}
                          >
                            {item.description}
                          </p>
                        </div>
                      );
                    }}
                  </For>
                </div>

                {/* Career Matches */}
                <h3
                  style={{
                    'font-family': maximalist.fonts.heading,
                    'font-size': '32px',
                    'margin-bottom': '24px',
                    color: maximalist.colors.text,
                  }}
                >
                  Recommended Careers
                </h3>

                <div
                  style={{
                    display: 'grid',
                    'grid-template-columns': 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '24px',
                    'margin-bottom': '48px',
                  }}
                >
                  <Show
                    when={!props.isLoading()}
                    fallback={
                      <div style={{ 'grid-column': '1/-1', 'text-align': 'center' }}>
                        Loading recommendations...
                      </div>
                    }
                  >
                    <For each={props.careerMatches()}>
                      {(career) => (
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            'border-radius': maximalist.radii.md,
                            padding: '24px',
                            border: `1px solid ${maximalist.colors.border}`,
                            transition: 'transform 0.2s',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.transform = 'translateY(-4px)')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                          <div
                            style={{
                              display: 'flex',
                              'justify-content': 'space-between',
                              'align-items': 'flex-start',
                              'margin-bottom': '12px',
                            }}
                          >
                            <Show when={career.tags.bright_outlook}>
                              <span
                                style={{
                                  background: `${maxPalette.teal}30`,
                                  color: maxPalette.teal,
                                  'font-size': '10px',
                                  padding: '4px 8px',
                                  'border-radius': '12px',
                                  'font-weight': 'bold',
                                  'text-transform': 'uppercase',
                                }}
                              >
                                Bright Outlook
                              </span>
                            </Show>
                            <CartoonBadge fit={career.fit} />
                          </div>

                          <h4
                            style={{
                              'font-size': '18px',
                              'font-weight': '600',
                              color: 'white',
                              'margin-bottom': '8px',
                            }}
                          >
                            {career.title}
                          </h4>

                          <div
                            style={{
                              color: maximalist.colors.textMuted,
                              'font-size': '15px',
                              'margin-bottom': '16px',
                            }}
                          >
                            Code: {career.code}
                          </div>

                          <button
                            onClick={() => props.onJobClick(career.code)}
                            disabled={props.isJobLoading()}
                            style={{
                              width: '100%',
                              padding: '12px',
                              background: 'transparent',
                              border: `1px solid ${props.currentTheme().colors.primary}`,
                              color: props.currentTheme().colors.primary,
                              'border-radius': '8px',
                              cursor: props.isJobLoading() ? 'wait' : 'pointer',
                              'font-weight': '600',
                              transition: 'all 0.2s',
                              opacity: props.isJobLoading() ? 0.7 : 1,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                props.currentTheme().colors.primary;
                              e.currentTarget.style.color =
                                props.currentTheme().colors.textOnPrimary;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = props.currentTheme().colors.primary;
                            }}
                          >
                            {props.isJobLoading() ? 'Loading...' : 'Explore Role'}
                          </button>
                        </div>
                      )}
                    </For>
                  </Show>
                </div>

                {/* O*NET Attribution */}
                <div style={{ 'text-align': 'center', 'margin-top': '48px' }}>
                  <button
                    onClick={() => props.onResetAssessment()}
                    style={{
                      padding: '12px 24px',
                      background: 'transparent',
                      border: `1px solid ${props.currentTheme().colors.border}`,
                      'border-radius': maximalist.radii.md,
                      color: props.currentTheme().colors.textMuted,
                      'font-size': '17px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = props.currentTheme().colors.primary;
                      e.currentTarget.style.color = props.currentTheme().colors.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = props.currentTheme().colors.border;
                      e.currentTarget.style.color = props.currentTheme().colors.textMuted;
                    }}
                  >
                    Retake Assessment
                  </button>
                </div>

                <footer
                  style={{
                    'margin-top': '64px',
                    'padding-top': '24px',
                    'border-top': `1px solid ${maximalist.colors.border}`,
                    'text-align': 'center',
                    color: maximalist.colors.textMuted,
                    'font-size': '15px',
                    'line-height': '1.5',
                  }}
                >
                  <p style={{ 'max-width': '600px', margin: '0 auto' }}>
                    This site incorporates information from O*NET Web Services by the U.S.
                    Department of Labor, Employment and Training Administration (USDOL/ETA). O*NET
                    is a trademark of USDOL/ETA.
                  </p>
                </footer>
              </div>
            </Show>
          </div>
        </Show>

        {/* OCEAN Personality Tab */}
        <Show when={props.discoverSubTab() === 'personality'}>
          <Show
            when={props.oceanAssessmentState() === 'results' && loadOceanProfile()}
            fallback={
              <OceanAssessment
                onComplete={props.onOceanComplete}
                onCancel={props.onOceanCancel}
                currentThemeGradient={props.currentTheme().gradients.primary}
                currentThemePrimary={props.currentTheme().colors.primary}
              />
            }
          >
            <OceanResults
              profile={loadOceanProfile()!}
              onRetake={props.onRetakeOcean}
              currentThemeGradient={props.currentTheme().gradients.primary}
              currentThemePrimary={props.currentTheme().colors.primary}
            />
          </Show>
        </Show>

        {/* Jungian Cognitive Style Tab */}
        <Show when={props.discoverSubTab() === 'cognitive-style'}>
          <Show
            when={props.jungianAssessmentState() === 'results' && loadJungianProfile()}
            fallback={
              <JungianAssessment
                onComplete={props.onJungianComplete}
                onCancel={props.onJungianCancel}
                currentThemeGradient={props.currentTheme().gradients.primary}
                currentThemePrimary={props.currentTheme().colors.primary}
              />
            }
          >
            <JungianResults
              profile={loadJungianProfile()!}
              onRetake={props.onRetakeJungian}
              currentThemeGradient={props.currentTheme().gradients.primary}
              currentThemePrimary={props.currentTheme().colors.primary}
            />
          </Show>
        </Show>
      </div>

      {/* Mobile Drawer - only on mobile */}
      <Show when={isMobile()}>
        <MobileDrawer
          appName="Discover"
          navItems={DISCOVER_NAV_ITEMS.filter((item) => {
            if (item.id === 'overview') return true;
            if (item.id === 'interests') return !!props.riasecScore();
            if (item.id === 'personality') return !!props.riasecScore() || props.oceanCompleted();
            if (item.id === 'cognitive-style') return props.jungianCompleted();
            return false;
          })}
          currentSection={props.discoverSubTab()}
          onNavigate={(sectionId) => props.onDiscoverSubTabChange(sectionId as DiscoverSubTab)}
          basePath="/tenure/discover"
          currentTenureApp="discover"
          theme={() => ({
            colors: {
              primary: props.currentTheme().colors.primary,
              text: props.currentTheme().colors.text,
              textMuted: props.currentTheme().colors.textMuted,
              border: props.currentTheme().colors.border,
              background: 'rgba(15, 15, 18, 0.75)',
            },
          })}
        />
      </Show>
    </MobileMenuProvider>
  );
};

export default DiscoverView;
