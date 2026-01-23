import { Component, Show, createEffect, createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import { CheckCircle, Trophy, Sparkle } from 'phosphor-solid';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { tempoDesign } from '../../theme/tempo-design';

interface TimerCompletionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  variant?: 'success' | 'default';
}

export const TimerCompletionModal: Component<TimerCompletionModalProps> = (props) => {
  const [isAnimating, setIsAnimating] = createSignal(false);

  createEffect(() => {
    if (props.isOpen) {
      setIsAnimating(true);
      // Reset animation after it plays
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  });

  const handleAction = () => {
    props.onAction?.();
  };

  const getIconColor = () => {
    return props.variant === 'success' ? tempoDesign.colors.frog : tempoDesign.colors.primary;
  };

  const getIconBgColor = () => {
    return props.variant === 'success'
      ? tempoDesign.colors.frogBg
      : `${tempoDesign.colors.primary}15`;
  };

  const getAccentGradient = () => {
    return props.variant === 'success'
      ? `linear-gradient(135deg, ${tempoDesign.colors.frog} 0%, #00D084 100%)`
      : `linear-gradient(135deg, ${tempoDesign.colors.primary} 0%, ${tempoDesign.colors.primaryHover} 100%)`;
  };

  return (
    <Show when={props.isOpen}>
      <Portal>
        {/* Enhanced backdrop with blur and darker overlay */}
        <div
          style={{
            position: 'fixed',
            inset: '0',
            background: 'rgba(0, 0, 0, 0.75)',
            'backdrop-filter': 'blur(8px)',
            '-webkit-backdrop-filter': 'blur(8px)',
            'z-index': 9999,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Modal Card with enhanced shadow and border */}
          <div
            style={{
              width: '100%',
              'max-width': '480px',
              margin: '0 24px',
              animation: 'modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card
              style={{
                border: `2px solid ${props.variant === 'success' ? tempoDesign.colors.frog : tempoDesign.colors.primary}40`,
                'box-shadow': `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px ${props.variant === 'success' ? tempoDesign.colors.frog : tempoDesign.colors.primary}20`,
                position: 'relative',
                background: tempoDesign.colors.card,
              }}
            >
              {/* Decorative gradient bar at top */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: getAccentGradient(),
                  'z-index': 1,
                }}
              />

              <CardContent
                style={{
                  padding: '64px 32px 36px',
                  display: 'flex',
                  'flex-direction': 'column',
                  'align-items': 'center',
                  'text-align': 'center',
                }}
              >
                {/* Enhanced icon with glow and animation */}
                <div
                  style={{
                    position: 'relative',
                    width: '88px',
                    height: '88px',
                    'margin-bottom': '24px',
                  }}
                >
                  {/* Animated glow ring */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: '-8px',
                      'border-radius': tempoDesign.radius.full,
                      background: getAccentGradient(),
                      opacity: 0.2,
                      animation: isAnimating() ? 'pulse 0.6s ease-out' : 'none',
                    }}
                  />

                  {/* Icon container with gradient background */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      'border-radius': tempoDesign.radius.full,
                      background: getAccentGradient(),
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'box-shadow': `0 8px 24px ${getIconColor()}40`,
                      animation: isAnimating()
                        ? 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                        : 'none',
                    }}
                  >
                    <Show
                      when={props.variant === 'success'}
                      fallback={<CheckCircle size={44} weight="fill" color="white" />}
                    >
                      <Trophy size={44} weight="fill" color="white" />
                    </Show>
                  </div>

                  {/* Sparkle decorations for success */}
                  <Show when={props.variant === 'success'}>
                    <Sparkle
                      size={20}
                      weight="fill"
                      color={tempoDesign.colors.frog}
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '8px',
                        animation: isAnimating() ? 'sparkle 0.8s ease-out' : 'none',
                      }}
                    />
                    <Sparkle
                      size={16}
                      weight="fill"
                      color={tempoDesign.colors.frog}
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '0',
                        animation: isAnimating() ? 'sparkle 0.8s 0.1s ease-out' : 'none',
                      }}
                    />
                  </Show>
                </div>

                {/* Title */}
                <h2
                  style={{
                    margin: '0 0 12px 0',
                    'font-size': tempoDesign.typography.sizes['2xl'],
                    'font-weight': tempoDesign.typography.weights.bold,
                    color: tempoDesign.colors.foreground,
                    'line-height': tempoDesign.typography.lineHeights.tight,
                    'letter-spacing': '-0.025em',
                  }}
                >
                  {props.title}
                </h2>

                {/* Enhanced description with better spacing */}
                <p
                  style={{
                    margin: '0 0 32px 0',
                    'font-size': tempoDesign.typography.sizes.base,
                    color: tempoDesign.colors.mutedForeground,
                    'line-height': tempoDesign.typography.lineHeights.relaxed,
                    'max-width': '380px',
                  }}
                >
                  {props.description}
                </p>

                {/* Enhanced buttons with better hierarchy */}
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    width: '100%',
                    'max-width': '400px',
                  }}
                >
                  <Button
                    variant="outline"
                    onClick={props.onClose}
                    style={{
                      flex: 1,
                      height: '48px',
                      'font-size': tempoDesign.typography.sizes.base,
                      'font-weight': tempoDesign.typography.weights.medium,
                      'border-width': '2px',
                    }}
                  >
                    Cancel
                  </Button>
                  <Show when={props.actionLabel && props.onAction}>
                    <Button
                      onClick={handleAction}
                      style={{
                        flex: 2,
                        height: '48px',
                        'font-size': tempoDesign.typography.sizes.base,
                        'font-weight': tempoDesign.typography.weights.semibold,
                        background: getAccentGradient(),
                        border: 'none',
                        'box-shadow': `0 4px 16px ${getIconColor()}40`,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 8px 24px ${getIconColor()}50`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 4px 16px ${getIconColor()}40`;
                      }}
                    >
                      {props.actionLabel}
                    </Button>
                  </Show>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced keyframe animations */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: translateY(-40px) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes scaleIn {
            0% {
              transform: scale(0.5) rotate(-10deg);
              opacity: 0;
            }
            50% {
              transform: scale(1.1) rotate(5deg);
            }
            100% {
              transform: scale(1) rotate(0deg);
              opacity: 1;
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.2;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.4;
            }
          }
          
          @keyframes sparkle {
            0% {
              opacity: 0;
              transform: scale(0) rotate(0deg);
            }
            50% {
              opacity: 1;
              transform: scale(1.2) rotate(180deg);
            }
            100% {
              opacity: 0;
              transform: scale(0.8) rotate(360deg);
            }
          }
        `}</style>
      </Portal>
    </Show>
  );
};
