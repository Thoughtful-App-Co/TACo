import { z } from 'zod';

export const ContactSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  relationship: z.enum(['family', 'friend', 'colleague', 'acquaintance']),
  lastContact: z.date(),
  nurtureCycle: z.number().min(1).max(90), // days
  notes: z.string().optional(),
  growthStage: z.enum(['seedling', 'growing', 'flourishing', 'needs-water']),
});

export const InteractionSchema = z.object({
  id: z.string().uuid(),
  contactId: z.string().uuid(),
  type: z.enum(['call', 'message', 'meetup', 'gift', 'thought']),
  date: z.date(),
  note: z.string().optional(),
});

export type Contact = z.infer<typeof ContactSchema>;
export type Interaction = z.infer<typeof InteractionSchema>;
