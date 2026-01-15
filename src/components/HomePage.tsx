/**
 * Home Page - App Launcher
 *
 * Native-feeling app launcher for logged-in users.
 * Features 3D app icons for live apps, flat icons for future apps.
 * Inspired by modern mobile OS home screens (iOS/Android).
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, onMount, Show, For } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../lib/auth-context';
import { logger } from '../lib/logger';
import { AppPreview } from './common/AppPreview';

// ============================================================================
// TYPES
// ============================================================================

type AppStatus = 'active' | 'alpha' | 'beta' | 'coming-soon';

interface AppInfo {
  id: string;
  name: string;
  description: string;
  elevatorPitch?: string;
  color: string;
  status: AppStatus;
  logo?: string;
  isLive: boolean; // Can be clicked and used
  designSystem?: string;
  releaseDate?: string;
  version?: string;
  changelog?: string[];
}

// ============================================================================
// APP DATA
// ============================================================================

const apps: AppInfo[] = [
  {
    id: 'tempo',
    name: 'Tempo',
    description: 'A.D.H.D Task Master',
    elevatorPitch:
      'Enter your tasks, get a real action plan. Tempo will ensure we turn to-do lists into actions. Activate "Annoy Me Mode" to get some really awesome results...',
    color: '#5E6AD2',
    status: 'active',
    logo: '/tempo/tempo_logo.png',
    isLive: true,
    designSystem: 'Dark Mode',
    releaseDate: 'December 2025',
    version: '1.0.0-beta',
    changelog: [
      'Brain Dump sessions for quick capture and processing',
      'AI-powered task extraction and organization',
      'Session-based workflow with time boxing',
      'Queue management with drag-and-drop prioritization',
      'Cloud sync and backup for premium users',
    ],
  },
  {
    id: 'tenure',
    name: 'Tenure',
    description: 'Eternal Career Companion',
    elevatorPitch:
      'Career help is not an effective money maker for corporations and LinkedIn charging you $30 a month to find a job is criminal. Tenure is about life-long career aid, find out what you want to be when you grow up, write specialized resumes w/ Resume Mutator, and, actively track and apply for jobs with our Prospect job pipeline.',
    color: '#9333EA',
    status: 'active',
    logo: '/tenure/tenure_logo.png',
    isLive: true,
    designSystem: 'Maximalist',
    releaseDate: 'Q1 2027',
    version: '1.0.0-alpha',
    changelog: [
      'Resume Mutator for AI-powered resume customization',
      'AI cover letter generation tailored to job postings',
      'Job pipeline with Discover, Prospect, and Prosper stages',
      'O*NET integration for career exploration',
      'BLS labor market data and salary insights',
    ],
  },
  {
    id: 'echoprax',
    name: 'Echoprax',
    description: 'Portable Boutique Fitness',
    elevatorPitch:
      'Boutique fitness classes cost $30-50 per session and most workout apps lock features behind subscriptions. Echoprax is about bringing that premium experience home for free—timer-driven voice coaching guides you through workouts hands-free, works completely offline on wall-mounted tablets, and suggests BPM-matched playlists to keep you in the zone.',
    color: '#FF6B6B',
    status: 'alpha',
    isLive: false,
    designSystem: 'Aurora + Glass',
    releaseDate: 'Q3 2026',
  },
  {
    id: 'nurture',
    name: 'Nurture',
    description: 'Relationship Management',
    elevatorPitch:
      'Never forget a birthday or let a friendship fade. Gentle reminders and interaction tracking.',
    color: '#2D5A45',
    status: 'alpha',
    isLive: false,
    designSystem: 'Biophilic',
    releaseDate: 'Q1 2026',
  },
  {
    id: 'papertrail',
    name: 'Paper Trail',
    description: 'News changelog',
    elevatorPitch:
      'Track what was said vs. what was true. Graph-first news aggregation with correction tracking.',
    color: '#FFE500',
    status: 'coming-soon',
    isLive: false,
    designSystem: 'Paper Trail',
    releaseDate: 'TBD',
  },
  {
    id: 'justincase',
    name: 'JustInCase',
    description: 'Small claims helper',
    elevatorPitch:
      'Document everything, stress about nothing. Build airtight cases for small claims court.',
    color: '#64748B',
    status: 'coming-soon',
    isLive: false,
    designSystem: 'Daylight Reading',
    releaseDate: 'Q3 2026',
  },
  {
    id: 'friendly',
    name: 'FriendLy',
    description: 'Friendship calendar',
    elevatorPitch:
      'Coordinate hangouts without the group chat chaos. Finds the perfect time for everyone.',
    color: '#3B82F6',
    status: 'coming-soon',
    isLive: false,
    designSystem: 'Liquid',
    releaseDate: 'Q1 2026',
  },
  {
    id: 'manifest',
    name: 'Manifest',
    description: 'Picky matchmaking',
    elevatorPitch: 'Dating for people with standards. Detailed compatibility matching.',
    color: '#000000',
    status: 'coming-soon',
    isLive: false,
    designSystem: 'Brutalistic',
    releaseDate: 'TBD',
  },
  {
    id: 'lol',
    name: 'LoL',
    description: 'Gamified chores',
    elevatorPitch: 'Turn household tasks into a game. Rewards, streaks, and friendly competition.',
    color: '#2196F3',
    status: 'coming-soon',
    isLive: false,
    designSystem: 'Papermorphic',
    releaseDate: 'Q3 2026',
  },
];

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const tokens = {
  colors: {
    background: '#0F0F1A',
    surface: '#1A1A2E',
    text: {
      primary: '#FFFFFF',
      secondary: '#A0A0B8',
      muted: '#6B6B80',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  radius: {
    icon: '22%', // iOS-style rounded square
  },
};

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * 3D App Icon Component
 * For live/active apps - full color with 3D depth effect
 */
