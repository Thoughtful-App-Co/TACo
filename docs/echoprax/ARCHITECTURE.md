# Echoprax Architecture

Technical design, component structure, and data flow for the Echoprax workout application.

---

## System Overview

Echoprax is a SolidJS PWA built on the TACo monorepo architecture. It follows the same patterns as Tempo and Tenure but introduces audio-first interaction patterns and real-time workout session management.

**Tech Stack:**

- **Frontend**: SolidJS 1.8.0 + TypeScript 5.3.0
- **Build Tool**: Vite 5.0.0
- **Styling**: Tailwind CSS + custom theme tokens
- **Backend**: Cloudflare Pages Functions (Workers)
- **Database**: Cloudflare D1 (SQLite) + localStorage
- **APIs**: ExerciseDB (exercises), Claude (workout generation), Whoop/Garmin (wearables)
- **Audio**: Web Speech Synthesis API (TTS)

---

## Directory Structure

```
src/
├── components/
│   └── echoprax/
│       ├── EchopraxApp.tsx           # Root component
│       ├── workout-generator/
│       │   ├── WorkoutGenerator.tsx  # Prompt → workout creation
│       │   ├── ExerciseSearch.tsx    # Browse ExerciseDB library
│       │   └── WorkoutPreview.tsx    # Review before starting
│       ├── session-player/
│       │   ├── SessionPlayer.tsx     # Core taskmaster loop
│       │   ├── ExerciseCard.tsx      # Visual: gif, timer, form cues
│       │   ├── ProgressTimeline.tsx  # Workout progress bar
│       │   └── AudioController.tsx   # TTS + voice settings
│       ├── scheduler/
│       │   ├── WorkoutCalendar.tsx   # Recurring schedules
│       │   └── ReminderSettings.tsx  # Push notification config
│       ├── history/
│       │   └── WorkoutHistory.tsx    # Past sessions, stats
│       ├── settings/
│       │   ├── WearableSettings.tsx  # Whoop/Garmin connect
│       │   └── VoiceSettings.tsx     # TTS voice selection
│       ├── services/
│       │   ├── workout-storage.ts    # localStorage persistence
│       │   ├── session-manager.ts    # Active workout state
│       │   └── bpm-mapper.ts         # Exercise → BPM recommendations
│       └── lib/
│           ├── types.ts              # Echoprax-specific types
│           └── utils.ts              # Utilities
│
├── services/
│   ├── exercisedb.ts                 # ExerciseDB API client
│   ├── tts.ts                        # Web Speech Synthesis wrapper
│   ├── audio-mixer.ts                # Music/voice coordination
│   ├── whoop.ts                      # Whoop API integration
│   └── garmin.ts                     # Garmin Connect integration
│
├── schemas/
│   └── echoprax.schema.ts            # Zod validation schemas
│
└── theme/
    └── echoprax.ts                   # Design tokens

functions/api/
├── exercisedb.ts                     # Proxy with API key + caching
├── workout-ai.ts                     # Claude workout parser
└── wearables/
    ├── whoop-auth.ts                 # Whoop OAuth callback
    └── garmin-auth.ts                # Garmin OAuth callback

public/echoprax/
├── manifest.json                     # PWA manifest
└── icons/                            # App icons
```

---

## Data Models

### Core Schemas (src/schemas/echoprax.schema.ts)

