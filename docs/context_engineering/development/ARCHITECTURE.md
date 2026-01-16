# TACo Architecture

High-level overview of TACo's monorepo architecture, project structure, and design decisions.

## Project Overview

TACo (Thoughtful App Co) is a monorepo containing multiple SolidJS applications built with:

- **Framework**: Solid.js 1.8.0 (frontend framework)
- **Build Tool**: Vite 5.0.0 (fast build tooling)
- **Language**: TypeScript 5.3.0 (type safety)
- **Styling**: Inline styles with design tokens + custom CSS classes
- **Deployment**: Cloudflare Pages (static hosting)
- **Backend**: Cloudflare Pages Functions (Workers)

## Directory Structure

```
TACo/
├── src/
│   ├── components/
│   │   ├── tempo/              # Tempo app (time management)
│   │   │   ├── TempoApp.tsx    # Root component
│   │   │   ├── brain-dump/     # Task input & AI processing
│   │   │   ├── session-manager/# Session tracking
│   │   │   └── theme/          # Tempo design tokens
│   │   ├── tenure/             # Tenure app (career management)
│   │   │   ├── prepare/        # Resume & job prep
│   │   │   ├── pipeline/       # Application tracking
│   │   │   └── prosper/        # Career reflection
│   │   ├── echoprax/           # Echoprax app (fitness tracking)
│   │   ├── nurture/            # Nurture app (relationship management)
│   │   ├── common/             # Shared components (Paywall, etc.)
│   │   └── pricing/            # Pricing page components
│   ├── lib/                    # Shared utilities
│   │   ├── auth-context.tsx    # Authentication state
│   │   ├── feature-gates.ts    # Premium feature gating
│   │   └── logger.ts           # Centralized logging
│   ├── services/               # API clients (BLS, O*NET, etc.)
│   ├── schemas/                # Zod validation schemas
│   ├── theme/                  # Theme configurations
│   ├── App.tsx                 # Main router & app shell
│   └── index.tsx               # Entry point
├── functions/                  # Cloudflare Pages Functions (API routes)
│   ├── api/
│   │   ├── auth/               # Authentication endpoints
│   │   ├── billing/            # Stripe integration
│   │   ├── resume/             # Resume parsing/mutation
│   │   └── tasks/              # Task processing (Tempo)
│   └── lib/                    # Backend utilities
├── migrations/                 # D1 database schema migrations
├── public/
│   ├── fonts/                  # Geist variable fonts
│   └── [app-assets]/           # App-specific static assets
├── docs/                       # Documentation
│   ├── core/                   # Core system docs
│   ├── tenure/                 # Tenure-specific docs
│   ├── tempo/                  # Tempo-specific docs
│   ├── echoprax/               # Echoprax-specific docs
│   └── context_engineering/    # Design & development guides
├── .github/workflows/          # CI/CD pipelines
├── eslint.config.js            # ESLint config
├── .prettierrc.json            # Prettier config
├── postcss.config.js           # PostCSS config (if needed)
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
├── wrangler.toml               # Cloudflare Workers config
└── package.json                # Dependencies & scripts
```

## Component Architecture

### Tempo App

**Root Component**: `src/components/tempo/TempoApp.tsx`

The Tempo app consists of:

1. **BrainDump** (`brain-dump/`)
   - Task input textarea
   - AI processing integration
   - Processes task descriptions into structured stories
   - Manages form state

2. **Session Manager** (`session-manager/`)
   - Timer display and controls
   - Session tracking
   - Story block management
   - Timeline visualization

3. **UI Components** (`ui/`)
   - Button, Card, Badge
   - Input, Textarea, Progress
   - Logo component
   - All styled inline with design tokens

### Design System

**Location**: `src/components/tempo/theme/tempo-design.ts`

Centralized design tokens:

```typescript
tempoDesign: {
  colors: { ... },      // Color palette
  typography: { ... },  // Font settings
  spacing: { ... },     // Spacing scale
  radius: { ... },      // Border radius
  shadows: { ... },     // Box shadows
  transitions: { ... }  // Animation timing
}

tempoComponents: {
  button: { ... },
  card: { ... },
  // etc.
}
```

### Services

**Location**: `src/components/tempo/services/`

Business logic separated from UI:

- `brain-dump.service.ts` - Task processing
- `session-storage.service.ts` - Local storage management
- `task-persistence.service.ts` - Task saving
- `task-rollover.service.ts` - Daily task rollover
- `debrief-storage.service.ts` - Session debriefing

### Augment App

**Root Component**: `src/components/augment/AugmentApp.tsx`

The Augment app is a career intelligence system with three integrated phases:

1. **Discover** (`AugmentApp.tsx` - RIASEC tab)
   - IO psychology-based personality assessment (RIASEC/Holland Codes)
   - Career aptitude evaluation
   - Work style analysis
   - Foundation for career self-knowledge

2. **Matches** (`AugmentApp.tsx` - Matches tab)
   - Personality-aligned career recommendations
   - RIASEC fit scoring
   - Career exploration based on assessment results

3. **Prospect** (`pipeline/` directory)
   - Job application tracking pipeline
   - Kanban board with 8 statuses
   - Analytics dashboard (stats, Sankey flow)
   - Rejection tracking and insights
   - Archive filtering
   - RIASEC integration per application

