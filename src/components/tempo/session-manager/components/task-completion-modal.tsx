import { Component, Show, createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Clock, CheckCircle } from 'phosphor-solid';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { NeoNumberInput } from '../../ui/neo-number-input';
import { tempoDesign } from '../../theme/tempo-design';

interface TaskCompletionModalProps {
  isOpen: boolean;
  taskName: string;
  onConfirm: (minutesSpent: number) => void;
}

const TIME_PRESETS = [5, 10, 15, 20, 30, 45, 60];

export const TaskCompletionModal: Component<TaskCompletionModalProps> = (props) => {
  const [selectedMinutes, setSelectedMinutes] = createSignal<number | null>(null);
  const [customMinutes, setCustomMinutes] = createSignal(15);
  const [useCustom, setUseCustom] = createSignal(false);

  const handleConfirm = () => {
    const minutes = useCustom() ? customMinutes() : selectedMinutes();
    if (minutes !== null) {
      props.onConfirm(minutes);
    }
  };

  const handlePresetClick = (minutes: number) => {
    setSelectedMinutes(minutes);
    setUseCustom(false);
  };

  const handleCustomToggle = () => {
    setUseCustom(true);
    setSelectedMinutes(null);
  };

  const isValid = () => useCustom() || selectedMinutes() !== null;

  return (
    <Show when={props.isOpen}>
      <Portal>
        {/* Backdrop */}
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
          {/* Modal */}
          <div
            style={{
              width: '100%',
              'max-width': '440px',
              margin: '0 24px',
              animation: 'modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card
              style={{
                border: `2px solid ${tempoDesign.colors.primary}40`,
                'box-shadow': `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px ${tempoDesign.colors.primary}20`,
                position: 'relative',
                background: tempoDesign.colors.card,
              }}
            >
              {/* Decorative bar at top */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: `linear-gradient(135deg, ${tempoDesign.colors.primary} 0%, ${tempoDesign.colors.primaryHover} 100%)`,
                  'z-index': 1,
                }}
              />

              <CardContent
                style={{
                  padding: '56px 32px 36px',
                  display: 'flex',
                  'flex-direction': 'column',
                  'align-items': 'center',
                  'text-align': 'center',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    'border-radius': tempoDesign.radius.full,
                    background: `linear-gradient(135deg, ${tempoDesign.colors.frog} 0%, #00D084 100%)`,
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'margin-bottom': '24px',
                    'box-shadow': `0 8px 24px ${tempoDesign.colors.frog}40`,
                  }}
                >
                  <CheckCircle size={36} weight="fill" color="white" />
                </div>

                {/* Title */}
                <h2
                  style={{
                    margin: '0 0 8px 0',
                    'font-size': tempoDesign.typography.sizes.xl,
                    'font-weight': tempoDesign.typography.weights.bold,
                    color: tempoDesign.colors.foreground,
                    'line-height': tempoDesign.typography.lineHeights.tight,
                  }}
                >
                  Task Complete!
                </h2>

                {/* Task name */}
                <p
                  style={{
                    margin: '0 0 8px 0',
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.mutedForeground,
                    'max-width': '320px',
                  }}
                >
                  {props.taskName}
                </p>

                {/* Time question */}
                <p
                  style={{
                    margin: '0 0 20px 0',
                    'font-size': tempoDesign.typography.sizes.base,
                    color: tempoDesign.colors.foreground,
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                  }}
                >
                  <Clock size={18} color={tempoDesign.colors.primary} />
                  How long did this take?
                </p>

                {/* Time presets grid */}
                <div
                  style={{
                    display: 'grid',
                    'grid-template-columns': 'repeat(4, 1fr)',
                    gap: '8px',
                    width: '100%',
                    'margin-bottom': '16px',
                  }}
                >
                  {TIME_PRESETS.map((minutes) => (
                    <button
                      type="button"
                      onClick={() => handlePresetClick(minutes)}
                      style={{
                        padding: '10px 8px',
                        'border-radius': tempoDesign.radius.md,
                        border: `2px solid ${selectedMinutes() === minutes && !useCustom() ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                        background:
                          selectedMinutes() === minutes && !useCustom()
                            ? `${tempoDesign.colors.primary}15`
                            : tempoDesign.colors.secondary,
                        color:
                          selectedMinutes() === minutes && !useCustom()
                            ? tempoDesign.colors.primary
                            : tempoDesign.colors.foreground,
                        'font-size': tempoDesign.typography.sizes.sm,
                        'font-weight': tempoDesign.typography.weights.medium,
                        'font-family': tempoDesign.typography.fontFamily,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                    </button>
                  ))}

                  {/* Custom option */}
                  <button
                    type="button"
                    onClick={handleCustomToggle}
                    style={{
                      padding: '10px 8px',
                      'border-radius': tempoDesign.radius.md,
                      border: `2px solid ${useCustom() ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                      background: useCustom()
                        ? `${tempoDesign.colors.primary}15`
                        : tempoDesign.colors.secondary,
                      color: useCustom()
                        ? tempoDesign.colors.primary
                        : tempoDesign.colors.foreground,
                      'font-size': tempoDesign.typography.sizes.sm,
                      'font-weight': tempoDesign.typography.weights.medium,
                      'font-family': tempoDesign.typography.fontFamily,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Custom
                  </button>
                </div>

                {/* Custom input */}
                <Show when={useCustom()}>
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      gap: '12px',
                      'margin-bottom': '16px',
                      padding: '12px 16px',
                      'border-radius': tempoDesign.radius.md,
                      background: tempoDesign.colors.secondary,
                      border: `1px solid ${tempoDesign.colors.border}`,
                    }}
                  >
                    <NeoNumberInput
                      value={customMinutes()}
                      onChange={setCustomMinutes}
                      min={1}
                      max={480}
                      step={5}
                      width="60px"
                      suffix="min"
                      aria-label="Custom time in minutes"
                    />
                  </div>
                </Show>

                {/* Buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    width: '100%',
                    'margin-top': '8px',
                  }}
                >
                  <Button
                    variant="outline"
                    onClick={() => props.onConfirm(0)}
                    style={{
                      flex: 1,
                      height: '48px',
                      'font-size': tempoDesign.typography.sizes.base,
                      'font-weight': tempoDesign.typography.weights.medium,
                      'border-width': '2px',
                    }}
                  >
                    Skip Time
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={!isValid()}
                    style={{
                      flex: 2,
                      height: '48px',
                      'font-size': tempoDesign.typography.sizes.base,
                      'font-weight': tempoDesign.typography.weights.semibold,
                      background: `linear-gradient(135deg, ${tempoDesign.colors.primary} 0%, ${tempoDesign.colors.primaryHover} 100%)`,
                      border: 'none',
                      opacity: isValid() ? 1 : 0.5,
                      cursor: isValid() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Confirm
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Keyframe animations */}
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
        `}</style>
      </Portal>
    </Show>
  );
};