```typescript
// Exercise from ExerciseDB
const ExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  bodyPart: z.string(), // chest, back, legs, etc.
  equipment: z.string(), // barbell, dumbbell, body weight
  gifUrl: z.string().url(),
  target: z.string(), // primary muscle
  secondaryMuscles: z.array(z.string()),
  instructions: z.array(z.string()),
});

// Workout block (single exercise instance)
const WorkoutBlockSchema = z.object({
  id: z.string().uuid(),
  exercise: ExerciseSchema,
  duration: z.number(), // seconds (for timed exercises)
  reps: z.number().optional(), // reps (for counted exercises)
  sets: z.number().default(1),
  restAfter: z.number().default(15), // seconds
  voiceCue: z.string(), // "Get ready for squats"
  completed: z.boolean().default(false),
});

// Full workout session
const WorkoutSessionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  warmup: z.array(WorkoutBlockSchema).optional(),
  main: z.array(WorkoutBlockSchema),
  cooldown: z.array(WorkoutBlockSchema).optional(),
  totalDuration: z.number(), // calculated from all blocks
  targetBpm: z.object({
    min: z.number(),
    max: z.number(),
    label: z.string(),
  }),
  createdAt: z.date(),
  scheduledFor: z.date().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  status: z.enum(['draft', 'scheduled', 'in-progress', 'completed', 'cancelled']),
});

// User workout schedule
const WorkoutScheduleSchema = z.object({
  id: z.string().uuid(),
  workoutId: z.string().uuid(), // reference to WorkoutSession
  recurrence: z.object({
    type: z.enum(['once', 'daily', 'weekly', 'custom']),
    daysOfWeek: z.array(z.number()).optional(), // 0=Sun, 6=Sat
    time: z.string().optional(), // HH:mm
  }),
  notifications: z.object({
    enabled: z.boolean().default(true),
    minutesBefore: z.number().default(15),
  }),
  active: z.boolean().default(true),
});

// Wearable sync configuration
const WearableSyncSchema = z.object({
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
```

---

## Component Architecture

### 1. Root Component (EchopraxApp.tsx)

```typescript
const EchopraxApp: Component = () => {
  const [activeTab, setActiveTab] = createSignal<'create' | 'sessions' | 'history'>('create');

  return (
    <main class="echoprax-app">
      <Header />
      <TabNavigation activeTab={activeTab()} onChange={setActiveTab} />

      <Show when={activeTab() === 'create'}>
        <WorkoutGenerator />
      </Show>

      <Show when={activeTab() === 'sessions'}>
        <WorkoutCalendar />
      </Show>

      <Show when={activeTab() === 'history'}>
        <WorkoutHistory />
      </Show>

      <SettingsSidebar />
    </main>
  );
};
```

**State Management:**

- Global workout state via SolidJS signals
- Active session stored in `session-manager.ts` service
- Workout library persisted to localStorage
- Scheduled workouts synced to D1 database (future)

---

### 2. Workout Generator

**Flow:**

```
User Prompt Input
      ↓
AI Parser (Claude)
      ↓
Exercise Matching (ExerciseDB)
      ↓
Workout Structure Assembly
      ↓
Preview & Edit
      ↓
Save or Start Immediately
```

**Components:**

- `WorkoutGenerator.tsx`: Main container
- `PromptInput.tsx`: Text area + AI processing button
- `ExerciseSearch.tsx`: Manual exercise selection fallback
- `WorkoutPreview.tsx`: Review/edit before saving

**AI Prompt Engineering:**

```typescript
// Example system prompt for Claude
const WORKOUT_PARSER_PROMPT = `
You are a fitness coach. Parse the user's workout request into a structured JSON format.

User input: "30 minute HIIT with no equipment"

Output format:
{
  "name": "30-Minute HIIT Workout",
  "targetDuration": 1800,
  "exercises": [
    {
      "name": "burpees",
      "duration": 45,
      "restAfter": 15,
      "sets": 3
    },
    ...
  ],
  "bpmRange": { "min": 140, "max": 170 }
}

Match exercise names to ExerciseDB taxonomy.
`;
```

---

### 3. Session Player (The Taskmaster)

**State Machine:**

```
IDLE → WARMUP_COUNTDOWN → WARMUP_ACTIVE → WARMUP_REST →
       MAIN_COUNTDOWN → MAIN_ACTIVE → MAIN_REST →
       COOLDOWN_COUNTDOWN → COOLDOWN_ACTIVE → COMPLETED
```

**Core Loop (pseudocode):**

