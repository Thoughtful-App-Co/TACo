/**
 * MutationResultsView - Display Mutation Results with Diff View
 *
 * Shows before/after comparison of resume mutations with accept/reject controls.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show, For } from 'solid-js';
import type { MutationResponse } from '../services/mutation.service';
import { IconEdit } from '../../pipeline/ui/Icons';
import { CheckIcon, ArrowRightIcon } from 'solid-phosphor/bold';

interface MutationResultsViewProps {
  mutation: MutationResponse;
  onAcceptAll: () => void;
  onSaveAsVariant: (name: string) => void;
  onClose: () => void;
  currentTheme: () => {
    colors: {
      primary: string;
      secondary: string;
      text: string;
      textMuted: string;
      textOnPrimary: string;
      background: string;
      surface: string;
      border: string;
      success: string;
      error: string;
    };
    fonts: {
      body: string;
      heading: string;
    };
    gradients: {
      primary: string;
    };
  };
}

export const MutationResultsView: Component<MutationResultsViewProps> = (props) => {
  const theme = () => props.currentTheme();
  const mutation = () => props.mutation;

  const [variantName, setVariantName] = createSignal('');
  const [showSaveModal, setShowSaveModal] = createSignal(false);
  const [acceptedChanges, setAcceptedChanges] = createSignal<Set<string>>(new Set());
  const [editingItems, setEditingItems] = createSignal<Set<string>>(new Set());
  const [editedValues, setEditedValues] = createSignal<Record<string, string>>({});

  const scoreImprovement = () => {
    const before = mutation().analysis.matchScoreBefore;
    const after = mutation().analysis.matchScoreAfter;
    return after - before;
  };

  const toggleAccept = (changeId: string) => {
    setAcceptedChanges((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(changeId)) {
        newSet.delete(changeId);
      } else {
        newSet.add(changeId);
      }
      return newSet;
    });
  };

  const isAccepted = (changeId: string) => acceptedChanges().has(changeId);

  const startEditing = (id: string) => {
    setEditingItems((prev) => new Set([...prev, id]));
    // Initialize with current value if not already edited
    if (!editedValues()[id]) {
      let value = '';
      if (id === 'summary') {
        value = mutation().mutations.summary?.mutated || '';
      } else if (id.startsWith('exp-')) {
        // Parse exp-{expIdx}-bullet-{bulletIdx}
        const parts = id.split('-');
        const expIdx = parseInt(parts[1], 10);
        const bulletIdx = parseInt(parts[3], 10);
        value = mutation().mutations.experiences[expIdx]?.bullets[bulletIdx]?.mutated || '';
      }
      setEditedValues((prev) => ({ ...prev, [id]: value }));
    }
  };

  const cancelEditing = (id: string) => {
    setEditingItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    // Reset the edited value
    setEditedValues((prev) => {
      const newValues = { ...prev };
      delete newValues[id];
      return newValues;
    });
  };

  const saveEditing = (id: string) => {
    setEditingItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    // Value is already stored in editedValues
  };

  const handleSaveAsVariant = () => {
    if (variantName().trim()) {
      props.onSaveAsVariant(variantName());
      setShowSaveModal(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${theme().colors.border}`,
        'border-radius': '16px',
      }}
    >
      {/* Header with Score */}
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'start',
          'margin-bottom': '24px',
        }}
      >
        <div>
          <h3
            style={{
              margin: '0 0 8px',
              'font-size': '24px',
              color: theme().colors.text,
              'font-family': theme().fonts.heading,
            }}
          >
            Mutation Results
          </h3>
          <p
            style={{
              margin: 0,
              'font-size': '14px',
              color: theme().colors.textMuted,
            }}
          >
            Review changes and accept what you like
          </p>
        </div>

        {/* Score Badge */}
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '12px',
            padding: '12px 20px',
            background: `${theme().colors.success}20`,
            border: `1px solid ${theme().colors.success}`,
            'border-radius': '10px',
          }}
        >
          <div style={{ 'text-align': 'right' }}>
            <div style={{ 'font-size': '12px', color: theme().colors.textMuted }}>Match Score</div>
            <div
              style={{ 'font-size': '20px', 'font-weight': '700', color: theme().colors.success }}
            >
              {mutation().analysis.matchScoreBefore}%{' '}
              <ArrowRightIcon width={12} height={12} style={{ 'vertical-align': 'middle' }} />{' '}
              {mutation().analysis.matchScoreAfter}%
            </div>
          </div>
          <div
            style={{
              padding: '4px 12px',
              background: theme().colors.success,
              'border-radius': '6px',
              color: '#FFFFFF',
              'font-size': '14px',
              'font-weight': '600',
            }}
          >
            +{scoreImprovement()}%
          </div>
        </div>
      </div>

      {/* Keywords Added */}
      <div
        style={{
          'margin-bottom': '24px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          'border-radius': '12px',
        }}
      >
        <div
          style={{
            'margin-bottom': '8px',
            'font-size': '14px',
            'font-weight': '600',
            color: theme().colors.text,
          }}
        >
          Keywords Added
        </div>
        <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '8px' }}>
          <For each={mutation().mutations.skillsToAdd}>
            {(keyword) => (
              <div
                style={{
                  padding: '6px 12px',
                  background: theme().gradients.primary,
                  'border-radius': '6px',
                  color: theme().colors.textOnPrimary,
                  'font-size': '13px',
                  'font-weight': '600',
                }}
              >
                {keyword}
              </div>
            )}
          </For>
          <Show when={mutation().mutations.skillsToAdd.length === 0}>
            <div style={{ 'font-size': '14px', color: theme().colors.textMuted }}>
              No new keywords added
            </div>
          </Show>
        </div>
      </div>

      {/* Summary Changes */}
      <Show when={mutation().mutations.summary}>
        <div style={{ 'margin-bottom': '24px' }}>
          <div
            style={{
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'center',
              'margin-bottom': '12px',
            }}
          >
            <h4
              style={{
                margin: 0,
                'font-size': '18px',
                color: theme().colors.text,
                'font-family': theme().fonts.heading,
              }}
            >
              Professional Summary
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => toggleAccept('summary')}
                style={{
                  padding: '8px 16px',
                  background: isAccepted('summary')
                    ? theme().colors.success
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${isAccepted('summary') ? theme().colors.success : theme().colors.border}`,
                  'border-radius': '8px',
                  color: isAccepted('summary') ? '#FFFFFF' : theme().colors.text,
                  'font-size': '14px',
                  'font-weight': '600',
                  cursor: 'pointer',
                  display: 'flex',
                  'align-items': 'center',
                  gap: '4px',
                }}
              >
                <Show when={isAccepted('summary')}>
                  <CheckIcon width={14} height={14} />
                </Show>
                {isAccepted('summary') ? 'Accepted' : 'Accept'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '16px' }}>
            {/* Before */}
            <div
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '10px',
              }}
            >
              <div
                style={{
                  'margin-bottom': '8px',
                  'font-size': '12px',
                  'font-weight': '600',
                  color: theme().colors.textMuted,
                  'text-transform': 'uppercase',
                }}
              >
                Before
              </div>
              <div
                style={{ 'font-size': '14px', 'line-height': '1.6', color: theme().colors.text }}
              >
                {mutation().mutations.summary?.original || 'No summary'}
              </div>
            </div>

            {/* After */}
            <div
              style={{
                padding: '16px',
                background: `${theme().colors.success}10`,
                border: `1px solid ${theme().colors.success}`,
                'border-radius': '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  'justify-content': 'space-between',
                  'align-items': 'center',
                  'margin-bottom': '8px',
                }}
              >
                <div
                  style={{
                    'font-size': '12px',
                    'font-weight': '600',
                    color: theme().colors.success,
                    'text-transform': 'uppercase',
                  }}
                >
                  After
                </div>
                <Show when={!editingItems().has('summary')}>
                  <button
                    onClick={() => startEditing('summary')}
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: `1px solid ${theme().colors.border}`,
                      'border-radius': '4px',
                      color: theme().colors.text,
                      'font-size': '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <IconEdit size={14} /> Edit
                  </button>
                </Show>
              </div>
              <Show when={!editingItems().has('summary')}>
                <div
                  style={{ 'font-size': '14px', 'line-height': '1.6', color: theme().colors.text }}
                >
                  {editedValues()['summary'] || mutation().mutations.summary?.mutated}
                </div>
              </Show>
              <Show when={editingItems().has('summary')}>
                <textarea
                  value={editedValues()['summary'] || mutation().mutations.summary?.mutated || ''}
                  onInput={(e) =>
                    setEditedValues((prev) => ({ ...prev, summary: e.currentTarget.value }))
                  }
                  style={{
                    width: '100%',
                    'min-height': '100px',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${theme().colors.border}`,
                    'border-radius': '8px',
                    color: theme().colors.text,
                    'font-size': '14px',
                    'line-height': '1.6',
                    'font-family': theme().fonts.body,
                    resize: 'vertical',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    'justify-content': 'flex-end',
                    'margin-top': '8px',
                  }}
                >
                  <button
                    onClick={() => cancelEditing('summary')}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${theme().colors.border}`,
                      'border-radius': '6px',
                      color: theme().colors.text,
                      'font-size': '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveEditing('summary')}
                    style={{
                      padding: '6px 12px',
                      background: theme().colors.success,
                      border: 'none',
                      'border-radius': '6px',
                      color: '#FFFFFF',
                      'font-size': '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                </div>
              </Show>
            </div>
          </div>

          <div
            style={{
              'margin-top': '8px',
              'font-size': '13px',
              color: theme().colors.textMuted,
              'font-style': 'italic',
            }}
          >
            {mutation().mutations.summary?.reason}
          </div>
        </div>
      </Show>

      {/* Experience Bullets */}
      <div style={{ 'margin-bottom': '24px' }}>
        <h4
          style={{
            margin: '0 0 16px',
            'font-size': '18px',
            color: theme().colors.text,
            'font-family': theme().fonts.heading,
          }}
        >
          Experience Bullets
        </h4>

        <For each={mutation().mutations.experiences}>
          {(experience, idx) => (
            <div style={{ 'margin-bottom': '24px' }}>
              <div
                style={{
                  'margin-bottom': '12px',
                  'font-size': '14px',
                  'font-weight': '600',
                  color: theme().colors.text,
                }}
              >
                Experience {idx() + 1}
              </div>

              <For each={experience.bullets}>
                {(bullet, bulletIdx) => {
                  const changeId = `exp-${idx()}-bullet-${bulletIdx()}`;
                  return (
                    <div style={{ 'margin-bottom': '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          'justify-content': 'space-between',
                          'align-items': 'center',
                          'margin-bottom': '8px',
                        }}
                      >
                        <div style={{ 'font-size': '13px', color: theme().colors.textMuted }}>
                          Bullet {bulletIdx() + 1}
                        </div>
                        <button
                          onClick={() => toggleAccept(changeId)}
                          style={{
                            padding: '6px 12px',
                            background: isAccepted(changeId)
                              ? theme().colors.success
                              : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${isAccepted(changeId) ? theme().colors.success : theme().colors.border}`,
                            'border-radius': '6px',
                            color: isAccepted(changeId) ? '#FFFFFF' : theme().colors.text,
                            'font-size': '12px',
                            'font-weight': '600',
                            cursor: 'pointer',
                            display: 'flex',
                            'align-items': 'center',
                            gap: '4px',
                          }}
                        >
                          <Show when={isAccepted(changeId)}>
                            <CheckIcon width={14} height={14} />
                          </Show>
                          {isAccepted(changeId) ? '' : 'Accept'}
                        </button>
                      </div>

                      <div
                        style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '12px' }}
                      >
                        {/* Before */}
                        <div
                          style={{
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${theme().colors.border}`,
                            'border-radius': '8px',
                            'font-size': '13px',
                            'line-height': '1.5',
                            color: theme().colors.text,
                          }}
                        >
                          • {bullet.original}
                        </div>

                        {/* After */}
                        <div
                          style={{
                            padding: '12px',
                            background: `${theme().colors.success}10`,
                            border: `1px solid ${theme().colors.success}`,
                            'border-radius': '8px',
                            'font-size': '13px',
                            'line-height': '1.5',
                            color: theme().colors.text,
                          }}
                        >
                          <Show when={!editingItems().has(changeId)}>
                            <div
                              style={{
                                display: 'flex',
                                'justify-content': 'space-between',
                                'align-items': 'flex-start',
                              }}
                            >
                              <span>• {editedValues()[changeId] || bullet.mutated}</span>
                              <button
                                onClick={() => startEditing(changeId)}
                                style={{
                                  display: 'flex',
                                  'align-items': 'center',
                                  gap: '4px',
                                  padding: '2px 6px',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: `1px solid ${theme().colors.border}`,
                                  'border-radius': '4px',
                                  color: theme().colors.text,
                                  'font-size': '11px',
                                  cursor: 'pointer',
                                  'flex-shrink': 0,
                                  'margin-left': '8px',
                                }}
                              >
                                <IconEdit size={12} />
                              </button>
                            </div>
                          </Show>
                          <Show when={editingItems().has(changeId)}>
                            <textarea
                              value={editedValues()[changeId] || bullet.mutated || ''}
                              onInput={(e) =>
                                setEditedValues((prev) => ({
                                  ...prev,
                                  [changeId]: e.currentTarget.value,
                                }))
                              }
                              style={{
                                width: '100%',
                                'min-height': '60px',
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${theme().colors.border}`,
                                'border-radius': '6px',
                                color: theme().colors.text,
                                'font-size': '13px',
                                'line-height': '1.5',
                                'font-family': theme().fonts.body,
                                resize: 'vertical',
                              }}
                            />
                            <div
                              style={{
                                display: 'flex',
                                gap: '6px',
                                'justify-content': 'flex-end',
                                'margin-top': '6px',
                              }}
                            >
                              <button
                                onClick={() => cancelEditing(changeId)}
                                style={{
                                  padding: '4px 8px',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: `1px solid ${theme().colors.border}`,
                                  'border-radius': '4px',
                                  color: theme().colors.text,
                                  'font-size': '11px',
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveEditing(changeId)}
                                style={{
                                  padding: '4px 8px',
                                  background: theme().colors.success,
                                  border: 'none',
                                  'border-radius': '4px',
                                  color: '#FFFFFF',
                                  'font-size': '11px',
                                  cursor: 'pointer',
                                }}
                              >
                                Save
                              </button>
                            </div>
                          </Show>
                        </div>
                      </div>

                      <Show when={bullet.keywordsAdded.length > 0}>
                        <div
                          style={{
                            'margin-top': '6px',
                            display: 'flex',
                            gap: '6px',
                            'flex-wrap': 'wrap',
                          }}
                        >
                          <span style={{ 'font-size': '12px', color: theme().colors.textMuted }}>
                            Added:
                          </span>
                          <For each={bullet.keywordsAdded}>
                            {(keyword) => (
                              <span
                                style={{
                                  padding: '2px 8px',
                                  background: theme().colors.success,
                                  'border-radius': '4px',
                                  'font-size': '11px',
                                  color: '#FFFFFF',
                                  'font-weight': '600',
                                }}
                              >
                                {keyword}
                              </span>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  );
                }}
              </For>
            </div>
          )}
        </For>
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          'justify-content': 'flex-end',
          'padding-top': '16px',
          'border-top': `1px solid ${theme().colors.border}`,
        }}
      >
        <button
          onClick={props.onClose}
          style={{
            padding: '12px 24px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${theme().colors.border}`,
            'border-radius': '10px',
            color: theme().colors.text,
            'font-size': '15px',
            'font-weight': '600',
            cursor: 'pointer',
          }}
        >
          Close
        </button>

        <button
          onClick={props.onAcceptAll}
          style={{
            padding: '12px 24px',
            background: theme().gradients.primary,
            border: 'none',
            'border-radius': '10px',
            color: theme().colors.textOnPrimary,
            'font-size': '15px',
            'font-weight': '600',
            cursor: 'pointer',
          }}
        >
          Accept All Changes
        </button>

        <button
          onClick={() => setShowSaveModal(true)}
          style={{
            padding: '12px 24px',
            background: theme().colors.success,
            border: 'none',
            'border-radius': '10px',
            color: '#FFFFFF',
            'font-size': '15px',
            'font-weight': '600',
            cursor: 'pointer',
          }}
        >
          Save as New Variant
        </button>
      </div>

      {/* Save Modal */}
      <Show when={showSaveModal()}>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'z-index': 1000,
          }}
          onClick={() => setShowSaveModal(false)}
        >
          <div
            style={{
              background: theme().colors.background,
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '16px',
              padding: '24px',
              'max-width': '400px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ margin: '0 0 16px', 'font-size': '20px', color: theme().colors.text }}>
              Save as Variant
            </h4>
            <input
              type="text"
              value={variantName()}
              onInput={(e) => setVariantName(e.currentTarget.value)}
              placeholder="e.g., For City Hospital RN Position"
              style={{
                width: '100%',
                padding: '12px',
                'margin-bottom': '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '8px',
                color: theme().colors.text,
                'font-size': '14px',
              }}
            />
            <div style={{ display: 'flex', gap: '12px', 'justify-content': 'flex-end' }}>
              <button
                onClick={() => setShowSaveModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '8px',
                  color: theme().colors.text,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsVariant}
                disabled={!variantName().trim()}
                style={{
                  padding: '10px 20px',
                  background: variantName().trim() ? theme().colors.success : theme().colors.border,
                  border: 'none',
                  'border-radius': '8px',
                  color: '#FFFFFF',
                  cursor: variantName().trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
