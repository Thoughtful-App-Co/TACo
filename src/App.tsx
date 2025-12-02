import { Component, createSignal, Show, For, createMemo } from 'solid-js';
import { A, useNavigate, useParams } from '@solidjs/router';
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
  elevatorPitch: string;
  designSystem: string;
  color: string;
  timeline: Timeline;
}

const apps: AppInfo[] = [
  // NOW - Active development
  { 
    id: 'nurture', 
    name: 'Nurture', 
    description: 'Relationship CRM', 
    elevatorPitch: 'Never forget a birthday or let a friendship fade. Nurture helps you maintain meaningful relationships with gentle reminders and interaction tracking.',
    designSystem: 'Biophilic', 
    color: '#2D5A45', 
    timeline: 'now' 
  },
  { 
    id: 'justincase', 
    name: 'JustInCase', 
    description: 'Small claims helper', 
    elevatorPitch: 'Document everything, stress about nothing. JustInCase helps you build airtight cases for small claims court with guided evidence collection.',
    designSystem: 'Daylight Reading', 
    color: '#1C1C1C', 
    timeline: 'now' 
  },
  { 
    id: 'tempo', 
    name: 'Tempo', 
    description: 'AI task timer', 
    elevatorPitch: 'Work with your natural rhythm, not against it. Tempo uses AI to learn when you\'re most productive and schedules tasks accordingly.',
    designSystem: 'Dark Mode', 
    color: '#5E6AD2', 
    timeline: 'now' 
  },
  // NEXT - Coming soon
  { 
    id: 'friendly', 
    name: 'FriendLy', 
    description: 'Friendship calendar', 
    elevatorPitch: 'Coordinate hangouts without the group chat chaos. FriendLy finds the perfect time for everyone to meet up.',
    designSystem: 'Liquid', 
    color: '#3B82F6', 
    timeline: 'next' 
  },
  { 
    id: 'augment', 
    name: 'Augment', 
    description: 'IO psychology jobs', 
    elevatorPitch: 'Find work that actually fits you. Augment matches your personality and work style to careers using IO psychology principles.',
    designSystem: 'Maximalist', 
    color: '#9333EA', 
    timeline: 'next' 
  },
  // LATER - Future plans
  { 
    id: 'manifest', 
    name: 'Manifest', 
    description: 'Picky matchmaking', 
    elevatorPitch: 'Dating for people with standards. Manifest uses detailed compatibility matching for those who know exactly what they want.',
    designSystem: 'Brutalistic', 
    color: '#000000', 
    timeline: 'later' 
  },
  { 
    id: 'lol', 
    name: 'LoL', 
    description: 'Gamified chores', 
    elevatorPitch: 'Turn household tasks into a game everyone wants to play. LoL makes chores fun with rewards, streaks, and friendly competition.',
    designSystem: 'Papermorphic', 
    color: '#2196F3', 
    timeline: 'later' 
  },
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

// App Tag with hover tooltip
const AppTag: Component<{ app: AppInfo }> = (props) => {
  const [showTooltip, setShowTooltip] = createSignal(false);
  
  return (
    <div 
      style={{ 
        position: 'relative', 
        display: 'inline-block',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      <span 
        tabIndex={0}
        role="button"
        aria-describedby={`tooltip-${props.app.id}`}
        style={{
          padding: '6px 12px',
          background: `${props.app.color}30`,
          'border-radius': '12px',
          'font-size': '12px',
          'font-weight': '500',
          color: 'rgba(255,255,255,0.9)',
          cursor: 'pointer',
          display: 'inline-block',
          transition: 'all 0.2s ease',
          border: '1px solid transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${props.app.color}50`;
          e.currentTarget.style.borderColor = `${props.app.color}60`;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `${props.app.color}30`;
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {props.app.name}
      </span>
      
      {/* Tooltip */}
      <Show when={showTooltip()}>
        <div
          id={`tooltip-${props.app.id}`}
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 12px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.98)',
            'backdrop-filter': 'blur(12px)',
            '-webkit-backdrop-filter': 'blur(12px)',
            'border-radius': '12px',
            'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)',
            'z-index': 100,
            animation: 'tooltipFadeIn 0.2s ease',
            'pointer-events': 'none',
          }}
        >
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: '12px',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.98)',
            'box-shadow': '2px 2px 4px rgba(0, 0, 0, 0.1)',
          }} />
          
          {/* Content */}
          <div style={{
            display: 'flex',
            'align-items': 'center',
            gap: '10px',
            'margin-bottom': '10px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              'border-radius': '8px',
              background: props.app.color,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              color: 'white',
              'font-weight': '700',
              'font-size': '14px',
            }}>
              {props.app.name.charAt(0)}
            </div>
            <div>
              <div style={{
                'font-size': '15px',
                'font-weight': '600',
                color: '#1F2937',
                'line-height': '1.2',
              }}>
                {props.app.name}
              </div>
              <div style={{
                'font-size': '12px',
                color: '#6B7280',
              }}>
                {props.app.description}
              </div>
            </div>
          </div>
          
          <p style={{
            margin: 0,
            'font-size': '13px',
            'line-height': '1.5',
            color: '#374151',
          }}>
            {props.app.elevatorPitch}
          </p>
        </div>
      </Show>
    </div>
  );
};

