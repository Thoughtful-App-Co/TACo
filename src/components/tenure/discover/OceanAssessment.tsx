/**
 * OceanAssessment Component
 *
 * Big Five (OCEAN) personality assessment question flow.
 * 44 questions with 5-point Likert scale.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, For, Show, onMount } from 'solid-js';
import { maximalist, maxGradients } from '../../../theme/maximalist';
import { BfiAnswer } from '../../../schemas/ocean.schema';
import { ArrowLeftIcon } from 'solid-phosphor/bold';
import {
  BFI_QUESTIONS_SORTED,
  BFI_QUESTION_STEM,
  BFI_RESPONSE_OPTIONS,
} from '../../../data/bfi-questions';
import {
  calculateOceanProfile,
  saveOceanAnswers,
  saveOceanProfile,
  loadOceanAnswers,
} from '../services/ocean';
import { findOceanArchetype } from '../../../data/ocean-archetypes';

export interface OceanAssessmentProps {
  onComplete: () => void;
  onCancel: () => void;
  currentThemeGradient?: string;
  currentThemePrimary?: string;
}

export const OceanAssessment: Component<OceanAssessmentProps> = (props) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = createSignal(0);
  const [answers, setAnswers] = createSignal<BfiAnswer[]>(new Array(44).fill(null));
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  // Load existing answers if resuming
  onMount(() => {
    const saved = loadOceanAnswers();
    if (saved && saved.length === 44) {
      setAnswers(saved);
    }
  });

  const currentQuestion = () => BFI_QUESTIONS_SORTED[currentQuestionIndex()];
  const progress = () => Math.round((currentQuestionIndex() / 44) * 100);
  const isLastQuestion = () => currentQuestionIndex() === 43;

  const handleAnswer = (value: 1 | 2 | 3 | 4 | 5) => {
    const newAnswers = [...answers()];
    newAnswers[currentQuestionIndex()] = value;
    setAnswers(newAnswers);

    // Save progress
    saveOceanAnswers(newAnswers);

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
    const profile = calculateOceanProfile(answers());

    // Find archetype
    const archetype = findOceanArchetype(profile);

    // Save results
    saveOceanProfile(profile, {
      id: archetype.id,
      title: archetype.title,
      description: archetype.description,
    });

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
            Question {currentQuestionIndex() + 1} of 44
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
              background: props.currentThemeGradient || maxGradients.vapor,
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
        {/* Question Stem */}
        <p
          style={{
            'font-size': '18px',
            color: maximalist.colors.textMuted,
            'margin-bottom': '16px',
            'text-align': 'center',
          }}
        >
          {BFI_QUESTION_STEM}
        </p>

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
          <For each={BFI_RESPONSE_OPTIONS}>
            {(option) => {
              const isSelected = () => answers()[currentQuestionIndex()] === option.value;

              return (
                <button
                  onClick={() => handleAnswer(option.value as 1 | 2 | 3 | 4 | 5)}
                  style={{
                    padding: '20px 12px',
                    background: isSelected()
                      ? props.currentThemeGradient || maxGradients.vapor
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
              background: props.currentThemeGradient || maxGradients.vapor,
              border: 'none',
              'border-radius': maximalist.radii.md,
              color: 'white',
              'font-size': '16px',
              'font-weight': '700',
              cursor: isSubmitting() ? 'wait' : 'pointer',
              'box-shadow': '0 4px 16px rgba(139, 92, 246, 0.4)',
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