**Design System**: Maximalist + Liquid theme

- **Theme**: `src/components/augment/pipeline/theme/liquid-augment.ts`
- **Colors**: Duotone system based on RIASEC types
- **Animation**: Fluid morphing, glassmorphic surfaces
- **Components**: FluidCard, ProspectSidebar, JobDetailSidebar

**Key Components**:

**Navigation**:

- `ProspectSidebar.tsx` - Left navigation (Dashboard/Pipeline/Insights/Settings)
- `PipelineView.tsx` - Main container with sidebar integration

**Views**:

- `DashboardView.tsx` - Stats overview, recent activity, quick actions
- `PipelineDashboard.tsx` - Kanban board, archive filter
- `InsightsView.tsx` - Analytics (Sankey flow, metrics)
- `SankeyView.tsx` - Flow visualization (status transitions)

**Modals**:

- `AddJobModal.tsx` - Create new job application
- `ImportCSVModal.tsx` - Bulk import jobs
- `JobDetailSidebar.tsx` - Edit application details

**Services** (future):

- Local storage for applications
- RIASEC score persistence
- Export/import functionality

**Schema**: `src/schemas/pipeline.schema.ts`

- `JobApplication` - Application data model
- `PipelineStatus` - Status enum
- Includes `rejectedAtStatus` for drop-off analysis

## Data Flow

```
User Input
    ↓
BrainDump Component (useState)
    ↓
Brain Dump Service (processTask)
    ↓
AI Processing (Claude API)
    ↓
ProcessedStories
    ↓
Update Stats
    ↓
Local Storage Service
    ↓
Persist to Browser Storage
```

## Styling Strategy

### Inline Styles with Design Tokens

- **No CSS Framework**: No Tailwind, Bootstrap, or external CSS frameworks
- **Inline Styles**: JSX style objects for component styling
- **Design Tokens**: Centralized tokens per app (tempo-design.ts, etc.)
- **Custom CSS Classes**: Global styles in `src/index.css` for base resets and utilities

### Component Styling

```typescript
// Inline styles with design tokens (primary approach)
<div style={{
  background: tempoDesign.colors.primary,
  color: tempoDesign.colors.text,
  padding: tempoDesign.spacing.lg,
  borderRadius: tempoDesign.radius.md
}}>
  Content
</div>

// Or with component token objects
<button style={tempoComponents.button.primary}>
  Click me
</button>
```

## State Management

### Solid.js Signals

Uses Solid's reactive primitives:

- `createSignal` - Reactive state
- `createEffect` - Side effects
- `createMemo` - Computed values
- `Show` - Conditional rendering
- `For` - List rendering

### Local Storage

Browser LocalStorage for persistence:

- Session data
- Task history
- User preferences

## Responsive Design

**Breakpoints**:

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Implementation**:

- CSS classes in global styles
- Media queries override grid layout
- Mobile-first approach

## Build & Deployment

### Vite Build

```bash
pnpm run build  # Generates optimized dist/
```

**Output**:

- HTML, CSS, JS bundles
- Asset optimization
- Source maps
- ~390KB JS (102KB gzipped)

### Cloudflare Pages

- Static file hosting
- Automatic deployments from GitHub
- CI/CD pipeline validation
- Environment variables via secrets

## Code Quality

### ESLint

Static analysis configuration:

- TypeScript rules
- Solid.js specific rules
- React-to-Solid compatibility checks

### Prettier

Code formatting:

- 2-space indentation
- 100-character line width
- Single quotes
- Trailing commas

### TypeScript

Type safety throughout:

- Strict mode enabled
- JSDoc comments
- Interface definitions
- Generic types

### Pre-commit Hooks

Husky + lint-staged:

- Auto-linting on commit
- Auto-formatting on commit
- Prevents bad commits

## Performance Characteristics

**Bundle Size**: 389.54 KB (102.59 KB gzipped)

**Optimizations**:

- No external CSS framework
- Minimal dependencies
- Tree-shaking enabled
- Code splitting ready

**Metrics**:

- 980 modules
- Zero external CSS dependencies
- Inline design system

## Key Design Decisions

1. **Solid.js** - Fine-grained reactivity, smaller bundle
2. **Inline Styles** - No CSS parsing overhead, co-located styles
3. **Design Tokens** - Single source of truth, maintainability
4. **TypeScript** - Catch errors early, better IDE support
5. **Vite** - Fast builds, ESM-native
6. **Cloudflare Pages** - Automatic deployments, edge caching

## Future Considerations

- Jest/Vitest for automated testing
- Component library documentation
- Performance monitoring
- A/B testing framework
- Analytics integration
- PWA capabilities

## Dependencies

**Core**:

- solid-js
- @solidjs/router
- typescript
- vite
- vite-plugin-solid

**UI**:

- phosphor-solid (icons)
- class-variance-authority
- clsx

**Utilities**:

- date-fns
- zod
- @anthropic-ai/sdk

**Dev Tools**:

- eslint
- prettier
- husky
- @typescript-eslint/\*

---

See [Development Guide](./DEVELOPMENT.md) for development workflow.
