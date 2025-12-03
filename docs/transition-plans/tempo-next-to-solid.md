# Tempo: Next.js to SolidJS Transition Plan

> **Source**: `/home/shuppdev/daemon/tempo` (Next.js 15.2.3 + React 19)  
> **Target**: `/home/shuppdev/taco/src/components/tempo` (SolidJS)  
> **Date**: December 2, 2025

---

## Executive Summary

**Tempo** is a sophisticated AI-powered Pomodoro task management app that uses Claude AI to convert brain dumps into structured work sessions. The app features complex animations and granular timer controls.

**Architecture**: Modular app within TACo multi-app shell  
**Complexity**: Medium-High (1295-line session view, Framer Motion animations)  
**Port Difficulty**: 5/10 (clean architecture helps, animations need attention)  
**Storage**: LocalStorage only (no Replicache complexity)  
**Theme**: `tempo.ts` (dark mode, Linear-inspired design system)

---

## Core Architecture

### Tech Stack Comparison

| Feature | Next.js (Current) | SolidStart (Target) |
|---------|-------------------|---------------------|
| Framework | Next.js 15.2.3 | SolidStart |
| UI Library | React 19 | SolidJS |
| Routing | App Router | File-based routing |
| State | useState/useEffect | createSignal/createEffect |
| Data Fetching | TanStack Query | @tanstack/solid-query |
| UI Components | Radix UI | Kobalte |
| Animations | Framer Motion | Motion One / CSS |
| Styling | Tailwind CSS | Tailwind CSS (keep) |
| AI | Anthropic Claude | Anthropic Claude (keep) |
| Sync | Replicache | **LocalStorage only** |
| Theme | next-themes | solid-theme (or custom) |

### File Structure (Simplified)

```
tempo/
├── app/
│   ├── api/                           # → SolidStart API routes
│   │   ├── ai/route.ts               # Claude integration
│   │   ├── tasks/process/route.ts    # Task AI processing
│   │   └── tasks/create-session/route.ts
│   ├── features/                      # → Port to Solid
│   │   ├── brain-dump/               # Task input & AI
│   │   ├── session-manager/          # Timer & progress
│   │   ├── task-persistence/         # LocalStorage
│   │   └── task-rollover/            # Archiving
│   ├── page.tsx                      # Home/Plan → index.tsx
│   ├── sessions/page.tsx             # Sessions list
│   └── session/[date]/page.tsx       # Session detail
├── components/
│   ├── ui/                           # shadcn → Kobalte
│   └── (business components)         # → Port to Solid
├── lib/
│   ├── types.ts                      # Keep as-is ✓
│   ├── utils.ts                      # Keep pure fns ✓
│   └── (services)                    # Port logic ✓
└── styles/globals.css                # Keep ✓
```

---

## Key Dependencies

### Core (Keep)
- `tailwindcss` - Styling (no changes needed)
- `@anthropic-ai/sdk` - Claude AI (keep)
- `date-fns` - Date utilities (keep)
- `lucide-react` → `lucide-solid` (Solid version)
- `clsx` + `tailwind-merge` - Keep

### Replace
- `react` + `react-dom` → `solid-js`
- `next` → `solid-start`
- `@tanstack/react-query` → `@tanstack/solid-query` (optional)
- `@radix-ui/*` → `@kobalte/core` (Solid UI primitives)
- `framer-motion` → `@motionone/solid` or CSS animations
- `next-themes` → Custom or `solid-theme`
- `@hello-pangea/dnd` → `@thisbeyond/solid-dnd`

### Remove
- ❌ `replicache` - Not needed, using LocalStorage only

---

## Critical Type System

### Central Types (`lib/types.ts`) - Port As-Is ✓