const AppIcon3D: Component<{ app: AppInfo; onClick: () => void }> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);
  const [isPressed, setIsPressed] = createSignal(false);

  const getTransform = () => {
    if (isPressed()) return 'translateY(4px) scale(0.95) rotateX(5deg)';
    if (isHovered()) return 'translateY(-8px) scale(1.05) rotateX(10deg)';
    return 'translateY(0) scale(1) rotateX(8deg)';
  };

  const getShadow = () => {
    if (isPressed()) return '0 4px 12px rgba(0, 0, 0, 0.4)';
    if (isHovered()) return `0 20px 40px ${props.app.color}40, 0 8px 16px rgba(0, 0, 0, 0.3)`;
    return `0 12px 24px ${props.app.color}30, 0 4px 8px rgba(0, 0, 0, 0.2)`;
  };

  return (
    <div
      style={{
        perspective: '1000px',
        'perspective-origin': 'center center',
      }}
    >
      <button
        onClick={() => props.onClick()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          background: props.app.logo
            ? `${props.app.color} url(${props.app.logo}) center/${props.app.id === 'tenure' ? '95%' : '80%'} no-repeat`
            : `linear-gradient(135deg, ${props.app.color} 0%, ${props.app.color}CC 100%)`,
          'border-radius': tokens.radius.icon,
          border: 'none',
          cursor: 'pointer',
          transform: getTransform(),
          'box-shadow': getShadow(),
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          'transform-style': 'preserve-3d',
          outline: 'none',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
          'font-size': '14px',
          'font-weight': '600',
          color: props.app.logo ? 'transparent' : '#FFFFFF',
          'text-shadow': '0 2px 4px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
        }}
        aria-label={`Open ${props.app.name}`}
      >
        {/* Shine overlay effect */}
        <div
          style={{
            position: 'absolute',
            inset: '0',
            background:
              'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 50%)',
            'border-radius': tokens.radius.icon,
            opacity: isHovered() ? '1' : '0.5',
            transition: 'opacity 0.3s ease',
            'pointer-events': 'none',
          }}
        />

        {/* App name if no logo */}
        <Show when={!props.app.logo}>
          <span style={{ position: 'relative', 'z-index': '1' }}>{props.app.name}</span>
        </Show>

        {/* Status badge */}
        <Show when={props.app.status === 'alpha' || props.app.status === 'beta'}>
          <div
            style={{
              position: 'absolute',
              top: tokens.spacing.xs,
              right: tokens.spacing.xs,
              background: props.app.status === 'alpha' ? '#EF4444' : '#F59E0B',
              color: '#FFFFFF',
              padding: `2px ${tokens.spacing.xs}`,
              'border-radius': '6px',
              'font-size': '10px',
              'font-weight': '700',
              'text-transform': 'uppercase',
              'letter-spacing': '0.5px',
              'box-shadow': '0 2px 4px rgba(0, 0, 0, 0.3)',
              'z-index': '2',
            }}
          >
            {props.app.status}
          </div>
        </Show>
      </button>

      {/* App name label below icon */}
      <div
        style={{
          'margin-top': tokens.spacing.sm,
          'text-align': 'center',
          color: tokens.colors.text.primary,
          'font-size': '14px',
          'font-weight': '500',
          'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
        }}
      >
        {props.app.name}
      </div>
    </div>
  );
};

