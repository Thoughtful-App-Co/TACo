import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  estimatedMinutes: z.number().min(1),
  actualMinutes: z.number().optional(),
  status: z.enum(['backlog', 'todo', 'in-progress', 'done', 'cancelled']),
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  scheduledStart: z.date().optional(),
  completedAt: z.date().optional(),
  tags: z.array(z.string()).optional(),
});

export const PomodoroSessionSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number(), // minutes
  type: z.enum(['work', 'short-break', 'long-break']),
  completed: z.boolean(),
});

export const DailyScheduleSchema = z.object({
  id: z.string().uuid(),
  date: z.date(),
  tasks: z.array(TaskSchema),
  totalEstimated: z.number(),
  totalActual: z.number(),
  accuracyScore: z.number().min(0).max(100).optional(),
});

export type Task = z.infer<typeof TaskSchema>;
export type PomodoroSession = z.infer<typeof PomodoroSessionSchema>;
export type DailySchedule = z.infer<typeof DailyScheduleSchema>;

// TimeBox task validation
export const TimeBoxTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  duration: z.number().min(0).default(0),
  isFrog: z.boolean().optional(),
  taskCategory: z.enum(['focus', 'learning', 'review', 'research', 'social']).optional(),
  projectType: z.string().optional(),
  isFlexible: z.boolean().optional(),
  status: z.enum(['todo', 'completed', 'in-progress']).optional(),
});

// TimeBox validation
export const TimeBoxSchema = z.object({
  type: z.enum(['work', 'short-break', 'long-break', 'debrief']),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  tasks: z.array(TimeBoxTaskSchema).optional(),
  status: z.enum(['todo', 'completed', 'in-progress']).optional(),
  estimatedStartTime: z.string().optional(),
  estimatedEndTime: z.string().optional(),
  icon: z.string().optional(),
  actualDuration: z.number().optional(),
  startTime: z.string().optional(),
});

// StoryBlock validation
export const StoryBlockSchema = z.object({
  id: z.string().optional(), // Optional - will be generated if not provided
  title: z.string().min(1, 'Story title is required'),
  timeBoxes: z.array(TimeBoxSchema).min(1, 'At least one timebox is required'),
  totalDuration: z.number().min(1).optional(), // Will be calculated if not provided
  progress: z.number().min(0).max(100).optional().default(0),
  icon: z.string().optional(),
  type: z.enum(['timeboxed', 'flexible', 'milestone']).optional(),
  taskIds: z.array(z.string()).optional().default([]),
});

// Create session validation
export const CreateSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  storyBlocks: z.array(StoryBlockSchema).min(1, 'At least one story block is required'),
  totalDuration: z.number().min(1).optional(), // Will be calculated if not provided
  status: z.enum(['planned', 'in-progress', 'completed', 'archived']).optional().default('planned'),
});

// Update session validation (partial of create, but date required for identification)
export const UpdateSessionSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  storyBlocks: z.array(StoryBlockSchema).optional(),
  totalDuration: z.number().min(1).optional(),
  status: z.enum(['planned', 'in-progress', 'completed', 'archived']).optional(),
});

export type TimeBoxTaskInput = z.infer<typeof TimeBoxTaskSchema>;
export type TimeBoxInput = z.infer<typeof TimeBoxSchema>;
export type StoryBlockInput = z.infer<typeof StoryBlockSchema>;
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
