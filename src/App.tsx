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
import { AccountButton } from './components/common/AccountButton';
import { Footer } from './components/common/Footer';
import { appMenuStore } from './stores/app-menu-store';
import {
  DoodleHeart,
  DoodleShield,
  DoodleSparkle,
  DoodlePeople,
} from './components/common/DoodleIcons';

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
    description: 'Alpha/Beta Testing',
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

      {/* Tooltip - Premium Dark Mode with Animated Gradient Border */}
      <Show when={showTooltip()}>
        {/* Animated gradient border wrapper */}
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 12px)',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '3px',
            'border-radius': '16px',
            background: `linear-gradient(90deg, 
              #FF6B6B 0%, 
              #FFE66D 33%, 
              #4ECDC4 66%,
              #FF6B6B 100%
            )`,
            'background-size': '300% 100%',
            animation: 'tooltipBorderFlow 4s linear infinite, tooltipFadeIn 0.2s ease',
            'box-shadow': `
              0 0 40px rgba(255, 107, 107, 0.3),
              0 24px 48px rgba(0, 0, 0, 0.6)
            `,
            'z-index': 100,
            'pointer-events': 'none',
          }}
        >
          <div
            id={`tooltip-${props.app.id}`}
            role="tooltip"
            style={{
              width: '280px',
              padding: '16px',
              background: '#1A1A2E',
              'backdrop-filter': 'blur(12px)',
              '-webkit-backdrop-filter': 'blur(12px)',
              'border-radius': 'calc(16px - 3px)',
              position: 'relative',
            }}
          >
            {/* Arrow with gradient glow */}
            <div
              style={{
                position: 'absolute',
                bottom: '-9px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '14px',
                height: '14px',
                background: '#1A1A2E',
                'box-shadow': '0 0 20px rgba(255, 107, 107, 0.2)',
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
                    'font-family': "'Shupp', 'DM Sans', system-ui, sans-serif",
                    'font-size': '24px',
                    'font-weight': '600',
                    color: '#FFFFFF',
                    'line-height': '1.2',
                  }}
                >
                  {props.app.name}
                </div>
                <div
                  style={{
                    'font-size': '13px',
                    'font-weight': '600',
                    color: '#A0A0B8',
                  }}
                >
                  {props.app.description}
                </div>
              </div>
            </div>

            <p
              style={{
                margin: 0,
                'font-size': '14px',
                'line-height': '1.5',
                color: '#A0A0B8',
              }}
            >
              {props.app.elevatorPitch}
            </p>
          </div>
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

      {/* Top Navigation Bar */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: isMobile() ? '12px 16px' : '16px 24px',
          display: 'flex',
          'justify-content': 'flex-end',
          'align-items': 'center',
          'z-index': 100,
          background:
            'linear-gradient(180deg, rgba(15, 15, 26, 0.95) 0%, rgba(15, 15, 26, 0) 100%)',
          'pointer-events': 'none',
        }}
      >
        {/* Sign Up Button - Top Right */}
        <div style={{ 'pointer-events': 'auto' }}>
          <AccountButton variant="header" label="Sign Up" />
        </div>
      </nav>

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
            margin: '0 auto 20px',
          }}
        >
          <svg
            width={isMobile() ? '80' : '120'}
            height={isMobile() ? '80' : '120'}
            viewBox="0 0 512 512"
          >
            <defs>
              <linearGradient id="tacoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ 'stop-color': '#FF6B6B', 'stop-opacity': 1 }} />
                <stop offset="50%" style={{ 'stop-color': '#FFE66D', 'stop-opacity': 1 }} />
                <stop offset="100%" style={{ 'stop-color': '#4ECDC4', 'stop-opacity': 1 }} />
              </linearGradient>
            </defs>
            <path
              fill="url(#tacoGradient)"
              d="M281.08,186.92c-2.49-3.58-2.78-9.02-3.34-12.78-.4-2.1-.71-4.04-.73-6.32.04-4.88.97-9.8-.27-14.61-.38-2.47-.9-3.84-3.51-4.22-23.13-2.51-46.07-.01-69.24.63-2.13-.12-4.21-.55-6.35-.43-2.84.09-4.2,2.08-4.02,4.91-.05,4.75.98,9.26,1.75,13.97.42,4.9,1.04,10.12.49,14.99-.38,5.57,1.25,11.46.8,16.97-.52,5.46.25,11.06-.16,16.51-.24,3.6-.68,7.23-.16,10.95.27,1.68-.15,3.62.03,5.14,1.17,2.37,4.32,1.93,6.82,2.17,2.37.07,6.55.16,8.98.22,12.23.66,26.28.02,38.37.06,11.01.54,20.73.16,31.72.45,4.5.03,12.36-3.32,9.89,4.64-.74,2.25-2.95,3.62-4.83,4.98-3.55,2.46-7.39,5.56-10.7,8.23-6.89,5.02-13.67,9.47-20.35,14.75-4.97,3.71-9.59,6.52-13.89,10.75-5.18,4.13-9.56,9.49-14.14,14.39-1.71,1.74-3,2.37-4.68,3.93-2.23,2.11-4.34,4.5-6.68,6.46-5.78,5.44-12.34,9.93-18.3,15.19-7.16,5.53-5.59-5.85-6.09-9.89-.49-5.72-1.14-11.08-1.4-16.87-.14-12.73.64-25.55,1.61-38.19.35-3.95-.45-7.95-.91-11.89-.24-1.77.14-3.46-1.45-3.99-7.59-.76-15.85-.95-23.66-.5-10.93.5-28.36-.42-40.41,1.3-5.77,1.03-11.78-.2-17.65.62-5.24.56-10.33-1.97-4.82-7,1.92-1.91,5.07-2.81,7.10-4.76,10.5-12,21.17-23.83,31.51-35.96,5.84-7.21,13.29-13.01,20.17-19.38,4.81-5.13,9.87-10.19,14.76-15.10,1.92-1.65,3.91-3.07,5.48-4.78,1.78-1.86,3.61-4.31,4.43-6.87.54-1.6,1.25-3.25,2.28-4.58,10.65-11.33,21.83-22.46,31.78-34.37,10.87-10.87,22-21.64,32.81-32.56,5.04-5.08,8.84-10.55,13.92-15.56,3.42-2.77,5.59-7.78,9.68-9.44,5.5-.75,3.59,6.83,3.78,10.18-.43,12.27-.44,24.9-2.75,37.03l-.37,6.69c.03,10,1.77,20.59,2.8,30.49.64,2.86.16,5.83.48,8.73.41,2.05,2.41,2.75,4.38,2.91,11.06-.57,21.58,1.57,32.64,1.81,7.67-.11,16.11-.21,23.94-.46,4.94-.47,9.37-1.4,14.36-2.11,2.64-.35,7.09-1.59,7.81,1.91.76,5.45.23,10.4,0,16.03-.26,3.66.69,6.98.67,10.59-.02,3.58-.04,6.8-.44,10.36-1.78,13.18-2.69,26.41-1.64,39.79.38,5.57,4.47,11.28-4.61,9.99-4.55-.3-8.22-.73-12.39-.48-5.55.2-11.4,1.63-17.07,1.27-3.96-.23-9.41.42-13.77.15-4.94-.37-10.62-.44-15.38-.34-6.94-.87-14.35-1.13-21.16-1.18-2.42-.82-.34-4.3.59-5.79,1.78-2.64,2.2-4.58,1.96-7.4-.06-2.78.08-5.65.11-8.4..."
            />
            <path
              fill="url(#tacoGradient)"
              d="M331.48,449.84c-13.69.21-27.51,2.18-41.32,1.21-4.64-.25-9.85.73-14.19-1.23-3.04-1.59-4.57-4.73-6.88-7.26-7.94-7.85-14.8-16.88-22.56-24.95-7.81-7.44-14.47-15.98-21.75-23.85-9.81-10.08-19.99-19.82-29.98-29.55-8.56-8.43,4.67-8.54,10.47-8.18,6.3.14,12.39-.38,18.65-.15,3.72.05,7.54.39,11.23-.12,7.32-.93,10.38-8.65,15.22-13.26,6.2-6.61,13.17-13.10,19.62-19.49,3.65-3.73,12.84-14.15,15.32-4.17.96,45.85-11.81,34.08,36.97,36.39,10.42-.02,20.84-.12,31.22.86,7.47.29,13.46,1.4,13.4,10.36.92,8.92,1.74,18.14,2.31,27.18,1.02,9.68,2.54,19.16,2.02,28.77-.17,4.69-.74,9.4-.64,14.09.53,7.78,1.06,12.15-8.35,11.44-4.74-.21-9.47.86-14.22,1.27-5.43.41-10.92.22-16.25.63h-.28ZM258.31,356.18c6.35-.36,14.03,1.04,19.72-2.47,2.15-1.76,2.28-5.29,2.6-8.45.57-5.34.69-10.75,1.07-16.03.42-5.79-1.61-7.67-6-3.12-8.27,7.63-16.78,15.16-24.6,23.27-8.11,8.58-.14,6.78,6.93,6.8h.28ZM294.56,420.76c5.1-5.55,10.94-10.69,15.89-16.48,7.3-8.32,15.78-15.82,23.68-23.50,6.26-5.7,13.74-10.04,20.08-15.64,1.03-.84,2.48-2.55,1.54-3.38-1.4-1.33-4.65-1.30-6.68-1.45-8.76-.59-17.77-.63-26.73-.56-10.74-.51-21.82-.36-32.57-.29-5.19-.23-8.1,2.02-8.23,7.38-.62,9.05-.75,17.75-.92,26.85-.01,9.69.79,19.41.59,29.09,0,2.85-.78,6.55-.05,9.31.92,2.11,3.04-.78,3.96-1.63,2.95-3.32,6.29-6.32,9.25-9.49l.20-.21ZM245.4,408.87c3.4,3.47,6.94,7.11,10.24,10.73,6.1,6.47,11.41,14.08,18.4,19.52,3.71,2.04,2.92-4.68,3.35-6.88.3-4.03.62-8.11.76-12.15.19-7.13-.63-14.43-.46-21.68.41-8.5-.26-16.97.39-25.47.06-4.32,2.4-12.54-4.07-12.75-11.94.25-24.04-.07-35.92,1.04-9.09-.46-19.06-.66-28.04-.02-2.08.25-5.42-.09-6.84,1.26-.35.47-.17,1.16.45,2.03,2.19,2.7,4.88,5.22,7.30,7.78,6.66,6.63,14.46,14.01,20.95,21.15,4.65,4.82,8.65,10.46,13.30,15.22l.19.19ZM325.02,444.35c12.32-.14,24.52.21,36.41-2.75,3.06-1.14,3.65-4.36,3.78-7.33.33-7.14.93-14.38.42-21.56-.11-4-.94-7.97-1.49-11.86-.31-4.39-.48-8.98-1.09-13.41-.51-5.31-.54-10.13-1.34-15.17-.57-4.19-2.56-5.94-6.18-3.01-4.75,3.91-10.02,7.12-14.92,10.82-3.39,2.92-6.55,6.33-9.98,9.27-6.67,5.98-11.84,12.80..."
            />
            <path
              fill="url(#tacoGradient)"
              d="M204.95,353.96c-10.93-3.6-10.3-15.43-3.77-23.03,8.59-10.56,18.41-20.09,28.31-29.42,12.53-11.93,24.27-24.61,38.04-35.16,6.87-5.99,14.74-19.27,25.18-12.39,12.52,8.75,3.86,22.67-3.77,31.72-4.35,5.48-9.27,10.72-14.08,15.90-6.25,6.89-13.15,12.14-19.61,18.12-7.11,6.86-13.85,14.24-20.93,21.12-7.53,7.33-17.9,16.36-29.11,13.20l-.25-.07ZM210.49,349.13c13.21-.96,31.36-24.75,41.34-33.93,8.87-7.84,17.91-15.82,25.69-25.02,5.11-6.46,22.85-23.39,13.70-31.07-4.51-2.54-9.65,2.56-12.95,5.53-3.31,3.05-6.84,5.69-10.39,8.34-9.34,6.67-16.98,15.18-25.18,23.15-5.01,4.80-10.34,9.61-15.23,14.59-7.81,8.13-16.19,16.06-22.72,25.48-3.89,5.76-2.30,12.94,5.51,12.93h.24Z"
            />
            <path
              fill="url(#tacoGradient)"
              d="M246.6,232.55c-26.61,6.76-49.96-17.81-46.66-44.07,4.37-38.58,54.95-51.23,72.93-15.01,11.11,22.28-1.39,52.99-26.02,59.01l-.26.07ZM242.03,227.66c18.21-2.11,31.41-21.94,28.76-39.88-6.08-40.34-59.27-38.39-65.01,1.05-3.04,20.76,14.55,41.84,35.99,38.86l.27-.04Z"
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
      <Footer apps={apps} isMobile={isMobile} navTokens={navTokens} />
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
                    'flex-shrink': 0,
                  }}
                >
                  <svg
                    width={isMobile() ? '44' : '56'}
                    height={isMobile() ? '44' : '56'}
                    viewBox="0 0 512 512"
                  >
                    <defs>
                      <linearGradient id="tacoGradientMenu" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ 'stop-color': '#FF6B6B', 'stop-opacity': 1 }} />
                        <stop offset="50%" style={{ 'stop-color': '#FFE66D', 'stop-opacity': 1 }} />
                        <stop
                          offset="100%"
                          style={{ 'stop-color': '#4ECDC4', 'stop-opacity': 1 }}
                        />
                      </linearGradient>
                    </defs>
                    <path
                      fill="url(#tacoGradientMenu)"
                      d="M281.08,186.92c-2.49-3.58-2.78-9.02-3.34-12.78-.4-2.1-.71-4.04-.73-6.32.04-4.88.97-9.8-.27-14.61-.38-2.47-.9-3.84-3.51-4.22-23.13-2.51-46.07-.01-69.24.63-2.13-.12-4.21-.55-6.35-.43-2.84.09-4.2,2.08-4.02,4.91-.05,4.75.98,9.26,1.75,13.97.42,4.9,1.04,10.12.49,14.99-.38,5.57,1.25,11.46.8,16.97-.52,5.46.25,11.06-.16,16.51-.24,3.6-.68,7.23-.16,10.95.27,1.68-.15,3.62.03,5.14,1.17,2.37,4.32,1.93,6.82,2.17,2.37.07,6.55.16,8.98.22,12.23.66,26.28.02,38.37.06,11.01.54,20.73.16,31.72.45,4.5.03,12.36-3.32,9.89,4.64-.74,2.25-2.95,3.62-4.83,4.98-3.55,2.46-7.39,5.56-10.7,8.23-6.89,5.02-13.67,9.47-20.35,14.75-4.97,3.71-9.59,6.52-13.89,10.75-5.18,4.13-9.56,9.49-14.14,14.39-1.71,1.74-3,2.37-4.68,3.93-2.23,2.11-4.34,4.5-6.68,6.46-5.78,5.44-12.34,9.93-18.3,15.19-7.16,5.53-5.59-5.85-6.09-9.89-.49-5.72-1.14-11.08-1.4-16.87-.14-12.73.64-25.55,1.61-38.19.35-3.95-.45-7.95-.91-11.89-.24-1.77.14-3.46-1.45-3.99-7.59-.76-15.85-.95-23.66-.5-10.93.5-28.36-.42-40.41,1.3-5.77,1.03-11.78-.2-17.65.62-5.24.56-10.33-1.97-4.82-7,1.92-1.91,5.07-2.81,7.10-4.76,10.5-12,21.17-23.83,31.51-35.96,5.84-7.21,13.29-13.01,20.17-19.38,4.81-5.13,9.87-10.19,14.76-15.10,1.92-1.65,3.91-3.07,5.48-4.78,1.78-1.86,3.61-4.31,4.43-6.87.54-1.6,1.25-3.25,2.28-4.58,10.65-11.33,21.83-22.46,31.78-34.37,10.87-10.87,22-21.64,32.81-32.56,5.04-5.08,8.84-10.55,13.92-15.56,3.42-2.77,5.59-7.78,9.68-9.44,5.5-.75,3.59,6.83,3.78,10.18-.43,12.27-.44,24.9-2.75,37.03l-.37,6.69c.03,10,1.77,20.59,2.8,30.49.64,2.86.16,5.83.48,8.73.41,2.05,2.41,2.75,4.38,2.91,11.06-.57,21.58,1.57,32.64,1.81,7.67-.11,16.11-.21,23.94-.46,4.94-.47,9.37-1.4,14.36-2.11,2.64-.35,7.09-1.59,7.81,1.91.76,5.45.23,10.4,0,16.03-.26,3.66.69,6.98.67,10.59-.02,3.58-.04,6.8-.44,10.36-1.78,13.18-2.69,26.41-1.64,39.79.38,5.57,4.47,11.28-4.61,9.99-4.55-.3-8.22-.73-12.39-.48-5.55.2-11.4,1.63-17.07,1.27-3.96-.23-9.41.42-13.77.15-4.94-.37-10.62-.44-15.38-.34-6.94-.87-14.35-1.13-21.16-1.18-2.42-.82-.34-4.3.59-5.79,1.78-2.64,2.2-4.58,1.96-7.4-.06-2.78.08-5.65.11-8.4..."
                    />
                    <path
                      fill="url(#tacoGradientMenu)"
                      d="M331.48,449.84c-13.69.21-27.51,2.18-41.32,1.21-4.64-.25-9.85.73-14.19-1.23-3.04-1.59-4.57-4.73-6.88-7.26-7.94-7.85-14.8-16.88-22.56-24.95-7.81-7.44-14.47-15.98-21.75-23.85-9.81-10.08-19.99-19.82-29.98-29.55-8.56-8.43,4.67-8.54,10.47-8.18,6.3.14,12.39-.38,18.65-.15,3.72.05,7.54.39,11.23-.12,7.32-.93,10.38-8.65,15.22-13.26,6.2-6.61,13.17-13.10,19.62-19.49,3.65-3.73,12.84-14.15,15.32-4.17.96,45.85-11.81,34.08,36.97,36.39,10.42-.02,20.84-.12,31.22.86,7.47.29,13.46,1.4,13.4,10.36.92,8.92,1.74,18.14,2.31,27.18,1.02,9.68,2.54,19.16,2.02,28.77-.17,4.69-.74,9.4-.64,14.09.53,7.78,1.06,12.15-8.35,11.44-4.74-.21-9.47.86-14.22,1.27-5.43.41-10.92.22-16.25.63h-.28ZM258.31,356.18c6.35-.36,14.03,1.04,19.72-2.47,2.15-1.76,2.28-5.29,2.6-8.45.57-5.34.69-10.75,1.07-16.03.42-5.79-1.61-7.67-6-3.12-8.27,7.63-16.78,15.16-24.6,23.27-8.11,8.58-.14,6.78,6.93,6.8h.28ZM294.56,420.76c5.1-5.55,10.94-10.69,15.89-16.48,7.3-8.32,15.78-15.82,23.68-23.50,6.26-5.7,13.74-10.04,20.08-15.64,1.03-.84,2.48-2.55,1.54-3.38-1.4-1.33-4.65-1.30-6.68-1.45-8.76-.59-17.77-.63-26.73-.56-10.74-.51-21.82-.36-32.57-.29-5.19-.23-8.1,2.02-8.23,7.38-.62,9.05-.75,17.75-.92,26.85-.01,9.69.79,19.41.59,29.09,0,2.85-.78,6.55-.05,9.31.92,2.11,3.04-.78,3.96-1.63,2.95-3.32,6.29-6.32,9.25-9.49l.20-.21ZM245.4,408.87c3.4,3.47,6.94,7.11,10.24,10.73,6.1,6.47,11.41,14.08,18.4,19.52,3.71,2.04,2.92-4.68,3.35-6.88.3-4.03.62-8.11.76-12.15.19-7.13-.63-14.43-.46-21.68.41-8.5-.26-16.97.39-25.47.06-4.32,2.4-12.54-4.07-12.75-11.94.25-24.04-.07-35.92,1.04-9.09-.46-19.06-.66-28.04-.02-2.08.25-5.42-.09-6.84,1.26-.35.47-.17,1.16.45,2.03,2.19,2.7,4.88,5.22,7.30,7.78,6.66,6.63,14.46,14.01,20.95,21.15,4.65,4.82,8.65,10.46,13.30,15.22l.19.19ZM325.02,444.35c12.32-.14,24.52.21,36.41-2.75,3.06-1.14,3.65-4.36,3.78-7.33.33-7.14.93-14.38.42-21.56-.11-4-.94-7.97-1.49-11.86-.31-4.39-.48-8.98-1.09-13.41-.51-5.31-.54-10.13-1.34-15.17-.57-4.19-2.56-5.94-6.18-3.01-4.75,3.91-10.02,7.12-14.92,10.82-3.39,2.92-6.55,6.33-9.98,9.27-6.67,5.98-11.84,12.80..."
                    />
                    <path
                      fill="url(#tacoGradientMenu)"
                      d="M204.95,353.96c-10.93-3.6-10.3-15.43-3.77-23.03,8.59-10.56,18.41-20.09,28.31-29.42,12.53-11.93,24.27-24.61,38.04-35.16,6.87-5.99,14.74-19.27,25.18-12.39,12.52,8.75,3.86,22.67-3.77,31.72-4.35,5.48-9.27,10.72-14.08,15.90-6.25,6.89-13.15,12.14-19.61,18.12-7.11,6.86-13.85,14.24-20.93,21.12-7.53,7.33-17.9,16.36-29.11,13.20l-.25-.07ZM210.49,349.13c13.21-.96,31.36-24.75,41.34-33.93,8.87-7.84,17.91-15.82,25.69-25.02,5.11-6.46,22.85-23.39,13.70-31.07-4.51-2.54-9.65,2.56-12.95,5.53-3.31,3.05-6.84,5.69-10.39,8.34-9.34,6.67-16.98,15.18-25.18,23.15-5.01,4.80-10.34,9.61-15.23,14.59-7.81,8.13-16.19,16.06-22.72,25.48-3.89,5.76-2.30,12.94,5.51,12.93h.24Z"
                    />
                    <path
                      fill="url(#tacoGradientMenu)"
                      d="M246.6,232.55c-26.61,6.76-49.96-17.81-46.66-44.07,4.37-38.58,54.95-51.23,72.93-15.01,11.11,22.28-1.39,52.99-26.02,59.01l-.26.07ZM242.03,227.66c18.21-2.11,31.41-21.94,28.76-39.88-6.08-40.34-59.27-38.39-65.01,1.05-3.04,20.76,14.55,41.84,35.99,38.86l.27-.04Z"
                    />
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

              {/* Account & Settings */}
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: isMobile() ? '8px' : '12px',
                  'flex-shrink': 0,
                }}
              >
                {/* Account Button */}
                <AccountButton variant={isMobile() ? 'header' : 'menu'} />

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
