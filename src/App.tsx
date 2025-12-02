import { Component, createSignal, Show, For, createMemo } from 'solid-js';
import { A, useLocation, useNavigate } from '@solidjs/router';
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
  { id: 'augment', name: 'Augment', description: 'IO psychology jobs', designSystem: 'Maximalist', color: '#9333EA', timeline: 'next' },
  // LATER - Future plans
  { id: 'manifest', name: 'Manifest', description: 'Picky matchmaking', designSystem: 'Brutalistic', color: '#000000', timeline: 'later' },
  { id: 'lol', name: 'LoL', description: 'Gamified chores', designSystem: 'Papermorphic', color: '#2196F3', timeline: 'later' },
];

const timelineLabels: Record<Timeline, { label: string; description: string }> = {
  now: { label: 'Now', description: 'Active Development' },
  next: { label: 'Next', description: 'Coming Soon' },
  later: { label: 'Later', description: 'Future Plans' },
};

// First app in each timeline for navigation
const firstAppByTimeline: Record<Timeline, AppTab> = {
  now: 'nurture',
  next: 'friendly',
  later: 'manifest',
};

// Get timeline from app id
const getTimelineFromApp = (appId: AppTab): Timeline => {
  const app = apps.find(a => a.id === appId);
  return app?.timeline || 'now';
};

// TACo Logo Component
const TacoLogo: Component<{ size?: number }> = (props) => {
  const size = props.size || 36;
  return (
    <A
      href="/"
      style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        width: `${size}px`,
        height: `${size}px`,
        background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)',
        border: 'none',
        'border-radius': '10px',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        'box-shadow': '0 2px 8px rgba(0,0,0,0.1)',
        'text-decoration': 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
      title="Back to Home"
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path 
          d="M12 3C7.5 3 4 6 4 9C4 10.5 4.5 12 6 13.5C7.5 15 9.5 16 12 16C14.5 16 16.5 15 18 13.5C19.5 12 20 10.5 20 9C20 6 16.5 3 12 3Z" 
          fill="white" 
          opacity="0.9"
        />
        <path 
          d="M6 13C6 13 7 17 12 17C17 17 18 13 18 13" 
          stroke="white" 
          stroke-width="2" 
          stroke-linecap="round"
          opacity="0.9"
        />
        <circle cx="9" cy="9" r="1.5" fill="#FF6B6B" />
        <circle cx="15" cy="9" r="1.5" fill="#4ECDC4" />
        <circle cx="12" cy="11" r="1" fill="#FFE66D" />
      </svg>
    </A>
  );
};