```typescript
const SessionPlayer: Component<{ session: WorkoutSession }> = (props) => {
  const [state, setState] = createSignal<SessionState>('countdown');
  const [currentBlock, setCurrentBlock] = createSignal(0);
  const [timeRemaining, setTimeRemaining] = createSignal(10);

  // Timer effect
  createEffect(() => {
    if (state() === 'active') {
      const interval = setInterval(() => {
        setTimeRemaining(t => {
          if (t <= 1) {
            playVoiceCue("Time! Rest.");
            setState('rest');
            return props.session.main[currentBlock()].restAfter;
          }

          // Voice cues at specific points
          if (t === 15) playVoiceCue("15 seconds left");
          if (t === 5) playVoiceCue("5 seconds");

          return t - 1;
        });
      }, 1000);

      onCleanup(() => clearInterval(interval));
    }
  });

  return (
    <div class="session-player">
      <ProgressTimeline
        blocks={props.session.main}
        currentIndex={currentBlock()}
      />

      <ExerciseCard
        exercise={props.session.main[currentBlock()].exercise}
        state={state()}
        timeRemaining={timeRemaining()}
      />

      <AudioController
        voiceCue={props.session.main[currentBlock()].voiceCue}
        state={state()}
      />
    </div>
  );
};
```

**Audio Coordination:**

- TTS announces exercise transitions
- Voice volume configurable (0-100%)
- Optional: fade music during announcements (V3 feature with in-app player)

---

### 4. Audio Services

#### TTS Service (src/services/tts.ts)

```typescript
class TTSService {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private volume: number = 0.8;
  private rate: number = 1.0;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadPreferredVoice();
  }

  speak(text: string, options?: { onEnd?: () => void }) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.voice;
    utterance.volume = this.volume;
    utterance.rate = this.rate;

    if (options?.onEnd) {
      utterance.onend = options.onEnd;
    }

    this.synth.speak(utterance);
  }

  setVoice(voiceId: string) {
    const voices = this.synth.getVoices();
    this.voice = voices.find((v) => v.voiceURI === voiceId) || null;
    localStorage.setItem('echoprax_voice', voiceId);
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('echoprax_voice_volume', volume.toString());
  }
}

export const tts = new TTSService();
```

**Browser Compatibility:**

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (limited voices)
- Mobile: ✅ Works on iOS/Android

---

### 5. ExerciseDB Integration

#### Service (src/services/exercisedb.ts)

```typescript
interface ExerciseDBExercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string[];
}

class ExerciseDBService {
  private baseUrl = '/api/exercisedb';

  async getExercisesByBodyPart(bodyPart: string): Promise<ExerciseDBExercise[]> {
    const response = await fetch(`${this.baseUrl}/bodyPart/${bodyPart}`);
    return response.json();
  }

  async getExercisesByEquipment(equipment: string): Promise<ExerciseDBExercise[]> {
    const response = await fetch(`${this.baseUrl}/equipment/${equipment}`);
    return response.json();
  }

  async searchExercises(query: string): Promise<ExerciseDBExercise[]> {
    const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
    return response.json();
  }

  async getExerciseById(id: string): Promise<ExerciseDBExercise> {
    const response = await fetch(`${this.baseUrl}/exercise/${id}`);
    return response.json();
  }
}

export const exerciseDB = new ExerciseDBService();
```

#### Proxy Function (functions/api/exercisedb.ts)

```typescript
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/exercisedb', '');

  // Check cache first
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), request);
  let response = await cache.match(cacheKey);

  if (!response) {
    // Fetch from ExerciseDB
    const exerciseDBUrl = `https://exercisedb.p.rapidapi.com${path}${url.search}`;
    response = await fetch(exerciseDBUrl, {
      headers: {
        'X-RapidAPI-Key': env.EXERCISEDB_API_KEY,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
      },
    });

    // Cache for 24 hours
    const clonedResponse = response.clone();
    context.waitUntil(cache.put(cacheKey, clonedResponse));
  }

  return response;
};
```

---

### 6. Wearable Integration

#### Whoop Service (src/services/whoop.ts)

```typescript
class WhoopService {
  private baseUrl = 'https://api.prod.whoop.com/developer';

