/**
 * Manifest - Deep Connection & Relationship Discovery App
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying, modification,
 * or distribution of this code is strictly prohibited. The frontend logic is local-first
 * and protected intellectual property. No infringement or unauthorized use is permitted.
 */

import { Component, For, createSignal, Show } from 'solid-js';
import { Profile, Match, SelfDiscovery } from '../../schemas/manifest.schema';
import { AppMenuTrigger } from '../common/AppMenuTrigger';

// --- DATA: DEEP CONNECTION FOCUS ---

const sampleProfile: Profile = {
  id: '1',
  displayName: 'Alex',
  age: 28,
  location: 'Brooklyn, NY',
  bio: 'Seeking someone who walks the same path.',
  photos: ['/avatar.jpg'],
  commitmentScore: 85,
};

const sampleMatches: (Match & {
  loveLanguage: string;
  lifePath: string;
  coreValue: string;
  redFlags: string[];
})[] = [
  {
    id: '1',
    userId: '1',
    matchedUserId: '2',
    compatibilityScore: 92,
    sharedValues: ['Growth', 'Authenticity'],
    matchedAt: new Date(),
    status: 'pending',
    loveLanguage: 'Acts of Service',
    lifePath: 'Creative Builder',
    coreValue: 'Radical Honesty',
    redFlags: ['Strictly Dates Tall Men (>6\'2")', 'Prefers Latino Men', 'Talks During Movies'],
  },
  {
    id: '2',
    userId: '1',
    matchedUserId: '3',
    compatibilityScore: 78,
    sharedValues: ['Stability', 'Family'],
    matchedAt: new Date(),
    status: 'accepted',
    loveLanguage: 'Quality Time',
    lifePath: 'Nurturing Guardian',
    coreValue: 'Loyalty',
    redFlags: ['Only Dates Asian Women', 'Needs 2h Alone Time Daily', 'Hates Dogs'],
  },
];

const journalPrompts: SelfDiscovery[] = [
  {
    id: '1',
    userId: '1',
    question: 'When do you feel most understood?',
    answer: '',
    category: 'emotional_intelligence',
    completedAt: new Date(),
  },
  {
    id: '2',
    userId: '1',
    question: 'What is a "dealbreaker" that actually protects your peace?',
    answer: '',
    category: 'boundaries',
    completedAt: new Date(),
  },
];

// --- THEME: DUOTONE (CHARCOAL & LOVE) ---

const duotone = {
  base: '#1a1a1a', // Charcoal - The Deep Self
  accent: '#D32F2F', // Love/Crimson - The Passion/Connection
  paper: '#F5F5F5', // Off-white - The Canvas
  text: '#1a1a1a',
  textMuted: '#757575',
};

// "Hard Stick" Shadows - crisp, high contrast
const shadows = {
  lifted: `8px 8px 0px ${duotone.base}`,
  floating: `4px 4px 0px ${duotone.base}`,
  flat: `2px 2px 0px ${duotone.accent}`,
};

const styles = {
  container: {
    'min-height': '100vh',
    background: duotone.paper,
    color: duotone.text,
    'font-family': "'Courier New', Courier, monospace",
    padding: '40px',
    'overflow-x': 'hidden' as const,
    position: 'relative' as const,
    // Subtle noise/grain could be added here, but staying clean for Duotone impact
  },
  title: {
    'font-family': "'Courier New', Courier, monospace",
    'font-weight': 'bold',
    'font-size': '4rem',
    'text-transform': 'uppercase' as const,
    'letter-spacing': '-0.05em',
    'margin-bottom': '0.5rem',
    position: 'relative' as const,
    'z-index': 10,
    color: duotone.base,
    'text-shadow': `4px 4px 0px ${duotone.accent}`, // Duotone shadow
  },
};

// --- COMPONENTS ---

