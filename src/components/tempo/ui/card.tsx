import { type Component, type ComponentProps, splitProps, mergeProps } from 'solid-js';
import { tempoDesign, tempoComponents } from '../theme/tempo-design';

export const Card: Component<ComponentProps<'div'>> = (props) => {
  const [local, others] = splitProps(props, ['style']);
  return (
    <div
      style={{
        ...tempoComponents.card,
        ...(local.style as any),
      }}
      {...others}
    />
  );
};

export const CardHeader: Component<ComponentProps<'div'>> = (props) => {
  const [local, others] = splitProps(props, ['style']);
  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        gap: '6px',
        padding: '24px',
        ...(local.style as any),
      }}
      {...others}
    />
  );
};

export const CardTitle: Component<ComponentProps<'h3'>> = (props) => {
  const [local, others] = splitProps(props, ['style']);
  return (
    <h3
      style={{
        'font-size': tempoDesign.typography.sizes['2xl'],
        'font-weight': tempoDesign.typography.weights.semibold,
        'line-height': 1,
        'letter-spacing': '-0.025em',
        margin: 0,
        ...(local.style as any),
      }}
      {...others}
    />
  );
};

export const CardDescription: Component<ComponentProps<'p'>> = (props) => {
  const [local, others] = splitProps(props, ['style']);
  return (
    <p
      style={{
        'font-size': tempoDesign.typography.sizes.sm,
        color: tempoDesign.colors.mutedForeground,
        margin: 0,
        ...(local.style as any),
      }}
      {...others}
    />
  );
};

export const CardContent: Component<ComponentProps<'div'>> = (props) => {
  const [local, others] = splitProps(props, ['style']);
  return (
    <div
      style={{
        padding: '24px',
        'padding-top': 0,
        ...(local.style as any),
      }}
      {...others}
    />
  );
};

export const CardFooter: Component<ComponentProps<'div'>> = (props) => {
  const [local, others] = splitProps(props, ['style']);
  return (
    <div
      style={{
        display: 'flex',
        'align-items': 'center',
        padding: '24px',
        'padding-top': 0,
        ...(local.style as any),
      }}
      {...others}
    />
  );
};