```typescript
// Core Entities
Task, ProcessedTask, TimeBoxTask
Story, ProcessedStory, StoryBlock  
TimeBox, SessionPlan, Session

// Enums
TaskType = "focus" | "learning" | "review" | "break" | "research"
TaskStatus = "todo" | "completed" | "in-progress" | "pending"
SessionStatus = "planned" | "in-progress" | "completed" | "archived"
DifficultyLevel = "low" | "medium" | "high"
TimeBoxType = "work" | "short-break" | "long-break" | "debrief"
StoryType = "timeboxed" | "flexible" | "milestone"

// Key Interfaces
StoredSession extends SessionPlan {
  status: SessionStatus
  activeTimeBox?: { storyId: string; timeBoxIndex: number } | null
  timeRemaining?: number | null
  isTimerRunning?: boolean
}
```

**Action**: Copy `lib/types.ts` verbatim, no changes needed.

---

## Feature Modules (Port Order)

### 1. Brain Dump (`app/features/brain-dump/`) - Priority: HIGH

**Purpose**: User dumps task list → AI processes → Structured stories

**Components**:
- `BrainDump.tsx` - Main container with textarea
- `BrainDumpForm.tsx` - Form logic
- `ProcessedStories.tsx` - Story cards display
- `StoryCard.tsx` - Individual story
- `DifficultyBadge.tsx` - Badge component

**Hooks** (React → Solid):
```typescript
// React
const [tasks, setTasks] = useState<string>("")
useEffect(() => { ... }, [deps])
const memoValue = useMemo(() => { ... }, [deps])
const callback = useCallback(() => { ... }, [deps])

// Solid
const [tasks, setTasks] = createSignal<string>("")
createEffect(() => { ... }) // No deps needed
const memoValue = createMemo(() => { ... }) // Auto-tracks
// No callback needed (functions are stable)
```

**Services** (Keep logic, adapt API calls):
- `brain-dump-services.ts` - processTasks(), createSession()
  - Uses fetch API (framework-agnostic) ✓
  - Retry logic with error handling ✓
  - Port to Solid Query for better DX

**Key Logic**:
1. User enters tasks (one per line)
2. `processTasks()` → `/api/tasks/process` → Claude AI
3. Returns `ProcessedStory[]` with tasks grouped
4. User edits durations
5. `createSession()` → `/api/tasks/create-session` → TimeBoxes
6. Saves to storage → Navigate to session

---

### 2. Session Manager (`app/features/session-manager/`) - Priority: HIGH

**Purpose**: Active session view with timer, progress, controls

**Components**:
- `session-view.tsx` (1295 lines!) - Main session UI
  - Active timer card
  - Floating timer (when scrolled)
  - Session metrics
  - Timeline view
- `vertical-timeline.tsx` - Visual progress timeline
- `timebox-view.tsx` - Individual timebox
- `session-debrief-modal.tsx` - Post-session reflection

**Hooks**:
- `useSession.ts` - Session state, timer logic
  - Timer tick (setInterval)
  - Play/pause/complete controls
  - Progress calculation
  - Status updates

**Services**:
- `session-storage.service.ts` - CRUD operations
  - LocalStorage fallback
  - Replicache integration
  - Timer state persistence
  - Status updates
- `debrief-storage.service.ts` - Debrief data

**Critical Features**:
- **Timer System**:
  - Countdown timer (minutes:seconds)
  - Play/pause/reset controls
  - Time adjustment (+/-1m, +/-5m)
  - Auto-advance to next timebox
  - Visual urgency (<60s red)
  - Floating timer on scroll
  
- **Animations** (Framer Motion → Motion One):
  - Floating timer entrance/exit
  - Progress bar fills
  - Urgency pulse animations
  - Timeline item highlights
  - Scroll-triggered visibility

**Conversion Challenges**:
1. Complex animation state (FloatingTimer wrappers)
2. Scroll intersection observer
3. Timer persistence on unmount
4. Optimistic UI updates

**Strategy**:
- Use `createEffect` for timer ticks
- `onCleanup` for timer intervals
- Motion One or CSS for animations
- Solid Transition API for route changes

---

### 3. Task Persistence (`app/features/task-persistence/`) - Priority: MEDIUM

