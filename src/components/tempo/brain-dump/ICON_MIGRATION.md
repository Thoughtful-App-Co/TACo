# Icon Migration: Lucide → Phosphor

## Brain Dump Components Icon Mapping

### DifficultyBadge.tsx

- `Clock` (lucide) → `Clock` (phosphor-solid)

### ProcessedStories.tsx

- `InfoIcon` (lucide) → `Info` (phosphor-solid)
- `Loader2` (lucide) → `CircleNotch` (phosphor-solid) with spin animation

### StoryCard.tsx

- `Clock` (lucide) → `Clock` (phosphor-solid)
- `Info` (lucide) → `Info` (phosphor-solid)

### BrainDump.tsx

- `Loader2` (lucide) → `CircleNotch` (phosphor-solid)
- `Lock` (lucide) → `Lock` (phosphor-solid)
- `ChevronRight` (lucide) → `CaretRight` (phosphor-solid)
- `HelpCircle` (lucide) → `Question` (phosphor-solid)

### BrainDumpForm.tsx

- `Info` (lucide) → `Info` (phosphor-solid)
- `Loader2` (lucide) → `CircleNotch` (phosphor-solid)
- `Lock` (lucide) → `Lock` (phosphor-solid)
- `Unlock` (lucide) → `LockOpen` (phosphor-solid)
- `XCircle` (lucide) → `XCircle` (phosphor-solid)
- `Bug` (lucide) → `Bug` (phosphor-solid)

## Usage Pattern

```tsx
// BEFORE (Lucide):
import { Clock, Loader2 } from "lucide-solid"
<Clock className="h-4 w-4" />
<Loader2 className="animate-spin" />

// AFTER (Phosphor):
import { Clock, CircleNotch } from "phosphor-solid"
<Clock class="h-4 w-4" />
<CircleNotch class="animate-spin" />
```

## Notes

- Phosphor icons use the same props interface
- className → class (Solid.js pattern)
- CircleNotch is the Phosphor equivalent of Loader2 for loading spinners
- All other icon names are similar or identical
