/**
 * SkillsViewer - Editable tag chips for skills management
 *
 * Displays skills as pill-shaped tag chips with add/remove functionality.
 * Supports keyboard navigation and duplicate prevention.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, For, Show, onMount } from 'solid-js';
import { prepareStore } from '../store';
import { IconPlus, IconX, IconZap } from '../../pipeline/ui/Icons';
import { Theme } from '../../../../theme/types';

type ThemeType = Theme & {
  colors: Theme['colors'] & {
    success?: string;
    error?: string;
  };
};

interface SkillsViewerProps {
  skills: string[];
  currentTheme: () => ThemeType;
}

export const SkillsViewer: Component<SkillsViewerProps> = (props) => {
  const theme = () => props.currentTheme();

  const [newSkill, setNewSkill] = createSignal('');
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [hoveredSkill, setHoveredSkill] = createSignal<string | null>(null);

  let inputRef: HTMLInputElement | undefined;

  // Focus input on mount if no skills
  onMount(() => {
    if (props.skills.length === 0 && inputRef) {
      inputRef.focus();
    }
  });

  const handleAddSkill = () => {
    const skill = newSkill().trim();

    if (!skill) {
      return;
    }

    // Check for duplicate (case-insensitive)
    const isDuplicate = props.skills.some(
      (existingSkill) => existingSkill.toLowerCase() === skill.toLowerCase()
    );

    if (isDuplicate) {
      setErrorMessage('This skill already exists');
      // Clear error after 2 seconds
      setTimeout(() => setErrorMessage(null), 2000);
      return;
    }

    prepareStore.addSkill(skill);
    setNewSkill('');
    setErrorMessage(null);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skill: string) => {
    prepareStore.removeSkill(skill);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header with count */}
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          'margin-bottom': '16px',
        }}
      >
        <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
          <IconZap size={20} color={theme().colors.primary} />
          <h3
            style={{
              margin: 0,
              'font-size': '16px',
              'font-weight': '600',
              color: theme().colors.text,
              'font-family': theme().fonts.heading,
            }}
          >
            Skills
          </h3>
        </div>
        <span
          style={{
            'font-size': '13px',
            color: theme().colors.textMuted,
            'font-weight': '500',
          }}
        >
          {props.skills.length} skill{props.skills.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Add Skill Input */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          'margin-bottom': '16px',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={newSkill()}
          onInput={(e) => setNewSkill(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new skill..."
          style={{
            flex: 1,
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${errorMessage() ? theme().colors.error || '#EF4444' : theme().colors.border}`,
            'border-radius': '8px',
            color: theme().colors.text,
            'font-size': '14px',
            'font-family': theme().fonts.body,
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = theme().colors.primary;
            e.currentTarget.style.boxShadow = `0 0 0 2px ${theme().colors.primary}20`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = theme().colors.border;
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <button
          onClick={handleAddSkill}
          disabled={!newSkill().trim()}
          class="pipeline-btn"
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            gap: '6px',
            padding: '10px 16px',
            background: newSkill().trim() ? theme().colors.primary : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${newSkill().trim() ? theme().colors.primary : theme().colors.border}`,
            'border-radius': '8px',
            color: newSkill().trim() ? '#FFFFFF' : theme().colors.textMuted,
            'font-size': '14px',
            'font-weight': '600',
            cursor: newSkill().trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: newSkill().trim() ? 1 : 0.6,
          }}
          onMouseOver={(e) => {
            if (newSkill().trim()) {
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${theme().colors.primary}40`;
              e.currentTarget.style.filter = 'brightness(1.1)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.filter = 'none';
          }}
        >
          <IconPlus size={16} />
          Add
        </button>
      </div>

      {/* Error Message */}
      <Show when={errorMessage()}>
        <div
          style={{
            'margin-bottom': '12px',
            padding: '8px 12px',
            background: `${theme().colors.error || '#EF4444'}15`,
            border: `1px solid ${theme().colors.error || '#EF4444'}40`,
            'border-radius': '6px',
            'font-size': '13px',
            color: theme().colors.error || '#EF4444',
          }}
        >
          {errorMessage()}
        </div>
      </Show>

      {/* Skills Chips Container */}
      <Show
        when={props.skills.length > 0}
        fallback={
          <div
            style={{
              padding: '32px 24px',
              'text-align': 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px dashed ${theme().colors.border}`,
              'border-radius': '12px',
            }}
          >
            <IconZap size={32} color={theme().colors.textMuted} />
            <p
              style={{
                margin: '12px 0 0',
                'font-size': '14px',
                color: theme().colors.textMuted,
              }}
            >
              No skills added yet
            </p>
            <p
              style={{
                margin: '4px 0 0',
                'font-size': '13px',
                color: theme().colors.textMuted,
                opacity: 0.7,
              }}
            >
              Type a skill name above and press Enter to add
            </p>
          </div>
        }
      >
        <div
          style={{
            display: 'flex',
            'flex-wrap': 'wrap',
            gap: '8px',
          }}
        >
          <For each={props.skills}>
            {(skill) => (
              <div
                onMouseEnter={() => setHoveredSkill(skill)}
                onMouseLeave={() => setHoveredSkill(null)}
                style={{
                  display: 'inline-flex',
                  'align-items': 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: `${theme().colors.primary}15`,
                  border: `1px solid ${theme().colors.primary}30`,
                  'border-radius': '100px',
                  'font-size': '13px',
                  'font-weight': '500',
                  color: theme().colors.text,
                  transition: 'all 0.2s',
                  cursor: 'default',
                  ...(hoveredSkill() === skill
                    ? {
                        background: `${theme().colors.primary}25`,
                        'border-color': `${theme().colors.primary}50`,
                      }
                    : {}),
                }}
              >
                <span>{skill}</span>
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  aria-label={`Remove ${skill}`}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    padding: '2px',
                    background: 'transparent',
                    border: 'none',
                    'border-radius': '50%',
                    cursor: 'pointer',
                    opacity: hoveredSkill() === skill ? 1 : 0.4,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    color: theme().colors.textMuted,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${theme().colors.error || '#EF4444'}20`;
                    e.currentTarget.style.color = theme().colors.error || '#EF4444';
                    e.currentTarget.style.transform = 'scale(1.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = theme().colors.textMuted;
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <IconX size={14} />
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default SkillsViewer;
