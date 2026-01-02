/**
 * JungianAssessment Component
 *
 * OEJTS (Open-Source Jung Type Scales) assessment question flow.
 * 32 questions with 5-point Likert scale measuring 4 dichotomies.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, For, Show, onMount } from 'solid-js';
import { maximalist } from '../../../theme/maximalist';
import { OejtsAnswer } from '../../../schemas/jungian.schema';
import { OEJTS_QUESTIONS } from '../../../data/oejts-questions';
import { ArrowLeftIcon } from 'solid-phosphor/bold';
import {
  calculateJungianProfile,
  saveJungianAnswers,
  saveJungianProfile,
  loadJungianAnswers,
} from '../services/jungian';

export interface JungianAssessmentProps {
  onComplete: () => void;
  onCancel: () => void;
  currentThemeGradient?: string;
  currentThemePrimary?: string;
}

const RESPONSE_OPTIONS = [
  { value: 1, label: 'Disagree Strongly', shortLabel: 'Disagree' },
  { value: 2, label: 'Disagree', shortLabel: 'Somewhat Disagree' },
  { value: 3, label: 'Neutral', shortLabel: 'Neutral' },
  { value: 4, label: 'Agree', shortLabel: 'Somewhat Agree' },
  { value: 5, label: 'Agree Strongly', shortLabel: 'Agree' },
];

export const JungianAssessment: Component<JungianAssessmentProps> = (props) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = createSignal(0);
  const [answers, setAnswers] = createSignal<OejtsAnswer[]>(new Array(32).fill(null));
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  // Load existing answers if resuming
  onMount(() => {
    const saved = loadJungianAnswers();
    if (saved && saved.length === 32) {
      setAnswers(saved);
    }
  });

  const currentQuestion = () => OEJTS_QUESTIONS[currentQuestionIndex()];
  const progress = () => Math.round((currentQuestionIndex() / 32) * 100);
  const isLastQuestion = () => currentQuestionIndex() === 31;

  const handleAnswer = (value: 1 | 2 | 3 | 4 | 5) => {
    const newAnswers = [...answers()];
    newAnswers[currentQuestionIndex()] = value;
    setAnswers(newAnswers);

    // Save progress
    saveJungianAnswers(newAnswers);

    // Auto-advance if not last question
    if (!isLastQuestion()) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex() + 1);
      }, 200);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex() > 0) {
      setCurrentQuestionIndex(currentQuestionIndex() - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    // Calculate profile
    const profile = calculateJungianProfile(answers());

    // Save results
    saveJungianProfile(profile);

    setTimeout(() => {
      setIsSubmitting(false);
      props.onComplete();
    }, 500);
  };

  const allAnswered = () => answers().every((a) => a !== null);

  return (
    <div
      style={{
        'max-width': '800px',
        margin: '0 auto',
        padding: '48px 24px',
      }}
    >
      {/* Header */}
      <div style={{ 'margin-bottom': '32px' }}>
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
            'margin-bottom': '16px',
          }}
        >
          <span style={{ color: maximalist.colors.textMuted, 'font-size': '17px' }}>
            Question {currentQuestionIndex() + 1} of 32
          </span>
          <span
            style={{
              color: props.currentThemePrimary || maximalist.colors.accent,
              'font-weight': '600',
              'font-size': '17px',
            }}
          >
            {progress()}% Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: '6px',
            background: 'rgba(255,255,255,0.1)',
            'border-radius': '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress()}%`,
              background: props.currentThemeGradient || 'rgba(255,255,255,0.15)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div
        style={{
          background: maximalist.colors.surface,
          padding: '48px',
          'border-radius': maximalist.radii.lg,
          border: `2px solid ${maximalist.colors.border}`,
          'box-shadow': '0 16px 48px rgba(0,0,0,0.3)',
          'margin-bottom': '24px',
        }}
      >
        {/* Question Text */}
        <h2
          style={{
            'font-family': maximalist.fonts.heading,
            'font-size': '32px',
            'font-weight': '700',
            'text-align': 'center',
            'line-height': '1.4',
            'margin-bottom': '48px',
            color: maximalist.colors.text,
          }}
        >
          {currentQuestion().text}
        </h2>

        {/* Response Options */}
        <div
          style={{
            display: 'grid',
            'grid-template-columns': 'repeat(5, 1fr)',
            gap: '12px',
          }}
        >
          <For each={RESPONSE_OPTIONS}>
            {(option) => {
              const isSelected = () => answers()[currentQuestionIndex()] === option.value;

              return (
                <button
                  onClick={() => handleAnswer(option.value as 1 | 2 | 3 | 4 | 5)}
                  style={{
                    padding: '20px 12px',
                    background: isSelected()
                      ? props.currentThemeGradient || 'rgba(255,255,255,0.15)'
                      : 'rgba(255,255,255,0.05)',
                    border: isSelected()
                      ? '2px solid transparent'
                      : `2px solid ${maximalist.colors.border}`,
                    'border-radius': maximalist.radii.md,
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    'flex-direction': 'column',
                    'align-items': 'center',
                    gap: '8px',
                    'font-weight': isSelected() ? '700' : '500',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected()) {
                      const target = e.currentTarget as HTMLElement;
                      target.style.background = 'rgba(255,255,255,0.1)';
                      target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected()) {
                      const target = e.currentTarget as HTMLElement;
                      target.style.background = 'rgba(255,255,255,0.05)';
                      target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <span style={{ 'font-size': '24px', 'font-weight': 'bold' }}>{option.value}</span>
                  <span
                    style={{ 'font-size': '13px', 'text-align': 'center', 'line-height': '1.3' }}
                  >
                    {option.shortLabel}
                  </span>
                </button>
              );
            }}
          </For>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '16px', 'justify-content': 'space-between' }}>
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex() === 0}
          style={{
            padding: '16px 32px',
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${maximalist.colors.border}`,
            'border-radius': maximalist.radii.md,
            color: maximalist.colors.text,
            'font-size': '16px',
            'font-weight': '600',
            cursor: currentQuestionIndex() === 0 ? 'not-allowed' : 'pointer',
            opacity: currentQuestionIndex() === 0 ? 0.5 : 1,
          }}
        >
          <ArrowLeftIcon width={16} height={16} /> Previous
        </button>

        <Show when={isLastQuestion() && allAnswered()}>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting()}
            style={{
              padding: '16px 48px',
              background: props.currentThemeGradient || 'rgba(255,255,255,0.15)',
              border: 'none',
              'border-radius': maximalist.radii.md,
              color: 'white',
              'font-size': '16px',
              'font-weight': '700',
              cursor: isSubmitting() ? 'wait' : 'pointer',
              'box-shadow': '0 4px 16px rgba(99, 102, 241, 0.4)',
            }}
          >
            {isSubmitting() ? 'Calculating...' : 'Complete Assessment'}
          </button>
        </Show>

        <button
          onClick={props.onCancel}
          style={{
            padding: '16px 32px',
            background: 'transparent',
            border: `1px solid ${maximalist.colors.border}`,
            'border-radius': maximalist.radii.md,
            color: maximalist.colors.textMuted,
            'font-size': '16px',
            'font-weight': '600',
            cursor: 'pointer',
          }}
        >
          Save & Exit
        </button>
      </div>
    </div>
  );
};