// Geometric Cutouts - Now STRICTLY Duotone
const DuotoneCutout: Component<{
  color: 'base' | 'accent';
  shape: 'circle' | 'square' | 'triangle';
  size: string;
  style?: any;
}> = (props) => {
  const bg = props.color === 'base' ? duotone.base : duotone.accent;

  // CSS Clip Paths for shapes
  const clipPath =
    props.shape === 'circle'
      ? 'circle(50% at 50% 50%)'
      : props.shape === 'triangle'
        ? 'polygon(50% 0%, 0% 100%, 100% 100%)'
        : 'none'; // Square is default

  return (
    <div
      style={{
        position: 'absolute',
        width: props.size,
        height: props.size,
        background: bg,
        'clip-path': clipPath,
        opacity: 0.15, // Subtle background presence
        'z-index': 0,
        'pointer-events': 'none',
        ...props.style,
      }}
    />
  );
};

const JournalCard: Component<{ children: any; style?: any; accent?: boolean }> = (props) => {
  return (
    <div
      style={{
        background: '#fff',
        padding: '32px',
        position: 'relative',
        border: `2px solid ${duotone.base}`,
        'box-shadow': props.accent ? `8px 8px 0px ${duotone.accent}` : shadows.floating,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        'z-index': 1,
        ...props.style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translate(-2px, -2px)';
        e.currentTarget.style.boxShadow = props.accent
          ? `12px 12px 0px ${duotone.accent}`
          : shadows.lifted;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = props.accent
          ? `8px 8px 0px ${duotone.accent}`
          : shadows.floating;
      }}
    >
      {/* Decorative Corner Fold or Accent */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          right: '0',
          width: '20px',
          height: '20px',
          background: props.accent ? duotone.accent : duotone.base,
          'clip-path': 'polygon(0 0, 100% 0, 100% 100%)',
        }}
      />

      {props.children}
    </div>
  );
};

const Tag: Component<{ label: string; invert?: boolean }> = (props) => (
  <span
    style={{
      display: 'inline-block',
      background: props.invert ? duotone.base : duotone.accent,
      color: '#fff',
      padding: '6px 12px',
      'font-size': '0.75rem',
      'font-weight': 'bold',
      'text-transform': 'uppercase',
      'margin-right': '8px',
      'margin-bottom': '8px',
      'box-shadow': '2px 2px 0px rgba(0,0,0,0.2)',
    }}
  >
    {props.label}
  </span>
);

const RedFlagReveal: Component<{ flags: string[] }> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Badge */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen());
        }}
        style={{
          background: 'transparent',
          border: `1px solid ${duotone.accent}`,
          color: duotone.accent,
          padding: '4px 8px',
          'font-size': '0.75rem',
          'font-weight': 'bold',
          'text-transform': 'uppercase',
          cursor: 'pointer',
          display: 'flex',
          'align-items': 'center',
          gap: '6px',
          transition: 'all 0.2s',
          'box-shadow': '2px 2px 0px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = duotone.accent;
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = duotone.accent;
        }}
      >
        <span>🚩</span>
        <span>{props.flags.length} WARNINGS</span>
      </button>

      {/* Popover */}
      <Show when={isOpen()}>
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            'margin-bottom': '12px',
            width: '240px',
            background: '#fff',
            border: `2px solid ${duotone.accent}`,
            'box-shadow': `4px 4px 0px ${duotone.accent}`,
            'z-index': 100,
            padding: '0',
          }}
        >
          {/* Popover Header */}
          <div
            style={{
              background: duotone.accent,
              color: '#fff',
              padding: '6px 12px',
              'font-size': '0.7rem',
              'font-weight': 'bold',
              'text-transform': 'uppercase',
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'center',
            }}
          >
            <span>Confidential</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                'font-weight': 'bold',
              }}
            >
              ×
            </button>
          </div>

          {/* List */}
          <ul
            style={{
              'list-style-type': 'none',
              padding: '12px',
              margin: 0,
              'font-size': '0.8rem',
              color: duotone.base,
            }}
          >
            <For each={props.flags}>
              {(flag) => (
                <li
                  style={{
                    'margin-bottom': '8px',
                    'border-bottom': '1px dashed #eee',
                    'padding-bottom': '4px',
                  }}
                >
                  • {flag}
                </li>
              )}
            </For>
          </ul>

          {/* Decorative Arrow */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '20px',
              width: '10px',
              height: '10px',
              background: '#fff',
              'border-right': `2px solid ${duotone.accent}`,
              'border-bottom': `2px solid ${duotone.accent}`,
              transform: 'rotate(45deg)',
            }}
          />
        </div>
      </Show>
    </div>
  );
};

