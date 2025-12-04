import { Component, createSignal, Show, For } from 'solid-js';
import { X, Plus, Trash, Brain, Timer, ListBullets } from 'phosphor-solid';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { tempoDesign } from '../../theme/tempo-design';

export type SessionMode = 'tasks' | 'flow';

export interface UserSubtask {
  id: string;
  title: string;
  status: 'todo' | 'completed';
}

interface StartTimeBoxModalProps {
  isOpen: boolean;
  storyTitle: string;
  timeBoxDuration: number;
  existingTasks?: Array<{ id: string; title: string; status?: string }>;
  onClose: () => void;
  onStart: (mode: SessionMode, subtasks: UserSubtask[]) => void;
}

export const StartTimeBoxModal: Component<StartTimeBoxModalProps> = (props) => {
  const [sessionMode, setSessionMode] = createSignal<SessionMode>('tasks');
  const [subtasks, setSubtasks] = createSignal<UserSubtask[]>([]);
  const [newTaskText, setNewTaskText] = createSignal('');

  // Initialize with existing tasks if provided
  const initializeSubtasks = () => {
    if (props.existingTasks && props.existingTasks.length > 0) {
      setSubtasks(
        props.existingTasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: (t.status as 'todo' | 'completed') || 'todo',
        }))
      );
    } else {
      setSubtasks([]);
    }
  };

  // Reset state when modal opens
  const handleOpen = () => {
    initializeSubtasks();
    setNewTaskText('');
    setSessionMode('tasks');
  };

  // Add a new subtask
  const addSubtask = () => {
    const text = newTaskText().trim();
    if (!text) return;

    const newTask: UserSubtask = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: text,
      status: 'todo',
    };

    setSubtasks([...subtasks(), newTask]);
    setNewTaskText('');
  };

  // Remove a subtask
  const removeSubtask = (id: string) => {
    setSubtasks(subtasks().filter((t) => t.id !== id));
  };

  // Handle key press in input
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtask();
    }
  };

  // Start the session
  const handleStart = () => {
    props.onStart(sessionMode(), sessionMode() === 'tasks' ? subtasks() : []);
  };

  // Close and reset
  const handleClose = () => {
    setSubtasks([]);
    setNewTaskText('');
    props.onClose();
  };

  // Initialize when modal opens
  if (props.isOpen) {
    handleOpen();
  }

  return (
    <Show when={props.isOpen}>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          'z-index': 50,
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          'z-index': 51,
          width: '100%',
          'max-width': '500px',
          'max-height': '85vh',
          'overflow-y': 'auto',
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card
          style={{
            border: `1px solid ${tempoDesign.colors.border}`,
            'box-shadow': tempoDesign.shadows.lg,
          }}
        >
          {/* Header */}
          <CardHeader style={{ 'padding-bottom': '12px' }}>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
              }}
            >
              <div>
                <CardTitle style={{ 'font-size': tempoDesign.typography.sizes.xl }}>
                  {props.storyTitle}
                </CardTitle>
                <CardDescription style={{ 'margin-top': '4px' }}>
                  {props.timeBoxDuration} minute session
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                style={{
                  height: '32px',
                  width: '32px',
                  'border-radius': tempoDesign.radius.full,
                }}
              >
                <X size={16} />
              </Button>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent style={{ display: 'flex', 'flex-direction': 'column', gap: '20px' }}>
            {/* Mode Selection */}
            <div>
              <p
                style={{
                  'font-size': tempoDesign.typography.sizes.sm,
                  color: tempoDesign.colors.mutedForeground,
                  'margin-bottom': '12px',
                }}
              >
                How would you like to work?
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Task Mode */}
                <button
                  onClick={() => setSessionMode('tasks')}
                  style={{
                    flex: 1,
                    padding: '16px',
                    'border-radius': tempoDesign.radius.lg,
                    border: `2px solid ${sessionMode() === 'tasks' ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                    background:
                      sessionMode() === 'tasks'
                        ? `${tempoDesign.colors.primary}15`
                        : tempoDesign.colors.card,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    'flex-direction': 'column',
                    'align-items': 'center',
                    gap: '8px',
                  }}
                >
                  <ListBullets
                    size={28}
                    weight={sessionMode() === 'tasks' ? 'fill' : 'regular'}
                    style={{
                      color:
                        sessionMode() === 'tasks'
                          ? tempoDesign.colors.primary
                          : tempoDesign.colors.mutedForeground,
                    }}
                  />
                  <span
                    style={{
                      'font-size': tempoDesign.typography.sizes.sm,
                      'font-weight': tempoDesign.typography.weights.medium,
                      color:
                        sessionMode() === 'tasks'
                          ? tempoDesign.colors.foreground
                          : tempoDesign.colors.mutedForeground,
                    }}
                  >
                    Task Mode
                  </span>
                  <span
                    style={{
                      'font-size': tempoDesign.typography.sizes.xs,
                      color: tempoDesign.colors.mutedForeground,
                      'text-align': 'center',
                    }}
                  >
                    Build a checklist
                  </span>
                </button>

                {/* Flow Mode */}
                <button
                  onClick={() => setSessionMode('flow')}
                  style={{
                    flex: 1,
                    padding: '16px',
                    'border-radius': tempoDesign.radius.lg,
                    border: `2px solid ${sessionMode() === 'flow' ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                    background:
                      sessionMode() === 'flow'
                        ? `${tempoDesign.colors.primary}15`
                        : tempoDesign.colors.card,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    'flex-direction': 'column',
                    'align-items': 'center',
                    gap: '8px',
                  }}
                >
                  <Brain
                    size={28}
                    weight={sessionMode() === 'flow' ? 'fill' : 'regular'}
                    style={{
                      color:
                        sessionMode() === 'flow'
                          ? tempoDesign.colors.primary
                          : tempoDesign.colors.mutedForeground,
                    }}
                  />
                  <span
                    style={{
                      'font-size': tempoDesign.typography.sizes.sm,
                      'font-weight': tempoDesign.typography.weights.medium,
                      color:
                        sessionMode() === 'flow'
                          ? tempoDesign.colors.foreground
                          : tempoDesign.colors.mutedForeground,
                    }}
                  >
                    Focus/Flow
                  </span>
                  <span
                    style={{
                      'font-size': tempoDesign.typography.sizes.xs,
                      color: tempoDesign.colors.mutedForeground,
                      'text-align': 'center',
                    }}
                  >
                    Deep work, reading
                  </span>
                </button>
              </div>
            </div>

            {/* Subtasks Section - Only show in Task Mode */}
            <Show when={sessionMode() === 'tasks'}>
              <div>
                <p
                  style={{
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.mutedForeground,
                    'margin-bottom': '12px',
                  }}
                >
                  What do you want to accomplish?
                </p>

                {/* Add Task Input */}
                <div style={{ display: 'flex', gap: '8px', 'margin-bottom': '12px' }}>
                  <Input
                    type="text"
                    placeholder="Add a subtask..."
                    value={newTaskText()}
                    onInput={(e) => setNewTaskText(e.currentTarget.value)}
                    onKeyPress={handleKeyPress}
                    style={{ flex: 1 }}
                  />
                  <Button
                    onClick={addSubtask}
                    disabled={!newTaskText().trim()}
                    style={{ 'flex-shrink': 0 }}
                  >
                    <Plus size={16} />
                  </Button>
                </div>

                {/* Subtask List */}
                <div
                  style={{
                    display: 'flex',
                    'flex-direction': 'column',
                    gap: '8px',
                    'max-height': '200px',
                    'overflow-y': 'auto',
                    padding: '4px',
                  }}
                >
                  <Show
                    when={subtasks().length > 0}
                    fallback={
                      <div
                        style={{
                          padding: '24px',
                          'text-align': 'center',
                          color: tempoDesign.colors.mutedForeground,
                          'font-size': tempoDesign.typography.sizes.sm,
                          background: tempoDesign.colors.secondary,
                          'border-radius': tempoDesign.radius.md,
                        }}
                      >
                        <ListBullets size={32} style={{ 'margin-bottom': '8px', opacity: 0.5 }} />
                        <p style={{ margin: 0 }}>No subtasks yet</p>
                        <p
                          style={{
                            margin: '4px 0 0 0',
                            'font-size': tempoDesign.typography.sizes.xs,
                          }}
                        >
                          Add tasks to track during your session
                        </p>
                      </div>
                    }
                  >
                    <For each={subtasks()}>
                      {(task) => (
                        <div
                          style={{
                            display: 'flex',
                            'align-items': 'center',
                            gap: '12px',
                            padding: '10px 12px',
                            background: tempoDesign.colors.secondary,
                            'border-radius': tempoDesign.radius.md,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              'border-radius': '4px',
                              border: `2px solid ${tempoDesign.colors.primary}`,
                              'flex-shrink': 0,
                            }}
                          />
                          <span
                            style={{
                              flex: 1,
                              'font-size': tempoDesign.typography.sizes.sm,
                              color: tempoDesign.colors.foreground,
                            }}
                          >
                            {task.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSubtask(task.id)}
                            style={{
                              height: '28px',
                              width: '28px',
                              color: tempoDesign.colors.mutedForeground,
                            }}
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                      )}
                    </For>
                  </Show>
                </div>
              </div>
            </Show>

            {/* Flow Mode Info */}
            <Show when={sessionMode() === 'flow'}>
              <div
                style={{
                  padding: '20px',
                  background: tempoDesign.colors.secondary,
                  'border-radius': tempoDesign.radius.lg,
                  'text-align': 'center',
                }}
              >
                <Brain
                  size={40}
                  style={{
                    color: tempoDesign.colors.primary,
                    'margin-bottom': '12px',
                  }}
                />
                <p
                  style={{
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.foreground,
                    margin: '0 0 8px 0',
                    'font-weight': tempoDesign.typography.weights.medium,
                  }}
                >
                  Focus/Flow Mode
                </p>
                <p
                  style={{
                    'font-size': tempoDesign.typography.sizes.xs,
                    color: tempoDesign.colors.mutedForeground,
                    margin: 0,
                    'line-height': 1.5,
                  }}
                >
                  Perfect for reading, creative work, or deep focus.
                  <br />
                  Just you and the timer.
                </p>
              </div>
            </Show>

            {/* Start Button */}
            <Button
              onClick={handleStart}
              style={{
                width: '100%',
                height: '48px',
                'font-size': tempoDesign.typography.sizes.base,
                'font-weight': tempoDesign.typography.weights.semibold,
                gap: '8px',
              }}
            >
              <Timer size={20} />
              Start {props.timeBoxDuration} Minute Session
            </Button>
          </CardContent>
        </Card>
      </div>
    </Show>
  );
};
