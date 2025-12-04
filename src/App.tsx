import { Component, createSignal, Show, For, createMemo, onCleanup, createEffect } from 'solid-js';
import { A, useNavigate, useParams } from '@solidjs/router';
import { NurtureApp } from './components/nurture/NurtureApp';
import { JustInCaseApp } from './components/justincase/JustInCaseApp';
import { TempoApp } from './components/tempo/TempoApp';
import { FriendlyApp } from './components/friendly/FriendlyApp';
import { ManifestApp } from './components/manifest/ManifestApp';
import { AugmentApp } from './components/augment/AugmentApp';
import { LolApp } from './components/lol/LolApp';
import { PaperTrailApp } from './components/papertrail/PaperTrailApp';

type AppTab =
  | 'nurture'
  | 'justincase'
  | 'tempo'
  | 'friendly'
  | 'manifest'
  | 'augment'
  | 'lol'
  | 'papertrail';
type Timeline = 'now' | 'next' | 'later';

interface AppInfo {
  id: AppTab;
  name: string;
  description: string;
  elevatorPitch: string;
  designSystem: string;
  color: string;
  timeline: Timeline;
  releaseDate: string;
  status: 'active' | 'alpha' | 'beta' | 'coming-soon';
  logo?: string;
}

const apps: AppInfo[] = [
  // NOW - Active development
  {
    id: 'tempo',
    name: 'Tempo',
    description: 'AI task timer',
    elevatorPitch:
      "Work with your natural rhythm, not against it. Tempo uses AI to learn when you're most productive.",
    designSystem: 'Dark Mode',
    color: '#5E6AD2',
    timeline: 'now',
    releaseDate: 'December 2025',
    status: 'active',
    logo: '/tempo/tempo_logo.png',
  },
  {
    id: 'nurture',
    name: 'Nurture',
    description: 'Relationship CRM',
    elevatorPitch:
      'Never forget a birthday or let a friendship fade. Gentle reminders and interaction tracking.',
    designSystem: 'Biophilic',
    color: '#2D5A45',
    timeline: 'now',
    releaseDate: 'Q1 2026',
    status: 'alpha',
  },
  // NEXT - Coming soon
  {
    id: 'justincase',
    name: 'JustInCase',
    description: 'Small claims helper',
    elevatorPitch:
      'Document everything, stress about nothing. Build airtight cases for small claims court.',
    designSystem: 'Daylight Reading',
    color: '#64748B',
    timeline: 'next',
    releaseDate: 'Q3 2026',
    status: 'coming-soon',
  },
  {
    id: 'friendly',
    name: 'FriendLy',
    description: 'Friendship calendar',
    elevatorPitch:
      'Coordinate hangouts without the group chat chaos. Finds the perfect time for everyone.',
    designSystem: 'Liquid',
    color: '#3B82F6',
    timeline: 'next',
    releaseDate: 'Q1 2026',
    status: 'coming-soon',
  },
  {
    id: 'augment',
    name: 'Augment',
    description: 'IO psychology jobs',
    elevatorPitch:
      'Find work that actually fits you. Matches personality and work style to careers.',
    designSystem: 'Maximalist',
    color: '#9333EA',
    timeline: 'next',
    releaseDate: 'Q1 2027',
    status: 'coming-soon',
  },
  // LATER - Future plans
  {
    id: 'manifest',
    name: 'Manifest',
    description: 'Picky matchmaking',
    elevatorPitch: 'Dating for people with standards. Detailed compatibility matching.',
    designSystem: 'Brutalistic',
    color: '#000000',
    timeline: 'later',
    releaseDate: 'TBD',
    status: 'coming-soon',
  },
  {
    id: 'lol',
    name: 'LoL',
    description: 'Gamified chores',
    elevatorPitch: 'Turn household tasks into a game. Rewards, streaks, and friendly competition.',
    designSystem: 'Papermorphic',
    color: '#2196F3',
    timeline: 'later',
    releaseDate: 'Q3 2026',
    status: 'coming-soon',
  },
  {
    id: 'papertrail',
    name: 'Paper Trail',
    description: 'News changelog',
    elevatorPitch:
      'Track what was said vs. what was true. Graph-first news aggregation with correction tracking.',
    designSystem: 'Paper Trail',
    color: '#D4A800',
    timeline: 'later',
    releaseDate: 'TBD',
    status: 'coming-soon',
  },
];

