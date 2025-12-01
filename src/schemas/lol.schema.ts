import { z } from 'zod';

export const ChoreSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  category: z.enum(['kitchen', 'laundry', 'bathroom', 'outdoor', 'general']),
  estimatedMinutes: z.number().min(1),
  points: z.number().min(1),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  assignedTo: z.string().uuid().optional(),
  icon: z.string().optional(),
});

export const CompletionSchema = z.object({
  id: z.string().uuid(),
  choreId: z.string().uuid(),
  userId: z.string().uuid(),
  startTime: z.date(),
  endTime: z.date(),
  duration: z.number(), // actual minutes
  pointsEarned: z.number(),
  verified: z.boolean(),
  verificationMethod: z.enum(['manual', 'sensor', 'photo']).optional(),
});

export const HouseholdMemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  avatar: z.string().optional(),
  color: z.string(), // for UI differentiation
  totalPoints: z.number(),
  weeklyPoints: z.number(),
  streak: z.number(), // consecutive days with completed chores
  level: z.number().min(1),
  achievements: z.array(z.string()),
});

export const RewardSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  pointsCost: z.number().min(1),
  createdBy: z.string().uuid(),
  claimedBy: z.string().uuid().optional(),
  claimedAt: z.date().optional(),
  type: z.enum(['personal', 'shared']),
});

export const HappinessMeterSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  date: z.date(),
  equityScore: z.number().min(0).max(100), // how evenly distributed chores are
  completionRate: z.number().min(0).max(100),
  memberScores: z.record(z.number()), // userId -> contribution percentage
});

export type Chore = z.infer<typeof ChoreSchema>;
export type Completion = z.infer<typeof CompletionSchema>;
export type HouseholdMember = z.infer<typeof HouseholdMemberSchema>;
export type Reward = z.infer<typeof RewardSchema>;
export type HappinessMeter = z.infer<typeof HappinessMeterSchema>;
