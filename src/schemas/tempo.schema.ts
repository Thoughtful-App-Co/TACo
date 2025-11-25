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