const timelineConfig: Record<Timeline, { label: string; description: string; color: string }> = {
  now: {
    label: 'Now',
    description: 'Active Development',
    color: '#10B981', // Emerald
  },
  next: {
    label: 'Next',
    description: 'Coming Soon',
    color: '#F59E0B', // Amber
  },
  later: {
    label: 'Later',
    description: 'Future Plans',
    color: '#8B5CF6', // Violet
  },
};

// First app in each timeline for navigation (fallback logic)
const firstAppByTimeline: Record<string, AppTab> = {
  now: 'tempo',
  next: 'friendly',
  later: 'manifest',
};

// =============================================================================
// KINETIC & ISOMETRIC COMPONENTS
// =============================================================================

const KineticText: Component<{
  text: string;
  delay?: number;
  style?: any;
}> = (props) => {
  return (
    <h1
      style={{
        display: 'inline-block',
        animation: 'slideUpFade 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        opacity: 0,
        transform: 'translateY(20px)',
        'animation-delay': `${props.delay || 0}ms`,
        ...props.style,
      }}
    >
      <For each={props.text.split('')}>
        {(char) => (
          <span
            style={{
              display: 'inline-block',
              transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), color 0.3s ease',
              'min-width': char === ' ' ? '0.3em' : 'auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.1)';
              e.currentTarget.style.color = '#4ECDC4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.color = 'inherit';
            }}
          >
            {char}
          </span>
        )}
      </For>
    </h1>
  );
};

