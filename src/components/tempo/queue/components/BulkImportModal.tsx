/**
 * BulkImportModal - Import multiple tasks by pasting a list
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { X, Upload, Lightning } from 'phosphor-solid';
import { tempoDesign } from '../../theme/tempo-design';
import type { TaskPriority } from '../../lib/types';
import { PRIORITY_CONFIG, PRIORITY_ORDER } from '../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (lines: string[], defaultPriority: TaskPriority) => Promise<number>;
}

export const BulkImportModal: Component<BulkImportModalProps> = (props) => {
  const [text, setText] = createSignal('');
  const [defaultPriority, setDefaultPriority] = createSignal<TaskPriority>('medium');
  const [isImporting, setIsImporting] = createSignal(false);
  const [result, setResult] = createSignal<{ count: number } | null>(null);

  const lineCount = () => {
    const lines = text()
      .split('\n')
      .filter((l) => l.trim());
    return lines.length;
  };

  const handleImport = async () => {
    if (lineCount() === 0 || isImporting()) return;

    setIsImporting(true);
    setResult(null);

    try {
      const lines = text()
        .split('\n')
        .filter((l) => l.trim());
      const count = await props.onImport(lines, defaultPriority());
      setResult({ count });

      // Clear form after successful import
      setTimeout(() => {
        setText('');
        setResult(null);
        props.onClose();
      }, 1500);
    } catch {
      // Error handled by parent
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (isImporting()) return;
    setText('');
    setResult(null);
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
          'z-index': 50,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          padding: '24px',
        }}
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            'max-width': '560px',
            background: tempoDesign.colors.card,
            'border-radius': tempoDesign.radius.xl,
            border: `1px solid ${tempoDesign.colors.cardBorder}`,
            'box-shadow': tempoDesign.shadows.lg,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
              padding: '20px 24px',
              'border-bottom': `1px solid ${tempoDesign.colors.border}`,
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  'border-radius': tempoDesign.radius.lg,
                  background: `${tempoDesign.colors.primary}15`,
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                }}
              >
                <Upload size={20} color={tempoDesign.colors.primary} />
              </div>
              <div>
                <h2
                  style={{
                    margin: 0,
                    'font-size': tempoDesign.typography.sizes.lg,
                    'font-weight': tempoDesign.typography.weights.semibold,
                    color: tempoDesign.colors.foreground,
                  }}
                >
                  Bulk Import
                </h2>
                <p
                  style={{
                    margin: 0,
                    'font-size': tempoDesign.typography.sizes.xs,
                    color: tempoDesign.colors.mutedForeground,
                  }}
                >
                  Paste multiple tasks, one per line
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={isImporting()}
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                width: '36px',
                height: '36px',
                'border-radius': tempoDesign.radius.full,
                border: 'none',
                background: 'transparent',
                color: tempoDesign.colors.mutedForeground,
                cursor: isImporting() ? 'not-allowed' : 'pointer',
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {/* Textarea */}
            <textarea
              placeholder={`Paste your tasks here, one per line:

Review quarterly report - 45m
Send client proposal FROG
Update documentation - 1h
Schedule team sync - 15m
Fix login bug`}
              value={text()}
              onInput={(e) => setText(e.currentTarget.value)}
              disabled={isImporting()}
              style={{
                width: '100%',
                'min-height': '200px',
                padding: '16px',
                'border-radius': tempoDesign.radius.lg,
                border: `1px solid ${tempoDesign.colors.input}`,
                background: tempoDesign.colors.background,
                color: tempoDesign.colors.foreground,
                'font-size': tempoDesign.typography.sizes.sm,
                'font-family': tempoDesign.typography.monoFamily,
                'line-height': '1.6',
                resize: 'vertical',
                outline: 'none',
              }}
            />

            {/* Tips */}
            <div
              style={{
                'margin-top': '12px',
                padding: '12px 16px',
                'border-radius': tempoDesign.radius.md,
                background: tempoDesign.colors.muted,
                'font-size': tempoDesign.typography.sizes.xs,
                color: tempoDesign.colors.mutedForeground,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '6px',
                  'margin-bottom': '8px',
                }}
              >
                <Lightning size={14} color={tempoDesign.colors.primary} />
                <span style={{ 'font-weight': '500', color: tempoDesign.colors.foreground }}>
                  Parsing Tips
                </span>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', 'line-height': '1.6' }}>
                <li>Add duration: "Task name - 30m" or "Task name (1h)"</li>
                <li>Mark as frog: Include "FROG" anywhere in the line</li>
                <li>Empty lines are ignored</li>
              </ul>
            </div>

            {/* Options row */}
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
                'margin-top': '16px',
              }}
            >
              {/* Default priority */}
              <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                <span
                  style={{
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.mutedForeground,
                  }}
                >
                  Default priority:
                </span>
                <select
                  value={defaultPriority()}
                  onChange={(e) => setDefaultPriority(e.currentTarget.value as TaskPriority)}
                  disabled={isImporting()}
                  style={{
                    padding: '6px 10px',
                    'border-radius': tempoDesign.radius.sm,
                    border: `1px solid ${tempoDesign.colors.input}`,
                    background: tempoDesign.colors.background,
                    color: tempoDesign.colors.foreground,
                    'font-size': tempoDesign.typography.sizes.sm,
                    'font-family': tempoDesign.typography.fontFamily,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {PRIORITY_ORDER.map((p) => (
                    <option value={p}>{PRIORITY_CONFIG[p].label}</option>
                  ))}
                </select>
              </div>

              {/* Line count */}
              <span
                style={{
                  'font-size': tempoDesign.typography.sizes.sm,
                  color: tempoDesign.colors.mutedForeground,
                }}
              >
                {lineCount()} {lineCount() === 1 ? 'task' : 'tasks'}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'flex-end',
              gap: '12px',
              padding: '16px 24px',
              'border-top': `1px solid ${tempoDesign.colors.border}`,
              background: tempoDesign.colors.muted,
            }}
          >
            <Show when={result()}>
              <span
                style={{
                  'font-size': tempoDesign.typography.sizes.sm,
                  color: tempoDesign.colors.frog,
                  'font-weight': '500',
                }}
              >
                Added {result()!.count} tasks!
              </span>
            </Show>

            <button
              type="button"
              onClick={handleClose}
              disabled={isImporting()}
              style={{
                padding: '10px 20px',
                'border-radius': tempoDesign.radius.md,
                border: `1px solid ${tempoDesign.colors.border}`,
                background: 'transparent',
                color: tempoDesign.colors.foreground,
                'font-size': tempoDesign.typography.sizes.sm,
                'font-weight': '500',
                cursor: isImporting() ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleImport}
              disabled={lineCount() === 0 || isImporting()}
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
                padding: '10px 20px',
                'border-radius': tempoDesign.radius.md,
                border: 'none',
                background: tempoDesign.colors.primary,
                color: tempoDesign.colors.primaryForeground,
                'font-size': tempoDesign.typography.sizes.sm,
                'font-weight': '500',
                cursor: lineCount() === 0 || isImporting() ? 'not-allowed' : 'pointer',
                opacity: lineCount() === 0 || isImporting() ? 0.5 : 1,
              }}
            >
              <Upload size={16} />
              {isImporting() ? 'Importing...' : 'Import Tasks'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
