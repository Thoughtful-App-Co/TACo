import { Component, createSignal, Show } from 'solid-js';
import { X, Warning, Check, Lock } from 'phosphor-solid';
import { Button } from './button';
import { Input } from './input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
import { tempoDesign } from '../theme/tempo-design';
import { ApiConfigService, type ApiKeyMode } from '../services/api-config.service';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const SettingsModal: Component<SettingsModalProps> = (props) => {
  const initialConfig = ApiConfigService.getConfig();
  const [apiKeyMode, setApiKeyMode] = createSignal<ApiKeyMode>(initialConfig.apiKeyMode);
  const [apiKey, setApiKey] = createSignal(initialConfig.claudeApiKey || '');
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);

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
        // For managed mode, just set the mode
        setIsSaving(true);
        ApiConfigService.setApiKeyMode('managed');
        // If not already subscribed, the user would need to complete payment
        // This is a placeholder for future Stripe integration
        if (!ApiConfigService.hasManagedSubscription()) {
          // TODO: Redirect to payment for managed API key service
        }
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

  return (
    <Show when={props.isOpen}>
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

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          'z-index': 51,
          width: '100%',
          'max-width': '600px',
          'max-height': '90vh',
          'overflow-y': 'auto',
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card
          style={{
            border: `1px solid ${tempoDesign.colors.border}`,
            'box-shadow': tempoDesign.shadows.lg,
          }}
        >
          {/* Header */}
          <CardHeader style={{ 'padding-bottom': '12px' }}>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
              }}
            >
              <CardTitle style={{ 'font-size': tempoDesign.typography.sizes.lg }}>
                API Configuration
              </CardTitle>
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
            <CardDescription style={{ 'margin-top': '8px' }}>
              Choose how you want to manage your Claude API key
            </CardDescription>
          </CardHeader>

          {/* Content */}
          <CardContent style={{ display: 'flex', 'flex-direction': 'column', gap: '20px' }}>
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
                    <h3
                      style={{
                        margin: '0 0 4px 0',
                        'font-size': tempoDesign.typography.sizes.base,
                        'font-weight': tempoDesign.typography.weights.medium,
                        color: tempoDesign.colors.foreground,
                      }}
                    >
                      Bring Your Own Key
                    </h3>
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

              {/* Option 2: Managed */}
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
                {isManagedActive && (
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
                    <h3
                      style={{
                        margin: '0 0 4px 0',
                        'font-size': tempoDesign.typography.sizes.base,
                        'font-weight': tempoDesign.typography.weights.medium,
                        color: tempoDesign.colors.foreground,
                      }}
                    >
                      Managed by Tempo
                    </h3>
                    <p
                      style={{
                        margin: '0 0 8px 0',
                        'font-size': tempoDesign.typography.sizes.sm,
                        color: tempoDesign.colors.mutedForeground,
                      }}
                    >
                      We handle the API key and billing for you
                    </p>
                    <p
                      style={{
                        margin: 0,
                        'font-size': tempoDesign.typography.sizes.xs,
                        color: tempoDesign.colors.mutedForeground,
                      }}
                    >
                      $3/month • No setup required
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
                  gap: '12px',
                  'padding-top': '8px',
                }}
              >
                {/* Info Box */}
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
                  <p style={{ margin: '0 0 8px 0', 'font-weight': 'bold' }}>📝 About API Keys</p>
                  <p style={{ margin: 0 }}>
                    Your API key is stored locally in your browser's localStorage. It's never sent
                    to our servers. Get your key from{' '}
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

                {/* API Key Input */}
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
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
                    Keep this private. Your key is never shared with third parties.
                  </p>
                </div>
              </div>
            </Show>

            {/* Managed - Info and CTA */}
            <Show when={apiKeyMode() === 'managed'}>
              <div
                style={{
                  display: 'flex',
                  'flex-direction': 'column',
                  gap: '12px',
                  'padding-top': '8px',
                }}
              >
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
                    <Lock size={16} style={{ 'flex-shrink': 0, 'margin-top': '2px' }} />
                    <div>
                      <p style={{ margin: '0 0 4px 0', 'font-weight': 'bold' }}>
                        Secure & Hassle-Free
                      </p>
                      <p style={{ margin: 0 }}>
                        We securely manage your API key. No setup required, and you only pay for
                        what you use (capped at $3/month).
                      </p>
                    </div>
                  </div>
                </div>

                <Show when={!isManagedActive}>
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
                    <p style={{ margin: 0 }}>
                      To activate managed API key service, you'll be directed to complete a one-time
                      setup and billing information.
                    </p>
                  </div>
                </Show>

                <Show when={isManagedActive}>
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
                        Subscription Active
                      </p>
                      <p style={{ margin: 0, 'font-size': tempoDesign.typography.sizes.xs }}>
                        Your managed API key service is active and ready to use.
                      </p>
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
          </CardContent>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '16px',
              'border-top': `1px solid ${tempoDesign.colors.border}`,
              'justify-content': 'flex-end',
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
        </Card>
      </div>
    </Show>
  );
};
