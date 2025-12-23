/**
 * SyncSettings - Cross-device sync via export/import
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { pipelineStore } from '../store';
import { liquidTenure, pipelineAnimations } from '../theme/liquid-tenure';
import { FluidCard } from '../ui';
import {
  IconSync,
  IconUpload,
  IconDownload,
  IconKey,
  IconCheck,
  IconX,
  IconCopy,
  IconSettings,
} from '../ui/Icons';

interface SyncSettingsProps {
  currentTheme: () => Partial<typeof liquidTenure> & typeof liquidTenure;
}

export const SyncSettings: Component<SyncSettingsProps> = (props) => {
  const theme = () => props.currentTheme();
  const settings = () => pipelineStore.state.settings;

  const [syncCode, setSyncCode] = createSignal('');
  const [importCode, setImportCode] = createSignal('');
  const [copySuccess, setCopySuccess] = createSignal(false);
  const [importSuccess, setImportSuccess] = createSignal(false);
  const [importError, setImportError] = createSignal<string | null>(null);

  // API Config state
  const [apiKey, setApiKey] = createSignal(settings().apiKey || '');
  const [apiMode, setApiMode] = createSignal(settings().apiMode);
  const [defaultLandingTab, setDefaultLandingTab] = createSignal<
    'discover' | 'prepare' | 'prospect' | 'prosper'
  >(settings().defaultLandingTab || 'discover');

  const inputStyle = () => ({
    width: '100%',
    padding: '12px 16px',
    background: theme().colors.background,
    border: `1px solid ${theme().colors.border}`,
    'border-radius': '10px',
    color: theme().colors.text,
    'font-size': '14px',
    outline: 'none',
    transition: `border-color ${pipelineAnimations.fast}`,
    'box-sizing': 'border-box' as const,
  });

  const labelStyle = () => ({
    display: 'block',
    'margin-bottom': '6px',
    'font-size': '13px',
    'font-weight': '500',
    color: theme().colors.textMuted,
  });

  const handleGenerateSyncCode = () => {
    const code = pipelineStore.generateSyncCode();
    setSyncCode(code);
  };

  const handleCopySyncCode = async () => {
    try {
      await navigator.clipboard.writeText(syncCode());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = syncCode();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleExportToFile = () => {
    const data = pipelineStore.exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFromCode = () => {
    setImportError(null);
    try {
      pipelineStore.importFromSyncCode(importCode());
      setImportSuccess(true);
      setImportCode('');
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (e) {
      setImportError((e as Error).message || 'Failed to import sync code');
    }
  };

  const handleImportFromFile = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        pipelineStore.importData(data);
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch (e) {
        setImportError((e as Error).message || 'Failed to import file');
      }
    };
    reader.readAsText(file);
    input.value = '';
  };

  const handleSaveApiConfig = () => {
    pipelineStore.updateSettings({
      apiMode: apiMode(),
      apiKey: apiMode() === 'byok' ? apiKey() : undefined,
    });
  };

  const stats = () => ({
    applications: pipelineStore.state.applications.length,
    hasProfile: !!pipelineStore.state.profile,
    lastSync: settings().lastSyncAt,
  });

  return (
    <div style={{ 'max-width': '600px' }}>
      {/* Sync Status */}
      <FluidCard style={{ 'margin-bottom': '24px' }}>
        <h3
          style={{
            margin: '0 0 16px',
            'font-size': '18px',
            'font-family': "'Playfair Display', Georgia, serif",
            'font-weight': '600',
            color: theme().colors.text,
            display: 'flex',
            'align-items': 'center',
            gap: '10px',
          }}
        >
          <IconSync size={20} color={theme().colors.primary} /> Sync Status
        </h3>

        <div style={{ display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)', gap: '16px' }}>
          <div
            style={{
              padding: '16px',
              background: theme().colors.surfaceLight,
              'border-radius': '12px',
              'text-align': 'center',
            }}
          >
            <div
              style={{
                'font-size': '24px',
                'font-family': "'Playfair Display', Georgia, serif",
                'font-weight': '700',
                color: theme().colors.primary,
              }}
            >
              {stats().applications}
            </div>
            <div
              style={{
                'font-size': '11px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'text-transform': 'uppercase',
                'letter-spacing': '0.05em',
                color: theme().colors.textMuted,
                'margin-top': '4px',
              }}
            >
              Applications
            </div>
          </div>
          <div
            style={{
              padding: '16px',
              background: theme().colors.surfaceLight,
              'border-radius': '12px',
              'text-align': 'center',
              display: 'flex',
              'flex-direction': 'column',
              'align-items': 'center',
              'justify-content': 'center',
            }}
          >
            <div style={{ 'margin-bottom': '4px' }}>
              {stats().hasProfile ? (
                <IconCheck size={22} color="#10B981" />
              ) : (
                <IconX size={22} color="#EF4444" />
              )}
            </div>
            <div
              style={{
                'font-size': '11px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'text-transform': 'uppercase',
                'letter-spacing': '0.05em',
                color: theme().colors.textMuted,
              }}
            >
              Profile
            </div>
          </div>
          <div
            style={{
              padding: '16px',
              background: theme().colors.surfaceLight,
              'border-radius': '12px',
              'text-align': 'center',
            }}
          >
            <div
              style={{
                'font-size': '14px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                color: theme().colors.text,
                'font-weight': '500',
              }}
            >
              {stats().lastSync ? new Date(stats().lastSync!).toLocaleDateString() : 'Never'}
            </div>
            <div
              style={{
                'font-size': '11px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'text-transform': 'uppercase',
                'letter-spacing': '0.05em',
                color: theme().colors.textMuted,
                'margin-top': '4px',
              }}
            >
              Last Sync
            </div>
          </div>
        </div>
      </FluidCard>

      {/* Export Section */}
      <FluidCard style={{ 'margin-bottom': '24px' }}>
        <h4
          style={{
            margin: '0 0 12px',
            'font-size': '16px',
            'font-family': "'Playfair Display', Georgia, serif",
            'font-weight': '600',
            color: theme().colors.text,
            display: 'flex',
            'align-items': 'center',
            gap: '10px',
          }}
        >
          <IconUpload size={18} color={theme().colors.primary} /> Export Data
        </h4>
        <p
          style={{
            margin: '0 0 16px',
            'font-size': '13px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: theme().colors.textMuted,
            'line-height': '1.5',
          }}
        >
          Export your data to transfer to another device. Choose between a sync code (copy-paste) or
          a JSON file download.
        </p>

        <div style={{ display: 'flex', gap: '12px', 'margin-bottom': '16px' }}>
          <button
            class="pipeline-btn"
            onClick={handleGenerateSyncCode}
            style={{
              flex: 1,
              padding: '12px',
              background: '#0A0A0A',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              'border-radius': '10px',
              color: '#FFFFFF',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              cursor: 'pointer',
              'font-weight': '500',
            }}
          >
            Generate Sync Code
          </button>
          <button
            class="pipeline-btn"
            onClick={handleExportToFile}
            style={{
              flex: 1,
              padding: '12px',
              background: '#0A0A0A',
              border: '2px solid #FFFFFF',
              'border-radius': '10px',
              color: '#FFFFFF',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              cursor: 'pointer',
              'font-weight': '600',
            }}
          >
            Download JSON
          </button>
        </div>

        <Show when={syncCode()}>
          <div style={{ 'margin-top': '16px' }}>
            <label style={labelStyle()}>Your Sync Code</label>
            <div style={{ position: 'relative' }}>
              <textarea
                value={syncCode()}
                readonly
                rows={4}
                style={{
                  ...inputStyle(),
                  'font-family': 'monospace',
                  'font-size': '11px',
                  resize: 'none',
                }}
              />
              <button
                onClick={handleCopySyncCode}
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '6px',
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  padding: '6px 12px',
                  background: copySuccess() ? '#10B981' : theme().colors.primary,
                  border: 'none',
                  'border-radius': '6px',
                  color: 'white',
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  cursor: 'pointer',
                  'font-size': '12px',
                }}
              >
                {copySuccess() ? (
                  <>
                    <IconCheck size={12} /> Copied
                  </>
                ) : (
                  <>
                    <IconCopy size={12} /> Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </Show>
      </FluidCard>

      {/* Import Section */}
      <FluidCard style={{ 'margin-bottom': '24px' }}>
        <h4
          style={{
            margin: '0 0 12px',
            'font-size': '16px',
            'font-family': "'Playfair Display', Georgia, serif",
            'font-weight': '600',
            color: theme().colors.text,
            display: 'flex',
            'align-items': 'center',
            gap: '10px',
          }}
        >
          <IconDownload size={18} color={theme().colors.primary} /> Import Data
        </h4>
        <p
          style={{
            margin: '0 0 16px',
            'font-size': '13px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: theme().colors.textMuted,
            'line-height': '1.5',
          }}
        >
          Import data from another device. Existing data will be merged (newer entries win).
        </p>

        <Show when={importSuccess()}>
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '10px',
              padding: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              'border-radius': '8px',
              color: '#10B981',
              'margin-bottom': '16px',
              'font-size': '14px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
            }}
          >
            <IconCheck size={16} color="#10B981" /> Data imported successfully!
          </div>
        </Show>

        <Show when={importError()}>
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '10px',
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              'border-radius': '8px',
              color: '#EF4444',
              'margin-bottom': '16px',
              'font-size': '14px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
            }}
          >
            <IconX size={16} color="#EF4444" /> {importError()}
          </div>
        </Show>

        <div style={{ 'margin-bottom': '16px' }}>
          <label style={labelStyle()}>Paste Sync Code</label>
          <textarea
            value={importCode()}
            onInput={(e) => setImportCode(e.currentTarget.value)}
            placeholder="Paste sync code from another device..."
            rows={4}
            style={{
              ...inputStyle(),
              'font-family': 'monospace',
              'font-size': '11px',
              resize: 'none',
            }}
          />
          <button
            class="pipeline-btn"
            onClick={handleImportFromCode}
            disabled={!importCode()}
            style={{
              'margin-top': '8px',
              padding: '10px 20px',
              background: '#0A0A0A',
              border: importCode() ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.2)',
              'border-radius': '8px',
              color: '#FFFFFF',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              cursor: importCode() ? 'pointer' : 'not-allowed',
              'font-weight': '500',
              opacity: importCode() ? 1 : 0.5,
            }}
          >
            Import from Code
          </button>
        </div>

        <div
          style={{
            'border-top': `1px solid ${theme().colors.border}`,
            'padding-top': '16px',
          }}
        >
          <label style={labelStyle()}>Or Import JSON File</label>
          <input
            type="file"
            accept=".json"
            onChange={handleImportFromFile}
            style={{
              ...inputStyle(),
              padding: '10px',
              cursor: 'pointer',
            }}
          />
        </div>
      </FluidCard>

      {/* Default Landing Tab */}
      <FluidCard style={{ 'margin-bottom': '24px' }}>
        <h4
          style={{
            margin: '0 0 12px',
            'font-size': '16px',
            'font-family': "'Playfair Display', Georgia, serif",
            'font-weight': '600',
            color: theme().colors.text,
            display: 'flex',
            'align-items': 'center',
            gap: '10px',
          }}
        >
          <IconSettings size={18} color={theme().colors.primary} /> Default Landing Tab
        </h4>
        <p
          style={{
            margin: '0 0 16px',
            'font-size': '13px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: theme().colors.textMuted,
            'line-height': '1.5',
          }}
        >
          Choose which tab to show when you open Tenure.
        </p>

        <div style={{ display: 'flex', gap: '8px', 'flex-wrap': 'wrap' }}>
          <button
            class="pipeline-btn"
            onClick={() => {
              setDefaultLandingTab('discover');
              pipelineStore.updateSettings({ defaultLandingTab: 'discover' });
            }}
            style={{
              flex: 1,
              'min-width': '100px',
              padding: '12px',
              background: '#0A0A0A',
              border:
                defaultLandingTab() === 'discover'
                  ? '2px solid #FFFFFF'
                  : '1px solid rgba(255, 255, 255, 0.3)',
              'border-radius': '10px',
              color: '#FFFFFF',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'font-weight': defaultLandingTab() === 'discover' ? '600' : '400',
              opacity: defaultLandingTab() === 'discover' ? 1 : 0.7,
              cursor: 'pointer',
            }}
          >
            Discover
          </button>
          <button
            class="pipeline-btn"
            onClick={() => {
              setDefaultLandingTab('prepare');
              pipelineStore.updateSettings({ defaultLandingTab: 'prepare' });
            }}
            style={{
              flex: 1,
              'min-width': '100px',
              padding: '12px',
              background: '#0A0A0A',
              border:
                defaultLandingTab() === 'prepare'
                  ? '2px solid #FFFFFF'
                  : '1px solid rgba(255, 255, 255, 0.3)',
              'border-radius': '10px',
              color: '#FFFFFF',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'font-weight': defaultLandingTab() === 'prepare' ? '600' : '400',
              opacity: defaultLandingTab() === 'prepare' ? 1 : 0.7,
              cursor: 'pointer',
            }}
          >
            Prepare
          </button>
          <button
            class="pipeline-btn"
            onClick={() => {
              setDefaultLandingTab('prospect');
              pipelineStore.updateSettings({ defaultLandingTab: 'prospect' });
            }}
            style={{
              flex: 1,
              'min-width': '100px',
              padding: '12px',
              background: '#0A0A0A',
              border:
                defaultLandingTab() === 'prospect'
                  ? '2px solid #FFFFFF'
                  : '1px solid rgba(255, 255, 255, 0.3)',
              'border-radius': '10px',
              color: '#FFFFFF',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'font-weight': defaultLandingTab() === 'prospect' ? '600' : '400',
              opacity: defaultLandingTab() === 'prospect' ? 1 : 0.7,
              cursor: 'pointer',
            }}
          >
            Prospect
          </button>
          <button
            class="pipeline-btn"
            onClick={() => {
              setDefaultLandingTab('prosper');
              pipelineStore.updateSettings({ defaultLandingTab: 'prosper' });
            }}
            style={{
              flex: 1,
              'min-width': '100px',
              padding: '12px',
              background: '#0A0A0A',
              border:
                defaultLandingTab() === 'prosper'
                  ? '2px solid #FFFFFF'
                  : '1px solid rgba(255, 255, 255, 0.3)',
              'border-radius': '10px',
              color: '#FFFFFF',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'font-weight': defaultLandingTab() === 'prosper' ? '600' : '400',
              opacity: defaultLandingTab() === 'prosper' ? 1 : 0.7,
              cursor: 'pointer',
            }}
          >
            Prosper
          </button>
        </div>
      </FluidCard>

      {/* API Configuration */}
      <FluidCard>
        <h4
          style={{
            margin: '0 0 12px',
            'font-size': '16px',
            'font-family': "'Playfair Display', Georgia, serif",
            'font-weight': '600',
            color: theme().colors.text,
            display: 'flex',
            'align-items': 'center',
            gap: '10px',
          }}
        >
          <IconKey size={18} color={theme().colors.primary} /> API Configuration
        </h4>
        <p
          style={{
            margin: '0 0 16px',
            'font-size': '13px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: theme().colors.textMuted,
            'line-height': '1.5',
          }}
        >
          Configure AI analysis. Bring your own API key or use our managed service.
        </p>

        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              class="pipeline-btn"
              onClick={() => setApiMode('none')}
              style={{
                flex: 1,
                padding: '12px',
                background: '#0A0A0A',
                border:
                  apiMode() === 'none' ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.3)',
                'border-radius': '10px',
                color: '#FFFFFF',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'font-weight': apiMode() === 'none' ? '600' : '400',
                opacity: apiMode() === 'none' ? 1 : 0.7,
                cursor: 'pointer',
              }}
            >
              No AI
            </button>
            <button
              class="pipeline-btn"
              onClick={() => setApiMode('byok')}
              style={{
                flex: 1,
                padding: '12px',
                background: '#0A0A0A',
                border:
                  apiMode() === 'byok' ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.3)',
                'border-radius': '10px',
                color: '#FFFFFF',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'font-weight': apiMode() === 'byok' ? '600' : '400',
                opacity: apiMode() === 'byok' ? 1 : 0.7,
                cursor: 'pointer',
              }}
            >
              Your API Key
            </button>
            <button
              class="pipeline-btn"
              onClick={() => setApiMode('managed')}
              style={{
                flex: 1,
                padding: '12px',
                background: '#0A0A0A',
                border:
                  apiMode() === 'managed'
                    ? '2px solid #FFFFFF'
                    : '1px solid rgba(255, 255, 255, 0.3)',
                'border-radius': '10px',
                color: '#FFFFFF',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'font-weight': apiMode() === 'managed' ? '600' : '400',
                opacity: apiMode() === 'managed' ? 1 : 0.7,
                cursor: 'pointer',
              }}
            >
              Managed
            </button>
          </div>

          <Show when={apiMode() === 'byok'}>
            <div>
              <label style={labelStyle()}>Anthropic API Key</label>
              <input
                type="password"
                value={apiKey()}
                onInput={(e) => setApiKey(e.currentTarget.value)}
                placeholder="sk-ant-..."
                style={inputStyle()}
              />
            </div>
          </Show>

          <Show when={apiMode() === 'managed'}>
            <div
              style={{
                padding: '16px',
                background: theme().colors.surfaceLight,
                'border-radius': '12px',
                'text-align': 'center',
              }}
            >
              <div style={{ 'font-size': '14px', color: theme().colors.textMuted }}>
                Managed API coming soon! For now, use your own API key.
              </div>
            </div>
          </Show>

          <button
            class="pipeline-btn"
            onClick={handleSaveApiConfig}
            style={{
              padding: '12px',
              background: '#0A0A0A',
              border: '2px solid #FFFFFF',
              'border-radius': '10px',
              color: '#FFFFFF',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              cursor: 'pointer',
              'font-weight': '600',
            }}
          >
            Save API Settings
          </button>
        </div>
      </FluidCard>
    </div>
  );
};

export default SyncSettings;
