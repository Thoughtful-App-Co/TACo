/**
 * AreaOnboarding - First-launch workout area selection
 *
 * Users must either:
 * 1. Create their own custom area (first option)
 * 2. Select a built-in template to start with
 *
 * Memphis x Retro-Futurism Design
 */

import { Component, createSignal, For, Show, createResource } from 'solid-js';
import { WorkoutAreaService } from '../lib/workout-area.service';
import { WorkoutAreaEditor } from '../areas/WorkoutAreaEditor';
import type { WorkoutAreaTemplate } from '../../../schemas/echoprax.schema';
import {
  echoprax,
  memphisColors,
  memphisSurfaces,
  glassButton,
  typography,
} from '../../../theme/echoprax';
import { logger } from '../../../lib/logger';

const log = logger.create('AreaOnboarding');

interface AreaOnboardingProps {
  onComplete: () => void;
}

// Icons for templates
const TemplateIcon: Component<{ icon: string; size?: number }> = (props) => {
  const iconMap: Record<string, string> = {
    user: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    dumbbell:
      'M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z',
    link: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
    sun: 'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z',
    briefcase:
      'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z',
  };

  const path = () => iconMap[props.icon] || iconMap['user'];

  return (
    <svg width={props.size || 32} height={props.size || 32} viewBox="0 0 24 24" fill="currentColor">
      <path d={path()} />
    </svg>
  );
};

export const AreaOnboarding: Component<AreaOnboardingProps> = (props) => {
  const [showEditor, setShowEditor] = createSignal(false);
  const [selectedTemplate, setSelectedTemplate] = createSignal<WorkoutAreaTemplate | null>(null);

  // Load templates
  const [templates] = createResource(async () => {
    const data = await import('../../../data/area-templates.json');
    return data.templates as WorkoutAreaTemplate[];
  });

  const handleCreateOwn = () => {
    log.info('User chose to create custom area');
    setShowEditor(true);
  };

  const handleSelectTemplate = (template: WorkoutAreaTemplate) => {
    log.info('User selected template', { templateId: template.id });
    try {
      WorkoutAreaService.createFromTemplate(template);
      WorkoutAreaService.completeOnboarding();
      props.onComplete();
    } catch (error) {
      log.error('Failed to create area from template', error);
    }
  };

  const handleEditorSave = () => {
    log.info('Custom area created');
    WorkoutAreaService.completeOnboarding();
    props.onComplete();
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
  };

  return (
    <Show
      when={!showEditor()}
      fallback={<WorkoutAreaEditor onSave={handleEditorSave} onCancel={handleEditorCancel} />}
    >
      <div
        style={{
          'min-height': '100vh',
          background: echoprax.colors.background,
          color: echoprax.colors.text,
          'font-family': echoprax.fonts.body,
          padding: echoprax.spacing.xl,
          display: 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
        }}
      >
        <div style={{ 'max-width': '600px', width: '100%' }}>
          {/* Header */}
          <header style={{ 'text-align': 'center', 'margin-bottom': echoprax.spacing.xxl }}>
            <h1
              style={{
                ...typography.brand,
                'font-size': '2.5rem',
                margin: 0,
                'margin-bottom': echoprax.spacing.md,
              }}
            >
              <span style={{ color: echoprax.colors.text }}>Welcome to </span>
              <span style={{ color: memphisColors.hotPink }}>Echoprax</span>
            </h1>
            <p
              style={{
                ...typography.body,
                color: echoprax.colors.textMuted,
                margin: 0,
              }}
            >
              Where do you usually work out?
            </p>
          </header>

          {/* Create Your Own - Primary Option */}
          <button
            type="button"
            onClick={handleCreateOwn}
            class="echoprax-glass-btn"
            style={{
              ...glassButton.primary,
              width: '100%',
              padding: echoprax.spacing.xl,
              'border-radius': echoprax.radii.lg,
              cursor: 'pointer',
              'margin-bottom': echoprax.spacing.xl,
              display: 'flex',
              'align-items': 'center',
              gap: echoprax.spacing.lg,
              'text-align': 'left',
              border: `2px solid ${memphisColors.hotPink}`,
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                'border-radius': echoprax.radii.md,
                background: memphisColors.hotPink,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'flex-shrink': 0,
              }}
            >
              <span style={{ 'font-size': '2rem', color: '#fff' }}>+</span>
            </div>
            <div>
              <h2
                style={{
                  ...typography.headingSm,
                  color: memphisColors.hotPink,
                  margin: 0,
                }}
              >
                Create Your Own
              </h2>
              <p
                style={{
                  ...typography.bodySm,
                  color: echoprax.colors.textMuted,
                  margin: `${echoprax.spacing.xs} 0 0`,
                }}
              >
                Set up your exact equipment and space
              </p>
            </div>
          </button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: echoprax.spacing.md,
              'margin-bottom': echoprax.spacing.xl,
            }}
          >
            <div
              style={{
                flex: 1,
                height: '1px',
                background: echoprax.colors.border,
              }}
            />
            <span
              style={{
                ...typography.caption,
                color: echoprax.colors.textMuted,
                'text-transform': 'uppercase',
                'letter-spacing': '0.1em',
              }}
            >
              Or start with a template
            </span>
            <div
              style={{
                flex: 1,
                height: '1px',
                background: echoprax.colors.border,
              }}
            />
          </div>

          {/* Templates Grid */}
          <Show
            when={!templates.loading && templates()}
            fallback={
              <div style={{ 'text-align': 'center', padding: echoprax.spacing.xl }}>
                <p style={{ color: echoprax.colors.textMuted }}>Loading templates...</p>
              </div>
            }
          >
            <div
              style={{
                display: 'grid',
                'grid-template-columns': 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: echoprax.spacing.md,
              }}
            >
              <For each={templates()}>
                {(template) => (
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate(template)}
                    class="echoprax-glass-btn"
                    style={{
                      ...glassButton.default,
                      padding: echoprax.spacing.lg,
                      'border-radius': echoprax.radii.lg,
                      cursor: 'pointer',
                      display: 'flex',
                      'flex-direction': 'column',
                      'align-items': 'center',
                      'text-align': 'center',
                      gap: echoprax.spacing.sm,
                      'min-height': '140px',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        'border-radius': echoprax.radii.md,
                        background: `${memphisColors.electricBlue}30`,
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        color: memphisColors.electricBlue,
                      }}
                    >
                      <TemplateIcon icon={template.icon} size={28} />
                    </div>
                    <h3
                      style={{
                        ...typography.bodySm,
                        'font-weight': '600',
                        color: echoprax.colors.text,
                        margin: 0,
                      }}
                    >
                      {template.name}
                    </h3>
                    <p
                      style={{
                        ...typography.caption,
                        color: echoprax.colors.textMuted,
                        margin: 0,
                        'line-height': 1.3,
                      }}
                    >
                      {template.description}
                    </p>
                  </button>
                )}
              </For>
            </div>
          </Show>

          {/* Footer note */}
          <p
            style={{
              ...typography.caption,
              color: echoprax.colors.textMuted,
              'text-align': 'center',
              'margin-top': echoprax.spacing.xxl,
            }}
          >
            You can always add more workout areas later
          </p>
        </div>
      </div>
    </Show>
  );
};