/**
 * 2D Flat Icon Component
 * For future/coming-soon apps - muted, grayscale
 */
const AppIconFlat: Component<{ app: AppInfo; onClick: () => void }> = (props) => {
  return (
    <div
      style={{
        opacity: '0.5',
        filter: 'grayscale(0.7)',
        cursor: 'pointer',
      }}
      onClick={() => props.onClick()}
    >
      <div
        style={{
          width: '120px',
          height: '120px',
          background: `linear-gradient(135deg, ${props.app.color}40 0%, ${props.app.color}20 100%)`,
          'border-radius': tokens.radius.icon,
          border: `2px dashed ${props.app.color}60`,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
          'font-size': '14px',
          'font-weight': '600',
          color: tokens.colors.text.muted,
          cursor: 'not-allowed',
        }}
      >
        {props.app.name}
      </div>

      {/* App name label below icon */}
      <div
        style={{
          'margin-top': tokens.spacing.sm,
          'text-align': 'center',
          color: tokens.colors.text.muted,
          'font-size': '14px',
          'font-weight': '500',
          'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
        }}
      >
        {props.app.name}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const HomePage: Component = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = createSignal(true);
  const [selectedApp, setSelectedApp] = createSignal<AppInfo | null>(null);
  const [showPreview, setShowPreview] = createSignal(false);

  // Auth guard - redirect to landing if not logged in
  onMount(() => {
    if (!auth.isLoading() && !auth.isAuthenticated()) {
      logger.auth.warn('Attempted to access /home without authentication, redirecting to /');
      navigate('/', { replace: true });
    } else {
      setIsLoading(false);
    }
  });

  const handleAppClick = (app: AppInfo) => {
    // Check if user has opted to skip preview for this app
    const skipPreview = localStorage.getItem(`taco_skip_preview_${app.id}`) === 'true';

    if (skipPreview && app.isLive) {
      // Skip preview and go directly to app
      logger.auth.info(`Launching app (skipped preview): ${app.name}`);
      navigate(`/${app.id}`);
    } else {
      // Show preview for all apps (both live and coming-soon)
      setSelectedApp(app);
      setShowPreview(true);
    }
  };

  const handleLaunchApp = () => {
    const app = selectedApp();
    if (!app || !app.isLive) return;

    logger.auth.info(`Launching app: ${app.name}`);
    setShowPreview(false);
    navigate(`/${app.id}`);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setTimeout(() => setSelectedApp(null), 300); // Clear after animation
  };

  return (
    <Show when={!isLoading() && auth.isAuthenticated()}>
      <div
        style={{
          'min-height': '100vh',
          background: tokens.colors.background,
          padding: `${tokens.spacing.xxl} ${tokens.spacing.lg}`,
          display: 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
          position: 'relative',
        }}
      >
        {/* TACo Logo - Top Left */}
        <a
          href="/"
          style={{
            position: 'absolute',
            top: tokens.spacing.lg,
            left: tokens.spacing.lg,
            display: 'flex',
            'align-items': 'center',
            'text-decoration': 'none',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          aria-label="Return to TACo landing page"
        >
          <img
            src="/Icon_Only.svg"
            alt="TACo"
            style={{
              width: '48px',
              height: '48px',
            }}
          />
        </a>

        {/* Settings Button - Top Right */}
        <button
          onClick={() => navigate('/settings')}
          style={{
            position: 'absolute',
            top: tokens.spacing.lg,
            right: tokens.spacing.lg,
            width: '48px',
            height: '48px',
            background: 'transparent',
            border: `1px solid ${tokens.colors.text.muted}40`,
            'border-radius': '12px',
            cursor: 'pointer',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = tokens.colors.text.secondary;
            e.currentTarget.style.background = tokens.colors.surface;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = `${tokens.colors.text.muted}40`;
            e.currentTarget.style.background = 'transparent';
          }}
          aria-label="Open settings"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={tokens.colors.text.secondary}
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Header */}
        <header
          style={{
            'margin-bottom': tokens.spacing.xxl,
            'text-align': 'center',
          }}
        >
          <h1
            style={{
              margin: `0 0 ${tokens.spacing.sm}`,
              'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
              'font-size': '36px',
              'font-weight': '700',
              color: tokens.colors.text.primary,
              'letter-spacing': '-0.5px',
            }}
          >
            Your Apps
          </h1>
          <p
            style={{
              margin: `0 0 ${tokens.spacing.xs}`,
              'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
              'font-size': '16px',
              color: tokens.colors.text.secondary,
            }}
          >
            Choose an app to get started
          </p>
          <a
            href="/"
            style={{
              'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
              'font-size': '13px',
              color: tokens.colors.text.muted,
              'text-decoration': 'none',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = tokens.colors.text.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = tokens.colors.text.muted;
            }}
          >
            ← Back to TACo
          </a>
        </header>

        {/* Live Apps Grid */}
        <div
          style={{
            display: 'grid',
            'grid-template-columns': 'repeat(auto-fit, 120px)',
            gap: tokens.spacing.xl,
            'justify-content': 'center',
            'max-width': '1200px',
            width: '100%',
          }}
        >
          <For each={apps.filter((app) => app.isLive)}>
            {(app) => <AppIcon3D app={app} onClick={() => handleAppClick(app)} />}
          </For>
        </div>

        {/* Separator */}
        <div
          style={{
            width: '100%',
            'max-width': '600px',
            height: '1px',
            background: `linear-gradient(90deg, transparent 0%, ${tokens.colors.text.muted}40 50%, transparent 100%)`,
            margin: `${tokens.spacing.xxl} 0`,
          }}
        />

        {/* Coming Soon Section Header */}
        <h2
          style={{
            margin: `0 0 ${tokens.spacing.xl}`,
            'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
            'font-size': '24px',
            'font-weight': '600',
            color: tokens.colors.text.secondary,
            'text-align': 'center',
          }}
        >
          Coming Soon
        </h2>

        {/* Coming Soon Apps Grid */}
        <div
          style={{
            display: 'grid',
            'grid-template-columns': 'repeat(auto-fit, 120px)',
            gap: tokens.spacing.xl,
            'justify-content': 'center',
            'max-width': '1200px',
            width: '100%',
          }}
        >
          <For each={apps.filter((app) => !app.isLive)}>
            {(app) => <AppIconFlat app={app} onClick={() => handleAppClick(app)} />}
          </For>
        </div>
      </div>

      {/* App Preview Modal */}
      <Show when={selectedApp()}>
        <AppPreview
          isOpen={showPreview()}
          onClose={handleClosePreview}
          onLaunch={handleLaunchApp}
          app={selectedApp()!}
        />
      </Show>
    </Show>
  );
};

export default HomePage;
