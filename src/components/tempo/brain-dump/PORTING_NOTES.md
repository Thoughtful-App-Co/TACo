# Brain Dump Feature - Porting Notes

## ✅ Successfully Ported (13 files, ~2,300 lines)

### Components (5 files)

- `components/BrainDump.tsx` - Main simplified Brain Dump component
- `components/BrainDumpForm.tsx` - Detailed Brain Dump form with extensive features
- `components/ProcessedStories.tsx` - Displays processed work stories/blocks
- `components/StoryCard.tsx` - Individual story/work block display
- `components/DifficultyBadge.tsx` - Task complexity indicator badge

### Hooks (3 files)

- `hooks/useBrainDump.ts` - Main Brain Dump state management hook
- `hooks/useTaskProcessing.ts` - Task processing logic hook
- `hooks/useSessionCreation.ts` - Session creation logic hook

### Services (2 files)

- `services/brain-dump-services.ts` - Core Brain Dump API service (~548 lines)
- `services/badge-utils.ts` - Utility functions for difficulty badges

### Supporting Files (3 files)

- `types.ts` - TypeScript type definitions
- `rules/brain-dump-rules.ts` - Comprehensive system rules documentation (~313 lines)
- `index.ts` - Central export file

## 🔄 Automatic Import Conversions Applied

### Framework Conversions (React → Solid.js)

- ✅ `import { useState }` → `import { createSignal }`
- ✅ `import { useEffect }` → `import { createEffect }`
- ✅ `import { useCallback }` → removed (not directly needed in Solid)
- ✅ `import { useMemo }` → `import { createMemo }`
- ✅ `import { useRouter } from "next/navigation"` → `import { useNavigate } from "@solidjs/router"`
- ✅ `import Link from "next/link"` → `import { A } from "@solidjs/router"`

### Path Conversions

- ✅ `@/app/features/brain-dump` → relative paths
- ✅ `@/components/ui` → `../../ui`
- ✅ `@/lib/` → `../../lib/`
- ✅ Service imports updated to relative paths

## ⚠️ Manual Changes Still Required

### 1. Hook API Conversions

The following React patterns need manual conversion to Solid.js:

#### In all hooks (useBrainDump, useTaskProcessing, useSessionCreation):

```typescript
// BEFORE (React):
const [value, setValue] = useState(initialValue);

// AFTER (Solid.js):
const [value, setValue] = createSignal(initialValue);

// Usage changes:
// React: value
// Solid: value()  // NOTE: Must call as function!

// React: setValue(newValue)
// Solid: setValue(newValue)  // Same
```

#### Router usage in hooks:

```typescript
// BEFORE (Next.js):
const router = useRouter();
router.push('/path');

// AFTER (Solid.js):
const navigate = useNavigate();
navigate('/path');
```

#### useEffect → createEffect:

```typescript
// BEFORE (React):
useEffect(() => {
  // effect code
}, [dependencies]);

// AFTER (Solid.js):
createEffect(() => {
  // effect code
  // Dependencies are tracked automatically
});
```

#### useCallback removal:

```typescript
// BEFORE (React):
const callback = useCallback(() => {
  // code
}, [deps]);

// AFTER (Solid.js):
// Just use regular function - Solid.js doesn't need useCallback
const callback = () => {
  // code
};
```

#### useMemo → createMemo:

```typescript
// BEFORE (React):
const value = useMemo(() => computation(), [deps]);

// AFTER (Solid.js):
const value = createMemo(() => computation());
// Access with: value() not value
```

### 2. Component Conversions

#### Props interfaces - KEEP AS IS (TypeScript interfaces work the same)

#### Component function signatures:

```typescript
// BEFORE (React):
export const Component = ({ prop1, prop2 }: Props) => {
  return <div>...</div>
}

// AFTER (Solid.js):
export const Component = (props: Props) => {
  // Access props with: props.prop1, props.prop2
  return <div>...</div>
}
```

#### Event handlers:

```typescript
// BEFORE (React):
onChange={(e) => setValue(e.target.value)}

// AFTER (Solid.js):
onChange={(e) => setValue(e.target.value)}
// or use onInput for input elements
onInput={(e) => setValue(e.currentTarget.value)}
```

#### Conditional rendering:

```typescript
// BEFORE (React):
{condition && <Component />}

// AFTER (Solid.js):
<Show when={condition}>
  <Component />
</Show>
```

#### List rendering:

```typescript
// BEFORE (React):
{items.map((item, index) => <Item key={index} {...item} />)}

// AFTER (Solid.js):
<For each={items()}>
  {(item, index) => <Item {...item} />}
</For>
```

### 3. Specific File Changes Needed

#### `components/BrainDump.tsx`:

- Convert `useState` calls to `createSignal`
- Update Link component usage (A instead of Link)
- Change prop access from destructured to `props.propName`

#### `components/BrainDumpForm.tsx`:

- Same as BrainDump.tsx
- Add Solid.js Show/For components where needed

#### `hooks/useBrainDump.ts`:

- Convert all React hooks to Solid equivalents
- Change `router` to `navigate`
- Update all state accessors to function calls
- Remove useCallback (not needed)
- createMemo for computed values

#### `hooks/useTaskProcessing.ts` & `hooks/useSessionCreation.ts`:

- Same pattern as useBrainDump.ts

### 4. Missing UI Components

You'll need to ensure these UI components exist in `~/components/tempo/ui/`:

- Badge
- Button
- Card, CardContent
- Input
- Textarea
- Alert, AlertDescription, AlertTitle
- Tooltip, TooltipContent, TooltipProvider, TooltipTrigger

If they don't exist, you'll need to:

1. Create them as Solid.js components
2. Or import from a Solid.js UI library like Kobalte

### 5. Check Service Dependencies

Verify these services exist and are compatible:

- `../../services/session-storage.service` (SessionStorageService)
- `../../services/task-persistence.service` (TaskPersistenceService)
- `../../services/task-rollover.service` (TaskRolloverService)

## 📋 Testing Checklist

After manual conversions:

- [ ] All imports resolve correctly
- [ ] TypeScript compilation passes
- [ ] Signal accessors use () where needed
- [ ] Props are accessed via props.name not destructured
- [ ] Router navigation works
- [ ] UI components render correctly
- [ ] API calls to backend work
- [ ] State updates trigger re-renders
- [ ] Form submissions work
- [ ] Error handling displays properly

## 🎯 Next Steps

1. **Convert hooks first** - Start with smaller hooks (useTaskProcessing, useSessionCreation) then tackle useBrainDump
2. **Convert components** - Start with leaf components (DifficultyBadge, StoryCard) then work up
3. **Test incrementally** - Test each component/hook as you convert it
4. **Update imports in TempoApp.tsx** - Once components work, integrate into main app

## 📚 Resources

- [Solid.js Tutorial](https://www.solidjs.com/tutorial/introduction_basics)
- [Solid.js vs React](https://docs.solidjs.com/guides/comparison#react)
- [Solid Router Docs](https://docs.solidjs.com/solid-router)
- [Kobalte UI Library](https://kobalte.dev/) (if needed for UI components)