**Purpose**: LocalStorage persistence

**Services**:
- `task-persistence.service.ts`
  - Save/load tasks from LocalStorage
  - Data validation
  - Simple CRUD operations

**Port Strategy**:
- Simplify: Remove all Replicache code
- Keep LocalStorage logic only
- Framework-agnostic service layer

---

### 4. Task Rollover (`app/features/task-rollover/`) - Priority: LOW

**Purpose**: Archive sessions, carry over tasks

**Components**:
- `TaskRollover.tsx` - Rollover UI

**Services**:
- `task-rollover.service.ts`
  - Archive/unarchive sessions
  - Get incomplete tasks
  - Rollover logic

**Port Strategy**: Straightforward service port

---

## UI Components (`components/ui/`)

### Replace with Kobalte

Current (Radix) → Target (Kobalte):

| Radix Component | Kobalte Component |
|-----------------|-------------------|
| @radix-ui/react-accordion | @kobalte/core/accordion |
| @radix-ui/react-alert-dialog | @kobalte/core/alert-dialog |
| @radix-ui/react-checkbox | @kobalte/core/checkbox |
| @radix-ui/react-dialog | @kobalte/core/dialog |
| @radix-ui/react-dropdown-menu | @kobalte/core/dropdown-menu |
| @radix-ui/react-label | @kobalte/core/label |
| @radix-ui/react-progress | @kobalte/core/progress |
| @radix-ui/react-select | @kobalte/core/select |
| @radix-ui/react-slider | @kobalte/core/slider |
| @radix-ui/react-tabs | @kobalte/core/tabs |
| @radix-ui/react-tooltip | @kobalte/core/tooltip |

**Action**: Create Kobalte versions of shadcn components in `taco/src/components/ui/`

