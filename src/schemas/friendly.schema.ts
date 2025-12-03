import { z } from 'zod';

// --- TIME & AVAILABILITY ---
export const TimeSlotSchema = z.object({
  dayOfWeek: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
  period: z.enum(['Morning', 'Afternoon', 'Evening']),
});

export const AvailabilitySchema = z.array(TimeSlotSchema);

// --- USER PROFILE (Owner of the FriendLy link) ---
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1), // friendly.app/username
  displayName: z.string().min(1),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  availability: AvailabilitySchema.default([]),
  badges: z.array(z.string()).default([]), // Badge IDs
  stats: z
    .object({
      hangoutsHosted: z.number().default(0),
      hangoutsAttended: z.number().default(0),
      friendsMade: z.number().default(0),
      streakWeeks: z.number().default(0), // Consecutive weeks with hangouts
    })
    .default({}),
});

// --- BADGES (Gamification) ---
export const BadgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(), // Emoji or icon name
  requirement: z.object({
    type: z.enum(['hangoutsHosted', 'hangoutsAttended', 'friendsMade', 'streakWeeks', 'special']),
    threshold: z.number().optional(),
  }),
});

// --- HANGOUT REQUEST (Incoming from public link) ---
export const HangoutRequestSchema = z.object({
  id: z.string().uuid(),
  requesterName: z.string().min(1),
  requesterEmail: z.string().email().optional(),
  requesterNote: z.string().optional(),
  requestedSlot: TimeSlotSchema,
  status: z.enum(['pending', 'accepted', 'declined']),
  createdAt: z.date(),
  // Booking options (set when accepting/creating)
  openToGroup: z.boolean().default(false), // Others can join this hangout
  isPublic: z.boolean().default(false), // Visible on public profile (if false, name hidden)
});

// --- CONFIRMED BOOKING (Accepted hangout with details) ---
export const BookingSchema = z.object({
  id: z.string().uuid(),
  slot: TimeSlotSchema,
  title: z.string().optional(), // e.g. "Coffee with Alex"
  participants: z.array(
    z.object({
      name: z.string(),
      email: z.string().email().optional(),
      isHost: z.boolean().default(false),
    })
  ),
  openToGroup: z.boolean().default(false), // Others can join
  isPublic: z.boolean().default(false), // Show on public page
  showParticipantNames: z.boolean().default(true), // If public but names hidden
  note: z.string().optional(),
  createdAt: z.date(),
  status: z.enum(['confirmed', 'in-progress', 'completed', 'cancelled']),
});

// --- FRIEND (Known contacts) ---
export const FriendSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  avatar: z.string().optional(),
  availability: AvailabilitySchema.default([]),
});

// --- FRIEND GROUPS (Circles) ---
export const FriendGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  emoji: z.string().optional(), // Circle icon
  members: z.array(z.string().uuid()),
  draftIdeas: z.array(z.string()).default([]), // Ideas being "shot around"
});

// --- EVENTS (Partiful-style invites) ---
export const EventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  emoji: z.string().optional(), // Event icon
  date: z.date(),
  timeSlot: TimeSlotSchema.optional(),
  location: z.string().optional(),
  hostId: z.string().uuid(), // User who created it
  invitedIds: z.array(z.string().uuid()), // Invited friends
  rsvps: z
    .array(
      z.object({
        friendId: z.string().uuid(),
        status: z.enum(['going', 'maybe', 'notGoing']),
      })
    )
    .default([]),
  visibility: z.enum(['private', 'circle', 'public']), // Who can see it
  circleId: z.string().uuid().optional(), // If tied to a circle
  status: z.enum(['upcoming', 'live', 'completed', 'cancelled']),
});

// --- TYPES ---
export type TimeSlot = z.infer<typeof TimeSlotSchema>;
export type Availability = z.infer<typeof AvailabilitySchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Badge = z.infer<typeof BadgeSchema>;
export type HangoutRequest = z.infer<typeof HangoutRequestSchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type Friend = z.infer<typeof FriendSchema>;
export type FriendGroup = z.infer<typeof FriendGroupSchema>;
export type Event = z.infer<typeof EventSchema>;

// --- PRESET BADGES ---
export const BADGES: Badge[] = [
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Attended 10+ hangouts',
    icon: '🦋',
    requirement: { type: 'hangoutsAttended', threshold: 10 },
  },
  {
    id: 'host-with-most',
    name: 'Host with the Most',
    description: 'Hosted 5+ events',
    icon: '🎉',
    requirement: { type: 'hangoutsHosted', threshold: 5 },
  },
  {
    id: 'connector',
    name: 'The Connector',
    description: 'Made 20+ friends',
    icon: '🔗',
    requirement: { type: 'friendsMade', threshold: 20 },
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: '4 weeks in a row with hangouts',
    icon: '🔥',
    requirement: { type: 'streakWeeks', threshold: 4 },
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'First to RSVP 5 times',
    icon: '🐦',
    requirement: { type: 'special' },
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Attended 5 evening events',
    icon: '🦉',
    requirement: { type: 'special' },
  },
];
