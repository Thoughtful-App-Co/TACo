import { z } from 'zod';

export const StrengthSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.enum(['executing', 'influencing', 'relationship-building', 'strategic-thinking']),
  score: z.number().min(0).max(100),
  description: z.string(),
  relatedRoles: z.array(z.string()),
});

export const CultureProfileSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  dimensions: z.object({
    autonomy: z.number().min(0).max(100),
    collaboration: z.number().min(0).max(100),
    innovation: z.number().min(0).max(100),
    stability: z.number().min(0).max(100),
    workLifeBalance: z.number().min(0).max(100),
    growthFocus: z.number().min(0).max(100),
  }),
  values: z.array(z.string()),
  workStyle: z.enum(['remote', 'hybrid', 'onsite']),
});

export const JobMatchSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  jobId: z.string().uuid(),
  company: z.string(),
  role: z.string(),
  location: z.string(),
  salary: z
    .object({
      min: z.number(),
      max: z.number(),
      currency: z.string(),
    })
    .optional(),
  strengthFitScore: z.number().min(0).max(100),
  cultureFitScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  matchedStrengths: z.array(z.string()),
  matchedValues: z.array(z.string()),
  appliedAt: z.date().optional(),
  status: z.enum(['discovered', 'interested', 'applied', 'interviewing', 'offered', 'rejected']),
});

export const AssessmentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['strengths', 'values', 'work-style', 'personality']),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      answer: z.any(),
    })
  ),
  completedAt: z.date(),
  results: z.record(z.any()),
});

export type Strength = z.infer<typeof StrengthSchema>;
export type CultureProfile = z.infer<typeof CultureProfileSchema>;
export type JobMatch = z.infer<typeof JobMatchSchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;