  async authenticate(code: string): Promise<WhoopAuthResponse> {
    const response = await fetch('/api/wearables/whoop-auth', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return response.json();
  }

  async syncWorkout(session: WorkoutSession): Promise<void> {
    const tokens = this.getStoredTokens();

    const response = await fetch(`${this.baseUrl}/v1/activity/workout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sport_id: this.mapWorkoutTypeToSport(session.name),
        start: session.startedAt,
        end: session.completedAt,
        timezone_offset: new Date().getTimezoneOffset(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync workout to Whoop');
    }
  }

  async getRecovery(): Promise<WhoopRecovery> {
    const tokens = this.getStoredTokens();
    const response = await fetch(`${this.baseUrl}/v1/recovery`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    return response.json();
  }
}

export const whoop = new WhoopService();
```

**OAuth Flow:**

1. User clicks "Connect Whoop" → redirects to Whoop authorization page
2. Whoop redirects back to `/api/wearables/whoop-auth?code=XXX`
3. Backend exchanges code for access/refresh tokens
4. Tokens stored in D1 database (encrypted)
5. Frontend polls for connection status

---

## Data Flow Diagrams

### Workout Generation Flow

```
┌──────────────┐
│ User Prompt  │
│ "20 min HIIT"│
└──────┬───────┘
       ↓
┌──────────────────────┐
│ AI Parser            │
│ (Claude via Workers) │
└──────┬───────────────┘
       ↓
┌────────────────────────┐
│ Exercise Matching      │
│ (ExerciseDB API)       │
│ "burpees" → ID: "0123" │
└──────┬─────────────────┘
       ↓
┌──────────────────────────┐
│ Workout Assembly         │
│ {warmup, main, cooldown} │
└──────┬───────────────────┘
       ↓
┌──────────────────────┐
│ Save to localStorage │
│ or Start Session     │
└──────────────────────┘
```

### Session Playback Flow

```
┌─────────────────┐
│ Start Session   │
└────────┬────────┘
         ↓
┌─────────────────────┐
│ Load Workout Blocks │
└────────┬────────────┘
         ↓
┌──────────────────────┐
│ COUNTDOWN (10s)      │
│ TTS: "Get ready..."  │
│ Show: Exercise GIF   │
└────────┬─────────────┘
         ↓
┌──────────────────────┐
│ ACTIVE (45s)         │
│ TTS: "GO!"           │
│ Timer: Countdown     │
└────────┬─────────────┘
         ↓
┌──────────────────────┐
│ REST (15s)           │
│ TTS: "Rest. Next..." │
│ Show: Next exercise  │
└────────┬─────────────┘
         ↓
    [Loop or Complete]
         ↓
┌──────────────────────┐
│ COMPLETED            │
│ Save to History      │
│ Sync to Wearable     │
└──────────────────────┘
```

---

## Responsive Design

**Breakpoints:**

- Mobile: < 640px (portrait phone)
- Tablet: 640px - 1024px (landscape phone, small tablet)
- Desktop: > 1024px (laptop, desktop, wall-mounted display)

**Session Player Layout:**

**Mobile (Portrait):**

```
┌─────────────────┐
│   Progress Bar  │
├─────────────────┤
│                 │
│  Exercise GIF   │
│   (centered)    │
│                 │
├─────────────────┤
│   Timer: 0:45   │
│   (large text)  │
├─────────────────┤
│ Form Cues (3)   │
│ • Keep back...  │
│ • Engage core   │
└─────────────────┘
```

**Desktop (Wall-Mount):**

```
┌───────────────────────────────────────┐
│   Progress Timeline (horizontal)      │
├───────────┬───────────────────────────┤
│           │                           │
│ Exercise  │   Next Exercise Preview   │
│   GIF     │   (small)                 │
│ (large)   │                           │
│           │   Timer: 0:45             │
│           │   (extra large)           │
│           │                           │
│           │   Form Cues (4-5)         │
│           │   • Keep back straight    │
│           │   • Engage core           │
└───────────┴───────────────────────────┘
```

---

## State Management Strategy

**Local-First Architecture:**

1. **Workout Library**: localStorage (instant access)
2. **Active Session**: SolidJS signals (reactive)
3. **Session History**: localStorage + optional cloud sync
4. **Wearable Tokens**: D1 database (encrypted, server-side only)
5. **User Preferences**: localStorage (voice settings, notifications)

**Sync Strategy (Future):**

- localStorage as source of truth
- Background sync to D1 when online
- Conflict resolution: last-write-wins

---

## Performance Characteristics

**Target Metrics:**

- **Initial Load**: < 2s (3G connection)
- **Session Start**: < 500ms (from tap to countdown)
- **TTS Response**: < 200ms (voice cue to speech start)
- **Exercise GIF Load**: < 1s (ExerciseDB CDN)

**Optimizations:**

- Preload next exercise GIF during rest periods
- Cache ExerciseDB responses for 24 hours
- Service worker caches workout library for offline use
- Lazy load workout history (virtualized list)

---

## Security Considerations

**API Key Protection:**

- ExerciseDB key stored in Cloudflare Workers environment variables
- All API requests proxied through `/api/exercisedb`
- Rate limiting: 10 requests/second per user

**Wearable OAuth:**

- Tokens stored in D1 database (server-side only)
- Encrypted at rest using Cloudflare's encryption
- Refresh token rotation on every use
- User can revoke access anytime

**User Data:**

- Workout history stored locally by default
- Optional cloud sync requires authentication
- No telemetry/tracking by default
- GDPR-compliant data export

---

## Future Architecture Considerations

**V2: Voice Input**

- Add Whisper API integration for voice-to-text
- Microphone permission handling
- Fallback to Web Speech API if quota exceeded

**V3: Video Studio**

- Self-hosted video CDN (Cloudflare R2 + Images)
- Video encoding pipeline (ffmpeg)
- Community upload moderation workflow

**V3: Music Sync**

- In-app audio player (Web Audio API)
- BPM analysis of user-uploaded tracks
- Real-time tempo adjustment during workout

---

## Testing Strategy

**Unit Tests:**

- Session state machine logic
- BPM mapping calculations
- Workout duration calculations

**Integration Tests:**

- ExerciseDB API mocking
- TTS voice synthesis (manual QA)
- Workout persistence layer

**E2E Tests (Playwright):**

- Complete workout flow: create → start → complete
- Wearable OAuth flow
- PWA offline functionality

---

## Deployment Pipeline

**Build Process:**

```bash
pnpm run build          # Vite production build
pnpm run deploy         # Cloudflare Pages deployment
```

**Environment Variables:**

- `EXERCISEDB_API_KEY`: RapidAPI key for ExerciseDB
- `ANTHROPIC_API_KEY`: Claude API for workout generation
- `WHOOP_CLIENT_ID`: Whoop OAuth client ID
- `WHOOP_CLIENT_SECRET`: Whoop OAuth client secret
- `GARMIN_CONSUMER_KEY`: Garmin OAuth consumer key
- `GARMIN_CONSUMER_SECRET`: Garmin OAuth consumer secret

---

## Dependencies

**Core:**

- `solid-js`: ^1.8.0
- `@solidjs/router`: ^0.10.0
- `zod`: ^3.22.0

**UI:**

- `phosphor-solid`: ^1.0.0 (icons)
- `tailwindcss`: ^3.4.0

**API Clients:**

- `@anthropic-ai/sdk`: ^0.10.0

**Dev Tools:**

- `vite`: ^5.0.0
- `typescript`: ^5.3.0
- `prettier`: ^3.1.0
- `eslint`: ^8.56.0

---

See [API_INTEGRATIONS.md](./API_INTEGRATIONS.md) for detailed API setup guides.
