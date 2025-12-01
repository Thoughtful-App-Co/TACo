import { Component, For, createSignal } from 'solid-js';
import { Task } from '../../schemas/tempo.schema';
import { linear, taskColors } from '../../theme/linear';

const sampleTasks: Task[] = [
  { id: '1', title: 'Review Q4 planning doc', estimatedMinutes: 25, status: 'in-progress', priority: 'high', tags: ['work'] },
  { id: '2', title: 'Code review: Auth PR', estimatedMinutes: 45, status: 'todo', priority: 'urgent', tags: ['code'] },
  { id: '3', title: 'Write weekly standup notes', estimatedMinutes: 15, status: 'todo', priority: 'medium', tags: ['work'] },
  { id: '4', title: 'Research AI time estimation APIs', estimatedMinutes: 60, status: 'backlog', priority: 'low', tags: ['research'] },
  { id: '5', title: 'Respond to client emails', estimatedMinutes: 20, status: 'done', priority: 'medium', tags: ['comms'] },
];

const StatusIcon: Component<{ status: Task['status'] }> = (props) => {
  const icons: Record<Task['status'], string> = {
    'backlog': 'M12 4v16m-8-8h16',
    'todo': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    'in-progress': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    'done': 'M5 13l4 4L19 7',
    'cancelled': 'M6 18L18 6M6 6l12 12',
  };
  
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={taskColors[props.status === 'in-progress' ? 'inProgress' : props.status]}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d={icons[props.status]} />
    </svg>
  );
};

const PriorityBadge: Component<{ priority: Task['priority'] }> = (props) => {
  const colors: Record<Task['priority'], string> = {
    urgent: '#EF4444',
    high: '#F59E0B',
    medium: '#6B7280',
    low: '#374151',
  };
  
  return (
    <span style={{
      display: 'inline-flex',
      'align-items': 'center',
      gap: '4px',
      padding: '2px 8px',
      'background': `${colors[props.priority]}20`,
      'border-radius': '4px',
      'font-size': '11px',
      'font-weight': '500',
      color: colors[props.priority],
      'text-transform': 'uppercase',
      'letter-spacing': '0.5px',
    }}>
      {props.priority === 'urgent' && (
        <span style={{ width: '6px', height: '6px', 'border-radius': '50%', background: colors.urgent }} />
      )}
      {props.priority}
    </span>
  );
};

