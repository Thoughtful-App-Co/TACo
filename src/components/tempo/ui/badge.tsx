import { type Component, type ComponentProps, splitProps, mergeProps } from 'solid-js';
import { tempoDesign, tempoComponents } from '../theme/tempo-design';

export interface BadgeProps extends ComponentProps<'div'> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export const Badge: Component<BadgeProps> = (props) => {
  const merged = mergeProps({ variant: 'default' }, props);
  const [local, others] = splitProps(merged, ['variant', 'style']);

  const getVariantStyles = () => {
    switch (local.variant) {
      case 'secondary':
        return tempoComponents.badgeSecondary;
      case 'outline':
        return tempoComponents.badgeOutline;
      case 'destructive':
        return {
          background: tempoDesign.colors.destructive,
          color: tempoDesign.colors.destructiveForeground,
        };
      default:
        return tempoComponents.badgeDefault;
    }
  };

  return (
    <div
      style={{
        ...tempoComponents.badge,
        ...getVariantStyles(),
        ...(local.style as any),
      }}
      {...others}
    />
  );
};
