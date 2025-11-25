import { Component, createSignal, Show } from 'solid-js';
import { NurtureApp } from './components/nurture/NurtureApp';
import { JustInCaseApp } from './components/justincase/JustInCaseApp';
import { biophilic } from './theme/biophilic';
import { daylight } from './theme/daylight';

type AppTab = 'nurture' | 'justincase';

const TabNavigation: Component<{ activeTab: AppTab; setActiveTab: (tab: AppTab) => void }> = (props) => {
  return (
    <nav style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      'z-index': 1000,
      display: 'flex',
      gap: '4px',
      padding: '6px',
      background: 'rgba(255, 255, 255, 0.95)',
      'backdrop-filter': 'blur(12px)',
      'border-radius': '20px',
      'box-shadow': '0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
    }}>
      {/* Nurture Tab */}
      <button
        onClick={() => props.setActiveTab('nurture')}
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: '10px',
          padding: '12px 24px',
          border: 'none',
          'border-radius': '14px',
          background: props.activeTab === 'nurture' 
            ? `linear-gradient(135deg, ${biophilic.colors.primary}, ${biophilic.colors.secondary})`
            : 'transparent',
          color: props.activeTab === 'nurture' ? 'white' : biophilic.colors.textMuted,
          'font-family': "'DM Sans', system-ui, sans-serif",
          'font-size': '14px',
          'font-weight': '500',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: props.activeTab === 'nurture' ? 'scale(1)' : 'scale(0.98)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path 
            d="M12 22V12M12 12C12 8 16 6 20 8C16 4 12 6 12 12ZM12 16C12 12 8 10 4 12C8 8 12 10 12 16Z" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round"
            fill={props.activeTab === 'nurture' ? 'rgba(255,255,255,0.2)' : 'none'}
          />
        </svg>
        Nurture
      </button>
      
      {/* JustInCase Tab */}
      <button
        onClick={() => props.setActiveTab('justincase')}
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: '10px',
          padding: '12px 24px',
          border: 'none',
          'border-radius': '14px',
          background: props.activeTab === 'justincase' 
            ? daylight.colors.primary
            : 'transparent',
          color: props.activeTab === 'justincase' ? 'white' : daylight.colors.textMuted,
          'font-family': "'DM Sans', system-ui, sans-serif",
          'font-size': '14px',
          'font-weight': '500',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: props.activeTab === 'justincase' ? 'scale(1)' : 'scale(0.98)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="3" width="14" height="18" rx="1" stroke="currentColor" stroke-width="2"/>
          <path d="M9 8H15M9 12H15M9 16H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        JustInCase
      </button>
    </nav>
  );
};

export const App: Component = () => {
  const [activeTab, setActiveTab] = createSignal<AppTab>('nurture');
  
  return (
    <div style={{ 'min-height': '100vh' }}>
      <TabNavigation activeTab={activeTab()} setActiveTab={setActiveTab} />
      
      <Show when={activeTab() === 'nurture'}>
        <NurtureApp />
      </Show>
      
      <Show when={activeTab() === 'justincase'}>
        <JustInCaseApp />
      </Show>
    </div>
  );
};

export default App;
