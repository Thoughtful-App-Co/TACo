/**
 * DiscoverOverview Component
 *
 * Overview/Hub page for the Discover panel.
 * Shows all available assessments as cards with integrated progress tracking.
 * This IS the hub - the landing page for Discover.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createMemo, Show } from 'solid-js';
import { AssessmentCard } from './AssessmentCard';
import { maximalist, maxGradients } from '../../../theme/maximalist';
import {
  isRiasecCompleted,
  isOceanCompleted,
  isJungianCompleted,
  areAllAssessmentsCompleted,
  getRiasecAssessment,
} from '../../../stores/assessment-store';
import { loadOceanProfile, loadOceanArchetype } from '../services/ocean';
import { loadJungianProfile } from '../services/jungian';
import { IconCompass, IconTarget, IconUsers, IconTrendingUp } from '../pipeline/ui/Icons';

// RIASEC Archetypes (copied from TenureApp for compact display)
const RIASEC_ARCHETYPES: Record<string, { title: string }> = {
  realistic: { title: 'The Artificer' },
  investigative: { title: 'The Sage' },
  artistic: { title: 'The Bard' },
  social: { title: 'The Diplomat' },
  enterprising: { title: 'The Warlord' },
  conventional: { title: 'The Scribe' },
  'artistic-conventional': { title: 'The Chronicler' },
  'artistic-enterprising': { title: 'The Illusionist' },
  'artistic-investigative': { title: 'The Alchemist' },
  'artistic-realistic': { title: 'The Runesmith' },
  'artistic-social': { title: 'The Muse' },
  'conventional-enterprising': { title: 'The Regent' },
  'conventional-investigative': { title: 'The Lorekeeper' },
  'conventional-realistic': { title: 'The Forgemaster' },
  'conventional-social': { title: 'The Steward' },
  'enterprising-investigative': { title: 'The Strategist' },
  'enterprising-realistic': { title: 'The Commander' },
  'enterprising-social': { title: 'The Champion' },
  'investigative-realistic': { title: 'The Engineer' },
  'investigative-social': { title: 'The Oracle' },
  'realistic-social': { title: 'The Paladin' },
};

export interface DiscoverOverviewProps {
  onStartRiasec: () => void;
  onStartOcean: () => void;
  onStartJungian: () => void;
  onViewRiasecResults: () => void;
  onViewOceanResults: () => void;
  onViewJungianResults: () => void;
  currentThemeGradient?: string; // Dynamic RIASEC theme gradient
  currentThemePrimary?: string; // Dynamic RIASEC primary color
  currentThemeTextOnPrimary?: string; // Dynamic text color for buttons (black on light, white on dark)
}

export const DiscoverOverview: Component<DiscoverOverviewProps> = (props) => {
  const completedCount = () => {
    let count = 0;
    if (isRiasecCompleted()) count++;
    if (isOceanCompleted()) count++;
    if (isJungianCompleted()) count++;
    return count;
  };

  const totalAssessments = 3;
  const progressPercentage = () => (completedCount() / totalAssessments) * 100;

  // Get RIASEC archetype for compact card
  const riasecResult = createMemo(() => {
    const assessment = getRiasecAssessment();
    if (!assessment?.scores) return null;

    const sorted = Object.entries(assessment.scores)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.score - a.score);

    const top1 = sorted[0];
    const top2 = sorted[1];
    const archetypeKey = [top1.key, top2.key].sort().join('-');
    const archetype = RIASEC_ARCHETYPES[archetypeKey] || RIASEC_ARCHETYPES[top1.key];

    return {
      title: archetype?.title || 'Unknown',
      subtext: `${top1.key.toUpperCase()}-${top2.key.toUpperCase()}`,
    };
  });

  // Get OCEAN archetype for compact card
  const oceanResult = createMemo(() => {
    const profile = loadOceanProfile();
    const archetype = loadOceanArchetype();
    if (!profile || !archetype) return null;

    return {
      title: archetype.title,
      subtext: `O${profile.openness.percentage.toFixed(0)} C${profile.conscientiousness.percentage.toFixed(0)} E${profile.extraversion.percentage.toFixed(0)} A${profile.agreeableness.percentage.toFixed(0)} N${profile.neuroticism.percentage.toFixed(0)}`,
    };
  });

  // Get Jungian type for compact card
  const jungianResult = createMemo(() => {
    const profile = loadJungianProfile();
    if (!profile) return null;

    return {
      title: profile.type,
      subtext: profile.temperament,
    };
  });

  return (
    <div
      style={{
        'max-width': '1200px',
        margin: '0 auto',
        padding: '48px 24px',
      }}
    >
      {/* Two-Column Header: Title + Progress */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': '1fr auto',
          gap: '48px',
          'align-items': 'center',
          'margin-bottom': '64px',
        }}
      >
        {/* Left Column: Title & Description */}
        <div>
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '16px',
              'margin-bottom': '16px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                'border-radius': '12px',
                background: props.currentThemeGradient || maxGradients.primary,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'box-shadow': `0 8px 24px ${props.currentThemePrimary || '#FFFFFF'}30`,
              }}
            >
              <IconCompass size={32} color="white" />
            </div>
            <h1
              style={{
                'font-family': maximalist.fonts.heading,
                'font-size': '48px',
                'font-weight': '700',
                margin: 0,
                color: maximalist.colors.text,
              }}
            >
              Discover Yourself
            </h1>
          </div>

          <p
            style={{
              'font-size': '20px',
              color: maximalist.colors.textMuted,
              'line-height': '1.6',
              'max-width': '600px',
              margin: 0,
            }}
          >
            Build your complete career profile through validated personality and interest
            assessments
          </p>
        </div>

        {/* Right Column: Progress Indicator */}
        <div
          style={{
            padding: '32px',
            background: 'rgba(255,255,255,0.03)',
            'border-radius': maximalist.radii.lg,
            border: `1px solid ${maximalist.colors.border}`,
            'min-width': '280px',
            'text-align': 'center',
          }}
        >
          <h3
            style={{
              'font-family': maximalist.fonts.heading,
              'font-size': '20px',
              'font-weight': '600',
              'margin-bottom': '12px',
              color: maximalist.colors.text,
            }}
          >
            Your Progress
          </h3>
          <p
            style={{
              'font-size': '16px',
              color: maximalist.colors.textMuted,
              'margin-bottom': '16px',
            }}
          >
            {completedCount()} of {totalAssessments} assessments complete
          </p>

          {/* Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              'border-radius': '4px',
              overflow: 'hidden',
              'margin-bottom': '8px',
            }}
          >
            <div
              style={{
                width: `${progressPercentage()}%`,
                height: '100%',
                background: props.currentThemeGradient || maxGradients.primary,
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <p
            style={{
              'font-size': '14px',
              color: maximalist.colors.textMuted,
            }}
          >
            {Math.round(progressPercentage())}% complete
          </p>
        </div>
      </div>

      {/* Assessment Cards Grid */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '32px',
        }}
      >
        {/* RIASEC Card */}
        <AssessmentCard
          title="Interests"
          subtitle="RIASEC / Holland Codes"
          description="Discover what types of work energize you and align with your natural interests"
          icon="target"
          questionCount={60}
          estimatedMinutes={10}
          isCompleted={isRiasecCompleted()}
          onStart={props.onStartRiasec}
          onViewResults={props.onViewRiasecResults}
          gradient={props.currentThemeGradient || maxGradients.primary}
          textOnPrimary={props.currentThemeTextOnPrimary || 'black'}
          resultTitle={riasecResult()?.title}
          resultSubtext={riasecResult()?.subtext}
        />

        {/* Big Five Card */}
        <AssessmentCard
          title="Personality"
          subtitle="Big Five / OCEAN"
          description="Understand your natural traits and work style tendencies"
          icon="brain"
          questionCount={44}
          estimatedMinutes={8}
          isCompleted={isOceanCompleted()}
          onStart={props.onStartOcean}
          onViewResults={props.onViewOceanResults}
          gradient={props.currentThemeGradient || maxGradients.primary}
          textOnPrimary={props.currentThemeTextOnPrimary || 'black'}
          resultTitle={oceanResult()?.title}
          resultSubtext={oceanResult()?.subtext}
        />

        {/* Jungian Card */}
        <AssessmentCard
          title="Cognitive Style"
          subtitle="Jungian Cognitive Types (OEJTS)"
          description="How you process information and make decisions"
          icon="mindmap"
          questionCount={32}
          estimatedMinutes={6}
          isCompleted={isJungianCompleted()}
          isComingSoon={false}
          onStart={props.onStartJungian}
          onViewResults={props.onViewJungianResults}
          gradient={props.currentThemeGradient || maxGradients.primary}
          textOnPrimary={props.currentThemeTextOnPrimary || 'black'}
          resultTitle={jungianResult()?.title}
          resultSubtext={jungianResult()?.subtext}
        />
      </div>

      {/* Premium Feature Teaser - Shows when all assessments complete */}
      <Show when={areAllAssessmentsCompleted()}>
        <div
          style={{
            'margin-top': '48px',
            background: props.currentThemeGradient
              ? `linear-gradient(135deg, ${props.currentThemePrimary}10, ${props.currentThemePrimary}05)`
              : `linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))`,
            'border-radius': maximalist.radii.lg,
            padding: '32px',
            border: `1px solid ${props.currentThemePrimary ? `${props.currentThemePrimary}30` : 'rgba(139, 92, 246, 0.3)'}`,
            'text-align': 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              'align-items': 'center',
              gap: '8px',
              background: props.currentThemeGradient || 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              padding: '6px 16px',
              'border-radius': '20px',
              'margin-bottom': '16px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <span
              style={{
                color: 'white',
                'font-size': '12px',
                'font-weight': '700',
                'text-transform': 'uppercase',
                'letter-spacing': '1px',
              }}
            >
              Premium Feature
            </span>
          </div>

          <h3
            style={{
              'font-family': maximalist.fonts.heading,
              'font-size': '28px',
              'font-weight': '700',
              'margin-bottom': '12px',
              color: props.currentThemePrimary || '#8B5CF6',
            }}
          >
            Extended Profile Report
          </h3>

          <p
            style={{
              color: maximalist.colors.text,
              'font-size': '16px',
              'line-height': '1.6',
              'max-width': '600px',
              margin: '0 auto 24px',
            }}
          >
            Unlock your comprehensive career analysis combining your RIASEC interests, Big Five
            personality traits, and Jungian cognitive style into actionable insights for career
            planning, team dynamics, and professional growth.
          </p>

          <div
            style={{
              display: 'grid',
              'grid-template-columns': 'repeat(3, 1fr)',
              gap: '16px',
              'max-width': '500px',
              margin: '0 auto 24px',
            }}
          >
            <div style={{ 'text-align': 'center' }}>
              <div style={{ 'margin-bottom': '4px', display: 'flex', 'justify-content': 'center' }}>
                <IconTarget
                  size={24}
                  color={props.currentThemePrimary || maximalist.colors.primary}
                />
              </div>
              <div style={{ 'font-size': '13px', color: maximalist.colors.textMuted }}>
                Career Match Analysis
              </div>
            </div>
            <div style={{ 'text-align': 'center' }}>
              <div style={{ 'margin-bottom': '4px', display: 'flex', 'justify-content': 'center' }}>
                <IconUsers
                  size={24}
                  color={props.currentThemePrimary || maximalist.colors.primary}
                />
              </div>
              <div style={{ 'font-size': '13px', color: maximalist.colors.textMuted }}>
                Team Compatibility
              </div>
            </div>
            <div style={{ 'text-align': 'center' }}>
              <div style={{ 'margin-bottom': '4px', display: 'flex', 'justify-content': 'center' }}>
                <IconTrendingUp
                  size={24}
                  color={props.currentThemePrimary || maximalist.colors.primary}
                />
              </div>
              <div style={{ 'font-size': '13px', color: maximalist.colors.textMuted }}>
                Growth Roadmap
              </div>
            </div>
          </div>

          <button
            style={{
              padding: '14px 32px',
              background: props.currentThemeGradient || 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              border: 'none',
              'border-radius': maximalist.radii.md,
              color: 'white',
              'font-size': '16px',
              'font-weight': '600',
              cursor: 'pointer',
              opacity: 0.8,
            }}
            disabled
          >
            Coming Soon
          </button>
        </div>
      </Show>
    </div>
  );
};
