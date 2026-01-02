/**
 * PredictiveInsights - Projections and recommendations based on industry benchmarks
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createMemo, Show, createSignal } from 'solid-js';
import { useTenureTheme } from '../../../TenureThemeProvider';
import { FluidCard } from '../../ui';
import { JobApplication } from '../../../../../schemas/pipeline.schema';
import {
  estimateWeeksToOffer,
  getSeasonalRecommendation,
  calculateSuccessProbability,
  CONVERSION_BENCHMARKS,
  APPLICATION_BENCHMARKS,
} from '../trends-benchmarks';
import { SeasonalInsightsModal } from './SeasonalInsightsModal';

interface PredictiveInsightsProps {
  applications: JobApplication[];
  applicationsPerWeek: number;
}

export const PredictiveInsights: Component<PredictiveInsightsProps> = (props) => {
  const theme = useTenureTheme();
  const [showSeasonalModal, setShowSeasonalModal] = createSignal(false);

  // Calculate current metrics
  const metrics = createMemo(() => {
    const apps = props.applications;
    const total = apps.length;

    // Interview rate
    const interviewedApps = apps.filter(
      (a) => a.status === 'interviewing' || a.status === 'offered' || a.status === 'accepted'
    ).length;
    const interviewRate = total > 0 ? interviewedApps / total : 0;

    // Response rate
    const respondedApps = apps.filter((a) => a.status !== 'saved' && a.status !== 'applied').length;
    const responseRate = total > 0 ? respondedApps / total : 0;

    // Has referrals (you could enhance this by adding a referral field to JobApplication)
    const hasReferrals = false; // Placeholder - enhance schema

    // Weeks active (estimate from oldest app)
    const now = new Date();
    const earliestApp = apps.reduce((earliest, app) => {
      const appDate = new Date(app.createdAt);
      return appDate < earliest ? appDate : earliest;
    }, now);
    const weeksActive = Math.max(
      1,
      Math.floor((now.getTime() - earliestApp.getTime()) / (7 * 24 * 60 * 60 * 1000))
    );

    return {
      total,
      interviewRate,
      responseRate,
      hasReferrals,
      weeksActive,
    };
  });

  // Success probability
  const successProbability = createMemo(() =>
    calculateSuccessProbability({
      applicationVolume: metrics().total,
      applicationRate: props.applicationsPerWeek,
      interviewRate: metrics().interviewRate,
      responseRate: metrics().responseRate,
      hasReferrals: metrics().hasReferrals,
      weeksActive: metrics().weeksActive,
    })
  );

  // Estimated weeks to offer
  const weeksToOffer = createMemo(() =>
    estimateWeeksToOffer(metrics().total, props.applicationsPerWeek, metrics().interviewRate)
  );

  // Seasonal recommendation
  const seasonal = createMemo(() => {
    const month = new Date().getMonth();
    return getSeasonalRecommendation(month);
  });

  // Progress to benchmark
  const progressToTarget = createMemo(() => {
    const target = APPLICATION_BENCHMARKS.APPLICATIONS_FOR_OFFER.min;
    const progress = Math.min(100, (metrics().total / target) * 100);
    return progress;
  });

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
      {/* Success Probability Gauge */}
      <FluidCard variant="elevated" style={{ padding: '20px' }}>
        <div style={{ 'margin-bottom': '16px' }}>
          <h4
            style={{
              margin: '0 0 4px',
              'font-size': '16px',
              'font-family': theme.fonts.heading,
              'font-weight': '600',
              color: theme.colors.text,
            }}
          >
            Success Probability
          </h4>
          <p
            style={{
              margin: 0,
              'font-size': '12px',
              'font-family': theme.fonts.body,
              color: theme.colors.textMuted,
            }}
          >
            Based on current velocity and conversion rates
          </p>
        </div>

        {/* Circular progress */}
        <div style={{ display: 'flex', 'align-items': 'center', gap: '24px' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px' }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                stroke-width="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={
                  successProbability() >= 0.7
                    ? theme.semantic.success.base
                    : successProbability() >= 0.4
                      ? theme.semantic.warning.base
                      : theme.semantic.error.base
                }
                stroke-width="8"
                stroke-dasharray={`${successProbability() * 251.2} 251.2`}
                stroke-linecap="round"
                transform="rotate(-90 50 50)"
                style={{
                  transition: `stroke-dasharray ${theme.animations.slow}`,
                }}
              />
              {/* Percentage text */}
              <text
                x="50"
                y="50"
                text-anchor="middle"
                dominant-baseline="middle"
                fill={theme.colors.text}
                font-size="20"
                font-family={theme.fonts.heading}
                font-weight="700"
              >
                {Math.round(successProbability() * 100)}%
              </text>
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ 'margin-bottom': '12px' }}>
              <div
                style={{
                  'font-size': '13px',
                  'font-family': theme.fonts.body,
                  color: theme.colors.textMuted,
                  'margin-bottom': '4px',
                }}
              >
                Current conversion rate
              </div>
              <div
                style={{
                  'font-size': '18px',
                  'font-family': theme.fonts.heading,
                  'font-weight': '600',
                  color: theme.colors.text,
                }}
              >
                {(metrics().interviewRate * 100).toFixed(1)}% interview rate
              </div>
              <div
                style={{
                  'font-size': '11px',
                  'font-family': theme.fonts.body,
                  color: theme.colors.textMuted,
                  'margin-top': '2px',
                }}
              >
                Benchmark: {CONVERSION_BENCHMARKS.APPLICATION_TO_INTERVIEW.min * 100}-
                {CONVERSION_BENCHMARKS.APPLICATION_TO_INTERVIEW.max * 100}%
              </div>
            </div>
          </div>
        </div>
      </FluidCard>

      {/* Time to Offer Estimate */}
      <FluidCard variant="elevated" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', 'align-items': 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              'border-radius': '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'flex-shrink': 0,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.semantic.info.base}
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                'font-size': '13px',
                'font-family': theme.fonts.body,
                color: theme.colors.textMuted,
                'margin-bottom': '4px',
              }}
            >
              Estimated Time to Offer
            </div>
            <div
              style={{
                'font-size': '20px',
                'font-family': theme.fonts.heading,
                'font-weight': '700',
                color: theme.semantic.info.base,
              }}
            >
              <Show
                when={weeksToOffer() !== null && weeksToOffer()! < 100}
                fallback={
                  <span style={{ 'font-size': '16px' }}>Increase velocity to estimate</span>
                }
              >
                {weeksToOffer()} week{weeksToOffer() !== 1 ? 's' : ''}
              </Show>
            </div>
            <div
              style={{
                'font-size': '11px',
                'font-family': theme.fonts.body,
                color: theme.colors.textMuted,
                'margin-top': '2px',
              }}
            >
              Based on current velocity and {Math.round(metrics().interviewRate * 100)}% interview
              rate
            </div>
          </div>
        </div>

        {/* Progress bar to 100 apps */}
        <div style={{ 'margin-top': '16px' }}>
          <div
            style={{
              display: 'flex',
              'justify-content': 'space-between',
              'margin-bottom': '6px',
            }}
          >
            <span
              style={{
                'font-size': '11px',
                'font-family': theme.fonts.body,
                color: theme.colors.textMuted,
              }}
            >
              Progress to target ({APPLICATION_BENCHMARKS.APPLICATIONS_FOR_OFFER.min} apps)
            </span>
            <span
              style={{
                'font-size': '11px',
                'font-family': theme.fonts.body,
                color: theme.colors.text,
                'font-weight': '600',
              }}
            >
              {metrics().total} / {APPLICATION_BENCHMARKS.APPLICATIONS_FOR_OFFER.min}
            </span>
          </div>
          <div
            style={{
              height: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              'border-radius': '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressToTarget()}%`,
                background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                'border-radius': '3px',
                transition: `width ${theme.animations.slow}`,
              }}
            />
          </div>
        </div>
      </FluidCard>

      {/* Seasonal Recommendation - Clickable */}
      <div
        style={{
          cursor: 'pointer',
          transition: `all ${theme.animations.fast}`,
        }}
        onClick={() => setShowSeasonalModal(true)}
        onMouseEnter={(e: MouseEvent) => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e: MouseEvent) => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        }}
      >
        <FluidCard
          variant="elevated"
          style={{
            padding: '20px',
            background: `linear-gradient(135deg, ${seasonal().score >= 8 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}, rgba(0, 0, 0, 0))`,
            border: `1px solid ${seasonal().score >= 8 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          }}
        >
          <div style={{ display: 'flex', 'align-items': 'flex-start', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                'border-radius': '12px',
                background:
                  seasonal().score >= 8 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                border: `1px solid ${seasonal().score >= 8 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'flex-shrink': 0,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={
                  seasonal().score >= 8 ? theme.semantic.success.base : theme.semantic.warning.base
                }
                stroke-width="2"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  'font-size': '14px',
                  'font-family': theme.fonts.heading,
                  'font-weight': '600',
                  color: theme.colors.text,
                  'margin-bottom': '4px',
                  display: 'flex',
                  'align-items': 'center',
                  gap: '8px',
                }}
              >
                Seasonal Insight
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div
                style={{
                  'font-size': '13px',
                  'font-family': theme.fonts.body,
                  color: theme.colors.text,
                  'margin-bottom': '8px',
                }}
              >
                {seasonal().message}
              </div>
              <div
                style={{
                  'font-size': '12px',
                  'font-family': theme.fonts.body,
                  color: theme.colors.textMuted,
                  'margin-bottom': '8px',
                }}
              >
                <strong>Action:</strong> {seasonal().action}
              </div>
              <div
                style={{
                  'font-size': '11px',
                  'font-family': theme.fonts.body,
                  color:
                    seasonal().score >= 8
                      ? theme.semantic.success.base
                      : theme.semantic.warning.base,
                  'font-weight': '600',
                  display: 'flex',
                  'align-items': 'center',
                  gap: '4px',
                }}
              >
                Click for full seasonal guide
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </div>
        </FluidCard>
      </div>

      {/* Seasonal Insights Modal */}
      <SeasonalInsightsModal
        isOpen={showSeasonalModal()}
        onClose={() => setShowSeasonalModal(false)}
      />
    </div>
  );
};

export default PredictiveInsights;