// Get timeline from app id
const getTimelineFromApp = (appId: AppTab): Timeline => {
  const app = apps.find(a => a.id === appId);
  return app?.timeline || 'now';
};

// TACo Logo Component - Brand identity anchor
const TacoLogo: Component<{ size?: number }> = (props) => {
  const size = props.size || 38;
  const brandGradient = `linear-gradient(135deg, ${navTokens.brand.coral} 0%, ${navTokens.brand.yellow} 50%, ${navTokens.brand.teal} 100%)`;
  
  return (
    <A
      href="/"
      aria-label="Thoughtful App Co. - Return to home page"
      style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        width: `${size}px`,
        height: `${size}px`,
        background: brandGradient,
        border: 'none',
        'border-radius': navTokens.radius.sm,
        cursor: 'pointer',
        transition: navTokens.transitions.normal,
        'box-shadow': `0 2px 8px ${navTokens.brand.coral}30, ${navTokens.shadows.sm}`,
        'text-decoration': 'none',
        outline: 'none',
        position: 'relative',
        overflow: 'hidden',
        'flex-shrink': 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = `0 4px 16px ${navTokens.brand.coral}40, 0 2px 6px rgba(0,0,0,0.08)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = `0 2px 8px ${navTokens.brand.coral}30, ${navTokens.shadows.sm}`;
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `${navTokens.shadows.focus} ${navTokens.brand.teal}60, 0 2px 8px ${navTokens.brand.coral}30`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = `0 2px 8px ${navTokens.brand.coral}30, ${navTokens.shadows.sm}`;
      }}
    >
      {/* Subtle shine overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
        'border-radius': `${navTokens.radius.sm} ${navTokens.radius.sm} 0 0`,
        'pointer-events': 'none',
      }} />
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
        <circle cx="9" cy="9" r="1.5" fill={navTokens.brand.coral} />
        <circle cx="15" cy="9" r="1.5" fill={navTokens.brand.teal} />
        <circle cx="12" cy="11" r="1" fill={navTokens.brand.yellow} />
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
                    <AppTag app={app} />
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
        padding: '60px 24px 40px',
        background: 'rgba(0,0,0,0.3)',
        'border-top': '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          'max-width': '1200px',
          margin: '0 auto',
        }}>
          {/* Footer Grid */}
          <div style={{
            display: 'grid',
            'grid-template-columns': 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            'margin-bottom': '48px',
          }}>
            {/* Brand Column */}
            <div>
              <div style={{
                display: 'flex',
                'align-items': 'center',
                gap: '12px',
                'margin-bottom': '16px',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)',
                  'border-radius': '10px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3C7.5 3 4 6 4 9C4 10.5 4.5 12 6 13.5C7.5 15 9.5 16 12 16C14.5 16 16.5 15 18 13.5C19.5 12 20 10.5 20 9C20 6 16.5 3 12 3Z" fill="white" opacity="0.95"/>
                    <path d="M6 13C6 13 7 17 12 17C17 17 18 13 18 13" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.95"/>
                  </svg>
                </div>
                <span style={{
                  'font-size': '16px',
                  'font-weight': '600',
                  color: 'white',
                }}>
                  Thoughtful App Co.
                </span>
              </div>
              <p style={{
                margin: '0 0 20px 0',
                'font-size': '14px',
                'line-height': '1.6',
                color: 'rgba(255,255,255,0.5)',
                'max-width': '280px',
              }}>
                Building technology that enables, not enslaves. An open contribution venture studio.
              </p>
              {/* Social Links */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <a 
                  href="https://github.com/Thoughtful-App-Co" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  style={{
                    width: '36px',
                    height: '36px',
                    'border-radius': '8px',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    color: 'rgba(255,255,255,0.6)',
                    transition: 'all 0.2s ease',
                    'text-decoration': 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </a>
                <a 
                  href="https://bsky.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Bluesky"
                  style={{
                    width: '36px',
                    height: '36px',
                    'border-radius': '8px',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    color: 'rgba(255,255,255,0.6)',
                    transition: 'all 0.2s ease',
                    'text-decoration': 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </a>
              </div>
              
              {/* Podcast Plug */}
              <a 
                href="https://humansonly.fm" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  'margin-top': '20px',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, rgba(255,107,107,0.15) 0%, rgba(78,205,196,0.15) 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  'border-radius': '12px',
                  display: 'flex',
                  'align-items': 'center',
                  gap: '12px',
                  'text-decoration': 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,107,107,0.25) 0%, rgba(78,205,196,0.25) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,107,107,0.15) 0%, rgba(78,205,196,0.15) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  'border-radius': '8px',
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  'flex-shrink': 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/>
                  </svg>
                </div>
                <div>
                  <div style={{
                    'font-size': '13px',
                    'font-weight': '600',
                    color: 'white',
                    'line-height': '1.2',
                  }}>
                    Humans Only Podcast
                  </div>
                  <div style={{
                    'font-size': '11px',
                    color: 'rgba(255,255,255,0.5)',
                  }}>
                    humansonly.fm
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ 'margin-left': 'auto' }}>
                  <path d="M7 17L17 7M17 7H7M17 7V17"/>
                </svg>
              </a>
            </div>
            
            {/* Apps Column */}
            <div>
              <h4 style={{
                margin: '0 0 16px 0',
                'font-size': '12px',
                'font-weight': '600',
                'letter-spacing': '1px',
                'text-transform': 'uppercase',
                color: 'rgba(255,255,255,0.4)',
              }}>
                Apps
              </h4>
              <ul style={{
                margin: 0,
                padding: 0,
                'list-style': 'none',
                display: 'flex',
                'flex-direction': 'column',
                gap: '10px',
              }}>
                {apps.map(app => (
                  <li>
                    <A 
                      href={`/${app.id}`}
                      style={{
                        'font-size': '14px',
                        color: 'rgba(255,255,255,0.6)',
                        'text-decoration': 'none',
                        transition: 'color 0.2s ease',
                        display: 'inline-flex',
                        'align-items': 'center',
                        gap: '8px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                      }}
                    >
                      <span style={{
                        width: '6px',
                        height: '6px',
                        'border-radius': '50%',
                        background: app.color,
                      }} />
                      {app.name}
                      <span style={{
                        'font-size': '11px',
                        color: 'rgba(255,255,255,0.3)',
                      }}>
                        — {app.description}
                      </span>
                    </A>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Philosophy Column */}
            <div>
              <h4 style={{
                margin: '0 0 16px 0',
                'font-size': '12px',
                'font-weight': '600',
                'letter-spacing': '1px',
                'text-transform': 'uppercase',
                color: 'rgba(255,255,255,0.4)',
              }}>
                Philosophy
              </h4>
              <ul style={{
                margin: 0,
                padding: 0,
                'list-style': 'none',
                display: 'flex',
                'flex-direction': 'column',
                gap: '10px',
              }}>
                <li>
                  <span style={{ 'font-size': '14px', color: 'rgba(255,255,255,0.6)' }}>
                    Design for Human Good
                  </span>
                </li>
                <li>
                  <span style={{ 'font-size': '14px', color: 'rgba(255,255,255,0.6)' }}>
                    Local-First Principles
                  </span>
                </li>
                <li>
                  <span style={{ 'font-size': '14px', color: 'rgba(255,255,255,0.6)' }}>
                    Anti-Dark Patterns
                  </span>
                </li>
                <li>
                  <span style={{ 'font-size': '14px', color: 'rgba(255,255,255,0.6)' }}>
                    Open Contribution
                  </span>
                </li>
              </ul>
            </div>
            
            {/* Resources Column */}
            <div>
              <h4 style={{
                margin: '0 0 16px 0',
                'font-size': '12px',
                'font-weight': '600',
                'letter-spacing': '1px',
                'text-transform': 'uppercase',
                color: 'rgba(255,255,255,0.4)',
              }}>
                Resources
              </h4>
              <ul style={{
                margin: 0,
                padding: 0,
                'list-style': 'none',
                display: 'flex',
                'flex-direction': 'column',
                gap: '10px',
              }}>
                <li>
                  <a 
                    href="https://github.com/Thoughtful-App-Co/TACo"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      'font-size': '14px',
                      color: 'rgba(255,255,255,0.6)',
                      'text-decoration': 'none',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                  >
                    Source Code
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/Thoughtful-App-Co/TACo/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      'font-size': '14px',
                      color: 'rgba(255,255,255,0.6)',
                      'text-decoration': 'none',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                  >
                    Report an Issue
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/Thoughtful-App-Co/TACo/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      'font-size': '14px',
                      color: 'rgba(255,255,255,0.6)',
                      'text-decoration': 'none',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                  >
                    Discussions
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/Thoughtful-App-Co/TACo#contributing"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      'font-size': '14px',
                      color: 'rgba(255,255,255,0.6)',
                      'text-decoration': 'none',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                  >
                    Contribute
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div style={{
            'padding-top': '24px',
            'border-top': '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
            'flex-wrap': 'wrap',
            gap: '16px',
          }}>
            <p style={{
              margin: 0,
              'font-size': '13px',
              color: 'rgba(255,255,255,0.3)',
            }}>
              © {new Date().getFullYear()} Thoughtful App Co. Technology for Human Good.
            </p>
            <div style={{
              display: 'flex',
              gap: '24px',
            }}>
              <a 
                href="#"
                style={{
                  'font-size': '13px',
                  color: 'rgba(255,255,255,0.3)',
                  'text-decoration': 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              >
                Privacy
              </a>
              <a 
                href="#"
                style={{
                  'font-size': '13px',
                  color: 'rgba(255,255,255,0.3)',
                  'text-decoration': 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// =============================================================================
// DESIGN TOKENS - Extracted from brand and standardized
// =============================================================================
// WHY: Centralized tokens ensure consistency and make updates propagate everywhere
// Font: DM Sans chosen for modern, clean readability with geometric characteristics
// Colors: Derived from TACo brand gradient (coral → yellow → teal)
// Spacing: 4px base unit for precise, harmonious layouts

const navTokens = {
  // Typography - DM Sans for body, modular scale 1.125
  typography: {
    fontFamily: "'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    sizes: {
      xs: '11px',
      sm: '12px',
      base: '13px',
      md: '14px',
      lg: '16px',
    },
    weights: {
      normal: '500',
      medium: '600',
      bold: '700',
    },
    letterSpacing: {
      tight: '0.1px',
      normal: '0.2px',
      wide: '0.4px',
    },
  },
  
  // Spacing - 4px base unit
  spacing: {
    '2xs': '2px',
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
  },
  
  // Border radius - progressive scale
  radius: {
    xs: '6px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },
  
  // Timeline colors - Semantic meaning:
  // Now = Teal (active, current, go)
  // Next = Amber/Orange (upcoming, attention, prepare)
  // Later = Purple/Slate (future, planned, distant)
  timelineColors: {
    now: {
      primary: '#10B981',      // Emerald green - active/current
      glow: 'rgba(16, 185, 129, 0.5)',
      bg: 'rgba(16, 185, 129, 0.08)',
    },
    next: {
      primary: '#F59E0B',      // Amber - upcoming/attention
      glow: 'rgba(245, 158, 11, 0.5)',
      bg: 'rgba(245, 158, 11, 0.08)',
    },
    later: {
      primary: '#8B5CF6',      // Violet - future/planned
      glow: 'rgba(139, 92, 246, 0.5)',
      bg: 'rgba(139, 92, 246, 0.08)',
    },
  },
  
  // Brand colors
  brand: {
    coral: '#FF6B6B',
    yellow: '#FFE66D',
    teal: '#4ECDC4',
    dark: '#1a1a2e',
    darker: '#16213E',
  },
  
  // Neutral scale
  neutrals: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Shadows - elevation system
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    nav: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
    dropdown: '0 12px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)',
    focus: '0 0 0 3px',
  },
  
  // Transitions - consistent timing
  transitions: {
    fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

const TabNavigation: Component<{ 
  activeTimeline: Timeline;
  activeTab: AppTab; 
}> = (props) => {
  const [dropdownOpen, setDropdownOpen] = createSignal(false);
  const navigate = useNavigate();
  const currentApps = () => apps.filter(app => app.timeline === props.activeTimeline);
  
  // Get timeline color object
  const getTimelineColor = (timeline: Timeline) => navTokens.timelineColors[timeline];
  
  const handleTimelineChange = (timeline: Timeline) => {
    const firstApp = firstAppByTimeline[timeline];
    navigate(`/${firstApp}`);
    setDropdownOpen(false);
  };

  // Keyboard navigation for dropdown
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setDropdownOpen(!dropdownOpen());
    }
  };
  
  return (
    <nav 
      style={{
        position: 'fixed',
        top: navTokens.spacing.lg,
        left: '50%',
        transform: 'translateX(-50%)',
        'z-index': 1000,
        display: 'flex',
        'align-items': 'center',
        gap: navTokens.spacing.xs,
        padding: navTokens.spacing.sm,
        background: 'rgba(255, 255, 255, 0.96)',
        'backdrop-filter': 'blur(20px)',
        '-webkit-backdrop-filter': 'blur(20px)',
        'border-radius': navTokens.radius.xl,
        'box-shadow': navTokens.shadows.nav,
        border: `1px solid ${navTokens.neutrals[200]}`,
        'font-family': navTokens.typography.fontFamily,
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* TACo Logo - Home Button */}
      <TacoLogo size={38} />
      
      {/* Divider */}
      <div 
        style={{
          width: '1px',
          height: '24px',
          background: navTokens.neutrals[200],
          margin: `0 ${navTokens.spacing.sm}`,
          'flex-shrink': 0,
        }} 
        aria-hidden="true"
      />
      
      {/* Timeline Dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen())}
          onKeyDown={handleKeyDown}
          aria-expanded={dropdownOpen()}
          aria-haspopup="listbox"
          aria-label={`Timeline: ${timelineLabels[props.activeTimeline].label}. ${timelineLabels[props.activeTimeline].description}`}
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: navTokens.spacing.sm,
            padding: `${navTokens.spacing.sm} ${navTokens.spacing.md}`,
            background: `linear-gradient(135deg, ${navTokens.brand.dark} 0%, ${navTokens.brand.darker} 100%)`,
            border: 'none',
            'border-radius': navTokens.radius.sm,
            color: 'white',
            'font-size': navTokens.typography.sizes.base,
            'font-weight': navTokens.typography.weights.medium,
            'letter-spacing': navTokens.typography.letterSpacing.normal,
            cursor: 'pointer',
            'min-width': '100px',
            transition: navTokens.transitions.normal,
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = `${navTokens.shadows.focus} ${navTokens.brand.teal}60`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <span style={{
            width: '8px',
            height: '8px',
            'border-radius': navTokens.radius.full,
            background: getTimelineColor(props.activeTimeline).primary,
            'box-shadow': `0 0 6px ${getTimelineColor(props.activeTimeline).glow}`,
            transition: navTokens.transitions.slow,
          }} />
          <span style={{ 'flex-grow': 1, 'text-align': 'left' }}>
            {timelineLabels[props.activeTimeline].label}
          </span>
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            style={{
              transition: navTokens.transitions.normal,
              transform: dropdownOpen() ? 'rotate(180deg)' : 'rotate(0deg)',
              opacity: 0.7,
            }}
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        
        {/* Dropdown menu */}
        <Show when={dropdownOpen()}>
          <div 
            style={{
              position: 'absolute',
              top: `calc(100% + ${navTokens.spacing.sm})`,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'white',
              'border-radius': navTokens.radius.md,
              'box-shadow': navTokens.shadows.dropdown,
              overflow: 'hidden',
              'min-width': '190px',
              border: `1px solid ${navTokens.neutrals[100]}`,
              animation: 'dropdownFadeIn 0.2s ease',
            }}
            role="listbox"
            aria-label="Select timeline"
          >
            {(['now', 'next', 'later'] as Timeline[]).map((timeline) => {
              const colors = getTimelineColor(timeline);
              const isSelected = props.activeTimeline === timeline;
              return (
                <button
                  onClick={() => handleTimelineChange(timeline)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTimelineChange(timeline);
                    }
                  }}
                  role="option"
                  aria-selected={isSelected}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: navTokens.spacing.md,
                    width: '100%',
                    padding: `${navTokens.spacing.md} ${navTokens.spacing.lg}`,
                    background: isSelected ? colors.bg : 'transparent',
                    border: 'none',
                    'border-left': `3px solid ${isSelected ? colors.primary : 'transparent'}`,
                    'text-align': 'left',
                    cursor: 'pointer',
                    transition: navTokens.transitions.fast,
                    outline: 'none',
                    'font-family': navTokens.typography.fontFamily,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = navTokens.neutrals[50];
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected ? colors.bg : 'transparent';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.background = colors.bg;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = isSelected ? colors.bg : 'transparent';
                  }}
                >
                  <span style={{
                    width: '10px',
                    height: '10px',
                    'border-radius': navTokens.radius.full,
                    background: colors.primary,
                    'box-shadow': `0 0 4px ${colors.glow}`,
                    'flex-shrink': 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      'font-size': navTokens.typography.sizes.md,
                      'font-weight': navTokens.typography.weights.medium,
                      color: navTokens.neutrals[800],
                      'letter-spacing': navTokens.typography.letterSpacing.tight,
                    }}>
                      {timelineLabels[timeline].label}
                    </div>
                    <div style={{ 
                      'font-size': navTokens.typography.sizes.xs,
                      color: navTokens.neutrals[500],
                      'margin-top': navTokens.spacing['2xs'],
                    }}>
                      {timelineLabels[timeline].description}
                    </div>
                  </div>
                  <Show when={isSelected}>
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke={colors.primary}
                      stroke-width="3" 
                      stroke-linecap="round" 
                      stroke-linejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </Show>
                </button>
              );
            })}
          </div>
        </Show>
      </div>
      
      {/* Divider */}
      <div 
        style={{
          width: '1px',
          height: '24px',
          background: navTokens.neutrals[200],
          margin: `0 ${navTokens.spacing.sm}`,
          'flex-shrink': 0,
        }} 
        aria-hidden="true"
      />
      
      {/* App Tabs */}
      <For each={currentApps()}>
        {(app) => {
          const isActive = () => props.activeTab === app.id;
          return (
            <A
              href={`/${app.id}`}
              aria-current={isActive() ? 'page' : undefined}
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: navTokens.spacing.sm,
                padding: `${navTokens.spacing.sm} ${navTokens.spacing.md}`,
                border: 'none',
                'border-radius': navTokens.radius.sm,
                background: isActive() ? app.color : 'transparent',
                color: isActive() ? 'white' : navTokens.neutrals[600],
                'font-size': navTokens.typography.sizes.base,
                'font-weight': isActive() ? navTokens.typography.weights.medium : navTokens.typography.weights.normal,
                'letter-spacing': navTokens.typography.letterSpacing.normal,
                cursor: 'pointer',
                transition: navTokens.transitions.normal,
                'text-decoration': 'none',
                outline: 'none',
                position: 'relative',
                'white-space': 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isActive()) {
                  e.currentTarget.style.background = `${app.color}12`;
                  e.currentTarget.style.color = app.color;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive()) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = navTokens.neutrals[600];
                }
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = `${navTokens.shadows.focus} ${app.color}50`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* App Icon Badge */}
              <div style={{
                width: '20px',
                height: '20px',
                'border-radius': navTokens.radius.xs,
                background: isActive() ? 'rgba(255,255,255,0.2)' : `${app.color}15`,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'font-size': navTokens.typography.sizes.xs,
                'font-weight': navTokens.typography.weights.bold,
                color: isActive() ? 'white' : app.color,
                transition: navTokens.transitions.fast,
              }}>
                {app.name.charAt(0)}
              </div>
              
              {/* App Name */}
              <span>{app.name}</span>
              
              {/* Active indicator bar */}
              <Show when={isActive()}>
                <span style={{
                  position: 'absolute',
                  bottom: navTokens.spacing['2xs'],
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '16px',
                  height: '2px',
                  background: 'rgba(255,255,255,0.8)',
                  'border-radius': navTokens.radius.full,
                }} />
              </Show>
            </A>
          );
        }}
      </For>
    </nav>
  );
};

// App page wrapper component - receives appId from route params
export const AppPage: Component = () => {
  const params = useParams<{ appId: string }>();
  const appId = () => params.appId as AppTab;
  const activeTimeline = createMemo(() => getTimelineFromApp(appId()));
  
  // Map of app components
  const appComponents: Record<AppTab, Component> = {
    nurture: NurtureApp,
    justincase: JustInCaseApp,
    tempo: TempoApp,
    friendly: FriendlyApp,
    manifest: ManifestApp,
    augment: AugmentApp,
    lol: LolApp,
  };
  
  return (
    <>
      <TabNavigation 
        activeTimeline={activeTimeline()} 
        activeTab={appId()}
      />
      
      {/* App content with top padding for nav */}
      <div style={{ 'padding-top': '80px' }}>
        <Show when={appId() === 'nurture'}>
          <NurtureApp />
        </Show>
        <Show when={appId() === 'justincase'}>
          <JustInCaseApp />
        </Show>
        <Show when={appId() === 'tempo'}>
          <TempoApp />
        </Show>
        <Show when={appId() === 'friendly'}>
          <FriendlyApp />
        </Show>
        <Show when={appId() === 'manifest'}>
          <ManifestApp />
        </Show>
        <Show when={appId() === 'augment'}>
          <AugmentApp />
        </Show>
        <Show when={appId() === 'lol'}>
          <LolApp />
        </Show>
      </div>
    </>
  );
};

// Root layout component - wraps all routes
export const App: Component<{ children?: any }> = (props) => {
  return (
    <div style={{ 'min-height': '100vh' }}>
      {props.children}
    </div>
  );
};

// Re-export LandingPage for use in routes
export { LandingPage };

export default App;
