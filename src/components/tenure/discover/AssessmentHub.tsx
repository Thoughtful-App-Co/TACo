/**
 * AssessmentHub Component
 *
 * Landing page for the Discover panel showing all available assessments.
 * Displays RIASEC, Big Five (OCEAN), and future assessments as cards.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show } from 'solid-js';
import { AssessmentCard } from './AssessmentCard';
import { maximalist, maxGradients } from '../../../theme/maximalist';
import { isRiasecCompleted, isOceanCompleted } from '../../../stores/assessment-store';
import { CompassIcon, CheckCircleIcon, StarIcon, RocketIcon } from 'solid-phosphor/bold';

export interface AssessmentHubProps {
  onStartRiasec: () => void;
  onStartOcean: () => void;
  onViewRiasecResults: () => void;
  onViewOceanResults: () => void;
}

export const AssessmentHub: Component<AssessmentHubProps> = (props) => {
  return (
    <div
      style={{
        'max-width': '1200px',
        margin: '0 auto',
        padding: '48px 24px',
      }}
    >
      {/* Header */}
      <div style={{ 'text-align': 'center', 'margin-bottom': '64px' }}>
        <div
          style={{
            width: '120px',
            height: '120px',
            'border-radius': '50%',
            background: maxGradients.aurora,
            margin: '0 auto 32px',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'box-shadow': '0 16px 48px rgba(16, 185, 129, 0.3)',
          }}
        >
          <CompassIcon width={64} height={64} color="white" />
        </div>

        <h1
          style={{
            'font-family': maximalist.fonts.heading,
            'font-size': '48px',
            'font-weight': '700',
            'margin-bottom': '16px',
            color: maximalist.colors.text,
          }}
        >
          Discover Yourself
        </h1>

        <p
          style={{
            'font-size': '20px',
            color: maximalist.colors.textMuted,
            'line-height': '1.6',
            'max-width': '600px',
            margin: '0 auto',
          }}
        >
          Build your complete career profile through validated personality and interest assessments
        </p>
      </div>

      {/* Assessment Cards Grid */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '32px',
          'margin-bottom': '48px',
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
          gradient={maxGradients.sunset}
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
          gradient={maxGradients.vapor}
        />

        {/* Jungian Card (Coming Soon) */}
        <AssessmentCard
          title="Cognitive Style"
          subtitle="Jungian Cognitive Types (OEJTS)"
          description="How you process information and make decisions"
          icon="mindmap"
          questionCount={32}
          estimatedMinutes={6}
          isCompleted={false}
          isComingSoon={true}
          onStart={() => {}}
          gradient={maxGradients.luxe}
        />
      </div>

      {/* Progress Indicator */}
      <div
        style={{
          'text-align': 'center',
          padding: '32px',
          background: 'rgba(255,255,255,0.03)',
          'border-radius': maximalist.radii.lg,
          border: `1px solid ${maximalist.colors.border}`,
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
          <Show
            when={isRiasecCompleted() && isOceanCompleted()}
            fallback={
              isRiasecCompleted() || isOceanCompleted() ? (
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                    'justify-content': 'center',
                  }}
                >
                  <StarIcon width={20} height={20} style={{ color: '#F59E0B' }} /> Great start!
                  Complete the remaining assessment for a full profile.
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                    'justify-content': 'center',
                  }}
                >
                  <RocketIcon width={20} height={20} style={{ color: '#3B82F6' }} /> Start with any
                  assessment - they can be taken in any order.
                </div>
              )
            }
          >
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
                'justify-content': 'center',
              }}
            >
              <CheckCircleIcon width={20} height={20} style={{ color: '#10B981' }} /> All
              assessments complete! View your Overview for combined insights.
            </div>
          </Show>
        </p>

        {/* Progress bar */}
        <div
          style={{
            height: '8px',
            background: 'rgba(255,255,255,0.1)',
            'border-radius': '4px',
            overflow: 'hidden',
            'max-width': '400px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(Number(isRiasecCompleted()) + Number(isOceanCompleted())) * 50}%`,
              background: maxGradients.aurora,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
};
