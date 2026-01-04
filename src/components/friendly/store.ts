import { createStore } from 'solid-js/store';
import { createEffect } from 'solid-js';
import {
  UserProfile,
  Friend,
  FriendGroup,
  Event,
  HangoutRequest,
  Booking,
  Availability,
  TimeSlot,
  BADGES,
} from '../../schemas/friendly.schema';
import { logger } from '../../lib/logger';

// --- INITIAL DATA ---
const INITIAL_PROFILE: UserProfile = {
  id: crypto.randomUUID(),
  username: 'yourname',
  displayName: 'Your Name',
  bio: "Let's hang out!",
  availability: [
    { dayOfWeek: 'Mon', period: 'Evening' },
    { dayOfWeek: 'Tue', period: 'Evening' },
    { dayOfWeek: 'Sat', period: 'Afternoon' },
    { dayOfWeek: 'Sun', period: 'Morning' },
  ],
  badges: [],
  stats: {
    hangoutsHosted: 3,
    hangoutsAttended: 7,
    friendsMade: 12,
    streakWeeks: 2,
  },
};

const INITIAL_FRIENDS: Friend[] = [
  {
    id: '1',
    name: 'Maya',
    availability: [
      { dayOfWeek: 'Mon', period: 'Evening' },
      { dayOfWeek: 'Sat', period: 'Afternoon' },
    ],
  },
  {
    id: '2',
    name: 'James',
    availability: [
      { dayOfWeek: 'Tue', period: 'Evening' },
      { dayOfWeek: 'Fri', period: 'Evening' },
    ],
  },
  {
    id: '3',
    name: 'Sophie',
    availability: [
      { dayOfWeek: 'Sun', period: 'Morning' },
      { dayOfWeek: 'Wed', period: 'Evening' },
    ],
  },
];

const INITIAL_GROUPS: FriendGroup[] = [
  {
    id: 'g1',
    name: 'Hiking Crew',
    emoji: '🥾',
    members: ['1', '3'],
    draftIdeas: ['Hike the Greenbelt'],
  },
  { id: 'g2', name: 'Board Games', emoji: '🎲', members: ['1', '2'], draftIdeas: [] },
];

const INITIAL_REQUESTS: HangoutRequest[] = [
  {
    id: 'r1',
    requesterName: 'Alex',
    requesterNote: 'Coffee catch-up?',
    requestedSlot: { dayOfWeek: 'Sat', period: 'Afternoon' },
    status: 'pending',
    createdAt: new Date(),
    openToGroup: false,
    isPublic: false,
  },
];

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    slot: { dayOfWeek: 'Mon', period: 'Evening' },
    title: 'Drinks with Maya',
    participants: [{ name: 'Maya', isHost: false }],
    openToGroup: true,
    isPublic: true,
    showParticipantNames: true,
    note: 'Trying that new bar downtown',
    createdAt: new Date(),
    status: 'confirmed',
  },
];

const INITIAL_EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'Game Night',
    emoji: '🎮',
    description: 'Bring snacks!',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    timeSlot: { dayOfWeek: 'Sat', period: 'Evening' },
    location: 'My place',
    hostId: INITIAL_PROFILE.id,
    invitedIds: ['1', '2'],
    rsvps: [{ friendId: '1', status: 'going' }],
    visibility: 'circle',
    circleId: 'g2',
    status: 'upcoming',
  },
];

// --- STORE STATE ---
interface StoreState {
  profile: UserProfile;
  friends: Friend[];
  groups: FriendGroup[];
  events: Event[];
  requests: HangoutRequest[];
  bookings: Booking[];
  viewMode: 'dashboard' | 'public'; // Toggle for demo purposes
}

// --- LOAD/SAVE ---
const loadState = (): StoreState => {
  const stored = localStorage.getItem('friendly_v2');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Revive dates
      if (parsed.requests) {
        parsed.requests = parsed.requests.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
        }));
      }
      if (parsed.events) {
        parsed.events = parsed.events.map((e: any) => ({ ...e, date: new Date(e.date) }));
      }
      if (parsed.bookings) {
        parsed.bookings = parsed.bookings.map((b: any) => ({
          ...b,
          createdAt: new Date(b.createdAt),
        }));
      }

      // Ensure all arrays are initialized (migration for older data)
      if (!parsed.bookings) parsed.bookings = [];
      if (!parsed.requests) parsed.requests = [];
      if (!parsed.events) parsed.events = [];
      if (!parsed.groups) parsed.groups = [];
      if (!parsed.friends) parsed.friends = [];

      return parsed;
    } catch (e) {
      logger.storage.error('Failed to load state: ' + String(e));
    }
  }
  return {
    profile: INITIAL_PROFILE,
    friends: INITIAL_FRIENDS,
    groups: INITIAL_GROUPS,
    events: INITIAL_EVENTS,
    requests: INITIAL_REQUESTS,
    bookings: INITIAL_BOOKINGS,
    viewMode: 'dashboard',
  };
};

const [state, setState] = createStore<StoreState>(loadState());

// Persistence
createEffect(() => {
  localStorage.setItem('friendly_v2', JSON.stringify(state));
});

