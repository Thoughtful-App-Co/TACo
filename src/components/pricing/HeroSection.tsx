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
          'font-size': 'clamp(36px, 6vw, 64px)',
          'font-weight': '400',
          'line-height': '1.1',
          'font-family': tokens.fonts.brand,
          margin: `0 auto ${tokens.spacing.sm} auto`,
          // Just use solid coral color - gradient text is too unreliable
          color: tokens.colors.accent.coral,
        }}
      >
        Build your perfect plan
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
