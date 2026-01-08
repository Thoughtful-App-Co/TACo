/**
 * Workout Area Service
 *
 * Manages user's workout areas in localStorage.
 * Areas define equipment availability and space constraints.
 */

import type {
  WorkoutArea,
  WorkoutAreaTemplate,
  SpaceConstraints,
} from '../../../schemas/echoprax.schema';
import { logger } from '../../../lib/logger';

const STORAGE_KEY = 'echoprax_workout_areas';
const ONBOARDING_KEY = 'echoprax_onboarding_complete';

const log = logger.create('WorkoutAreaService');

/**
 * Stored representation with Date fields as ISO strings
 */
interface StoredWorkoutArea extends Omit<WorkoutArea, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

function serializeArea(area: WorkoutArea): StoredWorkoutArea {
  return {
    ...area,
    createdAt: area.createdAt.toISOString(),
    updatedAt: area.updatedAt.toISOString(),
  };
}

function deserializeArea(stored: StoredWorkoutArea): WorkoutArea {
  return {
    ...stored,
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
  };
}

export class WorkoutAreaService {
  /**
   * Check if user has completed onboarding (selected/created first area)
   */
  static isOnboardingComplete(): boolean {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  }

  /**
   * Mark onboarding as complete
   */
  static completeOnboarding(): void {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    log.info('Onboarding marked complete');
  }

