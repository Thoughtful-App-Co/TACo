import { Component, createSignal, Show, createEffect, onCleanup } from 'solid-js';
import { X, Warning, Check, Star } from 'phosphor-solid';
import { Button } from './button';
import { Input } from './input';
import { tempoDesign } from '../theme/tempo-design';
import { ApiConfigService, type ApiKeyMode } from '../services/api-config.service';
import { canUseTempoAI } from '../../../lib/feature-gates';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const SettingsSidebar: Component<SettingsSidebarProps> = (props) => {
  const initialConfig = ApiConfigService.getConfig();
  const [apiKeyMode, setApiKeyMode] = createSignal<ApiKeyMode>(initialConfig.apiKeyMode);
  const [apiKey, setApiKey] = createSignal(initialConfig.claudeApiKey || '');
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [showSecurityWarning, setShowSecurityWarning] = createSignal(false);
  const [isViewRisksHovering, setIsViewRisksHovering] = createSignal(false);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    try {
      if (apiKeyMode() === 'bring-your-own') {
        const key = apiKey().trim();
        if (!key) {
          setError('API key is required for Bring Your Own mode');
          return;
        }

        if (!ApiConfigService.isValidApiKey(key)) {
          setError('Invalid API key format. Claude API keys should start with "sk-"');
          return;
        }

        setIsSaving(true);
        ApiConfigService.setApiKeyMode('bring-your-own');
        ApiConfigService.setClaudeApiKey(key);
      } else {
        // For managed mode, check if user has Tempo Extras subscription
        if (!hasTempoExtras()) {
          // Redirect to pricing page for subscription
          window.location.href = '/pricing#tempo-extras';
          return;
        }
        setIsSaving(true);
        ApiConfigService.setApiKeyMode('managed');
      }

      setSuccess(true);

      // Show success message for 2 seconds then close
      setTimeout(() => {
        props.onClose();
        props.onSave?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset form if closing without saving
    setApiKeyMode(initialConfig.apiKeyMode);
    setApiKey(initialConfig.claudeApiKey || '');
    setError(null);
    setSuccess(false);
    props.onClose();
  };

  const isManagedActive = ApiConfigService.hasManagedSubscription();
  const hasTempoExtras = () => canUseTempoAI().allowed;

  // Handle ESC key to close sidebar
  createEffect(() => {
    if (!props.isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    onCleanup(() => window.removeEventListener('keydown', handleEscape));
  });

  return (
    <Show when={props.isOpen}>
      <style>
        {`
          @keyframes slideInFromRight {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}
      </style>

      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          'z-index': 50,
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={handleClose}
      />

      {/* Security Warning Modal */}
      <Show when={showSecurityWarning()}>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            'z-index': 60,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setShowSecurityWarning(false)}
        >
          <div
            style={{
              background: tempoDesign.colors.background,
              'border-radius': tempoDesign.radius.lg,
              padding: '24px',
              'max-width': '400px',
              width: '100%',
              'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
                'margin-bottom': '16px',
              }}
            >
              <Warning size={20} style={{ color: tempoDesign.colors.destructive }} />
              <h3
                style={{
                  margin: 0,
                  'font-size': tempoDesign.typography.sizes.lg,
                  'font-weight': tempoDesign.typography.weights.semibold,
                  color: tempoDesign.colors.foreground,
                }}
              >
                Security Notice
              </h3>
            </div>
            <div
              style={{
                'font-size': tempoDesign.typography.sizes.sm,
                color: tempoDesign.colors.mutedForeground,
                'margin-bottom': '20px',
              }}
            >
              <p style={{ margin: '0 0 12px 0' }}>
                Your API key is stored <strong>unencrypted</strong> in your browser's localStorage.
                It could potentially be accessed by:
              </p>
              <ul style={{ margin: '0 0 12px 0', 'padding-left': '20px' }}>
                <li>Browser extensions</li>
                <li>Other scripts on this page</li>
                <li>Anyone with physical access to your device</li>
              </ul>
              <p style={{ margin: 0, 'font-weight': tempoDesign.typography.weights.medium }}>
                By using this feature, you accept full responsibility for your API key's security.
                Thoughtful App Co. is not liable for any unauthorized usage or charges.
              </p>
            </div>
            <Button
              onClick={() => setShowSecurityWarning(false)}
              style={{
                width: '100%',
                'font-weight': tempoDesign.typography.weights.semibold,
              }}
            >
              I Understand
            </Button>
          </div>
        </div>
      </Show>

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          'max-width': '400px',
          'z-index': 51,
          background: tempoDesign.colors.background,
          'box-shadow': '-4px 0 24px rgba(0, 0, 0, 0.3)',
          'overflow-y': 'auto',
          animation: 'slideInFromRight 0.3s ease-out',
          display: 'flex',
          'flex-direction': 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            'border-bottom': `1px solid ${tempoDesign.colors.border}`,
            'flex-shrink': 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
              'margin-bottom': '8px',
            }}
          >
            <h2
              style={{
                margin: 0,
                'font-size': tempoDesign.typography.sizes.xl,
                'font-weight': tempoDesign.typography.weights.semibold,
                color: tempoDesign.colors.foreground,
              }}
            >
              Settings
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              style={{
                height: '32px',
                width: '32px',
                'border-radius': tempoDesign.radius.full,
              }}
            >
              <X size={16} />
            </Button>
          </div>
          <p
            style={{
              margin: 0,
              'font-size': tempoDesign.typography.sizes.sm,
              color: tempoDesign.colors.mutedForeground,
            }}
          >
            Choose how you want to manage your Claude API key
          </p>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            'overflow-y': 'auto',
            padding: '20px',
            display: 'flex',
            'flex-direction': 'column',
            gap: '20px',
          }}
        >
          {/* Mode Selection */}
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
            <p
              style={{
                'font-size': tempoDesign.typography.sizes.sm,
                'font-weight': tempoDesign.typography.weights.medium,
                color: tempoDesign.colors.foreground,
                margin: '0 0 8px 0',
              }}
            >
              Select an option:
            </p>

            {/* Option 1: Bring Your Own */}
            <div
              style={{
                padding: '16px',
                border: `2px solid ${apiKeyMode() === 'bring-your-own' ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                'border-radius': tempoDesign.radius.lg,
                cursor: 'pointer',
                background:
                  apiKeyMode() === 'bring-your-own'
                    ? `${tempoDesign.colors.primary}08`
                    : 'transparent',
                transition: 'all 0.2s ease-out',
              }}
              onClick={() => {
                setApiKeyMode('bring-your-own');
                setError(null);
              }}
            >
              <div
                style={{
                  display: 'flex',
                  'align-items': 'flex-start',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    'border-radius': '50%',
                    border: `2px solid ${apiKeyMode() === 'bring-your-own' ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'flex-shrink': 0,
                    'margin-top': '2px',
                  }}
                >
                  {apiKeyMode() === 'bring-your-own' && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        'border-radius': '50%',
                        background: tempoDesign.colors.primary,
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '6px',
                      'margin-bottom': '4px',
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        'font-size': tempoDesign.typography.sizes.base,
                        'font-weight': tempoDesign.typography.weights.medium,
                        color: tempoDesign.colors.foreground,
                      }}
                    >
                      Bring Your Own Key
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSecurityWarning(true);
                      }}
                      onMouseEnter={() => setIsViewRisksHovering(true)}
                      onMouseLeave={() => setIsViewRisksHovering(false)}
                      style={{
                        display: 'flex',
                        'align-items': 'center',
                        gap: '4px',
                        background: isViewRisksHovering()
                          ? `${tempoDesign.colors.destructive}15`
                          : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        'font-size': tempoDesign.typography.sizes.xs,
                        color: tempoDesign.colors.destructive,
                        padding: '2px 6px',
                        'border-radius': tempoDesign.radius.sm,
                        transition: 'all 0.2s ease-out',
                        transform: isViewRisksHovering() ? 'scale(1.05)' : 'scale(1)',
                        'box-shadow': isViewRisksHovering()
                          ? `0 0 8px ${tempoDesign.colors.destructive}40`
                          : 'none',
                      }}
                      title="Security Notice"
                    >
                      <Warning size={12} />
                      <span>View risks</span>
                    </button>
                  </div>
                  <p
                    style={{
                      margin: '0 0 8px 0',
                      'font-size': tempoDesign.typography.sizes.sm,
                      color: tempoDesign.colors.mutedForeground,
                    }}
                  >
                    Use your own Claude API key from Anthropic
                  </p>
                  <p
                    style={{
                      margin: 0,
                      'font-size': tempoDesign.typography.sizes.xs,
                      color: tempoDesign.colors.mutedForeground,
                    }}
                  >
                    Free • You manage costs
                  </p>
                </div>
              </div>
            </div>

            {/* Option 2: Tempo Extras */}
            <div
              style={{
                padding: '16px',
                border: `2px solid ${apiKeyMode() === 'managed' ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                'border-radius': tempoDesign.radius.lg,
                cursor: 'pointer',
                background:
                  apiKeyMode() === 'managed' ? `${tempoDesign.colors.primary}08` : 'transparent',
                transition: 'all 0.2s ease-out',
                position: 'relative',
              }}
              onClick={() => {
                setApiKeyMode('managed');
                setError(null);
              }}
            >
              {hasTempoExtras() && (
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    display: 'flex',
                    'align-items': 'center',
                    gap: '4px',
                    'font-size': tempoDesign.typography.sizes.xs,
                    'font-weight': tempoDesign.typography.weights.medium,
                    color: tempoDesign.colors.frog,
                  }}
                >
                  <Check size={14} />
                  <span>Active</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  'align-items': 'flex-start',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    'border-radius': '50%',
                    border: `2px solid ${apiKeyMode() === 'managed' ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'flex-shrink': 0,
                    'margin-top': '2px',
                  }}
                >
                  {apiKeyMode() === 'managed' && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        'border-radius': '50%',
                        background: tempoDesign.colors.primary,
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '6px',
                      'margin-bottom': '4px',
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        'font-size': tempoDesign.typography.sizes.base,
                        'font-weight': tempoDesign.typography.weights.medium,
                        color: tempoDesign.colors.foreground,
                      }}
                    >
                      Tempo Extras
                    </h3>
                    <Star size={14} weight="fill" style={{ color: tempoDesign.colors.primary }} />
                  </div>
                  <p
                    style={{
                      margin: '0 0 8px 0',
                      'font-size': tempoDesign.typography.sizes.sm,
                      color: tempoDesign.colors.mutedForeground,
                    }}
                  >
                    Unlimited AI features with our managed service
                  </p>
                  <p
                    style={{
                      margin: 0,
                      'font-size': tempoDesign.typography.sizes.xs,
                      color: tempoDesign.colors.mutedForeground,
                    }}
                  >
                    $12/month • No API key needed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bring Your Own - API Key Input */}
          <Show when={apiKeyMode() === 'bring-your-own'}>
            <div
              style={{
                display: 'flex',
                'flex-direction': 'column',
                gap: '8px',
                'padding-top': '8px',
              }}
            >
              <label
                style={{
                  'font-size': tempoDesign.typography.sizes.sm,
                  'font-weight': tempoDesign.typography.weights.medium,
                  color: tempoDesign.colors.foreground,
                }}
              >
                Claude API Key
              </label>
              <Input
                type="password"
                placeholder="sk-ant-..."
                value={apiKey()}
                onInput={(e) => {
                  setApiKey(e.currentTarget.value);
                  setError(null);
                }}
                disabled={isSaving()}
                style={{
                  width: '100%',
                  'font-size': tempoDesign.typography.sizes.sm,
                }}
              />
              <p
                style={{
                  'font-size': tempoDesign.typography.sizes.xs,
                  color: tempoDesign.colors.mutedForeground,
                  margin: '4px 0 0 0',
                }}
              >
                Get your key from{' '}
                <a
                  href="https://console.anthropic.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: tempoDesign.colors.primary,
                    'text-decoration': 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Anthropic Console
                </a>
              </p>
            </div>
          </Show>

          {/* Tempo Extras - Info and CTA */}
          <Show when={apiKeyMode() === 'managed'}>
            <div
              style={{
                display: 'flex',
                'flex-direction': 'column',
                gap: '12px',
                'padding-top': '8px',
              }}
            >
              <Show when={!hasTempoExtras()}>
                {/* Simplified sales pitch for non-subscribers */}
                <div
                  style={{
                    'background-color': `${tempoDesign.colors.primary}10`,
                    border: `1px solid ${tempoDesign.colors.primary}30`,
                    'border-radius': tempoDesign.radius.lg,
                    padding: '16px',
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.foreground,
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 12px 0',
                      color: tempoDesign.colors.mutedForeground,
                    }}
                  >
                    Unlimited AI features without managing API keys.
                  </p>
                  <p
                    style={{
                      margin: '0 0 16px 0',
                      'font-weight': tempoDesign.typography.weights.semibold,
                      color: tempoDesign.colors.foreground,
                    }}
                  >
                    $12/month
                  </p>
                  <Button
                    onClick={() => {
                      window.location.href = '/pricing#tempo-extras';
                    }}
                    style={{
                      width: '100%',
                      'font-weight': tempoDesign.typography.weights.semibold,
                    }}
                  >
                    Subscribe
                  </Button>
                </div>
              </Show>

              <Show when={hasTempoExtras()}>
                {/* Active subscription confirmation */}
                <div
                  style={{
                    'background-color': `${tempoDesign.colors.frog}10`,
                    border: `1px solid ${tempoDesign.colors.frog}30`,
                    'border-radius': tempoDesign.radius.lg,
                    padding: '12px',
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.frog,
                    display: 'flex',
                    gap: '8px',
                    'align-items': 'flex-start',
                  }}
                >
                  <Check size={16} style={{ 'flex-shrink': 0, 'margin-top': '2px' }} />
                  <div>
                    <p style={{ margin: '0 0 2px 0', 'font-weight': 'bold' }}>
                      Tempo Extras Active
                    </p>
                    <p style={{ margin: 0, 'font-size': tempoDesign.typography.sizes.xs }}>
                      You have full access to all AI features. No API key needed - we handle
                      everything for you.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    'background-color': `${tempoDesign.colors.primary}10`,
                    border: `1px solid ${tempoDesign.colors.primary}30`,
                    'border-radius': tempoDesign.radius.lg,
                    padding: '12px',
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.foreground,
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', 'align-items': 'flex-start' }}>
                    <Star
                      size={16}
                      weight="fill"
                      style={{
                        'flex-shrink': 0,
                        'margin-top': '2px',
                        color: tempoDesign.colors.primary,
                      }}
                    />
                    <div>
                      <p style={{ margin: '0 0 4px 0', 'font-weight': 'bold' }}>Your Benefits</p>
                      <ul
                        style={{
                          margin: 0,
                          'padding-left': '16px',
                          'font-size': tempoDesign.typography.sizes.xs,
                          color: tempoDesign.colors.mutedForeground,
                        }}
                      >
                        <li>Unlimited brain dump processing</li>
                        <li>AI task refinement & prioritization</li>
                        <li>Smart scheduling suggestions</li>
                        <li>No API key management</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Show>
            </div>
          </Show>

          {/* Error Message */}
          <Show when={error()}>
            <div
              style={{
                display: 'flex',
                'align-items': 'flex-start',
                gap: '8px',
                'background-color': `${tempoDesign.colors.destructive}10`,
                border: `1px solid ${tempoDesign.colors.destructive}30`,
                'border-radius': tempoDesign.radius.lg,
                padding: '12px',
                'font-size': tempoDesign.typography.sizes.sm,
                color: tempoDesign.colors.destructive,
              }}
            >
              <Warning size={16} style={{ 'flex-shrink': 0, 'margin-top': '2px' }} />
              <span>{error()}</span>
            </div>
          </Show>

          {/* Success Message */}
          <Show when={success()}>
            <div
              style={{
                display: 'flex',
                'align-items': 'flex-start',
                gap: '8px',
                'background-color': `${tempoDesign.colors.frog}10`,
                border: `1px solid ${tempoDesign.colors.frog}30`,
                'border-radius': tempoDesign.radius.lg,
                padding: '12px',
                'font-size': tempoDesign.typography.sizes.sm,
                color: tempoDesign.colors.frog,
              }}
            >
              <span>✓ Configuration saved successfully!</span>
            </div>
          </Show>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '20px',
            'border-top': `1px solid ${tempoDesign.colors.border}`,
            'justify-content': 'flex-end',
            'flex-shrink': 0,
          }}
        >
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving()}
            style={{ 'min-width': '80px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={(apiKeyMode() === 'bring-your-own' && !apiKey().trim()) || isSaving()}
            style={{ 'min-width': '80px' }}
          >
            {isSaving() ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Show>
  );
};

// Export legacy name for backward compatibility
export const SettingsModal = SettingsSidebar;