// Main Landing Page with Manifesto
const LandingPage: Component = () => {
  const navigate = useNavigate();
  
  const handleSelectTimeline = (timeline: Timeline) => {
    const firstApp = firstAppByTimeline[timeline];
    navigate(`/${firstApp}`);
  };

  const philosophies = [
    {
      category: 'Design Philosophy',
      items: [
        { title: 'For Human Good', desc: 'Build and product roadmap dedicated to augmenting natural realities and subverting damage from profit-driven lifestyle applications' },
        { title: 'Anti-Hero Application Patterns', desc: 'Weaponize "negative" or dark patterns for good; applications should help basic human psychology and respect individual\'s "true nature"' },
        { title: 'Simple & Artistic Design', desc: 'Design influenced by UX/UI best practices while respecting the art of design' },
        { title: 'Phone As a Server', desc: 'Phone serves the individual rather than absorbing them; moonshots include wearables and notifications to increase reality time' },
      ],
    },
    {
      category: 'Business Philosophy',
      items: [
        { title: 'The New Bundle', desc: 'Marketplace allowing individuals to pick up and drop apps, countering anti-competitive bundles' },
        { title: 'Build for Blue Oceans', desc: 'Always seek new ideas serving market needs based on intrinsic value (not investor dollar value)' },
        { title: 'Alpha to Omega App Cycles', desc: 'Apps serve their purpose then phase out; embrace natural lifecycle' },
        { title: 'Alpha to Omega Growth', desc: 'Believe in natural life and death of companies rather than endless growth' },
      ],
    },
    {
      category: 'Technology Philosophy',
      items: [
        { title: 'Adopt Local First Principles', desc: 'Enable local-first principles for data custody' },
        { title: 'Open to Close(ish) Source', desc: 'May maintain select open-source elements based on strategic considerations' },
      ],
    },
    {
      category: 'Community Philosophy',
      items: [
        { title: 'Transparent Funding', desc: 'Explore community participation opportunities and compensation models that align with project goals' },
        { title: 'New Hiring Models', desc: 'Leverage various talent discovery methods including hackathons and open-source contributions' },
        { title: 'Incentivize Open-Source', desc: 'Explore incentive models for community participation as deemed beneficial' },
      ],
    },
  ];

  return (
    <div style={{
      'min-height': '100vh',
      background: 'linear-gradient(180deg, #0F0F1A 0%, #1A1A2E 50%, #16213E 100%)',
      'font-family': "'Inter', system-ui, sans-serif",
      color: 'white',
      overflow: 'hidden',
    }}>
      {/* Hero Section */}
      <header style={{
        'text-align': 'center',
        padding: '80px 24px 60px',
        position: 'relative',
      }}>
        {/* Decorative gradient orbs */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          left: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255,107,107,0.15) 0%, transparent 70%)',
          'border-radius': '50%',
          filter: 'blur(40px)',
          'pointer-events': 'none',
        }} />
        <div style={{
          position: 'absolute',
          top: '0',
          right: '15%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(78,205,196,0.12) 0%, transparent 70%)',
          'border-radius': '50%',
          filter: 'blur(40px)',
          'pointer-events': 'none',
        }} />
        
        <div style={{ position: 'relative', 'z-index': 1 }}>
          {/* Logo */}
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)',
            'border-radius': '20px',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'box-shadow': '0 8px 32px rgba(255,107,107,0.3)',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path 
                d="M12 3C7.5 3 4 6 4 9C4 10.5 4.5 12 6 13.5C7.5 15 9.5 16 12 16C14.5 16 16.5 15 18 13.5C19.5 12 20 10.5 20 9C20 6 16.5 3 12 3Z" 
                fill="white" 
                opacity="0.95"
              />
              <path 
                d="M6 13C6 13 7 17 12 17C17 17 18 13 18 13" 
                stroke="white" 
                stroke-width="2" 
                stroke-linecap="round"
                opacity="0.95"
              />
            </svg>
          </div>
          
          <h1 style={{
            margin: '0 0 8px 0',
            'font-size': '14px',
            'font-weight': '600',
            'letter-spacing': '3px',
            'text-transform': 'uppercase',
            color: 'rgba(255,255,255,0.5)',
          }}>
            Thoughtful App Co.
          </h1>
          
          <h2 style={{
            margin: '0 0 24px 0',
            'font-size': 'clamp(32px, 5vw, 56px)',
            'font-weight': '700',
            'line-height': '1.1',
            'letter-spacing': '-1px',
            'max-width': '800px',
            'margin-left': 'auto',
            'margin-right': 'auto',
          }}>
            Building Technology That{' '}
            <span style={{
              background: 'linear-gradient(135deg, #FF6B6B, #FFE66D, #4ECDC4)',
              '-webkit-background-clip': 'text',
              '-webkit-text-fill-color': 'transparent',
              'background-clip': 'text',
            }}>
              Enables, Not Enslaves
            </span>
          </h2>
          
          <p style={{
            margin: '0 auto 40px',
            'max-width': '700px',
            'font-size': '18px',
            'line-height': '1.7',
            color: 'rgba(255,255,255,0.7)',
          }}>
            We're an open contribution venture studio creating applications that respect your time, 
            attention, and autonomy. Technology should enhance life, not hijack it.
          </p>
          
          <p style={{
            margin: '0 auto 48px',
            'max-width': '650px',
            'font-size': '15px',
            'line-height': '1.6',
            color: 'rgba(255,255,255,0.5)',
            'font-style': 'italic',
          }}>
            Our intent is to use this seismic shift in code mechanics propelled by LLM code agents, to rapid develop design-first, human-first, local-first applications at scale to take back technology for human good.
          </p>
        </div>
      </header>
      
      {/* Timeline Selection */}
      <section style={{
        padding: '0 24px 60px',
        'max-width': '1000px',
        margin: '0 auto',
      }}>
        <h3 style={{
          'text-align': 'center',
          'font-size': '12px',
          'font-weight': '600',
          'letter-spacing': '2px',
          'text-transform': 'uppercase',
          color: 'rgba(255,255,255,0.4)',
          'margin-bottom': '24px',
        }}>
          Explore Our Apps
        </h3>
        
        <div style={{
          display: 'grid',
          'grid-template-columns': 'repeat(3, 1fr)',
          gap: '16px',
        }}>
          {(['now', 'next', 'later'] as Timeline[]).map(timeline => {
            const timelineApps = apps.filter(a => a.timeline === timeline);
            const colors = {
              now: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', dot: '#10B981' },
              next: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', dot: '#F59E0B' },
              later: { bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.3)', dot: '#6B7280' },
            };
            
            return (
              <button
                onClick={() => handleSelectTimeline(timeline)}
                style={{
                  padding: '24px',
                  background: colors[timeline].bg,
                  border: `1px solid ${colors[timeline].border}`,
                  'border-radius': '16px',
                  cursor: 'pointer',
                  'text-align': 'left',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = colors[timeline].dot;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = colors[timeline].border;
                }}
              >
                <div style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '10px',
                  'margin-bottom': '12px',
                }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    'border-radius': '50%',
                    background: colors[timeline].dot,
                  }} />
                  <span style={{
                    'font-size': '18px',
                    'font-weight': '600',
                    color: 'white',
                  }}>
                    {timelineLabels[timeline].label}
                  </span>
                </div>
                <p style={{
                  margin: '0 0 16px 0',
                  'font-size': '13px',
                  color: 'rgba(255,255,255,0.5)',
                }}>
                  {timelineLabels[timeline].description}
                </p>
                <div style={{ display: 'flex', gap: '8px', 'flex-wrap': 'wrap' }}>
                  {timelineApps.map(app => (
                    <span style={{
                      padding: '4px 10px',
                      background: `${app.color}30`,
                      'border-radius': '12px',
                      'font-size': '12px',
                      color: 'rgba(255,255,255,0.8)',
                    }}>
                      {app.name}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>
      
      {/* Philosophy Grid */}
      <section style={{
        padding: '60px 24px 80px',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ 'max-width': '1200px', margin: '0 auto' }}>
          <h3 style={{
            'text-align': 'center',
            'font-size': '12px',
            'font-weight': '600',
            'letter-spacing': '2px',
            'text-transform': 'uppercase',
            color: 'rgba(255,255,255,0.4)',
            'margin-bottom': '12px',
          }}>
            TACo Mission Statement
          </h3>
          <h4 style={{
            'text-align': 'center',
            'font-size': '28px',
            'font-weight': '600',
            color: 'white',
            'margin-bottom': '48px',
          }}>
            Our Philosophy
          </h4>
          
          <div style={{
            display: 'grid',
            'grid-template-columns': 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {philosophies.map(section => (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                'border-radius': '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h5 style={{
                  margin: '0 0 20px 0',
                  'font-size': '11px',
                  'font-weight': '600',
                  'letter-spacing': '1.5px',
                  'text-transform': 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                  'padding-bottom': '12px',
                  'border-bottom': '1px solid rgba(255,255,255,0.08)',
                }}>
                  {section.category}
                </h5>
                
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
                  {section.items.map(item => (
                    <div>
                      <h6 style={{
                        margin: '0 0 4px 0',
                        'font-size': '14px',
                        'font-weight': '600',
                        color: 'rgba(255,255,255,0.9)',
                      }}>
                        {item.title}
                      </h6>
                      <p style={{
                        margin: 0,
                        'font-size': '13px',
                        'line-height': '1.5',
                        color: 'rgba(255,255,255,0.5)',
                      }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer style={{
        padding: '32px 24px',
        'text-align': 'center',
        'border-top': '1px solid rgba(255,255,255,0.05)',
      }}>
        <p style={{
          margin: 0,
          'font-size': '13px',
          color: 'rgba(255,255,255,0.3)',
        }}>
          Thoughtful App Co. - Technology for Human Good
        </p>
      </footer>
    </div>
  );
};

const TabNavigation: Component<{ 
  activeTimeline: Timeline;
  activeTab: AppTab; 
}> = (props) => {
  const [dropdownOpen, setDropdownOpen] = createSignal(false);
  const navigate = useNavigate();
  const currentApps = () => apps.filter(app => app.timeline === props.activeTimeline);
  
  const handleTimelineChange = (timeline: Timeline) => {
    const firstApp = firstAppByTimeline[timeline];
    navigate(`/${firstApp}`);
    setDropdownOpen(false);
  };
  
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
      {/* TACo Logo - Home Button */}
      <TacoLogo size={36} />
      
      {/* Divider */}
      <div style={{
        width: '1px',
        height: '24px',
        background: '#E5E7EB',
        margin: '0 4px',
      }} />
      
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
                onClick={() => handleTimelineChange(timeline)}
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
          <A
            href={`/${app.id}`}
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
              'text-decoration': 'none',
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
          </A>
        )}
      </For>
    </nav>
  );
};

// App page wrapper component
const AppPage: Component<{ appId: AppTab; children: any }> = (props) => {
  const activeTimeline = createMemo(() => getTimelineFromApp(props.appId));
  
  return (
    <>
      <TabNavigation 
        activeTimeline={activeTimeline()} 
        activeTab={props.appId}
      />
      
      {/* App content with top padding for nav */}
      <div style={{ 'padding-top': '80px' }}>
        {props.children}
      </div>
    </>
  );
};

export const App: Component = () => {
  const location = useLocation();
  
  // Derive current app from URL path
  const currentPath = createMemo(() => location.pathname.replace('/', '') || null);
  const isHome = createMemo(() => currentPath() === null || currentPath() === '');
  const activeApp = createMemo(() => currentPath() as AppTab | null);
  
  return (
    <div style={{ 'min-height': '100vh' }}>
      <Show when={isHome()}>
        <LandingPage />
      </Show>
      
      <Show when={!isHome() && activeApp()}>
        <Show when={activeApp() === 'nurture'}>
          <AppPage appId="nurture">
            <NurtureApp />
          </AppPage>
        </Show>
        
        <Show when={activeApp() === 'justincase'}>
          <AppPage appId="justincase">
            <JustInCaseApp />
          </AppPage>
        </Show>
        
        <Show when={activeApp() === 'tempo'}>
          <AppPage appId="tempo">
            <TempoApp />
          </AppPage>
        </Show>
        
        <Show when={activeApp() === 'friendly'}>
          <AppPage appId="friendly">
            <FriendlyApp />
          </AppPage>
        </Show>
        
        <Show when={activeApp() === 'manifest'}>
          <AppPage appId="manifest">
            <ManifestApp />
          </AppPage>
        </Show>
        
        <Show when={activeApp() === 'augment'}>
          <AppPage appId="augment">
            <AugmentApp />
          </AppPage>
        </Show>
        
        <Show when={activeApp() === 'lol'}>
          <AppPage appId="lol">
            <LolApp />
          </AppPage>
        </Show>
      </Show>
    </div>
  );
};

export default App;
