/**
 * UserSettingsEditor - Configure workout preferences
 *
 * Allows users to customize timing, partner defaults, fitness level, etc.
 * Settings affect AI workout generation duration estimates.
 *
 * Memphis x Retro-Futurism Design
 */

import { Component, createSignal, onMount, For, Show } from 'solid-js';
import { FloppyDisk, ArrowCounterClockwise, Users, Timer, Barbell } from 'phosphor-solid';
import type { EchopraxUserSettings } from '../../../schemas/echoprax.schema';
import { UserSettingsService } from '../lib/user-settings.service';
import {
  echoprax,
  memphisColors,
  memphisSurfaces,
  glassButton,
  typography,
  touchTargets,
} from '../../../theme/echoprax';
import { ViewHeader } from '../common/ViewHeader';
import { logger } from '../../../lib/logger';

const log = logger.create('UserSettingsEditor');

interface UserSettingsEditorProps {
  onClose: () => void;
  onSave?: () => void;
}

export const UserSettingsEditor: Component<UserSettingsEditorProps> = (props) => {
  const [settings, setSettings] = createSignal<EchopraxUserSettings>(
    UserSettingsService.getDefaults()
  );
  const [hasChanges, setHasChanges] = createSignal(false);
  const [saveMessage, setSaveMessage] = createSignal<string | null>(null);

  onMount(() => {
    const loaded = UserSettingsService.getSettings();
    setSettings(loaded);
    log.debug('Settings loaded', loaded);
  });

  const updateSetting = <K extends keyof EchopraxUserSettings>(
    key: K,
    value: EchopraxUserSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateTiming = <K extends keyof EchopraxUserSettings['timing']>(
    key: K,
    value: EchopraxUserSettings['timing'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      timing: { ...prev.timing, [key]: value },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    try {
      UserSettingsService.saveSettings(settings());
      setHasChanges(false);
      setSaveMessage('Settings saved!');
      setTimeout(() => setSaveMessage(null), 2000);
      log.info('Settings saved', settings());
      props.onSave?.();
    } catch (error) {
      log.error('Failed to save settings', error);
      setSaveMessage('Failed to save');
      setTimeout(() => setSaveMessage(null), 2000);
    }
  };

  const handleReset = () => {
    const defaults = UserSettingsService.resetToDefaults();
    setSettings(defaults);
    setHasChanges(false);
    setSaveMessage('Reset to defaults');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const fitnessLevels = [
    { value: 'beginner', label: 'Beginner', description: 'New to fitness or returning' },
    { value: 'intermediate', label: 'Intermediate', description: 'Regular exercise routine' },
    { value: 'advanced', label: 'Advanced', description: 'Experienced, high intensity' },
  ] as const;

  const transitionPaces = [
    { value: 'quick', label: 'Quick', description: '10-15s between exercises' },
    { value: 'moderate', label: 'Moderate', description: '20-30s between exercises' },
    { value: 'relaxed', label: 'Relaxed', description: '30-45s between exercises' },
  ] as const;

  // Right actions for header
  const headerRightAction = (
    <div style={{ display: 'flex', gap: echoprax.spacing.xs }}>
      <button
        type="button"
        onClick={handleReset}
        class="echoprax-glass-btn"
        style={{
          ...glassButton.default,
          padding: `${echoprax.spacing.xs} ${echoprax.spacing.sm}`,
          'border-radius': echoprax.radii.sm,
          cursor: 'pointer',
          color: echoprax.colors.textMuted,
          display: 'flex',
          'align-items': 'center',
          gap: echoprax.spacing.xs,
          'min-height': touchTargets.minimum,
        }}
        aria-label="Reset to defaults"
      >
        <ArrowCounterClockwise size={16} />
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={!hasChanges()}
        class="echoprax-glass-btn"
        style={{
          ...glassButton.primary,
          padding: `${echoprax.spacing.xs} ${echoprax.spacing.sm}`,
          'border-radius': echoprax.radii.sm,
          cursor: hasChanges() ? 'pointer' : 'not-allowed',
          opacity: hasChanges() ? 1 : 0.5,
          color: memphisColors.hotPink,
          display: 'flex',
          'align-items': 'center',
          gap: echoprax.spacing.xs,
          'min-height': touchTargets.minimum,
        }}
      >
        <FloppyDisk size={16} />
        <span style={{ ...typography.caption }}>Save</span>
      </button>
    </div>
  );

  return (
    <div
      style={{
        'min-height': '100vh',
        background: echoprax.colors.background,
        color: echoprax.colors.text,
        'font-family': echoprax.fonts.body,
        display: 'flex',
        'flex-direction': 'column',
      }}
    >
      {/* Header with back navigation */}
      <ViewHeader title="Settings" onBack={() => props.onClose()} rightAction={headerRightAction} />

      <div
        style={{
          flex: 1,
          'max-width': '600px',
          width: '100%',
          margin: '0 auto',
          padding: `${echoprax.spacing.md} ${echoprax.spacing.lg}`,
        }}
      >
        {/* Save Message */}
        <Show when={saveMessage()}>
          <div
            style={{
              background: `${memphisColors.mintGreen}20`,
              border: `1px solid ${memphisColors.mintGreen}`,
              'border-radius': echoprax.radii.md,
              padding: echoprax.spacing.md,
              'margin-bottom': echoprax.spacing.lg,
              'text-align': 'center',
            }}
          >
            <span style={{ ...typography.bodySm, color: memphisColors.mintGreen }}>
              {saveMessage()}
            </span>
          </div>
        </Show>

        {/* Fitness Level Section */}
        <section
          style={{
            ...memphisSurfaces.card,
            padding: echoprax.spacing.lg,
            'margin-bottom': echoprax.spacing.lg,
          }}
        >
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: echoprax.spacing.sm,
              'margin-bottom': echoprax.spacing.md,
            }}
          >
            <Barbell size={20} color={memphisColors.hotPink} />
            <h2 style={{ ...typography.headingSm, color: memphisColors.hotPink, margin: 0 }}>
              Fitness Level
            </h2>
          </div>
          <p
            style={{
              ...typography.caption,
              color: echoprax.colors.textMuted,
              'margin-bottom': echoprax.spacing.md,
            }}
          >
            Affects exercise selection, rep ranges, and rest recommendations
          </p>
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: echoprax.spacing.sm }}>
            <For each={fitnessLevels}>
              {(level) => (
                <button
                  type="button"
                  onClick={() => updateSetting('fitnessLevel', level.value)}
                  style={{
                    display: 'flex',
                    'flex-direction': 'column',
                    'align-items': 'flex-start',
                    padding: echoprax.spacing.md,
                    'border-radius': echoprax.radii.md,
                    border:
                      settings().fitnessLevel === level.value
                        ? `2px solid ${memphisColors.hotPink}`
                        : `1px solid ${echoprax.colors.border}`,
                    background:
                      settings().fitnessLevel === level.value
                        ? `${memphisColors.hotPink}15`
                        : 'transparent',
                    cursor: 'pointer',
                    'text-align': 'left',
                  }}
                >
                  <span
                    style={{
                      ...typography.bodySm,
                      color:
                        settings().fitnessLevel === level.value
                          ? memphisColors.hotPink
                          : echoprax.colors.text,
                      'font-weight': '600',
                    }}
                  >
                    {level.label}
                  </span>
                  <span style={{ ...typography.caption, color: echoprax.colors.textMuted }}>
                    {level.description}
                  </span>
                </button>
              )}
            </For>
          </div>
        </section>

        {/* Partner Settings Section */}
        <section
          style={{
            ...memphisSurfaces.card,
            padding: echoprax.spacing.lg,
            'margin-bottom': echoprax.spacing.lg,
          }}
        >
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: echoprax.spacing.sm,
              'margin-bottom': echoprax.spacing.md,
            }}
          >
            <Users size={20} color={memphisColors.electricBlue} />
            <h2 style={{ ...typography.headingSm, color: memphisColors.electricBlue, margin: 0 }}>
              Default Partner Count
            </h2>
          </div>
          <p
            style={{
              ...typography.caption,
              color: echoprax.colors.textMuted,
              'margin-bottom': echoprax.spacing.md,
            }}
          >
            Partner workouts multiply active time (partners alternate). Can be changed per workout.
          </p>
          <div style={{ display: 'flex', gap: echoprax.spacing.sm }}>
            <For each={[1, 2, 3, 4]}>
              {(count) => (
                <button
                  type="button"
                  onClick={() => updateSetting('defaultPartnerCount', count)}
                  style={{
                    flex: 1,
                    padding: echoprax.spacing.md,
                    'border-radius': echoprax.radii.md,
                    border:
                      settings().defaultPartnerCount === count
                        ? `2px solid ${memphisColors.electricBlue}`
                        : `1px solid ${echoprax.colors.border}`,
                    background:
                      settings().defaultPartnerCount === count
                        ? `${memphisColors.electricBlue}20`
                        : 'transparent',
                    color:
                      settings().defaultPartnerCount === count
                        ? memphisColors.electricBlue
                        : echoprax.colors.text,
                    cursor: 'pointer',
                    ...typography.bodySm,
                    'font-weight': settings().defaultPartnerCount === count ? '600' : '400',
                  }}
                >
                  {count === 1 ? 'Solo' : `${count}`}
                </button>
              )}
            </For>
          </div>
        </section>

        {/* Timing Preferences Section */}
        <section
          style={{
            ...memphisSurfaces.card,
            padding: echoprax.spacing.lg,
            'margin-bottom': echoprax.spacing.lg,
          }}
        >
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: echoprax.spacing.sm,
              'margin-bottom': echoprax.spacing.md,
            }}
          >
            <Timer size={20} color={memphisColors.acidYellow} />
            <h2 style={{ ...typography.headingSm, color: memphisColors.acidYellow, margin: 0 }}>
              Timing Preferences
            </h2>
          </div>
          <p
            style={{
              ...typography.caption,
              color: echoprax.colors.textMuted,
              'margin-bottom': echoprax.spacing.lg,
            }}
          >
            These settings help AI generate accurate duration estimates
          </p>

          {/* Transition Pace */}
          <div style={{ 'margin-bottom': echoprax.spacing.lg }}>
            <label
              style={{
                ...typography.label,
                color: echoprax.colors.text,
                display: 'block',
                'margin-bottom': echoprax.spacing.sm,
              }}
            >
              Transition Pace
            </label>
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: echoprax.spacing.xs }}>
              <For each={transitionPaces}>
                {(pace) => (
                  <button
                    type="button"
                    onClick={() => updateTiming('transitionPace', pace.value)}
                    style={{
                      display: 'flex',
                      'justify-content': 'space-between',
                      'align-items': 'center',
                      padding: echoprax.spacing.sm,
                      'border-radius': echoprax.radii.sm,
                      border:
                        settings().timing.transitionPace === pace.value
                          ? `2px solid ${memphisColors.acidYellow}`
                          : `1px solid ${echoprax.colors.border}`,
                      background:
                        settings().timing.transitionPace === pace.value
                          ? `${memphisColors.acidYellow}15`
                          : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        ...typography.bodySm,
                        color:
                          settings().timing.transitionPace === pace.value
                            ? memphisColors.acidYellow
                            : echoprax.colors.text,
                      }}
                    >
                      {pace.label}
                    </span>
                    <span style={{ ...typography.caption, color: echoprax.colors.textMuted }}>
                      {pace.description}
                    </span>
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Rest Period */}
          <div style={{ 'margin-bottom': echoprax.spacing.lg }}>
            <label
              style={{
                ...typography.label,
                color: echoprax.colors.text,
                display: 'block',
                'margin-bottom': echoprax.spacing.sm,
              }}
            >
              Base Rest Period: {settings().timing.preferredRestPeriod}s
            </label>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={settings().timing.preferredRestPeriod}
              onInput={(e) => updateTiming('preferredRestPeriod', parseInt(e.currentTarget.value))}
              style={{
                width: '100%',
                'accent-color': memphisColors.acidYellow,
              }}
            />
            <div
              style={{
                display: 'flex',
                'justify-content': 'space-between',
                ...typography.caption,
                color: echoprax.colors.textMuted,
              }}
            >
              <span>10s</span>
              <span>90s</span>
            </div>
          </div>

          {/* Heavy Lift Multiplier */}
          <div style={{ 'margin-bottom': echoprax.spacing.lg }}>
            <label
              style={{
                ...typography.label,
                color: echoprax.colors.text,
                display: 'block',
                'margin-bottom': echoprax.spacing.sm,
              }}
            >
              Heavy Lift Rest Multiplier: {settings().timing.heavyLiftRestMultiplier}x
              <span
                style={{
                  ...typography.caption,
                  color: echoprax.colors.textMuted,
                  'margin-left': echoprax.spacing.sm,
                }}
              >
                (
                {Math.round(
                  settings().timing.preferredRestPeriod * settings().timing.heavyLiftRestMultiplier
                )}
                s for compounds)
              </span>
            </label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.25"
              value={settings().timing.heavyLiftRestMultiplier}
              onInput={(e) =>
                updateTiming('heavyLiftRestMultiplier', parseFloat(e.currentTarget.value))
              }
              style={{
                width: '100%',
                'accent-color': memphisColors.acidYellow,
              }}
            />
            <div
              style={{
                display: 'flex',
                'justify-content': 'space-between',
                ...typography.caption,
                color: echoprax.colors.textMuted,
              }}
            >
              <span>1x (same)</span>
              <span>3x (longer)</span>
            </div>
          </div>

          {/* Equipment Setup Time */}
          <div>
            <label
              style={{
                ...typography.label,
                color: echoprax.colors.text,
                display: 'block',
                'margin-bottom': echoprax.spacing.sm,
              }}
            >
              Equipment Setup Time: {settings().timing.equipmentSetupSeconds}s
            </label>
            <p
              style={{
                ...typography.caption,
                color: echoprax.colors.textMuted,
                'margin-bottom': echoprax.spacing.sm,
              }}
            >
              Extra time for plate changes, rack adjustments, etc.
            </p>
            <input
              type="range"
              min="0"
              max="120"
              step="15"
              value={settings().timing.equipmentSetupSeconds}
              onInput={(e) =>
                updateTiming('equipmentSetupSeconds', parseInt(e.currentTarget.value))
              }
              style={{
                width: '100%',
                'accent-color': memphisColors.acidYellow,
              }}
            />
            <div
              style={{
                display: 'flex',
                'justify-content': 'space-between',
                ...typography.caption,
                color: echoprax.colors.textMuted,
              }}
            >
              <span>0s (none)</span>
              <span>120s</span>
            </div>
          </div>
        </section>

        {/* Workout Structure Section */}
        <section
          style={{
            ...memphisSurfaces.card,
            padding: echoprax.spacing.lg,
            'margin-bottom': echoprax.spacing.lg,
          }}
        >
          <h2
            style={{
              ...typography.headingSm,
              color: memphisColors.mintGreen,
              margin: `0 0 ${echoprax.spacing.md}`,
            }}
          >
            Workout Structure
          </h2>

          {/* Preferred Duration */}
          <div style={{ 'margin-bottom': echoprax.spacing.lg }}>
            <label
              style={{
                ...typography.label,
                color: echoprax.colors.text,
                display: 'block',
                'margin-bottom': echoprax.spacing.sm,
              }}
            >
              Preferred Workout Duration: {settings().preferredDurationMinutes} min
            </label>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={settings().preferredDurationMinutes}
              onInput={(e) =>
                updateSetting('preferredDurationMinutes', parseInt(e.currentTarget.value))
              }
              style={{
                width: '100%',
                'accent-color': memphisColors.mintGreen,
              }}
            />
            <div
              style={{
                display: 'flex',
                'justify-content': 'space-between',
                ...typography.caption,
                color: echoprax.colors.textMuted,
              }}
            >
              <span>10 min</span>
              <span>90 min</span>
            </div>
          </div>

          {/* Countdown */}
          <div style={{ 'margin-bottom': echoprax.spacing.lg }}>
            <label
              style={{
                ...typography.label,
                color: echoprax.colors.text,
                display: 'block',
                'margin-bottom': echoprax.spacing.sm,
              }}
            >
              Countdown Before Exercise: {settings().countdownSeconds}s
            </label>
            <input
              type="range"
              min="3"
              max="10"
              step="1"
              value={settings().countdownSeconds}
              onInput={(e) => updateSetting('countdownSeconds', parseInt(e.currentTarget.value))}
              style={{
                width: '100%',
                'accent-color': memphisColors.mintGreen,
              }}
            />
            <div
              style={{
                display: 'flex',
                'justify-content': 'space-between',
                ...typography.caption,
                color: echoprax.colors.textMuted,
              }}
            >
              <span>3s</span>
              <span>10s</span>
            </div>
          </div>

          {/* Toggle Options */}
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: echoprax.spacing.sm }}>
            <label
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
                padding: echoprax.spacing.sm,
                'border-radius': echoprax.radii.sm,
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
              }}
            >
              <span style={{ ...typography.bodySm, color: echoprax.colors.text }}>
                Include Warmup
              </span>
              <input
                type="checkbox"
                checked={settings().includeWarmup}
                onChange={(e) => updateSetting('includeWarmup', e.currentTarget.checked)}
                style={{ 'accent-color': memphisColors.mintGreen, width: '20px', height: '20px' }}
              />
            </label>
            <label
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
                padding: echoprax.spacing.sm,
                'border-radius': echoprax.radii.sm,
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
              }}
            >
              <span style={{ ...typography.bodySm, color: echoprax.colors.text }}>
                Include Cooldown
              </span>
              <input
                type="checkbox"
                checked={settings().includeCooldown}
                onChange={(e) => updateSetting('includeCooldown', e.currentTarget.checked)}
                style={{ 'accent-color': memphisColors.mintGreen, width: '20px', height: '20px' }}
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
};
