# Tempo Architecture

High-level overview of Tempo's architecture, project structure, and design decisions.

## Project Overview

Tempo is a premium time-management application built with:

- **Framework**: Solid.js 1.8.0 (frontend framework)
- **Build Tool**: Vite 5.0.0 (fast build tooling)
- **Language**: TypeScript 5.3.0 (type safety)
- **Styling**: Inline styles with design tokens (no CSS framework)
- **Deployment**: Cloudflare Pages (static hosting)

## Directory Structure

```
tempo/
├── src/
│   ├── components/
│   │   ├── tempo/              # Main Tempo app
│   │   │   ├── TempoApp.tsx    # Root component
│   │   │   ├── brain-dump/     # Task input & processing
│   │   │   ├── session-manager/# Session tracking
│   │   │   ├── ui/             # Reusable UI components
│   │   │   ├── services/       # Business logic
│   │   │   ├── lib/            # Utilities & types
│   │   │   └── theme/          # Design tokens
│   │   ├── augment/            # Other app features
│   │   ├── friendly/
│   │   ├── justincase/
│   │   ├── lol/
│   │   ├── manifest/
│   │   └── nurture/
│   ├── App.tsx                 # Main router
│   ├── index.tsx               # Global styles & entry
│   └── schemas/                # Validation schemas
├── functions/                  # Edge functions (optional)
├── public/
│   ├── fonts/                  # Geist variable fonts
│   ├── tempo/                  # Tempo-specific assets
│   └── [policies]              # Legal docs
├── docs/                       # Documentation
│   ├── setup/                  # Getting started
│   ├── development/            # Development guides
│   ├── design/                 # Design specifications
│   ├── deployment/             # Deployment guides
│   └── guides/                 # Additional guides
├── .github/workflows/          # CI/CD pipelines
├── eslint.config.js            # ESLint config
├── .prettierrc.json            # Prettier config
├── .editorconfig               # Editor settings
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
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

### No CSS Framework

- **No Tailwind**: Removed entirely
- **Inline Styles**: All styling via inline style objects
- **Design Tokens**: Centralized in `tempo-design.ts`
- **Responsive**: Media queries in global styles + CSS classes

### Component Styling

```typescript
<div style={{
  background: tempoDesign.colors.primary,
  padding: tempoDesign.spacing.lg,
  borderRadius: tempoDesign.radius.md,
  transition: `all ${tempoDesign.transitions.normal}`
}}>
  Content
</div>
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
npm run build  # Generates optimized dist/
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
