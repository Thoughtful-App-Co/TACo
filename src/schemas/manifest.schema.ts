import { z } from 'zod';

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1),
  age: z.number().min(18),
  location: z.string(),
  bio: z.string().max(500).optional(),
  photos: z.array(z.string()).min(1).max(6),
  commitmentScore: z.number().min(0).max(100),
});

export const CriteriaSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  ageRange: z.object({
    min: z.number().min(18),
    max: z.number().max(100),
  }),
  distance: z.number().max(500), // miles
  dealBreakers: z.array(z.string()),
  mustHaves: z.array(z.string()),
  values: z.array(z.enum([
    'family', 'career', 'adventure', 'stability', 
    'creativity', 'spirituality', 'health', 'learning'
  ])),
});

export const MatchSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  matchedUserId: z.string().uuid(),
  compatibilityScore: z.number().min(0).max(100),
  sharedValues: z.array(z.string()),
  matchedAt: z.date(),
  status: z.enum(['pending', 'accepted', 'passed', 'blind-date']),
  dateScheduled: z.date().optional(),
});

export const SelfDiscoverySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  question: z.string(),
  answer: z.string(),
  category: z.enum(['values', 'lifestyle', 'relationship', 'personality']),
  completedAt: z.date(),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type Criteria = z.infer<typeof CriteriaSchema>;
export type Match = z.infer<typeof MatchSchema>;
export type SelfDiscovery = z.infer<typeof SelfDiscoverySchema>;