const TaskRow: Component<{ task: Task }> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '12px',
        padding: '12px 16px',
        background: isHovered() ? linear.colors.surface : 'transparent',
        'border-radius': linear.radii.md,
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        'border-left': `2px solid ${isHovered() ? linear.colors.primary : 'transparent'}`,
      }}
    >
      <div style={{ 'flex-shrink': 0 }}>
        <StatusIcon status={props.task.status} />
      </div>
      
      <div style={{ flex: 1, 'min-width': 0 }}>
        <div style={{
          'font-size': '14px',
          'font-weight': '500',
          color: props.task.status === 'done' ? linear.colors.textMuted : linear.colors.text,
          'text-decoration': props.task.status === 'done' ? 'line-through' : 'none',
          'white-space': 'nowrap',
          overflow: 'hidden',
          'text-overflow': 'ellipsis',
        }}>
          {props.task.title}
        </div>
      </div>
      
      <div style={{ display: 'flex', 'align-items': 'center', gap: '12px', 'flex-shrink': 0 }}>
        <PriorityBadge priority={props.task.priority} />
        
        <div style={{
          display: 'flex',
          'align-items': 'center',
          gap: '4px',
          'font-size': '12px',
          color: linear.colors.textMuted,
          'font-family': "'IBM Plex Mono', monospace",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {props.task.estimatedMinutes}m
        </div>
        
        {props.task.tags?.map(tag => (
          <span style={{
            padding: '2px 6px',
            'background': linear.colors.border,
            'border-radius': '3px',
            'font-size': '11px',
            color: linear.colors.textMuted,
          }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

const TimerDisplay: Component<{ minutes: number; seconds: number; isRunning: boolean }> = (props) => {
  return (
    <div style={{
      display: 'flex',
      'flex-direction': 'column',
      'align-items': 'center',
      gap: '16px',
      padding: '32px',
      background: linear.colors.surface,
      'border-radius': linear.radii.lg,
      border: `1px solid ${linear.colors.border}`,
    }}>
      <div style={{
        'font-family': "'IBM Plex Mono', monospace",
        'font-size': '64px',
        'font-weight': '300',
        color: props.isRunning ? linear.colors.accent : linear.colors.text,
        'letter-spacing': '-2px',
      }}>
        {String(props.minutes).padStart(2, '0')}:{String(props.seconds).padStart(2, '0')}
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button style={{
          padding: '10px 24px',
          background: props.isRunning ? 'transparent' : linear.colors.primary,
          border: props.isRunning ? `1px solid ${linear.colors.border}` : 'none',
          'border-radius': linear.radii.md,
          color: props.isRunning ? linear.colors.textMuted : 'white',
          'font-size': '13px',
          'font-weight': '500',
          cursor: 'pointer',
        }}>
          {props.isRunning ? 'Pause' : 'Start'}
        </button>
        <button style={{
          padding: '10px 16px',
          background: 'transparent',
          border: `1px solid ${linear.colors.border}`,
          'border-radius': linear.radii.md,
          color: linear.colors.textMuted,
          'font-size': '13px',
          cursor: 'pointer',
        }}>
          Skip
        </button>
      </div>
    </div>
  );
};

export const TempoApp: Component = () => {
  const [activeView, setActiveView] = createSignal<'tasks' | 'timer'>('tasks');
  const totalMinutes = sampleTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  
  return (
    <div style={{
      'min-height': '100vh',
      background: linear.colors.background,
      'font-family': linear.fonts.body,
      color: linear.colors.text,
    }}>
      {/* Command bar style header */}
      <header style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'space-between',
        padding: '16px 24px',
        'border-bottom': `1px solid ${linear.colors.border}`,
      }}>
        <div style={{ display: 'flex', 'align-items': 'center', gap: '16px' }}>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke={linear.colors.primary} stroke-width="2" />
              <path d="M12 6v6l4 2" stroke={linear.colors.primary} stroke-width="2" stroke-linecap="round" />
            </svg>
            <span style={{ 'font-size': '18px', 'font-weight': '600', 'letter-spacing': '-0.3px' }}>
              Tempo
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            'align-items': 'center',
            gap: '4px',
            padding: '6px 12px',
            background: linear.colors.surface,
            'border-radius': linear.radii.md,
            border: `1px solid ${linear.colors.border}`,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={linear.colors.textMuted} stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span style={{ 'font-size': '13px', color: linear.colors.textMuted }}>
              Search tasks...
            </span>
            <span style={{
              'margin-left': '24px',
              padding: '2px 6px',
              background: linear.colors.border,
              'border-radius': '3px',
              'font-size': '11px',
              color: linear.colors.textMuted,
            }}>
              /
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', 'align-items': 'center', gap: '16px' }}>
          <div style={{
            'font-family': "'IBM Plex Mono', monospace",
            'font-size': '13px',
            color: linear.colors.textMuted,
          }}>
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m scheduled
          </div>
          
          <button style={{
            padding: '8px 16px',
            background: linear.colors.primary,
            border: 'none',
            'border-radius': linear.radii.md,
            color: 'white',
            'font-size': '13px',
            'font-weight': '500',
            cursor: 'pointer',
            display: 'flex',
            'align-items': 'center',
            gap: '6px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Task
          </button>
        </div>
      </header>
      
      <div style={{ display: 'flex', 'min-height': 'calc(100vh - 65px)' }}>
        {/* Sidebar */}
        <nav style={{
          width: '220px',
          padding: '16px',
          'border-right': `1px solid ${linear.colors.border}`,
        }}>
          {[
            { id: 'tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Tasks' },
            { id: 'timer', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Timer' },
          ].map(item => (
            <button
              onClick={() => setActiveView(item.id as 'tasks' | 'timer')}
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                background: activeView() === item.id ? linear.colors.surface : 'transparent',
                border: 'none',
                'border-radius': linear.radii.md,
                color: activeView() === item.id ? linear.colors.text : linear.colors.textMuted,
                'font-size': '14px',
                'font-weight': activeView() === item.id ? '500' : '400',
                cursor: 'pointer',
                'text-align': 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
          
          <div style={{ 'margin-top': '24px', padding: '0 12px' }}>
            <div style={{
              'font-size': '11px',
              'font-weight': '600',
              color: linear.colors.textMuted,
              'text-transform': 'uppercase',
              'letter-spacing': '0.5px',
              'margin-bottom': '8px',
            }}>
              Filters
            </div>
            {['All', 'Today', 'Upcoming', 'Completed'].map(filter => (
              <div style={{
                padding: '8px 0',
                'font-size': '13px',
                color: linear.colors.textMuted,
                cursor: 'pointer',
              }}>
                {filter}
              </div>
            ))}
          </div>
        </nav>
        
        {/* Main content */}
        <main style={{ flex: 1, padding: '24px 32px' }}>
          {activeView() === 'tasks' ? (
            <>
              <div style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
                'margin-bottom': '24px',
              }}>
                <h1 style={{
                  margin: 0,
                  'font-size': '24px',
                  'font-weight': '600',
                  'letter-spacing': '-0.5px',
                }}>
                  Today's Schedule
                </h1>
                
                <div style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  background: linear.colors.surface,
                  'border-radius': linear.radii.md,
                  border: `1px solid ${linear.colors.border}`,
                }}>
                  <span style={{ 'font-size': '13px', color: linear.colors.textMuted }}>Sort:</span>
                  <span style={{ 'font-size': '13px', color: linear.colors.text }}>Priority</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={linear.colors.textMuted} stroke-width="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
              
              {/* Task groups */}
              <div style={{ 'margin-bottom': '32px' }}>
                <div style={{
                  'font-size': '12px',
                  'font-weight': '600',
                  color: linear.colors.textMuted,
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.5px',
                  'margin-bottom': '8px',
                  padding: '0 16px',
                }}>
                  In Progress
                </div>
                <For each={sampleTasks.filter(t => t.status === 'in-progress')}>
                  {task => <TaskRow task={task} />}
                </For>
              </div>
              
              <div style={{ 'margin-bottom': '32px' }}>
                <div style={{
                  'font-size': '12px',
                  'font-weight': '600',
                  color: linear.colors.textMuted,
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.5px',
                  'margin-bottom': '8px',
                  padding: '0 16px',
                }}>
                  Todo
                </div>
                <For each={sampleTasks.filter(t => t.status === 'todo')}>
                  {task => <TaskRow task={task} />}
                </For>
              </div>
              
              <div style={{ 'margin-bottom': '32px' }}>
                <div style={{
                  'font-size': '12px',
                  'font-weight': '600',
                  color: linear.colors.textMuted,
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.5px',
                  'margin-bottom': '8px',
                  padding: '0 16px',
                }}>
                  Completed
                </div>
                <For each={sampleTasks.filter(t => t.status === 'done')}>
                  {task => <TaskRow task={task} />}
                </For>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              'flex-direction': 'column',
              'align-items': 'center',
              'padding-top': '64px',
            }}>
              <div style={{
                'font-size': '14px',
                color: linear.colors.textMuted,
                'margin-bottom': '8px',
              }}>
                Currently working on:
              </div>
              <div style={{
                'font-size': '20px',
                'font-weight': '500',
                'margin-bottom': '32px',
              }}>
                Review Q4 planning doc
              </div>
              
              <TimerDisplay minutes={18} seconds={42} isRunning={true} />
              
              <div style={{
                display: 'flex',
                gap: '32px',
                'margin-top': '48px',
              }}>
                {['Work', 'Short Break', 'Long Break'].map((type, i) => (
                  <div style={{
                    'text-align': 'center',
                    padding: '16px 24px',
                    background: i === 0 ? linear.colors.surface : 'transparent',
                    'border-radius': linear.radii.md,
                    border: i === 0 ? `1px solid ${linear.colors.primary}` : 'none',
                  }}>
                    <div style={{ 'font-size': '13px', color: i === 0 ? linear.colors.text : linear.colors.textMuted }}>
                      {type}
                    </div>
                    <div style={{
                      'font-family': "'IBM Plex Mono', monospace",
                      'font-size': '20px',
                      color: i === 0 ? linear.colors.accent : linear.colors.textMuted,
                      'margin-top': '4px',
                    }}>
                      {i === 0 ? '25:00' : i === 1 ? '5:00' : '15:00'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
