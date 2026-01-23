# Tempo Session Manager Components

This document describes the key modal components used in the Tempo session manager for handling task and timebox completion flows.

---

## Overview

The session manager uses two distinct completion modals that serve different purposes:

| Modal                  | Trigger                            | Purpose                                             | Time Data                      |
| ---------------------- | ---------------------------------- | --------------------------------------------------- | ------------------------------ |
| `TaskCompletionModal`  | Checkbox click on a task           | Captures estimated time spent on individual task    | User-entered estimate          |
| `TimerCompletionModal` | Timer expires or "Complete" button | Celebrates timebox completion, offers to start next | Actual elapsed time from timer |

---

## TaskCompletionModal

**File:** `src/components/tempo/session-manager/components/task-completion-modal.tsx`

### Purpose

When a user checks off a task as complete, this modal appears to capture how long they estimate the task took. This enables time tracking at the task level for better productivity insights.

### Behavior

- **Mandatory interaction** - Cannot be dismissed by clicking outside or pressing Escape
- **No close button** - User must choose an action
- **Two valid actions:**
  - **"Skip Time"** - Marks task complete with 0 minutes (no time tracked)
  - **"Confirm"** - Marks task complete with selected/custom time

### Props

```typescript
interface TaskCompletionModalProps {
  isOpen: boolean;
  taskName: string;
  onConfirm: (minutesSpent: number) => void;
}
```

### Time Options

- Preset buttons: 5m, 10m, 15m, 20m, 30m, 45m, 1h
- Custom input: 1-480 minutes with NeoNumberInput

### Flow

```
User clicks task checkbox
         │
         ▼
┌────────────────────────────────────┐
│     TaskCompletionModal            │
│                                    │
│         Task Complete!             │
│    "[task name]"                   │
│                                    │
│   How long did this take?          │
│                                    │
│  [5m][10m][15m][20m][30m][45m][1h] │
│  [Custom]                          │
│                                    │
│  [Skip Time]         [Confirm]     │
└────────────────────────────────────┘
         │
         ├─── "Skip Time" ──► onConfirm(0) ──► Task complete, no time
         │
         └─── Select + "Confirm" ──► onConfirm(minutes) ──► Task complete with time
```

---

## TimerCompletionModal

**File:** `src/components/tempo/session-manager/components/timer-completion-modal.tsx`

### Purpose

Appears when a timebox is completed (either timer reaches zero or user clicks "Complete" button). Celebrates the completion and optionally offers to start the next timebox.

### Behavior

- **Mandatory interaction** - Cannot be dismissed by clicking outside
- **No close button** - User must choose an action
- **Two variants:**
  - **default** - Standard timebox completion
  - **success** - Session complete (all timeboxes done)

### Props

```typescript
interface TimerCompletionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  variant?: 'success' | 'default';
}
```

### Scenarios

#### Timebox Complete (more timeboxes remaining)

```
Timer expires or user clicks Complete
         │
         ▼
┌────────────────────────────────────┐
│     TimerCompletionModal           │
│                                    │
│         TimeBox Completed!         │
│   "Great work! Ready for next?"    │
│                                    │
│    [Cancel]         [Start Next]   │
└────────────────────────────────────┘
         │
         ├─── "Cancel" ──► Close modal, stay on current view
         │
         └─── "Start Next" ──► Start next timebox timer
```

#### All Tasks Complete in Timebox

```
User completes final task in active timebox
         │
         ▼
┌────────────────────────────────────┐
│     TimerCompletionModal           │
│                                    │
│      All Tasks Complete!           │
│  "Complete the timebox?"           │
│                                    │
│  [Cancel]      [Complete & Next]   │
└────────────────────────────────────┘
```

#### Session Complete (all timeboxes done)

```
Final timebox completed
         │
         ▼
┌────────────────────────────────────┐
│   TimerCompletionModal (success)   │
│                                    │
│      Session Complete!             │
│   "Congratulations!"               │
│                                    │
│           [Cancel]                 │
└────────────────────────────────────┘
```

---

## Time Data Flow

### Task-Level Time (TaskCompletionModal)

- **Source:** User estimate
- **Storage:** `task.actualMinutes` (TODO: extend data model)
- **Use case:** Understanding time spent on individual tasks

### Timebox-Level Time (Timer)

- **Source:** Actual timer countdown
- **Storage:** `timeBox.actualDuration`
- **Use case:** Comparing planned vs actual timebox duration

---

## State Management

Both modals are managed through `useSessionReducer`:

```typescript
// Task completion modal
taskCompletionModal: () => TaskCompletionModalState;
confirmTaskCompletion: (minutesSpent: number) => void;

// Timer completion modal
completionModal: () => CompletionModalState;
hideCompletionModal: () => void;
```

---

## Design Principles

1. **Mandatory Interaction** - Completion modals cannot be accidentally dismissed
2. **Clear Actions** - Button labels clearly indicate outcomes
3. **Celebration** - Visual feedback (icons, colors) celebrates progress
4. **Smooth Flow** - Seamless transition to next timebox when applicable
5. **Data Capture** - Every completion captures relevant time data

---

## Related Files

- `useSessionReducer.ts` - State management and modal triggers
- `session-view.tsx` - Renders both modals
- `vertical-timeline.tsx` - Task checkbox click handler
- `browser-notification.service.ts` - Browser notifications on completion
