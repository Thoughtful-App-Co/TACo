import { z } from 'zod';

/**
 * Space constraints schema - defines physical limitations of workout areas
 */
export const SpaceConstraintsSchema = z.object({
  noJumping: z.boolean().default(false),
  noSprinting: z.boolean().default(false),
  noLyingDown: z.boolean().default(false),
  lowCeiling: z.boolean().default(false),
  mustBeQuiet: z.boolean().default(false),
  outdoorAvailable: z.boolean().default(false),
});

/**
 * Equipment details schema - additional info about equipment in a workout area
 */
export const EquipmentDetailsSchema = z.record(
  z.string(),
  z.object({
    minWeight: z.number().optional(),
    maxWeight: z.number().optional(),
    notes: z.string().optional(),
  })
);

/**
 * Workout area schema - defines a location where workouts can be performed
 */
export const WorkoutAreaSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Area name is required'),
  icon: z.string().optional(),
  isDefault: z.boolean().default(false),
  equipment: z.array(z.string()),
  equipmentDetails: EquipmentDetailsSchema.optional(),
  constraints: SpaceConstraintsSchema,
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Workout area template schema - built-in templates for common workout areas
 */
export const WorkoutAreaTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  suggestedFor: z.string(),
  equipment: z.array(z.string()),
  equipmentDetails: EquipmentDetailsSchema.optional(),
  constraints: SpaceConstraintsSchema,
});

/**
 * Exercise constraints schema - defines physical requirements for an exercise
 */
export const ExerciseConstraintsSchema = z.object({
  requiresLyingDown: z.boolean().optional(),
  requiresJumping: z.boolean().optional(),
  requiresSprinting: z.boolean().optional(),
  ceilingHeight: z.enum(['low', 'normal', 'high', 'outdoor']).optional(),
  noiseLevel: z.enum(['quiet', 'moderate', 'loud']).optional(),
  outdoorOnly: z.boolean().optional(),
});

/**
 * Exercise substitution schema - alternative exercises when equipment unavailable
 */
export const ExerciseSubstitutionSchema = z.object({
  equipment: z.array(z.string()),
  exercise: z.string(),
});

/**
 * Exercise schema
 * Note: gifUrl is optional for V1 (local-first, no external APIs)
 * Video/GIF integration planned for V3
 */
export const ExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  bodyPart: z.string(),
  targetMuscle: z.string(),
  secondaryMuscles: z.array(z.string()).optional(),
  equipment: z.array(z.string()),
  category: z.enum(['strength', 'cardio', 'flexibility', 'plyometric']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  tags: z.array(z.string()).optional(),
  constraints: ExerciseConstraintsSchema.optional(),
  instructions: z.array(z.string()),
  cues: z.array(z.string()).optional(),
  variations: z.array(z.string()).optional(),
  substitutions: z.array(ExerciseSubstitutionSchema).optional(),
  gifUrl: z.string().url().optional(),
});

/**
 * Single exercise block in a workout
 */
export const WorkoutBlockSchema = z.object({
  id: z.string().uuid(),
  exercise: ExerciseSchema,
  duration: z.number().int().positive(), // seconds (for timed exercises)
  reps: z.number().int().positive().optional(), // reps (for counted exercises)
  sets: z.number().int().positive().default(1),
  restAfter: z.number().int().min(0).default(15), // seconds
  voiceCue: z.string(), // TTS announcement text
  completed: z.boolean().default(false),
});

/**
 * BPM recommendation range
 */
export const BPMRangeSchema = z.object({
  min: z.number().int().positive(),
  max: z.number().int().positive(),
  label: z.string(), // "High intensity", "Steady state", etc.
});

/**
 * Full workout session
 */
export const WorkoutSessionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Workout name is required'),
  description: z.string().optional(),
  warmup: z.array(WorkoutBlockSchema).optional(),
  main: z.array(WorkoutBlockSchema).min(1, 'At least one exercise required'),
  cooldown: z.array(WorkoutBlockSchema).optional(),
  totalDuration: z.number().int().positive(), // calculated from all blocks
  targetBpm: BPMRangeSchema,
  createdAt: z.date(),
  scheduledFor: z.date().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  status: z.enum(['draft', 'scheduled', 'in-progress', 'completed', 'cancelled']).default('draft'),
});

/**
 * Workout schedule configuration
 */
export const WorkoutScheduleSchema = z.object({
  id: z.string().uuid(),
  workoutId: z.string().uuid(), // reference to WorkoutSession
  recurrence: z.object({
    type: z.enum(['once', 'daily', 'weekly', 'custom']),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(), // 0=Sun, 6=Sat
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional(), // HH:mm format
  }),
  notifications: z.object({
    enabled: z.boolean().default(true),
    minutesBefore: z.number().int().positive().default(15),
  }),
  active: z.boolean().default(true),
});

