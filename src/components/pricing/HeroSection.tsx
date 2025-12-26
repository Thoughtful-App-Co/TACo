/**
 * Hero Section - Pricing Page Header
 * Fixed gradient text visibility issue
 */

import { Component } from 'solid-js';
import { tokens } from './tokens';

export const HeroSection: Component = () => {
  return (
    <section
      style={{
        padding: `${tokens.spacing['3xl']} ${tokens.spacing.lg}`,
        'text-align': 'center',
        'max-width': '800px',
        margin: '0 auto',
      }}
    >
      {/* Subheader */}
      <div
        style={{
          'font-size': '13px',
          'font-weight': '600',
          'letter-spacing': '1.5px',
          'text-transform': 'uppercase',
          color: tokens.colors.textDim,
          'margin-bottom': tokens.spacing.md,
        }}
      >
        All Free w/ Options
      </div>

      <h1
        style={{
          margin: 0,
          'font-size': 'clamp(36px, 6vw, 64px)',
          'font-weight': '400',
          'line-height': '1.1',
          'font-family': tokens.fonts.brand,
          'margin-bottom': tokens.spacing.sm,
        }}
      >
        {/* FIXED: Use proper gradient text technique */}
        <span
          style={{
            background: `linear-gradient(135deg, ${tokens.colors.accent.coral}, ${tokens.colors.accent.yellow}, ${tokens.colors.accent.teal})`,
            '-webkit-background-clip': 'text',
            '-webkit-text-fill-color': 'transparent',
            'background-clip': 'text',
            // Ensure gradient is applied as background, not fill
            '-moz-background-clip': 'text',
            '-moz-text-fill-color': 'transparent',
          }}
        >
          Build your perfect plan
        </span>
      </h1>

      <p
        style={{
          margin: 0,
          'font-size': '18px',
          color: tokens.colors.textMuted,
          'line-height': '1.6',
          'max-width': '500px',
          'margin-left': 'auto',
          'margin-right': 'auto',
        }}
      >
        Everything is free. Option to augment.
      </p>
    </section>
  );
};
