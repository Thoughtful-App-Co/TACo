import { Component, createSignal, Show, For, createMemo, onCleanup, createEffect } from 'solid-js';
import { A, useNavigate, useParams } from '@solidjs/router';
import { NurtureApp } from './components/nurture/NurtureApp';
import { JustInCaseApp } from './components/justincase/JustInCaseApp';
import { TempoApp } from './components/tempo/TempoApp';
import { FriendlyApp } from './components/friendly/FriendlyApp';
import { ManifestApp } from './components/manifest/ManifestApp';
import { TenureApp } from './components/tenure/TenureApp';
import { LolApp } from './components/lol/LolApp';
import { PricingPage } from './components/PricingPage';
import { PaperTrailApp } from './components/papertrail/PaperTrailApp';
import { useManifestSwitcher } from './lib/pwa/manifest-switcher';
import { useIOSMetaUpdater } from './lib/pwa/ios-meta';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { InstallBanner } from './components/common/InstallBanner';
import { UpdateModal } from './components/common/UpdateModal';
import { appMenuStore } from './stores/app-menu-store';

type AppTab =
  | 'nurture'
  | 'justincase'
  | 'tempo'
  | 'friendly'
  | 'manifest'
  | 'tenure'
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
    description: 'A.D.H.D Task Master',
    elevatorPitch:
      'Enter your tasks, get a real action plan. Tempo will ensure we turn to-do lists into actions. Activate "Annoy Me Mode" to get some really awesome results...',
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
    description: 'Relationship Management',
    elevatorPitch:
      'Never forget a birthday or let a friendship fade. Gentle reminders and interaction tracking.',
    designSystem: 'Biophilic',
    color: '#2D5A45',
    timeline: 'next',
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
    id: 'tenure',
    name: 'Tenure',
    description: 'Eternal Career Companion',
    elevatorPitch:
      'Career help is not an effective money maker for corporations and LinkedIn charging you $30 a month to find a job is criminal. Tenure is about life-long career aid, find out what you want to be when you grow up, write specialized resumes w/ Resume Mutator, and, actively track and apply for jobs with our Prospect job pipeline.',
    designSystem: 'Maximalist',
    color: '#9333EA',
    timeline: 'now',
    releaseDate: 'Q1 2027',
    status: 'coming-soon',
    logo: '/tenure/tenure_logo.png',
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
    color: '#FFE500',
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
  next: 'justincase',
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
              'text-shadow':
                '0 0 2px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.5), 1px 1px 0 rgba(0,0,0,0.3)',
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
            when={props.app.logo}
            fallback={
              <span
                style={{
                  color: 'white',
                  'font-size': '12px',
                  'font-weight': '600',
                  'text-shadow':
                    '0 0 2px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.5), 1px 1px 0 rgba(0,0,0,0.3)',
                }}
              >
                {props.app.name[0]}
              </span>
            }
          >
            <img
              src={props.app.logo}
              alt={props.app.name}
              style={{ width: '23px', height: '23px', 'object-fit': 'contain' }}
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
                'text-shadow':
                  '0 0 2px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.5), 1px 1px 0 rgba(0,0,0,0.3)',
              }}
            >
              <Show when={props.app.logo} fallback={props.app.name.charAt(0)}>
                <img
                  src={props.app.logo}
                  alt={props.app.name}
                  style={{ width: '26px', height: '26px', 'object-fit': 'contain' }}
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

  // Mobile detection
  const [isMobile, setIsMobile] = createSignal(window.innerWidth <= 768);

  createEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    onCleanup(() => window.removeEventListener('resize', handleResize));
  });

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
          padding: isMobile() ? '60px 20px 40px' : '80px 24px 50px',
          position: 'relative',
          'z-index': 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: isMobile() ? '56px' : '72px',
            height: isMobile() ? '56px' : '72px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)',
            'border-radius': isMobile() ? '14px' : '18px',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'box-shadow': '0 8px 32px rgba(255,107,107,0.3)',
          }}
        >
          <svg
            width={isMobile() ? '32' : '42'}
            height={isMobile() ? '32' : '42'}
            viewBox="0 0 24 24"
            fill="none"
          >
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
            'text-transform': 'uppercase',
            margin: '0 0 10px 0',
            'font-size': 'clamp(24px, 4vw, 36px)',
            'font-weight': '400',
            'letter-spacing': '1px',
            'font-family': navTokens.typography.brandFamily,
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          Thoughtful App Co.
        </h1>

        <h2
          style={{
            margin: '0 0 20px 0',
            'font-size': isMobile() ? '24px' : 'clamp(28px, 4vw, 48px)',
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
            'font-size': isMobile() ? '14px' : '16px',
            'line-height': '1.6',
            color: 'rgba(255,255,255,0.6)',
            padding: isMobile() ? '0 8px' : '0',
          }}
        >
          A marketplace of applications respecting your time, attention, and autonomy.
        </p>
        <p
          style={{
            margin: '0 auto',
            'font-size': isMobile() ? '11px' : '13px',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          {isMobile()
            ? 'Human-First • Local-First • Open'
            : 'Human-First • Local-First • Design-First • Open Contribution'}
        </p>
      </header>

      {/* App Marketplace */}
      <section
        style={{
          padding: isMobile() ? '16px 16px 60px' : '20px 24px 80px',
          'max-width': '1000px',
          margin: '0 auto',
          position: 'relative',
          'z-index': 1,
        }}
      >
        <div
          style={{
            display: 'grid',
            'grid-template-columns': isMobile() ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile() ? '16px' : '24px',
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
                    'border-radius': isMobile() ? '12px' : '16px',
                    padding: isMobile() ? '16px' : '20px',
                  }}
                >
                  {/* Section Header */}
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '8px',
                      'margin-bottom': isMobile() ? '12px' : '16px',
                      'padding-bottom': isMobile() ? '10px' : '12px',
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
                        'flex-shrink': 0,
                      }}
                    />
                    <span
                      style={{
                        'font-size': isMobile() ? '13px' : '14px',
                        'font-weight': '600',
                        color: 'white',
                      }}
                    >
                      {config.label}
                    </span>
                    <span
                      style={{
                        'font-size': isMobile() ? '10px' : '11px',
                        color: 'rgba(255,255,255,0.4)',
                        'margin-left': 'auto',
                        'text-align': 'right',
                      }}
                    >
                      {config.description}
                    </span>
                  </div>

                  {/* App List */}
                  <div
                    style={{
                      display: 'flex',
                      'flex-direction': 'column',
                      gap: isMobile() ? '2px' : '4px',
                    }}
                  >
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
          padding: isMobile() ? '40px 20px 32px' : '60px 24px 40px',
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
              'grid-template-columns': isMobile() ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: isMobile() ? '32px' : '40px',
              'margin-bottom': isMobile() ? '32px' : '48px',
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
                    'font-size': '18px',
                    'font-weight': '400',
                    'font-family': navTokens.typography.brandFamily,
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
              'padding-top': isMobile() ? '20px' : '24px',
              'border-top': '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              'flex-direction': isMobile() ? 'column' : 'row',
              'justify-content': isMobile() ? 'center' : 'space-between',
              'align-items': 'center',
              'flex-wrap': 'wrap',
              gap: isMobile() ? '12px' : '16px',
              'text-align': isMobile() ? 'center' : 'left',
            }}
          >
            <p
              style={{
                margin: 0,
                'font-size': isMobile() ? '11px' : '13px',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              © {new Date().getFullYear()} Thoughtful App Co.
              {isMobile() ? '' : ' Technology for Human Good.'}© 2025 Thoughtful App Co. Technology
              for Human Good.
            </p>
            <div
              style={{
                display: 'flex',
                gap: isMobile() ? '16px' : '24px',
              }}
            >
              <A
                href="/pricing"
                style={{
                  'font-size': '13px',
                  color: 'rgba(255,255,255,0.3)',
                  'text-decoration': 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                Pricing
              </A>
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
    brandFamily: "'Shupp', 'DM Sans', system-ui, sans-serif",
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
  const [menuTimeline, setMenuTimeline] = createSignal<Timeline>(props.activeTimeline);

  // Mobile detection
  const [isMobile, setIsMobile] = createSignal(window.innerWidth <= 768);

  // Update on resize
  createEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    onCleanup(() => window.removeEventListener('resize', handleResize));
  });

  const navigate = useNavigate();

  // Filtered apps for Hamburger Menu
  const filteredApps = () => apps.filter((app) => app.timeline === menuTimeline());

  // Sync menu timeline with active timeline when menu opens
  createEffect(() => {
    if (appMenuStore.isOpen()) {
      setMenuTimeline(props.activeTimeline);
    }
  });

  const handleTimelineChange = (timeline: Timeline) => {
    setMenuTimeline(timeline);
  };

  const handleAppClick = (appId: AppTab) => {
    navigate(`/${appId}`);
    appMenuStore.close();
  };

  // Global keyboard shortcuts
  createEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + H (Home)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        navigate('/');
        appMenuStore.close();
      }
      // ESC to close menu
      if (e.key === 'Escape' && appMenuStore.isOpen()) {
        e.preventDefault();
        appMenuStore.close();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleGlobalKeyDown));
  });

  return (
    <>
      {/* Full Screen Immersive Menu - No floating button, triggered by app logos */}
      <Show when={appMenuStore.isOpen()}>
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
            'flex-direction': isMobile() ? 'column' : 'row',
            animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Left Column - Triangle (hidden on mobile, replaced with top bar) */}
          <Show when={!isMobile()}>
            <div
              onClick={() => appMenuStore.close()}
              role="button"
              tabIndex={0}
              aria-label="Close menu"
              style={{
                position: 'relative',
                width: '40%',
                height: '100%',
                background: 'linear-gradient(135deg, #2D3748 0%, #1A202C 50%, #171923 100%)',
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
                  color: 'rgba(255,255,255,0.08)',
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
          </Show>

          {/* Mobile Top Bar - Subdued dark gradient with close hint */}
          <Show when={isMobile()}>
            <div
              onClick={() => appMenuStore.close()}
              role="button"
              tabIndex={0}
              aria-label="Close menu"
              style={{
                width: '100%',
                height: '56px',
                background: 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'flex-shrink': 0,
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {/* Swipe indicator pill */}
              <div
                style={{
                  width: '40px',
                  height: '5px',
                  'border-radius': '3px',
                  background: 'rgba(255,255,255,0.3)',
                  position: 'absolute',
                  bottom: '12px',
                }}
              />
              <span
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  'font-size': '12px',
                  'font-weight': '600',
                  'text-transform': 'uppercase',
                  'letter-spacing': '2px',
                }}
              >
                Tap to close
              </span>
            </div>
          </Show>

          {/* Right Column - Content */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              'flex-direction': 'column',
              padding: isMobile() ? '24px 20px' : '40px 60px',
              'justify-content': isMobile() ? 'flex-start' : 'center',
              'overflow-y': 'auto',
            }}
          >
            {/* Header */}
            <div
              style={{
                'margin-bottom': isMobile() ? '24px' : '48px',
                animation: 'slideDown 0.4s ease forwards',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
                'flex-wrap': isMobile() ? 'wrap' : 'nowrap',
                gap: isMobile() ? '12px' : '0',
              }}
            >
              {/* Logo and Company Name - Clickable Home Button */}
              <A
                href="/"
                onClick={() => appMenuStore.close()}
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: isMobile() ? '12px' : '16px',
                  'text-decoration': 'none',
                  transition: 'all 0.3s ease',
                  flex: isMobile() ? '1' : 'auto',
                  'min-width': 0,
                }}
                onMouseEnter={(e) => {
                  if (!isMobile()) {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.opacity = '0.8';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {/* Logo */}
                <div
                  style={{
                    width: isMobile() ? '44px' : '56px',
                    height: isMobile() ? '44px' : '56px',
                    'border-radius': isMobile() ? '12px' : '14px',
                    background: `linear-gradient(135deg, ${navTokens.brand.coral}, ${navTokens.brand.yellow}, ${navTokens.brand.teal})`,
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'box-shadow': '0 8px 24px rgba(0,0,0,0.3)',
                    'flex-shrink': 0,
                  }}
                >
                  <svg
                    width={isMobile() ? '24' : '32'}
                    height={isMobile() ? '24' : '32'}
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
                <div style={{ 'min-width': 0 }}>
                  <h2
                    style={{
                      'white-space': 'nowrap',
                      overflow: 'hidden',
                      'text-overflow': 'ellipsis',
                      'font-size': 'clamp(24px, 4vw, 36px)',
                      'font-weight': '400',
                      color: 'white',
                      margin: 0,
                      'line-height': 1.2,
                      'font-family': navTokens.typography.brandFamily,
                    }}
                  >
                    {isMobile() ? 'Thoughtful App Co.' : 'Thoughtful App Co.'}
                  </h2>
                  <div
                    style={{
                      'font-size': isMobile() ? '12px' : '14px',
                      color: 'rgba(255,255,255,0.5)',
                      'margin-top': '2px',
                    }}
                  >
                    Apps that care
                  </div>
                </div>
              </A>

              {/* Settings Button */}
              <button
                onClick={() => {
                  appMenuStore.close();
                  navigate('/settings');
                }}
                aria-label="Settings"
                style={{
                  width: isMobile() ? '40px' : '48px',
                  height: isMobile() ? '40px' : '48px',
                  'border-radius': '50%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  color: 'rgba(255,255,255,0.7)',
                  'flex-shrink': 0,
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
                  width={isMobile() ? '20' : '24'}
                  height={isMobile() ? '20' : '24'}
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
                gap: isMobile() ? '0' : '40px',
                'margin-bottom': isMobile() ? '24px' : '48px',
                'border-bottom': '1px solid rgba(255,255,255,0.1)',
                'padding-bottom': isMobile() ? '12px' : '16px',
                animation: 'slideDown 0.5s ease forwards',
                'justify-content': isMobile() ? 'space-between' : 'flex-start',
              }}
            >
              <For each={['now', 'next', 'later'] as Timeline[]}>
                {(timeline) => (
                  <button
                    onClick={() => handleTimelineChange(timeline)}
                    style={{
                      background:
                        isMobile() && menuTimeline() === timeline
                          ? `${navTokens.timelineColors[timeline].primary}20`
                          : 'transparent',
                      border: 'none',
                      color: menuTimeline() === timeline ? 'white' : 'rgba(255,255,255,0.4)',
                      'font-size': isMobile() ? '14px' : '20px',
                      'font-weight': menuTimeline() === timeline ? '600' : '400',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      padding: isMobile() ? '10px 16px' : '8px 0',
                      'font-family': navTokens.typography.fontFamily,
                      'border-radius': isMobile() ? '20px' : '0',
                      flex: isMobile() ? '1' : 'auto',
                      'max-width': isMobile() ? '100px' : 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={(e) => {
                      if (menuTimeline() !== timeline)
                        e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                    }}
                  >
                    {timelineConfig[timeline].label}
                    <Show when={menuTimeline() === timeline && !isMobile()}>
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
                'grid-template-columns': isMobile()
                  ? 'repeat(auto-fill, minmax(140px, 1fr))'
                  : 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: isMobile() ? '12px' : '24px',
                width: '100%',
                animation: 'slideDown 0.6s ease forwards',
                'padding-bottom': isMobile() ? '24px' : '0',
              }}
            >
              {filteredApps().map((app, index) => (
                <button
                  onClick={() => handleAppClick(app.id)}
                  style={{
                    padding: isMobile() ? '16px' : '32px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    'border-radius': isMobile() ? '16px' : '24px',
                    display: 'flex',
                    'flex-direction': 'column',
                    'align-items': isMobile() ? 'center' : 'flex-start',
                    gap: isMobile() ? '12px' : '16px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    'animation-delay': `${0.1 * index}s`,
                    cursor: 'pointer',
                    'text-align': isMobile() ? 'center' : 'left',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile()) {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.borderColor = app.color;
                      e.currentTarget.style.boxShadow = `0 12px 32px -8px ${app.color}30`;
                      const arrow = e.currentTarget.querySelector('.arrow-icon') as HTMLElement;
                      if (arrow) {
                        arrow.style.opacity = '1';
                        arrow.style.transform = 'translateX(0)';
                      }
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
                  // Add active state for touch feedback
                  onTouchStart={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = app.color;
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  {/* Mobile: Centered layout, Desktop: Spread layout */}
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': isMobile() ? 'center' : 'space-between',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: isMobile() ? '44px' : '48px',
                        height: isMobile() ? '44px' : '48px',
                        'border-radius': isMobile() ? '12px' : '14px',
                        background: app.color,
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'font-size': isMobile() ? '18px' : '20px',
                        'font-weight': '700',
                        color: 'white',
                        'box-shadow': `0 8px 24px ${app.color}40`,
                        padding: app.logo ? '4px' : '0',
                        'text-shadow':
                          '0 0 2px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.5), 1px 1px 0 rgba(0,0,0,0.3)',
                      }}
                    >
                      <Show when={app.logo} fallback={app.name.charAt(0)}>
                        <img
                          src={app.logo}
                          alt={`${app.name} Logo`}
                          style={{
                            height: isMobile() ? '26px' : '32px',
                            width: isMobile() ? '26px' : '32px',
                            'object-fit': 'contain',
                          }}
                        />
                      </Show>
                    </div>

                    {/* Arrow icon - hidden on mobile */}
                    <Show when={!isMobile()}>
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
                    </Show>
                  </div>

                  <div>
                    <div
                      style={{
                        'font-size': isMobile() ? '14px' : '20px',
                        'font-weight': '600',
                        color: 'white',
                        'margin-bottom': isMobile() ? '4px' : '6px',
                        'font-family': navTokens.typography.fontFamily,
                      }}
                    >
                      {app.name}
                    </div>
                    {/* Description - hidden on mobile for compact view */}
                    <Show when={!isMobile()}>
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
                    </Show>
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
    tenure: TenureApp,
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
      <Show when={appId() === 'tenure'}>
        <TenureApp />
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
  // Initialize manifest switcher to change PWA manifest based on route
  useManifestSwitcher();

  // Update iOS meta tags based on route
  useIOSMetaUpdater();

  return (
    <div style={{ 'min-height': '100vh' }}>
      <OfflineIndicator />
      <InstallBanner />
      <UpdateModal />
      {props.children}
    </div>
  );
};

// Re-export LandingPage for use in routes
export { LandingPage };

export default App;
