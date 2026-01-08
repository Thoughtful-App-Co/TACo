# Echoprax

**Your open-source workout taskmaster**

Echoprax is a boutique fitness experience that lives in your pocket. Create workouts manually or with AI assistance, get guided through exercises with voice coaching, and track your progress—all without relying on Big Tech platforms.

---

## Vision

**The Problem:**

- Boutique fitness classes ($30-50/session) are inaccessible to most people
- Existing workout apps are either subscription-locked or ad-riddled
- Wearables collect data but don't actively guide your workout
- Wall-mounted tablets in home gyms require clunky keyboard interactions

**The Echoprax Solution:**

- **Free & Open Source**: No subscriptions, no ads, no vendor lock-in
- **Timer-Driven Taskmaster**: Guides you through exercises with voice coaching
- **Audio-First UX**: Works hands-free—perfect for wall-mounted displays or when you don't want to stare at screens
- **Local-First (V1)**: Works completely offline with localStorage persistence
- **AI-Powered (V2)**: Generate workouts from prompts with Claude AI
- **Community-Driven Video Library (V3)**: YouTube integration or open-source studio content

---

## Product Roadmap

### V1: Local-First Taskmaster (MVP) - **Current Focus**

**Core Features:**

- ✅ **Manual Workout Creation**: Create and customize your own workouts
- ✅ **Session Player**: Timer-driven taskmaster that guides you through exercises
  - Countdown → Exercise → Rest → Next
  - Audio-first design with TTS voice coaching
  - Text-based exercise display with form cues
- ✅ **Workout Persistence**: Save custom workouts to localStorage
- ✅ **Offline-First**: Works completely without internet (PWA)

**Technical Stack:**

- Frontend: SolidJS, TypeScript, Tailwind CSS
- Storage: localStorage (no backend required)
- Audio: Web Speech Synthesis API (TTS)

**V1 Scope Boundaries:**

- ❌ No video/GIF integration (V3 feature)
- ❌ No AI workout generation (V2 feature)
- ❌ No wearable sync (V2 feature)
- ❌ No scheduling/reminders (V2 feature)
- ❌ No BPM recommendations (V3 feature)

---

### V2: AI Generation & Wearables

**New Features:**

- 🤖 **Claude AI Workout Generation**:
  - Text prompt → AI creates structured workout
  - "Create a 20-minute HIIT workout with no equipment"
  - Intelligent exercise selection based on goals
- ⌚ **Wearable Sync**:
  - Whoop integration for recovery-based suggestions
  - Garmin integration for workout logging
  - Strain/recovery data drives workout intensity
- 📅 **Scheduling & Reminders**:
  - Schedule workouts for specific days/times
  - Push notifications for workout reminders
  - Recurring workout schedules

**V2 Timeline:** 3-6 months post-V1 launch

---

### V3: Video Integration & Music

**New Features:**

- 🎥 **Video Integration**:
  - YouTube API integration for exercise demos
  - Or: Open-source video studio with professional form videos
  - Community-contributed content (Creative Commons licensed)
  - Multi-angle shots, slow-motion breakdowns
- 🎵 **BPM Recommendations**:
  - Suggests music tempo for workout intensity
  - Integration with open music sources
- 🌐 **Federated Workout Sharing**:
  - Share custom workouts with the community
  - Follow coaches/trainers for curated programs

**V3 Timeline:** 12-18 months post-V1 launch

---

## Key Differentiators

| Feature                   | Echoprax           | Peloton/Apple Fitness | Nike Training Club   | Freeletics            |
| ------------------------- | ------------------ | --------------------- | -------------------- | --------------------- |
| **Cost**                  | Free (open-source) | $44/mo subscription   | Free + IAP           | $8-13/mo subscription |
| **Platform Lock-in**      | None               | Apple/iOS ecosystem   | None                 | Account required      |
| **AI Workout Generation** | ✅ V2              | ❌ Pre-recorded only  | ❌ Pre-recorded only | ✅ Adaptive           |
| **Audio-First Design**    | ✅ TTS coaching    | ❌ Video required     | ❌ Video required    | ❌ Video required     |
| **Wearable Sync**         | ✅ V2              | ✅ Apple Watch only   | ❌ Limited           | ✅ Multiple devices   |
| **Offline-First**         | ✅ V1              | ❌ Requires internet  | ❌ Requires internet | ❌ Requires internet  |
| **Open-Source**           | ✅ AGPLv3          | ❌ Proprietary        | ❌ Proprietary       | ❌ Proprietary        |
| **Video Library**         | ✅ V3              | ❌ Exclusive content  | ❌ Nike-only         | ❌ Proprietary        |

---

## Target Users

1. **Home Gym Enthusiasts**: Wall-mounted tablets, smart mirrors, need hands-free control
2. **Minimalists**: Want quality guidance without subscriptions or accounts
3. **Offline-First Users**: Need workouts that work without internet connection
4. **Privacy-Conscious Athletes**: Don't want workout data sold to advertisers
5. **Open-Source Advocates**: Support community-driven fitness tools

---

## Technical Philosophy

### Why Local-First (V1)?

- **Zero Dependencies**: Works offline, no API keys required
- **Privacy by Default**: All data stays on your device
- **Instant Start**: No account creation, no onboarding, just workout
- **Reliability**: No server downtime, no API rate limits

### Why Audio-First?

- **Accessibility**: Works while device is locked, screen off, or wall-mounted
- **Safety**: Eyes on form, not on screen
- **Inclusivity**: Works for visually impaired users with screen readers

### Why Wearables in V2?

- **Whoop**: Cult following, recovery-focused, developer-friendly API
- **Garmin**: Open ecosystem, fitness enthusiasts, strong developer docs
- **Future**: Oura, Polar, COROS (based on community demand)

---

## Development Principles

1. **Offline-First**: Core workout player works without internet (PWA)
2. **Privacy-Respecting**: No tracking, no telemetry, local storage by default
3. **Accessible**: WCAG 2.1 AA compliance, screen reader support
4. **Performance**: <100KB initial JS bundle, instant session start
5. **Progressive Enhancement**: Works on basic smartphones, better on flagship devices

---

## Contributing

Echoprax is part of the TACo monorepo. See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for development setup.

**High-Impact Contribution Areas:**

- Manual workout builder UI
- Additional TTS voice options
- Internationalization (i18n)
- Accessibility testing
- Exercise science accuracy review

---

## Roadmap Status

| Milestone                | Status         | ETA     |
| ------------------------ | -------------- | ------- |
| **V1 MVP (Local-First)** | 🚧 In Progress | Q3 2026 |
| AI Generation (V2)       | 📋 Planned     | Q1 2027 |
| Wearable Sync (V2)       | 📋 Planned     | Q1 2027 |
| Video Integration (V3)   | 💡 Conceptual  | Q3 2027 |
| BPM Recommendations (V3) | 💡 Conceptual  | Q4 2027 |

---

## License

Echoprax is licensed under **AGPLv3**. See [LICENSE](../../LICENSE) for details.

**Why AGPL?**

- Ensures derivative works remain open-source (prevents proprietary forks)
- Protects against SaaS exploitation (must share source if hosted publicly)
- Aligns with open-source fitness movement

---

## Acknowledgments

- **ExerciseDB**: Initial exercise library provider
- **Whoop & Garmin**: Developer-friendly wearable APIs
- **Anthropic Claude**: AI workout generation engine
- **SolidJS Community**: Reactive primitives powering the UI

---

_Built with ❤️ by the Thoughtful App Co. team. No venture capital. No subscriptions. Just great software._