  /**
   * Get all workout areas
   */
  static getAreas(): WorkoutArea[] {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (!json) return [];
      const stored = JSON.parse(json) as StoredWorkoutArea[];
      return stored.map(deserializeArea);
    } catch (error) {
      log.error('Failed to get workout areas', error);
      return [];
    }
  }

  /**
   * Get the default workout area
   */
  static getDefaultArea(): WorkoutArea | null {
    const areas = this.getAreas();
    return areas.find((a) => a.isDefault) ?? areas[0] ?? null;
  }

  /**
   * Get a specific area by ID
   */
  static getAreaById(id: string): WorkoutArea | null {
    const areas = this.getAreas();
    return areas.find((a) => a.id === id) ?? null;
  }

  /**
   * Save a workout area (create or update)
   */
  static saveArea(area: WorkoutArea): WorkoutArea {
    try {
      const areas = this.getAreas();
      const existingIndex = areas.findIndex((a) => a.id === area.id);

      // If setting as default, unset others
      if (area.isDefault) {
        areas.forEach((a) => {
          a.isDefault = false;
        });
      }

      if (existingIndex !== -1) {
        areas[existingIndex] = { ...area, updatedAt: new Date() };
      } else {
        areas.push(area);
      }

      // Ensure at least one default
      if (!areas.some((a) => a.isDefault) && areas.length > 0) {
        areas[0].isDefault = true;
      }

      const stored = areas.map(serializeArea);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      log.debug('Saved workout area', { id: area.id, name: area.name });
      return area;
    } catch (error) {
      log.error('Failed to save workout area', error);
      throw new Error('Failed to save workout area');
    }
  }

  /**
   * Create a new area from a template
   */
  static createFromTemplate(template: WorkoutAreaTemplate, customName?: string): WorkoutArea {
    const now = new Date();
    const area: WorkoutArea = {
      id: crypto.randomUUID(),
      name: customName ?? template.name,
      icon: template.icon,
      isDefault: this.getAreas().length === 0, // First area is default
      equipment: [...template.equipment],
      equipmentDetails: template.equipmentDetails ? { ...template.equipmentDetails } : undefined,
      constraints: { ...template.constraints },
      createdAt: now,
      updatedAt: now,
    };

    return this.saveArea(area);
  }

  /**
   * Create a new blank area
   */
  static createBlankArea(name: string): WorkoutArea {
    const now = new Date();
    const area: WorkoutArea = {
      id: crypto.randomUUID(),
      name,
      isDefault: this.getAreas().length === 0,
      equipment: ['floor_space'], // Minimum default
      constraints: {
        noJumping: false,
        noSprinting: false,
        noLyingDown: false,
        lowCeiling: false,
        mustBeQuiet: false,
        outdoorAvailable: false,
      },
      createdAt: now,
      updatedAt: now,
    };

    return this.saveArea(area);
  }

  /**
   * Delete a workout area
   */
  static deleteArea(id: string): void {
    try {
      let areas = this.getAreas();
      const deletedArea = areas.find((a) => a.id === id);
      areas = areas.filter((a) => a.id !== id);

      // If we deleted the default, set a new one
      if (deletedArea?.isDefault && areas.length > 0) {
        areas[0].isDefault = true;
      }

      const stored = areas.map(serializeArea);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      log.debug('Deleted workout area', { id });
    } catch (error) {
      log.error('Failed to delete workout area', error);
      throw new Error('Failed to delete workout area');
    }
  }

  /**
   * Set an area as the default
   */
  static setDefaultArea(id: string): void {
    const areas = this.getAreas();
    areas.forEach((a) => {
      a.isDefault = a.id === id;
      a.updatedAt = new Date();
    });

    const stored = areas.map(serializeArea);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    log.debug('Set default area', { id });
  }

  /**
   * Update area equipment list
   */
  static updateEquipment(id: string, equipment: string[]): WorkoutArea {
    const area = this.getAreaById(id);
    if (!area) {
      throw new Error('Area not found');
    }

    area.equipment = equipment;
    area.updatedAt = new Date();
    return this.saveArea(area);
  }

  /**
   * Update area constraints
   */
  static updateConstraints(id: string, constraints: SpaceConstraints): WorkoutArea {
    const area = this.getAreaById(id);
    if (!area) {
      throw new Error('Area not found');
    }

    area.constraints = constraints;
    area.updatedAt = new Date();
    return this.saveArea(area);
  }

  /**
   * Duplicate an existing area
   */
  static duplicateArea(id: string, newName?: string): WorkoutArea {
    const original = this.getAreaById(id);
    if (!original) {
      throw new Error('Area not found');
    }

    const now = new Date();
    const duplicate: WorkoutArea = {
      ...original,
      id: crypto.randomUUID(),
      name: newName ?? `${original.name} (Copy)`,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };

    return this.saveArea(duplicate);
  }

  /**
   * Check if an area has specific equipment
   */
  static areaHasEquipment(areaId: string, equipmentId: string): boolean {
    const area = this.getAreaById(areaId);
    return area?.equipment.includes(equipmentId) ?? false;
  }

  /**
   * Check if an area can support a specific exercise based on equipment and constraints
   */
  static canPerformExercise(
    areaId: string,
    requiredEquipment: string[],
    exerciseConstraints?: {
      requiresLyingDown?: boolean;
      requiresJumping?: boolean;
      requiresSprinting?: boolean;
      noiseLevel?: 'quiet' | 'moderate' | 'loud';
    }
  ): { canPerform: boolean; missingEquipment: string[]; constraintViolations: string[] } {
    const area = this.getAreaById(areaId);
    if (!area) {
      return {
        canPerform: false,
        missingEquipment: requiredEquipment,
        constraintViolations: ['Area not found'],
      };
    }

    const missingEquipment = requiredEquipment.filter((eq) => !area.equipment.includes(eq));
    const constraintViolations: string[] = [];

    if (exerciseConstraints) {
      if (exerciseConstraints.requiresLyingDown && area.constraints.noLyingDown) {
        constraintViolations.push('Requires lying down');
      }
      if (exerciseConstraints.requiresJumping && area.constraints.noJumping) {
        constraintViolations.push('Requires jumping');
      }
      if (exerciseConstraints.requiresSprinting && area.constraints.noSprinting) {
        constraintViolations.push('Requires sprinting');
      }
      if (exerciseConstraints.noiseLevel === 'loud' && area.constraints.mustBeQuiet) {
        constraintViolations.push('Too loud for quiet space');
      }
    }

    return {
      canPerform: missingEquipment.length === 0 && constraintViolations.length === 0,
      missingEquipment,
      constraintViolations,
    };
  }
}
