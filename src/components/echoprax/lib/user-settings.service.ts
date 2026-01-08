/**
 * Echoprax User Settings Service
 *
 * Manages user preferences for workout generation and playback.
 * Persisted to localStorage for local-first operation.
 */

import {
  EchopraxUserSettingsSchema,
  type EchopraxUserSettings,
} from '../../../schemas/echoprax.schema';
import { logger } from '../../../lib/logger';

const STORAGE_KEY = 'echoprax_user_settings';

const log = logger.create('EchopraxUserSettings');

/**
 * Default settings - used when no settings exist or on parse error
 */
const DEFAULT_SETTINGS: EchopraxUserSettings = {
  defaultPartnerCount: 1,
  fitnessLevel: 'intermediate',
  preferredDurationMinutes: 30,
  timing: {
    transitionPace: 'moderate',
    preferredRestPeriod: 30,
    heavyLiftRestMultiplier: 1.5,
    equipmentSetupSeconds: 30,
  },
  tts: {
    enabled: true,
    volume: 0.8,
    rate: 1.0,
    pitch: 1.0,
  },
  includeWarmup: true,
  includeCooldown: true,
  countdownSeconds: 5,
};

export class UserSettingsService {
  /**
   * Get current user settings, with defaults for missing fields
   */
  static getSettings(): EchopraxUserSettings {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (!json) {
        log.debug('No settings found, using defaults');
        return DEFAULT_SETTINGS;
      }

      const parsed = JSON.parse(json);
      // Validate and merge with defaults to handle schema evolution
      const result = EchopraxUserSettingsSchema.safeParse({
        ...DEFAULT_SETTINGS,
        ...parsed,
        timing: {
          ...DEFAULT_SETTINGS.timing,
          ...parsed.timing,
        },
        tts: {
          ...DEFAULT_SETTINGS.tts,
          ...parsed.tts,
        },
      });

      if (!result.success) {
        log.warn('Invalid settings in storage, using defaults', {
          errors: result.error.errors,
        });
        return DEFAULT_SETTINGS;
      }

      return result.data;
    } catch (error) {
      log.error('Error reading settings', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save user settings
   */
  static saveSettings(settings: EchopraxUserSettings): void {
    try {
      // Validate before saving
      const result = EchopraxUserSettingsSchema.safeParse(settings);
      if (!result.success) {
        log.error('Invalid settings, not saving', { errors: result.error.errors });
        throw new Error('Invalid settings');
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
      log.debug('Settings saved', { settings: result.data });
    } catch (error) {
      log.error('Error saving settings', error);
      throw error;
    }
  }

  /**
   * Update specific settings fields (partial update)
   */
  static updateSettings(updates: Partial<EchopraxUserSettings>): EchopraxUserSettings {
    const current = this.getSettings();
    const updated: EchopraxUserSettings = {
      ...current,
      ...updates,
      timing: {
        ...current.timing,
        ...(updates.timing || {}),
      },
      tts: {
        ...current.tts,
        ...(updates.tts || {}),
      },
    };

    this.saveSettings(updated);
    return updated;
  }

  /**
   * Reset all settings to defaults
   */
  static resetToDefaults(): EchopraxUserSettings {
    this.saveSettings(DEFAULT_SETTINGS);
    log.info('Settings reset to defaults');
    return DEFAULT_SETTINGS;
  }

  /**
   * Get the default settings (useful for UI reset buttons)
   */
  static getDefaults(): EchopraxUserSettings {
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Calculate estimated transition time based on settings and equipment
   * Used by LLM prompt to provide accurate duration estimates
   */
  static getTransitionTimeSeconds(hasHeavyEquipment: boolean): number {
    const settings = this.getSettings();
    const paceMultiplier =
      settings.timing.transitionPace === 'quick'
        ? 0.5
        : settings.timing.transitionPace === 'relaxed'
          ? 1.5
          : 1.0;

    let baseTime = 15; // Base transition time
    if (hasHeavyEquipment) {
      baseTime += settings.timing.equipmentSetupSeconds;
    }

    return Math.round(baseTime * paceMultiplier);
  }

  /**
   * Calculate rest period for an exercise type
   */
  static getRestPeriodSeconds(isHeavyCompound: boolean): number {
    const settings = this.getSettings();
    const baseRest = settings.timing.preferredRestPeriod;

    if (isHeavyCompound) {
      return Math.round(baseRest * settings.timing.heavyLiftRestMultiplier);
    }

    return baseRest;
  }

  /**
   * Generate a settings summary for LLM context
   * Returns a human-readable description of user preferences
   */
  static getSettingsSummaryForLLM(): string {
    const s = this.getSettings();
    const lines: string[] = [];

    // Partner count
    if (s.defaultPartnerCount > 1) {
      lines.push(
        `PARTNER WORKOUT: ${s.defaultPartnerCount} partners alternating. Multiply active exercise time by ${s.defaultPartnerCount}.`
      );
    }

    // Fitness level
    lines.push(`FITNESS LEVEL: ${s.fitnessLevel}`);

    // Timing preferences
    const paceTimes = { quick: '10-15s', moderate: '20-30s', relaxed: '30-45s' };
    lines.push(
      `TRANSITION PACE: ${s.timing.transitionPace} (${paceTimes[s.timing.transitionPace]} between exercises)`
    );
    lines.push(`BASE REST PERIOD: ${s.timing.preferredRestPeriod} seconds`);
    lines.push(
      `HEAVY LIFT REST: ${Math.round(s.timing.preferredRestPeriod * s.timing.heavyLiftRestMultiplier)} seconds (${s.timing.heavyLiftRestMultiplier}x multiplier for compound lifts)`
    );
    lines.push(
      `EQUIPMENT SETUP TIME: Add ${s.timing.equipmentSetupSeconds}s for barbell/plate changes`
    );

    // Structure preferences
    lines.push(`WARMUP: ${s.includeWarmup ? 'Include 5-10 min warmup' : 'Skip warmup'}`);
    lines.push(`COOLDOWN: ${s.includeCooldown ? 'Include 3-5 min cooldown' : 'Skip cooldown'}`);
    lines.push(`COUNTDOWN: ${s.countdownSeconds}s countdown before each exercise`);

    // Duration preference
    lines.push(`TARGET DURATION: ${s.preferredDurationMinutes} minutes`);

    return lines.join('\n');
  }
}
