/**
 * Paper Trail - Settings Modal
 * Optional AI configuration for enhanced entity extraction
 * News is fetched server-side - no user API keys needed!
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { papertrail, yellowScale, motionTokens } from '../../../theme/papertrail';
import { AI_PRESETS } from '../../../schemas/papertrail.schema';
import { ApiConfigService } from '../services/api-config.service';
import { Button } from './button';
import { Input } from './input';
import { Select } from './select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const SettingsModal: Component<SettingsModalProps> = (props) => {
  const existingConfig = ApiConfigService.getConfig();

  // Form state
  const [aiEnabled, setAiEnabled] = createSignal(existingConfig?.aiEnabled || false);
  const [aiPreset, setAiPreset] = createSignal('anthropic');
  const [aiBaseUrl, setAiBaseUrl] = createSignal(
    existingConfig?.aiBaseUrl || AI_PRESETS.anthropic.baseUrl
  );
  const [aiApiKey, setAiApiKey] = createSignal(existingConfig?.aiApiKey || '');
  const [aiModel, setAiModel] = createSignal(
    existingConfig?.aiModel || AI_PRESETS.anthropic.models[0]
  );

  // UI state
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal(false);

  const aiPresetOptions = Object.entries(AI_PRESETS).map(([id, info]) => ({
    value: id,
    label: info.name,
  }));

  const handlePresetChange = (presetId: string) => {
    setAiPreset(presetId);
    const preset = AI_PRESETS[presetId];
    if (preset) {
      setAiBaseUrl(preset.baseUrl);
      setAiModel(preset.models[0]);
    }
  };

  const handleSave = () => {
    setError(null);
    setSuccess(false);

    try {
      // Save AI config if enabled
      if (aiEnabled()) {
        if (!aiApiKey().trim()) {
          setError('Please enter your AI API key or disable AI');
          return;
        }
        ApiConfigService.setAIConfig(true, aiBaseUrl(), aiApiKey(), aiModel());
      } else {
        ApiConfigService.setAIConfig(false);
      }

      setSuccess(true);
      setTimeout(() => {
        props.onClose();
        props.onSave?.();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    props.onClose();
  };

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
          background: 'rgba(0, 0, 0, 0.6)',
          'z-index': 100,
          animation: `fadeIn ${motionTokens.duration.fast} ${motionTokens.easing.enter}`,
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
          'z-index': 101,
          width: '100%',
          'max-width': '560px',
          'max-height': '90vh',
          'overflow-y': 'auto',
          animation: `slideUp ${motionTokens.duration.normal} ${motionTokens.easing.enter}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card>
          <CardHeader
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
            }}
          >
            <div>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure AI for enhanced entity extraction</CardDescription>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                color: papertrail.colors.textMuted,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </CardHeader>

          <CardContent>
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '20px' }}>
              {/* Enable Toggle */}
              <label
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '12px 16px',
                  background: aiEnabled() ? yellowScale[50] : papertrail.colors.background,
                  border: `1px solid ${aiEnabled() ? yellowScale[400] : papertrail.colors.border}`,
                  'border-radius': papertrail.radii.organic,
                }}
              >
                <input
                  type="checkbox"
                  checked={aiEnabled()}
                  onChange={(e) => setAiEnabled(e.currentTarget.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <div>
                  <p style={{ margin: 0, 'font-weight': 600, color: papertrail.colors.text }}>
                    Enable AI Entity Extraction
                  </p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      'font-size': '13px',
                      color: papertrail.colors.textMuted,
                    }}
                  >
                    Uses your own AI API to extract people, organizations, and topics
                  </p>
                </div>
              </label>

              <Show when={aiEnabled()}>
                {/* AI Provider Preset */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      'margin-bottom': '8px',
                      'font-family': papertrail.fonts.heading,
                      'font-size': '13px',
                      'font-weight': 600,
                      color: papertrail.colors.text,
                    }}
                  >
                    AI Provider
                  </label>
                  <Select
                    value={aiPreset()}
                    options={aiPresetOptions}
                    onChange={handlePresetChange}
                  />
                </div>

                {/* Base URL */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      'margin-bottom': '8px',
                      'font-family': papertrail.fonts.heading,
                      'font-size': '13px',
                      'font-weight': 600,
                      color: papertrail.colors.text,
                    }}
                  >
                    Base URL
                  </label>
                  <Input
                    type="url"
                    value={aiBaseUrl()}
                    placeholder="https://api.anthropic.com/v1"
                    onInput={(e) => setAiBaseUrl(e.currentTarget.value)}
                  />
                </div>

                {/* API Key */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      'margin-bottom': '8px',
                      'font-family': papertrail.fonts.heading,
                      'font-size': '13px',
                      'font-weight': 600,
                      color: papertrail.colors.text,
                    }}
                  >
                    API Key
                  </label>
                  <Input
                    type="password"
                    value={aiApiKey()}
                    placeholder="sk-..."
                    onInput={(e) => setAiApiKey(e.currentTarget.value)}
                  />
                </div>

                {/* Model */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      'margin-bottom': '8px',
                      'font-family': papertrail.fonts.heading,
                      'font-size': '13px',
                      'font-weight': 600,
                      color: papertrail.colors.text,
                    }}
                  >
                    Model
                  </label>
                  <Input
                    type="text"
                    value={aiModel()}
                    placeholder="claude-3-haiku-20240307"
                    onInput={(e) => setAiModel(e.currentTarget.value)}
                  />
                </div>
              </Show>

              <Show when={!aiEnabled()}>
                <div
                  style={{
                    padding: '16px',
                    background: papertrail.colors.background,
                    border: `1px solid ${papertrail.colors.border}`,
                    'border-radius': papertrail.radii.organic,
                    'text-align': 'center',
                  }}
                >
                  <p style={{ margin: 0, color: papertrail.colors.textMuted, 'font-size': '13px' }}>
                    Without AI, Paper Trail uses simple keyword extraction for the graph.
                    <br />
                    You can enable AI anytime for better entity detection.
                  </p>
                </div>
              </Show>

              {/* Error */}
              <Show when={error()}>
                <div
                  style={{
                    padding: '12px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    'border-radius': papertrail.radii.organic,
                    color: '#DC2626',
                    'font-size': '13px',
                  }}
                >
                  {error()}
                </div>
              </Show>

              {/* Success */}
              <Show when={success()}>
                <div
                  style={{
                    padding: '12px',
                    background: '#F0FDF4',
                    border: '1px solid #86EFAC',
                    'border-radius': papertrail.radii.organic,
                    color: '#166534',
                    'font-size': '13px',
                  }}
                >
                  Settings saved!
                </div>
              </Show>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  'justify-content': 'flex-end',
                  'padding-top': '8px',
                }}
              >
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button variant="accent" onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, -45%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </Show>
  );
};
