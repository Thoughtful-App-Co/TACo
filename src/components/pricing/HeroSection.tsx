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
      <h1
        style={{
          margin: 0,
          'font-size': 'clamp(36px, 6vw, 64px)',
          'font-weight': '400',
          'line-height': '1.1',
          'font-family': tokens.fonts.brand,
          'margin-bottom': tokens.spacing.md,
        }}
      >
        {/* FIX: Removed gradient overlay block, applied gradient directly to text */}
        <span
          style={{
            background: `linear-gradient(135deg, ${tokens.colors.accent.coral}, ${tokens.colors.accent.yellow}, ${tokens.colors.accent.teal})`,
            '-webkit-background-clip': 'text',
            '-webkit-text-fill-color': 'transparent',
            'background-clip': 'text',
            // Fallback for browsers that don't support background-clip: text
            color: tokens.colors.text,
            display: 'inline-block', // Critical for gradient clip to work properly
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
        }}
      >
        Check off what you need. See your savings in real time.
      </p>
    </section>
  );
};