/**
 * Wearable sync configuration
 */
export const WearableSyncSchema = z.object({
  userId: z.string().uuid(),
  whoop: z
    .object({
      connected: z.boolean().default(false),
      accessToken: z.string().optional(),
      refreshToken: z.string().optional(),
      expiresAt: z.date().optional(),
      syncEnabled: z.boolean().default(true),
    })
    .optional(),
  garmin: z
    .object({
      connected: z.boolean().default(false),
      accessToken: z.string().optional(),
      accessTokenSecret: z.string().optional(),
      syncEnabled: z.boolean().default(true),
    })
    .optional(),
});

/**
 * Session state for active workout playback
 */
export const SessionStateSchema = z.enum([
  'idle',
  'countdown',
  'active',
  'rest',
  'completed',
  'paused',
]);

/**
 * TTS voice settings
 */
export const TTSSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  voiceUri: z.string().optional(),
  volume: z.number().min(0).max(1).default(0.8),
  rate: z.number().min(0.1).max(10).default(1.0),
  pitch: z.number().min(0).max(2).default(1.0),
});

/**
 * User's workout timing preferences - affects AI duration estimates
 * These settings help the LLM generate more accurate workout durations
 */
export const WorkoutTimingPreferencesSchema = z.object({
  /**
   * How quickly user transitions between exercises
   * - quick: Minimal rest, fast transitions (~10s)
   * - moderate: Standard pace (~20s)
   * - relaxed: Take your time (~30-45s)
   */
  transitionPace: z.enum(['quick', 'moderate', 'relaxed']).default('moderate'),

  /**
   * Default rest period preference in seconds
   * LLM uses this as baseline for rest between exercises
   */
  preferredRestPeriod: z.number().int().min(10).max(180).default(30),

  /**
   * Rest multiplier for heavy compound lifts (deadlifts, squats, bench)
   * 1.0 = same rest as other exercises
   * 2.0 = double the rest time for heavy lifts
   */
  heavyLiftRestMultiplier: z.number().min(1.0).max(3.0).default(1.5),

  /**
   * Seconds to add per exercise for equipment setup/breakdown
   * Accounts for loading plates, adjusting machines, etc.
   */
  equipmentSetupSeconds: z.number().int().min(0).max(120).default(30),
});

/**
 * Echoprax user settings - persisted locally
 * Controls workout generation, playback defaults, and timing estimates
 */
export const EchopraxUserSettingsSchema = z.object({
  /**
   * Default number of partners (1 = solo workout)
   * Partner workouts multiply active time by partner count
   */
  defaultPartnerCount: z.number().int().min(1).max(4).default(1),

  /**
   * User's fitness/experience level
   * Affects exercise selection, rep ranges, and rest recommendations
   */
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),

  /**
   * Preferred workout duration in minutes
   * Used as default target when generating workouts
   */
  preferredDurationMinutes: z.number().int().min(5).max(120).default(30),

  /**
   * Timing preferences for accurate duration estimates
   */
  timing: WorkoutTimingPreferencesSchema,

  /**
   * TTS voice settings
   */
  tts: TTSSettingsSchema,

  /**
   * Include warmup in generated workouts
   */
  includeWarmup: z.boolean().default(true),

  /**
   * Include cooldown in generated workouts
   */
  includeCooldown: z.boolean().default(true),

  /**
   * Countdown duration before each exercise starts (seconds)
   */
  countdownSeconds: z.number().int().min(3).max(15).default(5),
});

// Type exports
export type SpaceConstraints = z.infer<typeof SpaceConstraintsSchema>;
export type EquipmentDetails = z.infer<typeof EquipmentDetailsSchema>;
export type WorkoutArea = z.infer<typeof WorkoutAreaSchema>;
export type WorkoutAreaTemplate = z.infer<typeof WorkoutAreaTemplateSchema>;
export type ExerciseConstraints = z.infer<typeof ExerciseConstraintsSchema>;
export type ExerciseSubstitution = z.infer<typeof ExerciseSubstitutionSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type WorkoutBlock = z.infer<typeof WorkoutBlockSchema>;
export type BPMRange = z.infer<typeof BPMRangeSchema>;
export type WorkoutSession = z.infer<typeof WorkoutSessionSchema>;
export type WorkoutSchedule = z.infer<typeof WorkoutScheduleSchema>;
export type WearableSync = z.infer<typeof WearableSyncSchema>;
export type SessionState = z.infer<typeof SessionStateSchema>;
export type TTSSettings = z.infer<typeof TTSSettingsSchema>;
export type WorkoutTimingPreferences = z.infer<typeof WorkoutTimingPreferencesSchema>;
export type EchopraxUserSettings = z.infer<typeof EchopraxUserSettingsSchema>;
