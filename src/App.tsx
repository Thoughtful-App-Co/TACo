import { Component, createSignal, Show } from 'solid-js';
import { NurtureApp } from './components/nurture/NurtureApp';
import { JustInCaseApp } from './components/justincase/JustInCaseApp';
import { TempoApp } from './components/tempo/TempoApp';
import { FriendlyApp } from './components/friendly/FriendlyApp';
import { ManifestApp } from './components/manifest/ManifestApp';
import { AugmentApp } from './components/augment/AugmentApp';
import { LolApp } from './components/lol/LolApp';

type AppTab = 'nurture' | 'justincase' | 'tempo' | 'friendly' | 'manifest' | 'augment' | 'lol';

interface AppInfo {
  id: AppTab;
  name: string;
  description: string;
  designSystem: string;
  color: string;
}

const apps: AppInfo[] = [
  { id: 'nurture', name: 'Nurture', description: 'Relationship CRM', designSystem: 'Biophilic', color: '#2D5A45' },
  { id: 'justincase', name: 'JustInCase', description: 'Small claims helper', designSystem: 'Daylight Reading', color: '#1C1C1C' },
  { id: 'tempo', name: 'Tempo', description: 'AI task timer', designSystem: 'Linear-type', color: '#5E6AD2' },
  { id: 'friendly', name: 'FriendLy', description: 'Friendship calendar', designSystem: 'Liquid', color: '#3B82F6' },
  { id: 'manifest', name: 'Manifest', description: 'Picky matchmaking', designSystem: 'Brutalistic', color: '#000000' },
  { id: 'augment', name: 'Augment', description: 'IO psychology jobs', designSystem: 'Maximalist', color: '#9333EA' },
  { id: 'lol', name: 'LoL', description: 'Gamified chores', designSystem: 'Papermorphic', color: '#2196F3' },
];

const AppSelector: Component<{ onSelect: (app: AppTab) => void }> = (props) => {
  return (
    <div style={{
      'min-height': '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: '48px 24px',
      'font-family': "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ 'max-width': '1200px', margin: '0 auto' }}>
        <header style={{ 'text-align': 'center', 'margin-bottom': '64px' }}>
          <h1 style={{
            margin: '0 0 16px 0',
            'font-size': '48px',
            'font-weight': '700',
            color: '#FFFFFF',
            'letter-spacing': '-1px',
          }}>
            Thoughtful App Co.
          </h1>
          <p style={{
            margin: 0,
            'font-size': '18px',
            color: 'rgba(255, 255, 255, 0.7)',
          }}>
            Design System Experiments - 7 Apps, 7 Paradigms
          </p>
        </header>
        
        <div style={{
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {apps.map(app => (
            <button
              onClick={() => props.onSelect(app.id)}
              style={{
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'flex-start',
                padding: '28px',
                background: 'rgba(255, 255, 255, 0.05)',
                'backdrop-filter': 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                'border-radius': '16px',
                cursor: 'pointer',
                'text-align': 'left',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = app.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              {/* Color accent */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: app.color,
              }} />
              
              <div style={{
                display: 'flex',
                'align-items': 'center',
                gap: '12px',
                'margin-bottom': '12px',
                width: '100%',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  'border-radius': '12px',
                  background: app.color,
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  color: 'white',
                  'font-weight': '700',
                  'font-size': '18px',
                }}>
                  {app.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    margin: 0,
                    'font-size': '20px',
                    'font-weight': '600',
                    color: '#FFFFFF',
                  }}>
                    {app.name}
                  </h2>
                  <p style={{
                    margin: 0,
                    'font-size': '14px',
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}>
                    {app.description}
                  </p>
                </div>
              </div>
              
              <div style={{
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.1)',
                'border-radius': '20px',
                'font-size': '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                'font-weight': '500',
              }}>
                {app.designSystem} Design
              </div>
            </button>
          ))}
        </div>
        
        <footer style={{
          'text-align': 'center',
          'margin-top': '64px',
          'font-size': '14px',
          color: 'rgba(255, 255, 255, 0.5)',
        }}>
          Select an app to view its wireframe prototype
        </footer>
      </div>
    </div>
  );
};

const BackButton: Component<{ onClick: () => void }> = (props) => {
  return (
    <button
      onClick={props.onClick}
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        'z-index': 9999,
        display: 'flex',
        'align-items': 'center',
        gap: '8px',
        padding: '10px 16px',
        background: 'rgba(0, 0, 0, 0.8)',
        'backdrop-filter': 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        'border-radius': '8px',
        color: 'white',
        'font-size': '13px',
        'font-weight': '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back to Apps
    </button>
  );
};

export const App: Component = () => {
  const [activeApp, setActiveApp] = createSignal<AppTab | null>(null);
  
  return (
    <div style={{ 'min-height': '100vh' }}>
      <Show when={activeApp() === null}>
        <AppSelector onSelect={setActiveApp} />
      </Show>
      
      <Show when={activeApp() !== null}>
        <BackButton onClick={() => setActiveApp(null)} />
      </Show>
      
      <Show when={activeApp() === 'nurture'}>
        <NurtureApp />
      </Show>
      
      <Show when={activeApp() === 'justincase'}>
        <JustInCaseApp />
      </Show>
      
      <Show when={activeApp() === 'tempo'}>
        <TempoApp />
      </Show>
      
      <Show when={activeApp() === 'friendly'}>
        <FriendlyApp />
      </Show>
      
      <Show when={activeApp() === 'manifest'}>
        <ManifestApp />
      </Show>
      
      <Show when={activeApp() === 'augment'}>
        <AugmentApp />
      </Show>
      
      <Show when={activeApp() === 'lol'}>
        <LolApp />
      </Show>
    </div>
  );
};

export default App;