const MatchProfile: Component<{ match: (typeof sampleMatches)[0] }> = (props) => {
  return (
    <JournalCard
      style={{
        height: '100%',
        display: 'flex',
        'flex-direction': 'column',
        'justify-content': 'space-between',
      }}
    >
      <div>
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
            'border-bottom': `2px solid ${duotone.base}`,
            'padding-bottom': '12px',
            'margin-bottom': '20px',
          }}
        >
          <span style={{ 'font-weight': 'bold', 'font-size': '1.2rem', color: duotone.base }}>
            #{props.match.id.padStart(3, '0')}
          </span>
          <div style={{ display: 'flex', gap: '12px', 'align-items': 'center' }}>
            <RedFlagReveal flags={props.match.redFlags} />
            <span
              style={{
                color: props.match.status === 'accepted' ? duotone.accent : duotone.textMuted,
                'font-weight': 'bold',
                'font-size': '0.9rem',
              }}
            >
              {props.match.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ 'margin-bottom': '24px' }}>
          <div
            style={{
              'font-size': '0.8rem',
              color: duotone.textMuted,
              'margin-bottom': '4px',
              'text-transform': 'uppercase',
            }}
          >
            Love Language
          </div>
          <div
            style={{
              'font-size': '1.2rem',
              'font-weight': 'bold',
              'margin-bottom': '16px',
              color: duotone.accent,
            }}
          >
            {props.match.loveLanguage}
          </div>

          <div
            style={{
              'font-size': '0.8rem',
              color: duotone.textMuted,
              'margin-bottom': '4px',
              'text-transform': 'uppercase',
            }}
          >
            Life Path
          </div>
          <div style={{ 'font-size': '1.1rem', 'font-weight': 'bold', 'margin-bottom': '12px' }}>
            {props.match.lifePath}
          </div>
        </div>

        <div style={{ 'margin-bottom': '20px' }}>
          <For each={props.match.sharedValues}>{(val) => <Tag label={val} invert />}</For>
        </div>
      </div>

      <div
        style={{
          'text-align': 'center',
          'border-top': `1px dashed ${duotone.textMuted}`,
          'padding-top': '20px',
        }}
      >
        <div
          style={{
            'font-size': '3.5rem',
            'font-weight': 'bold',
            color: duotone.base,
            'line-height': 1,
            'letter-spacing': '-2px',
          }}
        >
          {props.match.compatibilityScore}%
        </div>
        <div
          style={{
            'font-size': '0.8rem',
            color: duotone.textMuted,
            'text-transform': 'uppercase',
            'letter-spacing': '1px',
          }}
        >
          Resonance
        </div>
      </div>

      <button
        style={{
          'margin-top': '24px',
          background: 'transparent',
          color: duotone.base,
          border: `2px solid ${duotone.base}`,
          padding: '12px',
          'font-family': 'inherit',
          'font-weight': 'bold',
          'text-transform': 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          'justify-content': 'center',
          'align-items': 'center',
          gap: '8px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = duotone.base;
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = duotone.base;
        }}
      >
        <span>Open Journal</span>
        <span>→</span>
      </button>
    </JournalCard>
  );
};

const JournalEntry: Component<{ prompt: SelfDiscovery; index: number }> = (props) => (
  <div
    style={{
      position: 'relative',
      'margin-bottom': '60px',
      'padding-left': '20px',
      'border-left': `4px solid ${duotone.accent}`,
    }}
  >
    <div
      style={{
        'font-size': '0.8rem',
        'text-transform': 'uppercase',
        color: duotone.textMuted,
        'margin-bottom': '12px',
        'letter-spacing': '2px',
        'font-weight': 'bold',
      }}
    >
      /// Entry {String(props.index + 1).padStart(2, '0')}
    </div>

    <h3
      style={{
        'font-size': '1.5rem',
        'line-height': '1.3',
        'margin-bottom': '20px',
        'font-weight': 'bold',
        color: duotone.base,
      }}
    >
      {props.prompt.question}
    </h3>

    <div
      style={{
        position: 'relative',
        background: '#fff',
        padding: '0 24px',
        border: `2px solid ${duotone.base}`,
        'box-shadow': shadows.flat,
      }}
    >
      <textarea
        placeholder="Type your truth here..."
        style={{
          width: '100%',
          'min-height': '150px',
          border: 'none',
          background: 'transparent',
          'font-family': "'Courier New', Courier, monospace",
          'font-size': '1.1rem',
          'line-height': '2rem',
          'background-image': `repeating-linear-gradient(transparent, transparent 31px, #E0E0E0 31px, #E0E0E0 32px)`,
          'background-attachment': 'local',
          padding: '16px 0',
          outline: 'none',
          resize: 'vertical',
          color: duotone.base,
        }}
      />
    </div>
  </div>
);

