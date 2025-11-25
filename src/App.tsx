import { Component, createSignal, Show, For } from 'solid-js';
import { NurtureApp } from './components/nurture/NurtureApp';
import { JustInCaseApp } from './components/justincase/JustInCaseApp';
import { TempoApp } from './components/tempo/TempoApp';
import { FriendlyApp } from './components/friendly/FriendlyApp';
import { ManifestApp } from './components/manifest/ManifestApp';
import { AugmentApp } from './components/augment/AugmentApp';
import { LolApp } from './components/lol/LolApp';

type AppTab = 'nurture' | 'justincase' | 'tempo' | 'friendly' | 'manifest' | 'augment' | 'lol';
type Timeline = 'now' | 'next' | 'later';

interface AppInfo {
  id: AppTab;
  name: string;
  description: string;
  designSystem: string;
  color: string;
  timeline: Timeline;
}

const apps: AppInfo[] = [
  // NOW - Active development
  { id: 'nurture', name: 'Nurture', description: 'Relationship CRM', designSystem: 'Biophilic', color: '#2D5A45', timeline: 'now' },
  { id: 'justincase', name: 'JustInCase', description: 'Small claims helper', designSystem: 'Daylight Reading', color: '#1C1C1C', timeline: 'now' },
  { id: 'tempo', name: 'Tempo', description: 'AI task timer', designSystem: 'Dark Mode', color: '#5E6AD2', timeline: 'now' },
  // NEXT - Coming soon
  { id: 'friendly', name: 'FriendLy', description: 'Friendship calendar', designSystem: 'Liquid', color: '#3B82F6', timeline: 'next' },
  { id: 'manifest', name: 'Manifest', description: 'Picky matchmaking', designSystem: 'Brutalistic', color: '#000000', timeline: 'next' },
  { id: 'augment', name: 'Augment', description: 'IO psychology jobs', designSystem: 'Maximalist', color: '#9333EA', timeline: 'next' },
  // LATER - Future plans
  { id: 'lol', name: 'LoL', description: 'Gamified chores', designSystem: 'Papermorphic', color: '#2196F3', timeline: 'later' },
];

const timelineLabels: Record<Timeline, { label: string; description: string }> = {
  now: { label: 'Now', description: 'Active Development' },
  next: { label: 'Next', description: 'Coming Soon' },
  later: { label: 'Later', description: 'Future Plans' },
};

const TabNavigation: Component<{ 
  activeTimeline: Timeline;
  setActiveTimeline: (t: Timeline) => void;
  activeTab: AppTab | null; 
  setActiveTab: (tab: AppTab) => void;
}> = (props) => {
  const [dropdownOpen, setDropdownOpen] = createSignal(false);
  const currentApps = () => apps.filter(app => app.timeline === props.activeTimeline);
  
  return (
    <nav style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      'z-index': 1000,
      display: 'flex',
      'align-items': 'center',
      gap: '8px',
      padding: '6px',
      background: 'rgba(255, 255, 255, 0.95)',
      'backdrop-filter': 'blur(12px)',
      'border-radius': '20px',
      'box-shadow': '0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
    }}>
      {/* Timeline Dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen())}
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
            padding: '10px 16px',
            background: '#1a1a2e',
            border: 'none',
            'border-radius': '14px',
            color: 'white',
            'font-size': '13px',
            'font-weight': '600',
            cursor: 'pointer',
            'min-width': '100px',
          }}
        >
          <span style={{
            width: '8px',
            height: '8px',
            'border-radius': '50%',
            background: props.activeTimeline === 'now' ? '#10B981' : props.activeTimeline === 'next' ? '#F59E0B' : '#6B7280',
          }} />
          {timelineLabels[props.activeTimeline].label}
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
            style={{
              transition: 'transform 0.2s',
              transform: dropdownOpen() ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        
        {/* Dropdown menu */}
        <Show when={dropdownOpen()}>
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            background: 'white',
            'border-radius': '12px',
            'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
            'min-width': '180px',
          }}>
            {(['now', 'next', 'later'] as Timeline[]).map(timeline => (
              <button
                onClick={() => {
                  props.setActiveTimeline(timeline);
                  // Set first app in new timeline as active
                  const firstApp = apps.find(a => a.timeline === timeline);
                  if (firstApp) props.setActiveTab(firstApp.id);
                  setDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  background: props.activeTimeline === timeline ? '#F3F4F6' : 'transparent',
                  border: 'none',
                  'text-align': 'left',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{
                  width: '10px',
                  height: '10px',
                  'border-radius': '50%',
                  background: timeline === 'now' ? '#10B981' : timeline === 'next' ? '#F59E0B' : '#6B7280',
                }} />
                <div>
                  <div style={{ 'font-size': '14px', 'font-weight': '600', color: '#1F2937' }}>
                    {timelineLabels[timeline].label}
                  </div>
                  <div style={{ 'font-size': '12px', color: '#6B7280' }}>
                    {timelineLabels[timeline].description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Show>
      </div>
      
      {/* Divider */}
      <div style={{
        width: '1px',
        height: '24px',
        background: '#E5E7EB',
        margin: '0 4px',
      }} />
      
      {/* App Tabs */}
      <For each={currentApps()}>
        {(app) => (
          <button
            onClick={() => props.setActiveTab(app.id)}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              padding: '10px 16px',
              border: 'none',
              'border-radius': '14px',
              background: props.activeTab === app.id ? app.color : 'transparent',
              color: props.activeTab === app.id ? 'white' : '#6B7280',
              'font-size': '13px',
              'font-weight': '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              'border-radius': '6px',
              background: props.activeTab === app.id ? 'rgba(255,255,255,0.2)' : `${app.color}20`,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'font-size': '11px',
              'font-weight': '700',
              color: props.activeTab === app.id ? 'white' : app.color,
            }}>
              {app.name.charAt(0)}
            </div>
            {app.name}
          </button>
        )}
      </For>
    </nav>
  );
};

export const App: Component = () => {
  const [activeTimeline, setActiveTimeline] = createSignal<Timeline>('now');
  const [activeTab, setActiveTab] = createSignal<AppTab>('nurture');
  
  // When timeline changes, ensure activeTab is valid for that timeline
  const handleTimelineChange = (timeline: Timeline) => {
    setActiveTimeline(timeline);
    const firstApp = apps.find(a => a.timeline === timeline);
    if (firstApp) setActiveTab(firstApp.id);
  };
  
  return (
    <div style={{ 'min-height': '100vh' }}>
      <TabNavigation 
        activeTimeline={activeTimeline()} 
        setActiveTimeline={handleTimelineChange}
        activeTab={activeTab()} 
        setActiveTab={setActiveTab} 
      />
      
      {/* App content with top padding for nav */}
      <div style={{ 'padding-top': '80px' }}>
        <Show when={activeTab() === 'nurture'}>
          <NurtureApp />
        </Show>
        
        <Show when={activeTab() === 'justincase'}>
          <JustInCaseApp />
        </Show>
        
        <Show when={activeTab() === 'tempo'}>
          <TempoApp />
        </Show>
        
        <Show when={activeTab() === 'friendly'}>
          <FriendlyApp />
        </Show>
        
        <Show when={activeTab() === 'manifest'}>
          <ManifestApp />
        </Show>
        
        <Show when={activeTab() === 'augment'}>
          <AugmentApp />
        </Show>
        
        <Show when={activeTab() === 'lol'}>
          <LolApp />
        </Show>
      </div>
    </div>
  );
};

export default App;
