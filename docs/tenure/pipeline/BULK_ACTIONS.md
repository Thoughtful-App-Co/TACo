# Bulk Actions & Selection System

**Last Updated:** December 29, 2025  
**Version:** 1.0

---

## Overview

The Tenure Pipeline supports multi-select functionality for performing bulk operations on job applications. This enables users to efficiently manage multiple applications at once—updating statuses, deleting entries, or organizing their pipeline with fewer clicks.

---

## Features

### Core Capabilities

| Feature                           | Description                                                             |
| --------------------------------- | ----------------------------------------------------------------------- |
| **Multi-select via checkboxes**   | Click checkboxes on individual application cards or rows to select them |
| **Bulk status change**            | Move multiple applications to a new status simultaneously               |
| **Bulk delete with confirmation** | Delete multiple applications at once with a safety confirmation modal   |
| **Select all in status**          | Select all applications within a specific pipeline column               |

---

## Selection State

**File:** `src/components/tenure/pipeline/store.ts`

The selection state is managed in the pipeline store as a reactive `Set<string>` containing the IDs of selected applications.

### State Structure

```typescript
interface PipelineStoreState {
  // ... other state

  // Selection state for bulk operations
  selectedIds: Set<string>;
}
```

### Selection Actions

| Action             | Signature                 | Description                                 |
| ------------------ | ------------------------- | ------------------------------------------- |
| `toggleSelection`  | `(id: string) => void`    | Toggles an application's selection state    |
| `selectAll`        | `(ids: string[]) => void` | Selects all applications with the given IDs |
| `clearSelection`   | `() => void`              | Clears all selections                       |
| `isSelected`       | `(id: string) => boolean` | Checks if an application is selected        |
| `getSelectedCount` | `() => number`            | Returns the count of selected applications  |

### Bulk Operation Actions

| Action             | Signature                                               | Description                                  |
| ------------------ | ------------------------------------------------------- | -------------------------------------------- |
| `bulkUpdateStatus` | `(newStatus: ApplicationStatus, note?: string) => void` | Updates status for all selected applications |
| `bulkDelete`       | `() => void`                                            | Deletes all selected applications            |

### Implementation Details

```typescript
// Toggle individual selection
toggleSelection: (id: string) => {
  setState('selectedIds', (prev) => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });
},

// Select multiple by IDs
selectAll: (ids: string[]) => {
  setState('selectedIds', new Set(ids));
},

// Clear all selections
clearSelection: () => {
  setState('selectedIds', new Set<string>());
},

// Check selection state
isSelected: (id: string): boolean => {
  return state.selectedIds.has(id);
},

// Get selection count
getSelectedCount: (): number => {
  return state.selectedIds.size;
},
```

---

## UI Components

### Checkbox Component

**File:** `src/components/tenure/pipeline/ui/Checkbox.tsx`

A custom checkbox component supporting checked, indeterminate, and disabled states with smooth transitions.

#### Props

| Prop            | Type                         | Default     | Description                            |
| --------------- | ---------------------------- | ----------- | -------------------------------------- |
| `checked`       | `boolean`                    | required    | Whether the checkbox is checked        |
| `onChange`      | `(checked: boolean) => void` | required    | Callback when checkbox state changes   |
| `size`          | `'sm' \| 'md'`               | `'md'`      | Size variant                           |
| `disabled`      | `boolean`                    | `false`     | Disables interaction                   |
| `indeterminate` | `boolean`                    | `false`     | Shows indeterminate state (minus icon) |
| `accentColor`   | `string`                     | `'#3b82f6'` | Accent color for checked state         |

#### Usage

```tsx
import { Checkbox } from '../ui';

<Checkbox
  checked={isSelected}
  onChange={(checked) => handleSelection(appId, checked)}
  size="sm"
  accentColor={statusColor}
/>;
```

#### Accessibility

- Uses `role="checkbox"` with proper `aria-checked` states
- Supports keyboard navigation (Space and Enter keys)
- Respects `aria-disabled` for disabled state

---

### BulkActionsBar Component

**File:** `src/components/tenure/pipeline/components/BulkActionsBar.tsx`

A floating action bar that appears when applications are selected, providing bulk operation controls.

#### Props

| Prop                 | Type                                  | Description                      |
| -------------------- | ------------------------------------- | -------------------------------- |
| `selectedCount`      | `number`                              | Number of selected applications  |
| `onClearSelection`   | `() => void`                          | Callback to clear all selections |
| `onBulkStatusChange` | `(status: ApplicationStatus) => void` | Callback for bulk status updates |
| `onBulkDelete`       | `() => void`                          | Callback for bulk delete         |
| `theme`              | `() => typeof liquidTenure`           | Theme accessor function          |
| `isOpen`             | `boolean`                             | Controls visibility of the bar   |

#### Visual Design

- **Position:** Fixed at bottom center of viewport
- **Appearance:** Glass morphism background with blur effect
- **Animation:** Slides up when appearing, slides down when dismissing

#### Features

1. **Count Badge:** Shows number of selected applications with dynamic pluralization
2. **Clear Button:** Clears all selections
3. **Status Dropdown:** "Move to..." dropdown with all 8 statuses, color-coded with status indicators
4. **Delete Button:** Red-styled button for bulk deletion

#### Usage

```tsx
import { BulkActionsBar } from './BulkActionsBar';

<BulkActionsBar
  selectedCount={selectedCount()}
  onClearSelection={() => pipelineStore.clearSelection()}
  onBulkStatusChange={handleBulkStatusChange}
  onBulkDelete={handleBulkDelete}
  theme={currentTheme}
  isOpen={hasSelection()}
/>;
```

