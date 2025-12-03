import { Component, mergeProps } from "solid-js";
import { tempoDesign } from "../theme/tempo-design";

interface LogoProps {
  size?: number;
  color?: string;
  withText?: boolean;
}

export const TempoLogo: Component<LogoProps> = (props) => {
  const merged = mergeProps({ size: 32, color: tempoDesign.colors.primary, withText: true }, props);
  
  return (
    <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
      <svg 
        width={merged.size} 
        height={merged.size} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z" 
          stroke={merged.color} 
          stroke-width="2.5" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        />
        <path 
          d="M16 9V16L21 21" 
          stroke={merged.color} 
          stroke-width="2.5" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        />
        <circle cx="16" cy="16" r="3" fill={merged.color} />
      </svg>
      {merged.withText && (
        <div style={{ display: 'flex', 'flex-direction': 'column' }}>
          <span style={{ 
            'font-family': tempoDesign.typography.fontFamily,
            'font-weight': tempoDesign.typography.weights.bold,
            'font-size': `${merged.size * 0.75}px`,
            'line-height': 1,
            'letter-spacing': '-0.02em',
            color: tempoDesign.colors.foreground 
          }}>
            Tempo
          </span>
          <span style={{ 
            'font-family': tempoDesign.typography.fontFamily,
            'font-size': `${merged.size * 0.35}px`,
            'font-weight': tempoDesign.typography.weights.medium,
            color: tempoDesign.colors.mutedForeground,
            'letter-spacing': '0.05em',
            'text-transform': 'uppercase'
          }}>
            Rhythm for Work
          </span>
        </div>
      )}
    </div>
  );
};
