# Brain Dump Feature

A comprehensive task processing and session planning system that helps users organize their work into structured, time-boxed sessions.

## Overview

The Brain Dump feature allows users to:

1. **Input raw tasks** - Simply dump all tasks without worrying about organization
2. **AI Processing** - Tasks are analyzed, grouped into stories, and enriched with metadata
3. **Session Creation** - Processed stories are converted into time-boxed work sessions
4. **Smart Scheduling** - Automatic break insertion, duration validation, and work/rest balance

## Architecture

```
brain-dump/
├── components/          # UI Components
│   ├── BrainDump.tsx           # Main simplified component
│   ├── BrainDumpForm.tsx       # Detailed form component
│   ├── ProcessedStories.tsx    # Story list display
│   ├── StoryCard.tsx           # Individual story display
│   └── DifficultyBadge.tsx     # Task complexity indicator
├── hooks/               # State Management Hooks
│   ├── useBrainDump.ts         # Main hook (516 lines)
│   ├── useTaskProcessing.ts    # Task processing logic
│   └── useSessionCreation.ts   # Session creation logic
├── services/            # Business Logic
│   ├── brain-dump-services.ts  # Core API service (548 lines)
│   └── badge-utils.ts          # Utility functions
├── rules/               # Documentation
│   └── brain-dump-rules.ts     # System rules (313 lines)
├── types.ts             # TypeScript definitions
└── index.ts             # Public exports
```

## Key Features

### 1. Intelligent Task Processing

- **AI-Powered Analysis** - Uses AI to understand task context, priority, and complexity
- **Smart Grouping** - Groups related tasks into coherent work stories
- **Duration Estimation** - Suggests realistic time estimates for tasks
- **Priority Detection** - Identifies high-priority "FROG" tasks
- **Difficulty Assessment** - Rates task complexity (low/medium/high)

### 2. Session Planning

- **Time-Boxing** - Creates focused work blocks with defined durations
- **Break Management** - Automatically inserts breaks to prevent burnout
- **Duration Rules** - Enforces productivity-optimized work intervals
- **Validation** - Ensures sessions follow best practices
- **Retry Logic** - Handles errors gracefully with automatic adjustments

### 3. User Experience

- **Simple Input** - Just type tasks, one per line
- **Real-Time Feedback** - Progress indicators during processing
- **Editable Durations** - Adjust time estimates before creating session
- **Error Recovery** - Clear error messages with retry options
- **Tips & Guidance** - Helpful tooltips and examples

## Usage

### Basic Example

```typescript
import { BrainDump } from '~/components/tempo/brain-dump'

function MyApp() {
  const handleTasksProcessed = (stories) => {
    console.log('Processed stories:', stories)
  }

  return <BrainDump onTasksProcessed={handleTasksProcessed} />
}
```

### Using the Hook Directly

```typescript
import { useBrainDump } from '~/components/tempo/brain-dump'

function CustomBrainDump() {
  const {
    tasks,
    setTasks,
    processedStories,
    isProcessing,
    error,
    processTasks,
    handleCreateSession
  } = useBrainDump()

  return (
    <div>
      <textarea value={tasks()} onInput={(e) => setTasks(e.currentTarget.value)} />
      <button onClick={() => processTasks()} disabled={isProcessing()}>
        Process
      </button>
      {/* Display processed stories */}
    </div>
  )
}
```

## Task Input Format

### Basic Tasks

```
Update client dashboard
Review Q1 metrics
Schedule team meeting
```

### With Time Estimates

```
Create landing page mockup - 2h
Review Q1 metrics - 30m
Daily standup - 15m
```

### With Priorities

```
Fix production bug FROG
Update documentation
Complete quarterly report - EOD
```

### Advanced Format

```
Create landing page mockup FROG - 2h
Review Q1 metrics - 30m - due by 3pm
Update team documentation - flexible
Schedule team meeting - by Thursday
```

## Duration Rules

The system enforces these rules for optimal productivity:

- **MIN_DURATION**: 15 minutes (minimum task duration)
- **BLOCK_SIZE**: 5 minutes (time increments)
- **MAX_DURATION**: 180 minutes (max single task)
- **MAX_WORK_WITHOUT_BREAK**: 90 minutes (requires break after)
- **SHORT_BREAK**: 5 minutes
- **LONG_BREAK**: 15 minutes
- **DEBRIEF**: 5 minutes (after story completion)

## API Endpoints

### POST /api/tasks/process

Processes raw tasks into structured stories.

**Request:**

```json
{
  "tasks": ["Task 1", "Task 2 FROG", "Task 3 - 30m"]
}
```

**Response:**

```json
{
  "stories": [
    {
      "title": "Story Title",
      "summary": "Description",
      "type": "timeboxed",
      "estimatedDuration": 60,
      "tasks": [
        {
          "title": "Task 1",
          "duration": 30,
          "difficulty": "medium",
          "isFrog": false
        }
      ]
    }
  ]
}
```

### POST /api/tasks/create-session

Creates a time-boxed session from stories.

**Request:**

```json
{
  "stories": [...],
  "startTime": "2025-12-02T10:00:00Z"
}
```

**Response:**

```json
{
  "storyBlocks": [...],
  "totalDuration": 120,
  "startTime": "2025-12-02T10:00:00Z",
  "endTime": "2025-12-02T12:00:00Z"
}
```

## State Management

The `useBrainDump` hook manages:

- Task input state
- Processed stories
- Duration edits
- Processing states
- Error handling
- Session creation

## Error Handling

The system handles errors at multiple levels:

1. **Validation Errors** - Invalid input, missing fields
2. **Processing Errors** - AI processing failures
3. **Duration Errors** - Invalid time constraints
4. **Session Errors** - Session creation failures

Each error includes:

- Clear message
- Error code
- Technical details (for debugging)
- Retry capability

## Performance

- **Retry Logic**: Up to 10 attempts for session creation
- **Task Splitting**: Automatic for long tasks (>60m)
- **Break Insertion**: Automatic based on work duration
- **Validation**: Multi-level validation prevents invalid sessions

## Contributing

When modifying the Brain Dump feature:

1. Review `rules/brain-dump-rules.ts` for system constraints
2. Update types in `types.ts`
3. Test with various task formats
4. Ensure duration rules are respected
5. Handle errors gracefully

## See Also

- `PORTING_NOTES.md` - Porting guide from React/Next.js to Solid.js
- `rules/brain-dump-rules.ts` - Complete system rules documentation
- Parent Tempo app documentation