---

### Integration with PipelineDashboard

**File:** `src/components/tenure/pipeline/components/PipelineDashboard.tsx`

The dashboard integrates selection throughout both Kanban and List views.

#### ApplicationCard Integration

Checkboxes appear on hover or when selected:

```tsx
<ApplicationCard
  application={app}
  theme={props.theme}
  onClick={() => props.onSelectJob(app)}
  isSelected={props.isSelected(app.id)}
  onCheckboxChange={handleCheckboxChange}
/>
```

CSS handles hover visibility:

```css
.application-card:hover .card-checkbox {
  opacity: 1 !important;
}
```

#### ApplicationRow Integration

Same pattern for list view rows:

```tsx
<ApplicationRow
  application={app}
  theme={theme}
  onClick={() => props.onSelectJob(app)}
  isSelected={pipelineStore.isSelected(app.id)}
  onCheckboxChange={handleCheckboxChange}
/>
```

#### Selection Props Pattern

Both `ApplicationCard` and `ApplicationRow` accept:

| Prop               | Type                                     | Description                   |
| ------------------ | ---------------------------------------- | ----------------------------- |
| `isSelected`       | `boolean`                                | Whether this item is selected |
| `onCheckboxChange` | `(id: string, checked: boolean) => void` | Selection change handler      |

---

## Usage Examples

### Toggling Selection

```typescript
import { pipelineStore } from './store';

// Toggle a single application
pipelineStore.toggleSelection('app-123');

// Check if selected
const selected = pipelineStore.isSelected('app-123'); // true/false

// Get count
const count = pipelineStore.getSelectedCount(); // number
```

### Bulk Status Change

```typescript
import { pipelineStore } from './store';
import { ApplicationStatus } from '../../../schemas/pipeline.schema';

// In a component handler:
const handleBulkStatusChange = (status: ApplicationStatus) => {
  pipelineStore.bulkUpdateStatus(status, 'Bulk update from dashboard');
};

// The store action:
// - Iterates through all selectedIds
// - Updates each application's status with proper statusHistory tracking
// - Handles rejectedAtStatus for terminal statuses
// - Clears selection after completion
```

### Bulk Delete

```typescript
import { pipelineStore } from './store';

// With confirmation modal:
const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

const handleBulkDelete = () => {
  setShowDeleteConfirm(true);
};

const confirmBulkDelete = () => {
  pipelineStore.bulkDelete();
  setShowDeleteConfirm(false);
};

// In JSX:
<DeleteConfirmationModal
  isOpen={showDeleteConfirm()}
  onClose={() => setShowDeleteConfirm(false)}
  onConfirm={confirmBulkDelete}
  title="Delete Selected Applications"
  message={`Are you sure you want to delete ${selectedCount()} application${selectedCount() !== 1 ? 's' : ''}?`}
/>
```

### Select All in Status Column

```typescript
const handleSelectAllInStatus = (status: ApplicationStatus) => {
  const appsInStatus = applicationsByStatus()[status];
  const ids = appsInStatus.map((app) => app.id);
  pipelineStore.selectAll(ids);
};
```

---

## Keyboard Shortcuts

| Shortcut               | Action                              | Status     |
| ---------------------- | ----------------------------------- | ---------- |
| `Ctrl+A` / `Cmd+A`     | Select all visible applications     | 🔮 Planned |
| `Escape`               | Clear selection                     | 🔮 Planned |
| `Delete` / `Backspace` | Delete selected (with confirmation) | 🔮 Planned |

_Note: Keyboard shortcuts are planned for a future release._

---

## Best Practices

### For Users

1. **Use bulk actions for efficiency** when managing many applications at once
2. **Review selections** before performing destructive actions like delete
3. **Use status dropdown** rather than drag-and-drop when moving multiple items
4. **Clear selection** after completing bulk operations to avoid accidental changes

### For Developers

1. **Always clear selection after bulk operations** to reset UI state:

   ```typescript
   setState('selectedIds', new Set<string>());
   ```

2. **Maintain status history** during bulk updates—don't skip `statusHistory`:

   ```typescript
   const statusChange: StatusChange = {
     status: newStatus,
     timestamp: now,
     note,
   };
   ```

3. **Track rejection context** when bulk-moving to terminal statuses:

   ```typescript
   if (newStatus === 'rejected' || newStatus === 'withdrawn') {
     updates.rejectedAtStatus = app.status;
   }
   ```

4. **Use confirmation modals** for destructive bulk operations

5. **Provide visual feedback** for selection state in both card and row views

6. **Support hover-to-reveal** checkboxes for cleaner default UI

---

## Related Documentation

- [STATUS_SYSTEM.md](./STATUS_SYSTEM.md) - Status definitions and transitions
- [THEMING.md](../THEMING.md) - Color system and theme tokens
- [SYNC_INTEGRATION.md](../SYNC_INTEGRATION.md) - Data synchronization

---

## For AI Agents

When working with bulk actions:

1. **Use store actions**, never manipulate `selectedIds` directly
2. **Clear selection** after bulk operations complete
3. **Respect confirmation flows** for destructive actions
4. **Track status history** properly in bulk updates
5. **Handle `rejectedAtStatus`** when bulk-moving to rejected/withdrawn

### Common Patterns

```typescript
// ✅ Correct: Use store actions
pipelineStore.toggleSelection(id);
pipelineStore.bulkUpdateStatus('applied');
pipelineStore.bulkDelete();

// ❌ Incorrect: Direct manipulation
state.selectedIds.add(id);
```

---

_Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved._