const IsometricCard: Component<{
  app: AppInfo;
  onClick: () => void;
}> = (props) => {
  return (
    <div
      onClick={props.onClick}
      style={{
        position: 'relative',
        width: '100%',
        height: '180px', // Fixed height for uniformity
        cursor: 'pointer',
        transition: 'transform 0.3s ease',
        transform: 'perspective(1000px) rotateX(10deg) rotateY(-10deg)', // Subtle 3D
        'transform-style': 'preserve-3d',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform =
          'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1.05) translateZ(20px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'perspective(1000px) rotateX(10deg) rotateY(-10deg)';
      }}
    >
      {/* Shadow */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '-20px',
          bottom: '-20px',
          background: 'rgba(0,0,0,0.5)',
          filter: 'blur(20px)',
          'border-radius': '20px',
          'z-index': 0,
          transform: 'translateZ(-50px)',
        }}
      />

      {/* Main Face */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${props.app.color}20, #1A1A2E)`,
          'backdrop-filter': 'blur(10px)',
          border: `1px solid ${props.app.color}40`,
          'border-radius': '20px',
          padding: '24px',
          display: 'flex',
          'flex-direction': 'column',
          gap: '12px',
          overflow: 'hidden',
          'box-shadow': `inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 0 20px ${props.app.color}20`,
          'z-index': 10,
        }}
      >
        {/* Top Edge Highlight */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${props.app.color}, transparent)`,
          }}
        />

        <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              'border-radius': '8px',
              background: props.app.color,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              color: 'white',
              'font-weight': 'bold',
              'box-shadow': `0 4px 12px ${props.app.color}60`,
            }}
          >
            {props.app.name[0]}
          </div>
          <h4 style={{ margin: 0, color: 'white', 'font-size': '18px' }}>{props.app.name}</h4>
        </div>

        <p
          style={{
            margin: 0,
            'font-size': '13px',
            color: 'rgba(255,255,255,0.7)',
            'line-height': '1.4',
          }}
        >
          {props.app.description}
        </p>

        <div style={{ 'margin-top': 'auto', display: 'flex', gap: '8px' }}>
          <span
            style={{
              'font-size': '10px',
              padding: '4px 8px',
              'border-radius': '12px',
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            {props.app.releaseDate}
          </span>
        </div>
      </div>

      {/* Side Face (Thickness) */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          right: '-10px',
          width: '10px',
          height: '100%',
          background: props.app.color,
          filter: 'brightness(0.6)',
          transform: 'skewY(45deg) translateZ(-1px)',
          'transform-origin': 'left',
          'border-top-right-radius': '4px',
          'border-bottom-right-radius': '4px',
        }}
      />

      {/* Bottom Face (Thickness) */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10px',
          left: '0',
          width: '100%',
          height: '10px',
          background: props.app.color,
          filter: 'brightness(0.4)',
          transform: 'skewX(45deg) translateZ(-1px)',
          'transform-origin': 'top',
          'border-bottom-left-radius': '4px',
          'border-bottom-right-radius': '4px',
        }}
      />
    </div>
  );
};

// Compact App Item with bracket styling and tooltip
const AppItem: Component<{ app: AppInfo; onClick: () => void }> = (props) => {
  const [showTooltip, setShowTooltip] = createSignal(false);

  return (
    <div
      style={{
        position: 'relative',
        display: 'block',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      <button
        onClick={props.onClick}
        tabIndex={0}
        role="button"
        aria-describedby={`tooltip-${props.app.id}`}
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: '12px',
          padding: '10px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          'border-radius': '8px',
          width: '100%',
          'text-align': 'left',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.transform = 'translateX(4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        {/* Left bracket */}
        <span
          style={{
            color: props.app.color,
            'font-size': '18px',
            'font-weight': '300',
            opacity: 0.6,
          }}
        >
          [
        </span>

        {/* App icon/logo */}
        <div
          style={{
            width: '28px',
            height: '28px',
            'border-radius': '6px',
            background: props.app.color,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'flex-shrink': 0,
            border: '1px solid rgba(255,255,255,0.15)',
            'box-shadow': `0 0 12px ${props.app.color}40, inset 0 1px 0 rgba(255,255,255,0.1)`,
          }}
        >
          <Show
            when={props.app.id === 'tempo'}
            fallback={
              <span style={{ color: 'white', 'font-size': '12px', 'font-weight': '600' }}>
                {props.app.name[0]}
              </span>
            }
          >
            <img
              src="/tempo/tempo_logo.png"
              alt="Tempo"
              style={{ width: '18px', height: '18px', 'object-fit': 'contain' }}
            />
          </Show>
        </div>

        {/* App info */}
        <div style={{ flex: 1, 'min-width': 0 }}>
          <div style={{ 'font-size': '14px', 'font-weight': '600', color: 'white' }}>
            {props.app.name}
          </div>
          <div style={{ 'font-size': '11px', color: 'rgba(255,255,255,0.4)' }}>
            {props.app.description}
          </div>
        </div>

        {/* Right bracket */}
        <span
          style={{
            color: props.app.color,
            'font-size': '18px',
            'font-weight': '300',
            opacity: 0.6,
          }}
        >
          ]
        </span>
      </button>

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
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '12px',
              height: '12px',
              background: 'rgba(255, 255, 255, 0.98)',
              'box-shadow': '2px 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          />

          {/* Content */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '10px',
              'margin-bottom': '10px',
            }}
          >
            <div
              style={{
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
              }}
            >
              <Show when={props.app.id === 'tempo'} fallback={props.app.name.charAt(0)}>
                <img
                  src="/tempo/tempo_logo.png"
                  alt="Tempo"
                  style={{ width: '20px', height: '20px', 'object-fit': 'contain' }}
                />
              </Show>
            </div>
            <div>
              <div
                style={{
                  'font-size': '15px',
                  'font-weight': '600',
                  color: '#1F2937',
                  'line-height': '1.2',
                }}
              >
                {props.app.name}
              </div>
              <div
                style={{
                  'font-size': '12px',
                  color: '#6B7280',
                }}
              >
                {props.app.description}
              </div>
            </div>
          </div>

          <p
            style={{
              margin: 0,
              'font-size': '13px',
              'line-height': '1.5',
              color: '#374151',
            }}
          >
            {props.app.elevatorPitch}
          </p>
        </div>
      </Show>
    </div>
  );
};

// Main Landing Page with Manifesto
const LandingPage: Component = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        'min-height': '100vh',
        background: 'linear-gradient(180deg, #0F0F1A 0%, #1A1A2E 50%, #16213E 100%)',
        'font-family': "'Inter', system-ui, sans-serif",
        color: 'white',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>
        {`
          @keyframes slideUpFade {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      {/* Decorative gradient orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          left: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255,107,107,0.15) 0%, transparent 70%)',
          'border-radius': '50%',
          filter: 'blur(40px)',
          'pointer-events': 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '0',
          right: '15%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(78,205,196,0.12) 0%, transparent 70%)',
          'border-radius': '50%',
          filter: 'blur(40px)',
          'pointer-events': 'none',
        }}
      />

      {/* Hero Section */}
      <header
        style={{
          'text-align': 'center',
          padding: '80px 24px 50px',
          position: 'relative',
          'z-index': 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '72px',
            height: '72px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)',
            'border-radius': '18px',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'box-shadow': '0 8px 32px rgba(255,107,107,0.3)',
          }}
        >
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
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

        <h1
          style={{
            margin: '0 0 6px 0',
            'font-size': '13px',
            'font-weight': '600',
            'letter-spacing': '2px',
            'text-transform': 'uppercase',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          Thoughtful App Co.
        </h1>

        <h2
          style={{
            margin: '0 0 20px 0',
            'font-size': 'clamp(28px, 4vw, 48px)',
            'font-weight': '700',
            'line-height': '1.1',
            'letter-spacing': '-1px',
            background: 'linear-gradient(135deg, #FF6B6B, #FFE66D, #4ECDC4)',
            '-webkit-background-clip': 'text',
            '-webkit-text-fill-color': 'transparent',
            'background-clip': 'text',
          }}
        >
          Enable, Don't Enslave
        </h2>

        <p
          style={{
            margin: '0 auto 8px',
            'max-width': '600px',
            'font-size': '16px',
            'line-height': '1.6',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          A marketplace of applications respecting your time, attention, and autonomy.
        </p>
        <p
          style={{
            margin: '0 auto',
            'font-size': '13px',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          Human-First • Local-First • Design-First • Open Contribution
        </p>
      </header>

      {/* App Marketplace */}
      <section
        style={{
          padding: '20px 24px 80px',
          'max-width': '1000px',
          margin: '0 auto',
          position: 'relative',
          'z-index': 1,
        }}
      >
        <div
          style={{
            display: 'grid',
            'grid-template-columns': 'repeat(3, 1fr)',
            gap: '24px',
          }}
        >
          <For each={['now', 'next', 'later'] as Timeline[]}>
            {(quadrant) => {
              const quadrantApps = apps.filter((a) => a.timeline === quadrant);
              const config = timelineConfig[quadrant];

              return (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    'border-radius': '16px',
                    padding: '20px',
                  }}
                >
                  {/* Section Header */}
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '8px',
                      'margin-bottom': '16px',
                      'padding-bottom': '12px',
                      'border-bottom': '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        'border-radius': '50%',
                        background: config.color,
                        'box-shadow': `0 0 8px ${config.color}`,
                      }}
                    />
                    <span style={{ 'font-size': '14px', 'font-weight': '600', color: 'white' }}>
                      {config.label}
                    </span>
                    <span
                      style={{
                        'font-size': '11px',
                        color: 'rgba(255,255,255,0.4)',
                        'margin-left': 'auto',
                      }}
                    >
                      {config.description}
                    </span>
                  </div>

                  {/* App List */}
                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
                    <For each={quadrantApps}>
                      {(app) => <AppItem app={app} onClick={() => navigate(`/${app.id}`)} />}
                    </For>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '60px 24px 40px',
          background: 'rgba(0,0,0,0.3)',
          'border-top': '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            'max-width': '1200px',
            margin: '0 auto',
          }}
        >
          {/* Footer Grid */}
          <div
            style={{
              display: 'grid',
              'grid-template-columns': 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '40px',
              'margin-bottom': '48px',
            }}
          >
            {/* Brand Column */}
            <div>
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '12px',
                  'margin-bottom': '16px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)',
                    'border-radius': '10px',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
                <span
                  style={{
                    'font-size': '16px',
                    'font-weight': '600',
                    color: 'white',
                  }}
                >
                  Thoughtful App Co.
                </span>
              </div>
              <p
                style={{
                  margin: '0 0 20px 0',
                  'font-size': '14px',
                  'line-height': '1.6',
                  color: 'rgba(255,255,255,0.5)',
                  'max-width': '280px',
                }}
              >
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
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
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
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
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
                  background:
                    'linear-gradient(135deg, rgba(255,107,107,0.15) 0%, rgba(78,205,196,0.15) 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  'border-radius': '12px',
                  display: 'flex',
                  'align-items': 'center',
                  gap: '12px',
                  'text-decoration': 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, rgba(255,107,107,0.25) 0%, rgba(78,205,196,0.25) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, rgba(255,107,107,0.15) 0%, rgba(78,205,196,0.15) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    'border-radius': '8px',
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'flex-shrink': 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
                  </svg>
                </div>
                <div>
                  <div
                    style={{
                      'font-size': '13px',
                      'font-weight': '600',
                      color: 'white',
                      'line-height': '1.2',
                    }}
                  >
                    Humans Only Podcast
                  </div>
                  <div
                    style={{
                      'font-size': '11px',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    humansonly.fm
                  </div>
                </div>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  style={{ 'margin-left': 'auto' }}
                >
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </a>
            </div>

            {/* Apps Column */}
            <div>
              <h4
                style={{
                  margin: '0 0 16px 0',
                  'font-size': '12px',
                  'font-weight': '600',
                  'letter-spacing': '1px',
                  'text-transform': 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                Apps
              </h4>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  'list-style': 'none',
                  display: 'flex',
                  'flex-direction': 'column',
                  gap: '10px',
                }}
              >
                <For each={apps}>
                  {(app) => (
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
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            'border-radius': '50%',
                            background: app.color,
                          }}
                        />
                        {app.name}
                        <span
                          style={{
                            'font-size': '11px',
                            color: 'rgba(255,255,255,0.3)',
                          }}
                        >
                          — {app.description}
                        </span>
                      </A>
                    </li>
                  )}
                </For>
              </ul>
            </div>

            {/* Philosophy Column */}
            <div>
              <h4
                style={{
                  margin: '0 0 16px 0',
                  'font-size': '12px',
                  'font-weight': '600',
                  'letter-spacing': '1px',
                  'text-transform': 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                Philosophy
              </h4>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  'list-style': 'none',
                  display: 'flex',
                  'flex-direction': 'column',
                  gap: '10px',
                }}
              >
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
              <h4
                style={{
                  margin: '0 0 16px 0',
                  'font-size': '12px',
                  'font-weight': '600',
                  'letter-spacing': '1px',
                  'text-transform': 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                Resources
              </h4>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  'list-style': 'none',
                  display: 'flex',
                  'flex-direction': 'column',
                  gap: '10px',
                }}
              >
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
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
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
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
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
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
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
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  >
                    Contribute
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              'padding-top': '24px',
              'border-top': '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'center',
              'flex-wrap': 'wrap',
              gap: '16px',
            }}
          >
            <p
              style={{
                margin: 0,
                'font-size': '13px',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              © {new Date().getFullYear()} Thoughtful App Co. Technology for Human Good.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '24px',
              }}
            >
              <a
                href="#"
                style={{
                  'font-size': '13px',
                  color: 'rgba(255,255,255,0.3)',
                  'text-decoration': 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
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
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
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
  // Now = Emerald (active, current, go)
  // Next = Amber (upcoming, attention, prepare)
  // Later = Violet (future, planned)
  timelineColors: {
    now: {
      primary: '#10B981', // Emerald green
      glow: 'rgba(16, 185, 129, 0.5)',
      bg: 'rgba(16, 185, 129, 0.08)',
    },
    next: {
      primary: '#F59E0B', // Amber
      glow: 'rgba(245, 158, 11, 0.5)',
      bg: 'rgba(245, 158, 11, 0.08)',
    },
    later: {
      primary: '#8B5CF6', // Violet
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
  const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false);
  const [menuTimeline, setMenuTimeline] = createSignal<Timeline>(props.activeTimeline);

  // Drag state
  const [menuPos, setMenuPos] = createSignal({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = createSignal({ x: 0, y: 0 });

  // Resize state
  const [menuSize, setMenuSize] = createSignal(56);
  const [isResizing, setIsResizing] = createSignal(false);
  const [resizeStart, setResizeStart] = createSignal({ x: 0, y: 0, initialSize: 0 });

  const navigate = useNavigate();

  // Filtered apps for Hamburger Menu
  const filteredApps = () => apps.filter((app) => app.timeline === menuTimeline());

  // Sync menu timeline with active timeline when menu opens
  createEffect(() => {
    if (mobileMenuOpen()) {
      setMenuTimeline(props.activeTimeline);
    }
  });

  const handleMouseDown = (e: MouseEvent) => {
    // Check if clicking resize handle (we'll add a class or id to check)
    const target = e.target as HTMLElement;
    if (target.closest('.resize-handle')) {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      setResizeStart({ x: e.clientX, y: e.clientY, initialSize: menuSize() });
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialPos(menuPos());
      e.preventDefault();
    }
  };

  const handleWindowMouseMove = (e: MouseEvent) => {
    if (isDragging()) {
      const dx = e.clientX - dragStart().x;
      const dy = e.clientY - dragStart().y;
      setMenuPos({
        x: Math.max(16, Math.min(window.innerWidth - menuSize() - 16, initialPos().x + dx)),
        y: Math.max(16, Math.min(window.innerHeight - menuSize() - 16, initialPos().y + dy)),
      });
    } else if (isResizing()) {
      const dx = e.clientX - resizeStart().x;
      const dy = e.clientY - resizeStart().y;
      // Use the larger of dx/dy to keep aspect ratio 1:1 if we want, or just diagonal
      // Let's assume uniform scaling based on diagonal movement
      const delta = (dx + dy) / 2;
      const newSize = Math.max(32, Math.min(120, resizeStart().initialSize + delta));
      setMenuSize(newSize);
    }
  };

  const handleWindowMouseUp = (e: MouseEvent) => {
    if (isDragging()) {
      setIsDragging(false);
      // If moved less than 5px, treat as click
      const dx = e.clientX - dragStart().x;
      const dy = e.clientY - dragStart().y;
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
        setMobileMenuOpen(!mobileMenuOpen());
      }
    } else if (isResizing()) {
      setIsResizing(false);
    }
  };

  // Attach drag listeners
  createEffect(() => {
    if (isDragging()) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    } else {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    }
  });

  // Cleanup on unmount
  onCleanup(() => {
    window.removeEventListener('mousemove', handleWindowMouseMove);
    window.removeEventListener('mouseup', handleWindowMouseUp);
  });

  const handleTimelineChange = (timeline: Timeline) => {
    setMenuTimeline(timeline);
  };

  const handleAppClick = (appId: AppTab) => {
    navigate(`/${appId}`);
    setMobileMenuOpen(false);
  };

  // Global keyboard shortcuts
  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    // Ctrl + Shift + H (Home)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      navigate('/');
      setMobileMenuOpen(false);
    }
  };

  createEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleGlobalKeyDown));
  });

  return (
    <>
      {/* Draggable Hamburger Button */}
      <button
        onMouseDown={handleMouseDown}
        aria-label={mobileMenuOpen() ? 'Close menu' : 'Open menu'}
        style={{
          position: 'fixed',
          top: `${menuPos().y}px`,
          left: `${menuPos().x}px`,
          'z-index': 2002,
          width: `${menuSize()}px`,
          height: `${menuSize()}px`,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          background: mobileMenuOpen() ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.9)',
          'backdrop-filter': 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          'border-radius': '50%',
          border: mobileMenuOpen()
            ? '1px solid rgba(255,255,255,0.2)'
            : `1px solid ${navTokens.neutrals[200]}`,
          'box-shadow': mobileMenuOpen()
            ? 'none'
            : isDragging()
              ? navTokens.shadows.dropdown
              : navTokens.shadows.nav,
          cursor: isDragging() ? 'grabbing' : 'grab',

          // Persistent visibility
          opacity: 1,
          'pointer-events': 'auto',
          transform: 'scale(1)',

          transition:
            isDragging() || isResizing() ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          color: mobileMenuOpen() ? 'white' : navTokens.brand.dark,
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          if (!mobileMenuOpen() && !isDragging() && !isResizing()) {
            e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
            e.currentTarget.style.boxShadow = navTokens.shadows.dropdown;
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging() && !isResizing()) {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            e.currentTarget.style.boxShadow = mobileMenuOpen() ? 'none' : navTokens.shadows.nav;
          }
        }}
      >
        {/* Resize Handle */}
        <div
          class="resize-handle"
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '16px',
            height: '16px',
            cursor: 'nwse-resize',
            'z-index': 10,
            display: 'flex',
            'align-items': 'flex-end',
            'justify-content': 'flex-end',
            padding: '3px',
            opacity: 0,
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              'border-right': `2px solid ${mobileMenuOpen() ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}`,
              'border-bottom': `2px solid ${mobileMenuOpen() ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}`,
              'border-bottom-right-radius': '2px',
            }}
          />
        </div>

        <svg
          width={menuSize() * 0.5}
          height={menuSize() * 0.5}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          style={{
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: mobileMenuOpen() ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          <Show
            when={mobileMenuOpen()}
            fallback={
              <>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </>
            }
          >
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          </Show>
        </svg>
      </button>

      {/* Full Screen Immersive Menu */}
      <Show when={mobileMenuOpen()}>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#0F0F1A',
            'z-index': 2001,
            display: 'flex',
            animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Left Column - Triangle */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close menu"
            style={{
              position: 'relative',
              width: '40%',
              height: '100%',
              background: `linear-gradient(135deg, ${navTokens.brand.coral}, ${navTokens.brand.yellow}, ${navTokens.brand.teal})`,
              'clip-path': 'polygon(0 0, 100% 0, 60% 100%, 0 100%)',
              cursor: 'pointer',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'z-index': 2,
              transition: 'filter 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
          >
            <div
              style={{
                'font-size': 'clamp(80px, 15vw, 200px)',
                color: 'rgba(255,255,255,0.2)',
                'font-weight': '900',
                transform: 'rotate(-90deg)',
                'white-space': 'nowrap',
                'pointer-events': 'none',
                'user-select': 'none',
                'letter-spacing': '20px',
              }}
            >
              CLOSE
            </div>
          </div>

          {/* Right Column - Content */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              'flex-direction': 'column',
              padding: '40px 60px',
              'justify-content': 'center',
              'overflow-y': 'auto',
            }}
          >
            {/* Header */}
            <div
              style={{
                'margin-bottom': '48px',
                animation: 'slideDown 0.4s ease forwards',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
              }}
            >
              {/* Logo and Company Name - Clickable Home Button */}
              <A
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '16px',
                  'text-decoration': 'none',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {/* Logo */}
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    'border-radius': '14px',
                    background: `linear-gradient(135deg, ${navTokens.brand.coral}, ${navTokens.brand.yellow}, ${navTokens.brand.teal})`,
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'box-shadow': '0 8px 24px rgba(0,0,0,0.3)',
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div>
                  <h2
                    style={{
                      'font-size': 'clamp(24px, 4vw, 36px)',
                      'font-weight': '700',
                      color: 'white',
                      margin: 0,
                      'line-height': 1.2,
                      'font-family': navTokens.typography.fontFamily,
                    }}
                  >
                    Thoughtful App Co.
                  </h2>
                  <div
                    style={{
                      'font-size': '14px',
                      color: 'rgba(255,255,255,0.5)',
                      'margin-top': '4px',
                    }}
                  >
                    Apps that care
                  </div>
                </div>
              </A>

              {/* Settings Button */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  // Navigate to settings/profile - for now just close menu
                  // TODO: Add actual settings route when available
                  navigate('/settings');
                }}
                aria-label="Settings"
                style={{
                  width: '48px',
                  height: '48px',
                  'border-radius': '50%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  color: 'rgba(255,255,255,0.7)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'rotate(45deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            </div>

            {/* Timeline Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '40px',
                'margin-bottom': '48px',
                'border-bottom': '1px solid rgba(255,255,255,0.1)',
                'padding-bottom': '16px',
                animation: 'slideDown 0.5s ease forwards',
              }}
            >
              <For each={['now', 'next', 'later'] as Timeline[]}>
                {(timeline) => (
                  <button
                    onClick={() => handleTimelineChange(timeline)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: menuTimeline() === timeline ? 'white' : 'rgba(255,255,255,0.4)',
                      'font-size': '20px',
                      'font-weight': menuTimeline() === timeline ? '600' : '400',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      padding: '8px 0',
                      'font-family': navTokens.typography.fontFamily,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={(e) => {
                      if (menuTimeline() !== timeline)
                        e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                    }}
                  >
                    {timelineConfig[timeline].label}
                    <Show when={menuTimeline() === timeline}>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-17px',
                          left: 0,
                          width: '100%',
                          height: '3px',
                          background: navTokens.timelineColors[timeline].primary,
                          'box-shadow': `0 0 10px ${navTokens.timelineColors[timeline].glow}`,
                          'border-radius': '2px',
                          transition: 'all 0.3s ease',
                        }}
                      />
                    </Show>
                  </button>
                )}
              </For>
            </div>

            {/* App Grid */}
            <div
              style={{
                display: 'grid',
                'grid-template-columns': 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '24px',
                width: '100%',
                animation: 'slideDown 0.6s ease forwards',
              }}
            >
              {filteredApps().map((app, index) => (
                <button
                  onClick={() => handleAppClick(app.id)}
                  style={{
                    padding: '32px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    'border-radius': '24px',
                    display: 'flex',
                    'flex-direction': 'column',
                    'align-items': 'flex-start',
                    gap: '16px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    'animation-delay': `${0.1 * index}s`,
                    cursor: 'pointer',
                    'text-align': 'left',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = app.color;
                    e.currentTarget.style.boxShadow = `0 12px 32px -8px ${app.color}30`;
                    const arrow = e.currentTarget.querySelector('.arrow-icon') as HTMLElement;
                    if (arrow) {
                      arrow.style.opacity = '1';
                      arrow.style.transform = 'translateX(0)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                    const arrow = e.currentTarget.querySelector('.arrow-icon') as HTMLElement;
                    if (arrow) {
                      arrow.style.opacity = '0';
                      arrow.style.transform = 'translateX(-10px)';
                    }
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'space-between',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        'border-radius': '14px',
                        background: app.color,
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'font-size': '20px',
                        'font-weight': '700',
                        color: 'white',
                        'box-shadow': `0 8px 24px ${app.color}40`,
                        padding: app.id === 'tempo' ? '4px' : '0',
                      }}
                    >
                      <Show when={app.id === 'tempo'} fallback={app.name.charAt(0)}>
                        <img
                          src="/tempo/tempo_logo.png"
                          alt="Tempo Logo"
                          style={{
                            height: '32px',
                            width: '32px',
                            'object-fit': 'contain',
                          }}
                        />
                      </Show>
                    </div>

                    <div
                      class="arrow-icon"
                      style={{
                        opacity: 0,
                        transform: 'translateX(-10px)',
                        transition: 'all 0.3s ease',
                        color: 'white',
                      }}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        'font-size': '20px',
                        'font-weight': '600',
                        color: 'white',
                        'margin-bottom': '6px',
                        'font-family': navTokens.typography.fontFamily,
                      }}
                    >
                      {app.name}
                    </div>
                    <div
                      style={{
                        'font-size': '14px',
                        color: 'rgba(255,255,255,0.5)',
                        'line-height': '1.5',
                        'font-family': navTokens.typography.fontFamily,
                      }}
                    >
                      {app.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Show>
    </>
  );
};

// Get timeline from app id
const getTimelineFromApp = (appId: AppTab): Timeline => {
  const app = apps.find((a) => a.id === appId);
  return app?.timeline || 'now';
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
    papertrail: PaperTrailApp,
  };

  return (
    <>
      <TabNavigation activeTimeline={activeTimeline()} activeTab={appId()} />

      {/* App content */}
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
      <Show when={appId() === 'papertrail'}>
        <PaperTrailApp />
      </Show>
    </>
  );
};

// Root layout component - wraps all routes
export const App: Component<{ children?: any }> = (props) => {
  return <div style={{ 'min-height': '100vh' }}>{props.children}</div>;
};

// Re-export LandingPage for use in routes
export { LandingPage };

export default App;