**Reference**: [Kobalte Docs](https://kobalte.dev)

---

## API Routes (`app/api/`)

### Convert to SolidStart API Routes

```typescript
// Next.js: app/api/ai/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  // ...
  return NextResponse.json({ ... })
}

// SolidStart: src/routes/api/ai.ts
import { json, type APIEvent } from "solid-start/api"

export async function POST({ request }: APIEvent) {
  const body = await request.json()
  // ...
  return json({ ... })
}
```

**Routes to Convert**:
1. `/api/ai` - Claude integration
2. `/api/tasks/process` - Task processing
3. `/api/tasks/create-session` - Session creation
4. `/api/replicache` - Sync endpoint

---

## State Management Conversion

### React Hooks → Solid Primitives

```typescript
// ❌ React
const [count, setCount] = useState(0)
const [user, setUser] = useState<User | null>(null)

useEffect(() => {
  console.log('Count changed:', count)
}, [count])

const doubled = useMemo(() => count * 2, [count])
const increment = useCallback(() => setCount(c => c + 1), [])

// ✅ Solid
const [count, setCount] = createSignal(0)
const [user, setUser] = createSignal<User | null>(null)

createEffect(() => {
  console.log('Count changed:', count())
})

const doubled = createMemo(() => count() * 2)
const increment = () => setCount(c => c + 1) // No wrapper needed
```

### Context Pattern

```typescript
// ❌ React
const Context = createContext<Value>(defaultValue)

export function Provider({ children }) {
  const [state, setState] = useState(initial)
  return <Context.Provider value={{ state, setState }}>
    {children}
  </Context.Provider>
}

export function useMyContext() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('Missing provider')
  return ctx
}

// ✅ Solid
const Context = createContext<Value>(defaultValue)

export function Provider(props) {
  const [state, setState] = createSignal(initial)
  const value = { state, setState }
  return <Context.Provider value={value}>
    {props.children}
  </Context.Provider>
}

export function useMyContext() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('Missing provider')
  return ctx
}
```

---

## Animation Strategy

### Current: Framer Motion

```tsx
<motion.div
  initial={{ opacity: 0, y: 100 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 100 }}
  transition={{ duration: 0.3 }}
>
  {/* ... */}
</motion.div>
```

### Option 1: Motion One (Recommended)

```tsx
import { Motion } from "@motionone/solid"

<Motion
  initial={{ opacity: 0, y: 100 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 100 }}
  transition={{ duration: 0.3 }}
>
  {/* ... */}
</Motion>
```

### Option 2: CSS Animations (Fallback)

```css
@keyframes slideUp {
  from { opacity: 0; transform: translateY(100px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
```

**Decision**: Use Motion One for complex animations, CSS for simple ones.

---

## Routing Conversion

### Next.js App Router → SolidStart File-Based

```
Next.js                          SolidStart
-------                          ----------
app/page.tsx                  →  src/routes/index.tsx
app/sessions/page.tsx         →  src/routes/sessions.tsx
app/session/[date]/page.tsx   →  src/routes/session/[date].tsx
app/api/ai/route.ts           →  src/routes/api/ai.ts
app/layout.tsx                →  src/root.tsx + src/routes/*.tsx
```

### Dynamic Routes

```tsx
// Next.js
export default function SessionPage({ params }: { params: { date: string } }) {
  const { date } = params
  // ...
}

// SolidStart
import { useParams } from "@solidjs/router"

export default function SessionPage() {
  const params = useParams()
  const date = () => params.date
  // ...
}
```

---

## Data Fetching

### TanStack Query Migration

```typescript
// ❌ React Query
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['session', date],
  queryFn: () => fetchSession(date)
})

// ✅ Solid Query
import { createQuery } from '@tanstack/solid-query'

const query = createQuery(() => ({
  queryKey: ['session', date()],
  queryFn: () => fetchSession(date())
}))

const data = () => query.data
const isLoading = () => query.isLoading
const error = () => query.error
```

---

## Persistence Layer

### LocalStorage Only (Simplified)

**Current**: `lib/sessionStorage.ts` with Replicache + LocalStorage fallback

**New Strategy**: Strip out Replicache, keep LocalStorage only

**Simplified Service**:

```typescript
// Simple LocalStorage persistence
export const sessionStorage = {
  async saveSession(date: string, session: StoredSession): Promise<void> {
    const key = `session-${date}`
    const data = {
      ...session,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(key, JSON.stringify(data))
  },

  async getSession(date: string): Promise<StoredSession | null> {
    const key = `session-${date}`
    const data = localStorage.getItem(key)
    if (!data) return null
    return JSON.parse(data)
  },

  async getAllSessions(): Promise<StoredSession[]> {
    const sessions: StoredSession[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('session-')) {
        const date = key.replace('session-', '')
        const session = await this.getSession(date)
        if (session) sessions.push(session)
      }
    }
    return sessions
  },

  async deleteSession(date: string): Promise<void> {
    localStorage.removeItem(`session-${date}`)
  },

  async clearAllSessions(): Promise<void> {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('session-'))
    keys.forEach(key => localStorage.removeItem(key))
  }
}
```

**Benefits**:
- ✅ Simple, no dependencies
- ✅ Works immediately
- ✅ Easy to debug
- ✅ Can add sync later if needed

---

## Migration Checklist

**Current Progress**: Phase 1 Foundation - ✅ 100% Complete | Phase 2 Services - 43% Complete

**Files Ported**: 13 files, ~1,400 lines ✅  
**Build Status**: ✅ Passing  
**Branch**: `tempo-migration`  
**Commits**: 5 commits

---

### Phase 1: Foundation (Week 1) - ✅ COMPLETE
- [x] Set up SolidStart project structure (using existing TACo structure) ✅
- [x] Copy `lib/types.ts` (no changes) ✅
- [x] Port `lib/utils.ts` (pure functions) ✅
- [x] Port `lib/durationUtils.ts` ✅
- [x] Port `lib/transformUtils.ts` ✅
- [x] Set up Tailwind config (inherited from TACo) ✅
- [x] Create base UI components (Kobalte) ✅ **NEW**
  - Button (polymorphic, variants)
  - Card (+ subcomponents)
  - Badge
  - Input
  - Textarea
- [x] Install dependencies (Kobalte, CVA, etc.) ✅ **NEW**

### Phase 2: Services (Week 1-2)
- [x] Port `lib/task-manager.ts` ✅
- [ ] Port `lib/sessionStorage.ts` (remove Replicache)
- [x] Port `lib/ai.ts` ✅
- [ ] Port `brain-dump-services.ts`
- [ ] Port `session-storage.service.ts` (LocalStorage only)
- [x] Port `task-persistence.service.ts` (LocalStorage only) ✅
- [ ] Port `task-rollover.service.ts`

### Phase 3: API Routes (Week 2)
- [ ] Convert `/api/ai` to SolidStart
- [ ] Convert `/api/tasks/process`
- [ ] Convert `/api/tasks/create-session`
- [ ] Convert `/api/replicache`
- [ ] Test all endpoints

### Phase 4: Brain Dump Feature (Week 2-3)
- [ ] Port `BrainDump.tsx`
- [ ] Port `useBrainDump.ts` → Solid signals
- [ ] Port form components
- [ ] Port story display components
- [ ] Test AI integration
- [ ] Test session creation flow

### Phase 5: Session Manager (Week 3-4)
- [ ] Port `useSession.ts` → Solid signals
- [ ] Port `session-view.tsx` (complex!)
- [ ] Implement timer system
- [ ] Port vertical timeline
- [ ] Convert animations (Motion One)
- [ ] Test timer persistence
- [ ] Test floating timer

### Phase 6: Persistence (Week 4)
- [ ] Test LocalStorage CRUD operations
- [ ] Verify timer state persistence
- [ ] Test data migrations (if needed)
- [ ] Add export/import functionality (nice-to-have)

### Phase 7: Routing & Pages (Week 4-5)
- [ ] Create `/` (Home/Plan)
- [ ] Create `/sessions` (List)
- [ ] Create `/session/[date]` (Detail)
- [ ] Test navigation
- [ ] Test session modal

### Phase 8: Polish (Week 5)
- [ ] Dark mode (solid-theme or custom)
- [ ] Test all animations
- [ ] Performance optimization
- [ ] Error boundaries
- [ ] Loading states
- [ ] Responsive design

---

## Known Challenges & Solutions

### 1. Complex Timer State
**Challenge**: Timer uses multiple effects, refs, intervals  
**Solution**: Use `createEffect` with `onCleanup`, leverage Solid's fine-grained reactivity

### 2. Framer Motion Animations
**Challenge**: 50+ animation instances throughout app  
**Solution**: Use Motion One for complex, CSS for simple. Phase approach: CSS first, Motion One later

### 3. ~~Replicache Compatibility~~ **REMOVED**
**Decision**: Using LocalStorage only for simplicity  
**Benefits**: Faster development, simpler code, easier debugging

### 4. React 19's `use()` Pattern
**Challenge**: SessionPage uses `use(params)` for async params  
**Solution**: SolidStart handles async params differently (use `createAsync`)

### 5. Large Component Size
**Challenge**: `session-view.tsx` is 1295 lines  
**Solution**: Break into smaller components, port incrementally

---

## Performance Considerations

### Solid Advantages
1. **Fine-grained reactivity** - Only timer display updates, not full component
2. **No virtual DOM** - Direct DOM updates
3. **Smaller bundle** - ~6KB vs React's ~42KB
4. **Faster hydration** - Compiles to vanilla JS

### Optimizations to Keep
- Memoization (use `createMemo`)
- Code splitting (Solid supports lazy)
- Debouncing (timer updates, scroll events)

### Optimizations to Add
- `createResource` for async data
- Lazy-load timeline when scrolled into view
- Defer non-critical animations

---

## Testing Strategy

### Unit Tests
- Pure functions (utils, task-manager)
- Service layer (mock Replicache)
- Type validation

### Integration Tests
- Brain dump → Session creation flow
- Timer play/pause/complete
- Session persistence
- Rollover logic

### E2E Tests (Playwright)
- Full user journey: Dump → Create → Execute → Complete
- Timer accuracy
- Offline sync

---

## Rollback Plan

If Solid port encounters blockers:

1. **Animation too complex**: Use CSS, sacrifice some polish
2. **Timeline too slow**: Simplify design, remove some animations
3. **Solid Query issues**: Use `createResource` + manual cache
4. **LocalStorage limits**: Implement data cleanup/archiving (sessions older than 30 days)

---

## Success Metrics

### Functionality
- [ ] All features work (brain dump, timer, persistence, rollover)
- [ ] No regressions in AI processing
- [ ] Session data persists correctly in LocalStorage
- [ ] Data survives page reload

### Performance
- [ ] Initial load < 2s (vs Next.js ~3s)
- [ ] Timer updates < 16ms (60fps)
- [ ] Timeline scroll smooth
- [ ] Bundle size < 200KB (vs Next.js ~300KB)

### Code Quality
- [ ] Type safety maintained
- [ ] Feature modules intact
- [ ] No `any` types
- [ ] Clear separation of concerns

---

## Resources

### Documentation
- [SolidJS Docs](https://docs.solidjs.com)
- [SolidStart](https://start.solidjs.com)
- [Kobalte](https://kobalte.dev)
- [Motion One](https://motion.dev)
- [Solid Query](https://tanstack.com/query/latest/docs/framework/solid/overview)

### Examples
- [Solid Hacker News](https://github.com/solidjs/solid-hackernews)
- [Solid Realworld](https://github.com/solidjs/solid-realworld)

### Migration Guides
- [React to Solid](https://docs.solidjs.com/guides/comparison#react-to-solid)
- [TanStack Query Migration](https://tanstack.com/query/latest/docs/framework/solid/quick-start)

---

## Appendix: Key Files Reference

### Must-Read Files (Understand Before Porting)

1. **`lib/types.ts`** (225 lines) - Central type definitions
2. **`app/features/brain-dump/hooks/useBrainDump.ts`** (516 lines) - Brain dump state
3. **`app/features/session-manager/components/session-view.tsx`** (1295 lines) - Session UI
4. **`lib/sessionStorage.ts`** (617 lines) - Persistence layer
5. **`lib/task-manager.ts`** (378 lines) - Task grouping logic
6. **`app/features/brain-dump/services/brain-dump-services.ts`** (548 lines) - Core services

### Keep As-Is (Framework-Agnostic)

- All of `lib/*.ts` except React-specific ones
- All service files (`*service.ts`)
- `tailwind.config.ts`
- `tsconfig.json` (minor tweaks for Solid)

---

## Timeline Estimate

**Total**: 3-4 weeks (1 developer, full-time)

- **Week 1**: Foundation + Services (40%)
- **Week 2**: API Routes + Brain Dump (65%)
- **Week 3**: Session Manager + Persistence (85%)
- **Week 4**: Polish + Testing (100%)

**Confidence**: 85% (No Replicache complexity, main challenge is animations)

---

## Final Notes

This is a **high-quality codebase** with excellent architecture. The feature-based organization and clean separation of concerns make it very portable. By removing Replicache, we've eliminated a major complexity source.

**Main challenges** (reduced from 3 to 2):
1. **Animations** - Lots of Framer Motion to replace (use Motion One + CSS)
2. **Timer complexity** - 1295-line session view (break into smaller components)

**Advantages**:
- Business logic is framework-agnostic (50% of work already done)
- No sync complexity (LocalStorage is simple)
- Clean type system (port as-is)
- Well-organized features (port module by module)

**Overall Assessment**: Very feasible port, 3-4 weeks realistic timeline.

---

*Document generated from analysis of Tempo Next.js app at `/home/shuppdev/daemon/tempo`*