// --- MAIN LAYOUT ---

export const ManifestApp: Component = () => {
  const [activeTab, setActiveTab] = createSignal<'journal' | 'connections'>('connections');

  return (
    <div style={styles.container}>
      {/* Duotone Background Accents */}
      <DuotoneCutout
        color="accent"
        shape="circle"
        size="400px"
        style={{ top: '-100px', right: '-100px' }}
      />
      <DuotoneCutout
        color="base"
        shape="triangle"
        size="300px"
        style={{ bottom: '50px', left: '-100px', transform: 'rotate(15deg)' }}
      />

      <header
        style={{
          'max-width': '900px',
          margin: '0 auto 80px',
          'text-align': 'center',
          position: 'relative',
        }}
      >
        <div style={{ display: 'inline-block', position: 'relative' }}>
          <AppMenuTrigger>
            <h1 style={styles.title}>Manifest.</h1>
          </AppMenuTrigger>
          <div
            style={{
              position: 'absolute',
              bottom: '15px',
              right: '-70px',
              background: duotone.accent,
              color: '#fff',
              padding: '4px 8px',
              'font-size': '0.9rem',
              'font-weight': 'bold',
              transform: 'rotate(-10deg)',
              'box-shadow': '4px 4px 0px rgba(0,0,0,0.2)',
            }}
          >
            VOL. 1
          </div>
        </div>

        <p
          style={{
            'font-size': '1.2rem',
            color: duotone.base,
            'max-width': '600px',
            margin: '0 auto',
            'line-height': '1.6',
            'border-top': `1px solid ${duotone.base}`,
            'padding-top': '20px',
            'margin-top': '20px',
          }}
        >
          Knowing yourself is the prerequisite to{' '}
          <span style={{ color: duotone.accent, 'font-weight': 'bold' }}>true connection</span>.
        </p>

        <div
          style={{
            display: 'flex',
            'justify-content': 'center',
            gap: '0',
            'margin-top': '50px',
            border: `2px solid ${duotone.base}`,
            background: '#fff',
            width: 'fit-content',
            'margin-left': 'auto',
            'margin-right': 'auto',
            'box-shadow': shadows.floating,
          }}
        >
          <button
            onClick={() => setActiveTab('connections')}
            style={{
              padding: '16px 32px',
              border: 'none',
              background: activeTab() === 'connections' ? duotone.base : 'transparent',
              color: activeTab() === 'connections' ? '#fff' : duotone.base,
              'font-family': 'inherit',
              'font-weight': 'bold',
              'text-transform': 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
              'letter-spacing': '1px',
            }}
          >
            Connections
          </button>
          <div style={{ width: '2px', background: duotone.base }} />
          <button
            onClick={() => setActiveTab('journal')}
            style={{
              padding: '16px 32px',
              border: 'none',
              background: activeTab() === 'journal' ? duotone.base : 'transparent',
              color: activeTab() === 'journal' ? '#fff' : duotone.base,
              'font-family': 'inherit',
              'font-weight': 'bold',
              'text-transform': 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
              'letter-spacing': '1px',
            }}
          >
            Journal
          </button>
        </div>
      </header>

      <main style={{ 'max-width': '1000px', margin: '0 auto', position: 'relative', 'z-index': 1 }}>
        <Show when={activeTab() === 'connections'}>
          <div
            style={{
              display: 'grid',
              'grid-template-columns': 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '40px',
              padding: '0 20px',
            }}
          >
            <For each={sampleMatches}>{(match) => <MatchProfile match={match} />}</For>

            {/* The "Manifested Date" Card - Accent Style */}
            <JournalCard
              accent
              style={{
                display: 'flex',
                'flex-direction': 'column',
                'justify-content': 'center',
                'align-items': 'center',
                'text-align': 'center',
                padding: '40px',
              }}
            >
              <div
                style={{
                  'font-size': '4rem',
                  color: duotone.accent,
                  'margin-bottom': '20px',
                }}
              >
                ♥
              </div>
              <h3
                style={{
                  'font-size': '2rem',
                  'margin-bottom': '16px',
                  color: duotone.base,
                  'text-transform': 'uppercase',
                  'letter-spacing': '-1px',
                }}
              >
                The Leap
              </h3>
              <p
                style={{ 'margin-bottom': '32px', 'line-height': '1.6', color: duotone.textMuted }}
              >
                We've identified a soul resonance. <br />
                <b>Match #882</b> shares your Core Value of <i>"Radical Honesty"</i>.
              </p>
              <button
                style={{
                  background: duotone.accent,
                  color: '#fff',
                  border: 'none',
                  padding: '16px 32px',
                  'font-size': '1.1rem',
                  'font-weight': 'bold',
                  'box-shadow': `4px 4px 0 rgba(0,0,0,0.2)`,
                  cursor: 'pointer',
                  'text-transform': 'uppercase',
                  'letter-spacing': '1px',
                  transition: 'transform 0.1s',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'translate(2px, 2px)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'translate(0, 0)')}
              >
                Manifest Date
              </button>
            </JournalCard>
          </div>
        </Show>

        <Show when={activeTab() === 'journal'}>
          <div
            style={{
              background: '#fff',
              padding: '60px',
              border: `2px solid ${duotone.base}`,
              'box-shadow': shadows.lifted,
              position: 'relative',
              'min-height': '600px',
            }}
          >
            {/* Header */}
            <div
              style={{
                'border-bottom': `4px solid ${duotone.base}`,
                'padding-bottom': '24px',
                'margin-bottom': '60px',
                display: 'flex',
                'justify-content': 'space-between',
                'align-items': 'flex-end',
              }}
            >
              <div>
                <h2
                  style={{
                    'font-size': '3rem',
                    margin: 0,
                    'line-height': 0.8,
                    color: duotone.base,
                  }}
                >
                  SELF
                  <br />
                  STUDY
                </h2>
              </div>
              <div style={{ 'text-align': 'right' }}>
                <div
                  style={{
                    'font-size': '0.9rem',
                    'text-transform': 'uppercase',
                    color: duotone.textMuted,
                    'margin-bottom': '4px',
                  }}
                >
                  Clarity Score
                </div>
                <div
                  style={{
                    'font-size': '3rem',
                    'font-weight': 'bold',
                    'line-height': 0.8,
                    color: duotone.accent,
                  }}
                >
                  {sampleProfile.commitmentScore}
                </div>
              </div>
            </div>

            <For each={journalPrompts}>
              {(prompt, i) => <JournalEntry prompt={prompt} index={i()} />}
            </For>

            <div
              style={{
                'text-align': 'center',
                'margin-top': '80px',
                'border-top': `1px dashed ${duotone.textMuted}`,
                'padding-top': '40px',
              }}
            >
              <button
                style={{
                  background: duotone.base,
                  color: '#fff',
                  border: 'none',
                  padding: '16px 48px',
                  'font-family': 'inherit',
                  'font-weight': 'bold',
                  'font-size': '1.2rem',
                  cursor: 'pointer',
                  'box-shadow': `4px 4px 0px ${duotone.accent}`,
                  transition: 'all 0.2s',
                }}
              >
                COMMIT ENTRY
              </button>
            </div>
          </div>
        </Show>
      </main>

      <footer
        style={{
          'text-align': 'center',
          'margin-top': '120px',
          padding: '40px',
          color: duotone.textMuted,
          'font-size': '0.8rem',
          'text-transform': 'uppercase',
          'letter-spacing': '2px',
        }}
      >
        Manifest Vol. 1 — Est. 2025
      </footer>
    </div>
  );
};
