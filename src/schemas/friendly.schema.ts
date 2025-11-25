import { z } from 'zod';

export const FriendSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  avatar: z.string().optional(),
  location: z.object({
    city: z.string(),
    timezone: z.string(),
  }).optional(),
  interests: z.array(z.string()).optional(),
  lastSeen: z.date().optional(),
  connectionStrength: z.number().min(0).max(100),
  checkInFrequency: z.number().min(1).max(365), // days
});

export const EventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.date(),
  location: z.string().optional(),
  attendees: z.array(z.string().uuid()),
  maxCapacity: z.number().optional(),
  splitPayment: z.boolean().optional(),
  costPerPerson: z.number().optional(),
  status: z.enum(['planning', 'confirmed', 'completed', 'cancelled']),
});

export const ReminderSchema = z.object({
  id: z.string().uuid(),
  friendId: z.string().uuid(),
  type: z.enum(['check-in', 'birthday', 'anniversary', 'custom']),
  message: z.string().optional(),
  dueDate: z.date(),
  isRecurring: z.boolean(),
  recurrencePattern: z.string().optional(),
});

export type Friend = z.infer<typeof FriendSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Reminder = z.infer<typeof ReminderSchema>;
