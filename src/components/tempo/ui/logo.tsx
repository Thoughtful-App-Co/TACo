import { Component, mergeProps, Show } from 'solid-js';
import { tempoDesign } from '../theme/tempo-design';

interface LogoProps {
  size?: number;
  color?: string;
  withText?: boolean;
}

export const TempoLogo: Component<LogoProps> = (props) => {
  const merged = mergeProps({ size: 32, color: tempoDesign.colors.primary, withText: true }, props);

  return (
    <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
      <img
        src="/tempo/tempo_logo.png"
        alt="Tempo Logo"
        style={{
          height: `${merged.size}px`,
          width: 'auto',
          'object-fit': 'contain',
        }}
      />
      <Show when={merged.withText}>
        <div style={{ display: 'flex', 'flex-direction': 'column' }}>
          <span
            style={{
              'font-family': tempoDesign.typography.fontFamily,
              'font-weight': tempoDesign.typography.weights.bold,
              'font-size': `${merged.size * 0.75}px`,
              'line-height': 1,
              'letter-spacing': '-0.02em',
              color: tempoDesign.colors.foreground,
            }}
          >
            Tempo
          </span>
        </div>
      </Show>
    </div>
  );
};