// --- ACTIONS ---
export const store = {
  state,

  // Profile
  updateProfile: (updates: Partial<UserProfile>) => {
    setState('profile', (prev) => ({ ...prev, ...updates }));
  },

  toggleAvailability: (slot: TimeSlot) => {
    const exists = state.profile.availability.find(
      (s) => s.dayOfWeek === slot.dayOfWeek && s.period === slot.period
    );
    if (exists) {
      setState('profile', 'availability', (current) =>
        current.filter((s) => !(s.dayOfWeek === slot.dayOfWeek && s.period === slot.period))
      );
    } else {
      setState('profile', 'availability', (current) => [...current, slot]);
    }
  },

  // Friends
  addFriend: (name: string, email?: string) => {
    const newFriend: Friend = {
      id: crypto.randomUUID(),
      name,
      email,
      availability: [],
    };
    setState('friends', (current) => [...current, newFriend]);
    setState('profile', 'stats', 'friendsMade', (n) => n + 1);
  },

  // Groups
  createGroup: (name: string, memberIds: string[], emoji?: string) => {
    const newGroup: FriendGroup = {
      id: crypto.randomUUID(),
      name,
      emoji,
      members: memberIds,
      draftIdeas: [],
    };
    setState('groups', (current) => [...current, newGroup]);
  },

  addIdeaToGroup: (groupId: string, idea: string) => {
    setState(
      'groups',
      (g) => g.id === groupId,
      'draftIdeas',
      (ideas) => [...ideas, idea]
    );
  },

  // Requests (Incoming from public link)
  submitRequest: (
    name: string,
    slot: TimeSlot,
    note?: string,
    email?: string,
    options?: { openToGroup?: boolean; isPublic?: boolean }
  ) => {
    const newRequest: HangoutRequest = {
      id: crypto.randomUUID(),
      requesterName: name,
      requesterEmail: email,
      requesterNote: note,
      requestedSlot: slot,
      status: 'pending',
      createdAt: new Date(),
      openToGroup: options?.openToGroup ?? false,
      isPublic: options?.isPublic ?? false,
    };
    setState('requests', (current) => [...current, newRequest]);
  },

  respondToRequest: (
    requestId: string,
    response: 'accepted' | 'declined',
    bookingOptions?: {
      openToGroup: boolean;
      isPublic: boolean;
      showParticipantNames: boolean;
      title?: string;
    }
  ) => {
    setState('requests', (r) => r.id === requestId, 'status', response);

    if (response === 'accepted') {
      const request = state.requests.find((r) => r.id === requestId);
      if (request) {
        // Create a booking from the accepted request
        const newBooking: Booking = {
          id: crypto.randomUUID(),
          slot: request.requestedSlot,
          title: bookingOptions?.title || `Hangout with ${request.requesterName}`,
          participants: [
            { name: request.requesterName, email: request.requesterEmail, isHost: false },
          ],
          openToGroup: bookingOptions?.openToGroup ?? false,
          isPublic: bookingOptions?.isPublic ?? false,
          showParticipantNames: bookingOptions?.showParticipantNames ?? true,
          note: request.requesterNote,
          createdAt: new Date(),
          status: 'confirmed',
        };
        setState('bookings', (current) => [...current, newBooking]);
      }
      setState('profile', 'stats', 'hangoutsAttended', (n) => n + 1);
    }
  },

  // Events
  createEvent: (event: Omit<Event, 'id' | 'rsvps' | 'status'>) => {
    const newEvent: Event = {
      ...event,
      id: crypto.randomUUID(),
      rsvps: [],
      status: 'upcoming',
    };
    setState('events', (current) => [...current, newEvent]);
    setState('profile', 'stats', 'hangoutsHosted', (n) => n + 1);
  },

  rsvpToEvent: (eventId: string, friendId: string, status: 'going' | 'maybe' | 'notGoing') => {
    setState(
      'events',
      (e) => e.id === eventId,
      'rsvps',
      (rsvps) => {
        const existing = rsvps.findIndex((r) => r.friendId === friendId);
        if (existing >= 0) {
          const updated = [...rsvps];
          updated[existing] = { friendId, status };
          return updated;
        }
        return [...rsvps, { friendId, status }];
      }
    );
  },

  // Bookings
  joinBooking: (bookingId: string, name: string, email?: string) => {
    setState(
      'bookings',
      (b) => b.id === bookingId,
      'participants',
      (participants) => [...participants, { name, email, isHost: false }]
    );
  },

  updateBooking: (bookingId: string, updates: Partial<Booking>) => {
    setState(
      'bookings',
      (b) => b.id === bookingId,
      (prev) => ({ ...prev, ...updates })
    );
  },

  cancelBooking: (bookingId: string) => {
    setState('bookings', (b) => b.id === bookingId, 'status', 'cancelled');
  },

  getBookingForSlot: (slot: TimeSlot): Booking | undefined => {
    return state.bookings.find(
      (b) =>
        b.slot.dayOfWeek === slot.dayOfWeek &&
        b.slot.period === slot.period &&
        b.status !== 'cancelled'
    );
  },

  // View Mode (for demo)
  setViewMode: (mode: 'dashboard' | 'public') => {
    setState('viewMode', mode);
  },

  // Badge Checker
  checkBadges: () => {
    const { stats, badges } = state.profile;
    const newBadges: string[] = [...badges];

    BADGES.forEach((badge) => {
      if (badges.includes(badge.id)) return;

      const { type, threshold } = badge.requirement;
      if (type === 'special') return; // Manual award

      const statValue = stats[type as keyof typeof stats];
      if (threshold && statValue >= threshold) {
        newBadges.push(badge.id);
      }
    });

    if (newBadges.length !== badges.length) {
      setState('profile', 'badges', newBadges);
    }
  },
};
