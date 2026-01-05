import { Component, createSignal, createEffect, onCleanup, For } from 'solid-js';
import { A } from '@solidjs/router';
import { DoodleRocket, DoodleLightbulb, DoodleHandshake, DoodlePeople } from './common/DoodleIcons';
import { Footer } from './common/Footer';

/**
 * InvestorsPage - Information for potential investors
 * Design: Matches TACo brand aesthetic with gradient accents and clean layout
 */

// Define navTokens inline since we can't import from App.tsx
const navTokens = {
  typography: {
    brandFamily: "'Shupp', 'DM Sans', system-ui, sans-serif",
  },
};

// Simplified apps data for footer
const apps = [
  { id: 'tempo', name: 'Tempo', description: 'A.D.H.D Task Master', color: '#5E6AD2' },
  { id: 'nurture', name: 'Nurture', description: 'Relationship Management', color: '#2D5A45' },
  { id: 'justincase', name: 'JustInCase', description: 'Small claims helper', color: '#64748B' },
  { id: 'friendly', name: 'FriendLy', description: 'Friendship calendar', color: '#3B82F6' },
  { id: 'tenure', name: 'Tenure', description: 'Eternal Career Companion', color: '#9333EA' },
  { id: 'manifest', name: 'Manifest', description: 'Picky matchmaking', color: '#000000' },
  { id: 'lol', name: 'LoL', description: 'Gamified chores', color: '#2196F3' },
  {
    id: 'papertrail',
    name: 'Paper Trail',
    description: 'News changelog',
    color: '#FFE500',
  },
];

export const InvestorsPage: Component = () => {
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
          top: '200px',
          right: '15%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(78,205,196,0.12) 0%, transparent 70%)',
          'border-radius': '50%',
          filter: 'blur(40px)',
          'pointer-events': 'none',
        }}
      />

      {/* Top Navigation */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: isMobile() ? '12px 16px' : '16px 24px',
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          'z-index': 100,
          background:
            'linear-gradient(180deg, rgba(15, 15, 26, 0.95) 0%, rgba(15, 15, 26, 0) 100%)',
          'backdrop-filter': 'blur(10px)',
        }}
      >
        <A
          href="/"
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '12px',
            'text-decoration': 'none',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)',
              'border-radius': '8px',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
              'font-size': isMobile() ? '14px' : '16px',
              'font-weight': '600',
              'font-family': navTokens.typography.brandFamily,
              color: 'white',
            }}
          >
            {isMobile() ? 'TACo' : 'Thoughtful App Co.'}
          </span>
        </A>
        <A
          href="/"
          style={{
            'font-size': '14px',
            color: 'rgba(255,255,255,0.6)',
            'text-decoration': 'none',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
        >
          ← Back to Home
        </A>
      </nav>

      {/* Main Content */}
      <main
        style={{
          'max-width': '900px',
          margin: '0 auto',
          padding: isMobile() ? '100px 20px 60px' : '120px 24px 80px',
          position: 'relative',
          'z-index': 1,
        }}
      >
        {/* Header */}
        <header style={{ 'text-align': 'center', 'margin-bottom': isMobile() ? '48px' : '64px' }}>
          <h1
            style={{
              'font-size': isMobile() ? '32px' : 'clamp(36px, 5vw, 56px)',
              'font-weight': '400',
              'line-height': '1.1',
              'letter-spacing': '-1px',
              'font-family': navTokens.typography.brandFamily,
              background: 'linear-gradient(135deg, #FF6B6B, #FFE66D, #4ECDC4)',
              '-webkit-background-clip': 'text',
              '-webkit-text-fill-color': 'transparent',
              'background-clip': 'text',
              margin: '0 0 20px 0',
            }}
          >
            Invest in Human-First Technology
          </h1>
          <p
            style={{
              'font-size': isMobile() ? '16px' : '20px',
              'line-height': '1.6',
              color: 'rgba(255,255,255,0.7)',
              margin: '0 0 12px 0',
              'max-width': '700px',
              'margin-left': 'auto',
              'margin-right': 'auto',
            }}
          >
            The A24 of lifestyle applications and SaaS bundle.
          </p>
          <p
            style={{
              'font-size': isMobile() ? '14px' : '16px',
              'line-height': '1.6',
              color: 'rgba(255,255,255,0.5)',
              margin: 0,
              'max-width': '700px',
              'margin-left': 'auto',
              'margin-right': 'auto',
              'font-style': 'italic',
            }}
          >
            An open contribution venture studio building applications that enable, not enslave.
          </p>
        </header>

        {/* Content Sections */}
        <div
          style={{ display: 'flex', 'flex-direction': 'column', gap: isMobile() ? '40px' : '56px' }}
        >
          {/* Our Vision */}
          <section
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              'border-radius': '20px',
              padding: isMobile() ? '24px' : '40px',
            }}
          >
            <h2
              style={{
                'font-size': isMobile() ? '24px' : '32px',
                'font-weight': '600',
                margin: '0 0 20px 0',
                color: 'white',
                'font-family': navTokens.typography.brandFamily,
              }}
            >
              Our Vision
            </h2>
            <p
              style={{
                'font-size': isMobile() ? '15px' : '17px',
                'line-height': '1.7',
                color: 'rgba(255,255,255,0.7)',
                margin: '0 0 16px 0',
              }}
            >
              We are building an application ecosystem that focuses on creating{' '}
              <strong>healthy, high-quality applications</strong> in areas of people's lives that
              most corporations will not pursue because they are not sticky. We're using the next
              seismic shift in code mechanics—propelled by LLM code agents—to take back technology
              for human good.
            </p>
            <p
              style={{
                'font-size': isMobile() ? '15px' : '17px',
                'line-height': '1.7',
                color: 'rgba(255,255,255,0.7)',
                margin: '0 0 16px 0',
              }}
            >
              Thoughtful App Co. hopes to be one of the first{' '}
              <strong>Open Contribution Venture Studios</strong> funded by 100% community and
              sponsors. We seek sponsors who can: (1) provide us credits and services (DevTools),
              and (2) companies who we can cross-market (as approved vendors). We allow users to
              bring their own API calls (handle their own costs)—embracing transparency and user
              control.
            </p>
            <p
              style={{
                'font-size': isMobile() ? '15px' : '17px',
                'line-height': '1.7',
                color: 'rgba(255,255,255,0.7)',
                margin: '0 0 16px 0',
              }}
            >
              We're building <strong>"The New Bundle"</strong>—a marketplace allowing individuals to
              pick up and drop apps at will, countering the anti-competitive bundles of Adobe and
              Microsoft. Our apps embrace natural lifecycles: alpha to omega cycles where apps serve
              their purpose, then gracefully phase out.
            </p>
            <p
              style={{
                'font-size': isMobile() ? '15px' : '17px',
                'line-height': '1.7',
                color: 'rgba(255,255,255,0.7)',
                margin: 0,
              }}
            >
              We are open to investment so we can accelerate our app ecosystem and provide less
              shitty alternatives! We seek <strong>strategic investors</strong> who align with our
              mission and have the right to refuse corporations, investors, or other contributors
              based on ethical concerns.
            </p>
          </section>

          {/* Legal Structure & Philosophy */}
          <section
            style={{
              background: 'rgba(255,107,107,0.08)',
              border: '1px solid rgba(255,107,107,0.2)',
              'border-radius': '20px',
              padding: isMobile() ? '24px' : '40px',
            }}
          >
            <h2
              style={{
                'font-size': isMobile() ? '24px' : '32px',
                'font-weight': '600',
                margin: '0 0 20px 0',
                color: '#FF6B6B',
                'font-family': navTokens.typography.brandFamily,
              }}
            >
              Our Commitment
            </h2>
            <p
              style={{
                'font-size': isMobile() ? '15px' : '17px',
                'line-height': '1.7',
                color: 'rgba(255,255,255,0.7)',
                margin: '0 0 16px 0',
              }}
            >
              Thoughtful App Co. is a{' '}
              <strong>Delaware C Corp with a Public Benefit designation</strong>.
            </p>
            <div
              style={{
                background: 'rgba(255,107,107,0.15)',
                border: '1px solid rgba(255,107,107,0.3)',
                'border-radius': '12px',
                padding: isMobile() ? '16px' : '20px',
                'margin-bottom': '16px',
              }}
            >
              <p
                style={{
                  'font-size': isMobile() ? '16px' : '18px',
                  'line-height': '1.6',
                  color: 'white',
                  margin: 0,
                  'font-weight': '600',
                }}
              >
                ⚠️ All investors beware!
              </p>
            </div>
            <ul
              style={{
                'list-style': 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                'flex-direction': 'column',
                gap: '12px',
              }}
            >
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ 'flex-shrink': 0, color: '#FF6B6B', 'font-size': '18px' }}>•</span>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                  We will <strong>not enshittify</strong> our applications
                </span>
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ 'flex-shrink': 0, color: '#FF6B6B', 'font-size': '18px' }}>•</span>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                  We will <strong>not build stickier</strong> to extract more value
                </span>
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ 'flex-shrink': 0, color: '#FF6B6B', 'font-size': '18px' }}>•</span>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Our <strong>community is our goal</strong>, not maximizing profits at their
                  expense
                </span>
              </li>
            </ul>
          </section>

          {/* Design Philosophy */}
          <section
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              'border-radius': '20px',
              padding: isMobile() ? '24px' : '40px',
            }}
          >
            <h2
              style={{
                'font-size': isMobile() ? '24px' : '32px',
                'font-weight': '600',
                margin: '0 0 20px 0',
                color: 'white',
                'font-family': navTokens.typography.brandFamily,
              }}
            >
              Our Design Philosophy
            </h2>
            <ul
              style={{
                'list-style': 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                'flex-direction': 'column',
                gap: '16px',
              }}
            >
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ 'flex-shrink': 0, color: '#4ECDC4', 'font-size': '20px' }}>→</span>
                <div>
                  <strong style={{ color: 'white' }}>Anti-Hero Application Patterns:</strong>{' '}
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Weaponize "negative" or dark patterns for good—helping basic human psychology
                    and respecting individual's "true nature"
                  </span>
                </div>
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ 'flex-shrink': 0, color: '#4ECDC4', 'font-size': '20px' }}>→</span>
                <div>
                  <strong style={{ color: 'white' }}>Phone As a Server:</strong>{' '}
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Your phone serves you rather than absorbing you. Moonshots include wearables
                    (haptics, audio, "dumb" screens) to increase reality time
                  </span>
                </div>
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ 'flex-shrink': 0, color: '#4ECDC4', 'font-size': '20px' }}>→</span>
                <div>
                  <strong style={{ color: 'white' }}>Local-First Principles:</strong>{' '}
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Enable data custody and user sovereignty through local-first architecture
                  </span>
                </div>
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ 'flex-shrink': 0, color: '#4ECDC4', 'font-size': '20px' }}>→</span>
                <div>
                  <strong style={{ color: 'white' }}>Simple & Artistic Design:</strong>{' '}
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                    UX/UI best practices balanced with respect for the art of design
                  </span>
                </div>
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ 'flex-shrink': 0, color: '#4ECDC4', 'font-size': '20px' }}>→</span>
                <div>
                  <strong style={{ color: 'white' }}>Build for Blue Oceans:</strong>{' '}
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Always seek new ideas serving market needs based on intrinsic value, not
                    investor dollar value
                  </span>
                </div>
              </li>
            </ul>
          </section>

          {/* Open Source Philosophy */}
          <section
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              'border-radius': '20px',
              padding: isMobile() ? '24px' : '40px',
            }}
          >
            <h2
              style={{
                'font-size': isMobile() ? '24px' : '32px',
                'font-weight': '600',
                margin: '0 0 20px 0',
                color: 'white',
                'font-family': navTokens.typography.brandFamily,
              }}
            >
              Open Contribution Model
            </h2>
            <p
              style={{
                'font-size': isMobile() ? '15px' : '17px',
                'line-height': '1.7',
                color: 'rgba(255,255,255,0.7)',
                margin: '0 0 16px 0',
              }}
            >
              We are not 100% Open Source technically. People who try to steal apps, fork ideas, or
              use applications for commercial purposes is not allowed. However, people who want to
              set up the application and run their own apps from our codebase—as of now, no issue.
            </p>
            <p
              style={{
                'font-size': isMobile() ? '15px' : '17px',
                'line-height': '1.7',
                color: 'rgba(255,255,255,0.7)',
                margin: 0,
              }}
            >
              We hope developers who love our ideas will want to be part of our mission here.
            </p>
          </section>

          {/* Investment Opportunity */}
          <section
            style={{
              background:
                'linear-gradient(135deg, rgba(78,205,196,0.08) 0%, rgba(255,230,109,0.08) 100%)',
              border: '1px solid rgba(78,205,196,0.2)',
              'border-radius': '20px',
              padding: isMobile() ? '24px' : '40px',
            }}
          >
            <h2
              style={{
                'font-size': isMobile() ? '24px' : '32px',
                'font-weight': '600',
                margin: '0 0 20px 0',
                color: '#4ECDC4',
                'font-family': navTokens.typography.brandFamily,
              }}
            >
              The Investment Opportunity
            </h2>
            <p
              style={{
                'font-size': isMobile() ? '15px' : '17px',
                'line-height': '1.7',
                color: 'rgba(255,255,255,0.7)',
                margin: '0 0 24px 0',
              }}
            >
              We're seeking <strong>strategic investors</strong> who can dedicate at least{' '}
              <strong>5 hours a week</strong> of their time or enable their company/estate resources
              to help Thoughtful be successful. <strong>We don't want silent partners</strong>—we
              want active collaborators who believe in the mission and can accelerate our growth.
            </p>

            <h3
              style={{
                'font-size': isMobile() ? '18px' : '22px',
                'font-weight': '600',
                margin: '0 0 16px 0',
                color: 'white',
              }}
            >
              We're Looking For Strategic Investors With:
            </h3>
            <ul
              style={{
                'list-style': 'none',
                padding: 0,
                margin: '0 0 24px 0',
                display: 'flex',
                'flex-direction': 'column',
                gap: '12px',
              }}
            >
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ 'flex-shrink': 0, color: '#4ECDC4', 'font-size': '18px' }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <strong>MarTech Expertise</strong> — Growth marketing, customer acquisition, and
                  go-to-market strategies
                </span>
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ 'flex-shrink': 0, color: '#4ECDC4', 'font-size': '18px' }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <strong>Enterprise Sales</strong> — Software sales to large groups, B2B
                  partnerships, and vendor relationships
                </span>
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ 'flex-shrink': 0, color: '#4ECDC4', 'font-size': '18px' }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <strong>Rapid Development</strong> — Shipping products quickly, agile execution,
                  and scaling engineering teams
                </span>
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ 'flex-shrink': 0, color: '#4ECDC4', 'font-size': '18px' }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <strong>Mission Alignment</strong> — Belief in ethical technology and
                  human-centered design principles
                </span>
              </li>
            </ul>

            <h3
              style={{
                'font-size': isMobile() ? '18px' : '22px',
                'font-weight': '600',
                margin: '0 0 16px 0',
                color: 'white',
              }}
            >
              Our Strategic Focus Areas:
            </h3>
            <div
              style={{
                display: 'grid',
                'grid-template-columns': isMobile() ? '1fr' : 'repeat(2, 1fr)',
                gap: isMobile() ? '12px' : '16px',
              }}
            >
              <div
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  'border-radius': '8px',
                  padding: '12px 16px',
                }}
              >
                <strong style={{ color: 'white', 'font-size': '14px' }}>Now:</strong>{' '}
                <span style={{ color: 'rgba(255,255,255,0.6)', 'font-size': '14px' }}>
                  ADHD (Productivity + Relationships), Legal Empowerment
                </span>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  'border-radius': '8px',
                  padding: '12px 16px',
                }}
              >
                <strong style={{ color: 'white', 'font-size': '14px' }}>Next:</strong>{' '}
                <span style={{ color: 'rgba(255,255,255,0.6)', 'font-size': '14px' }}>
                  Community Resources, Mental Health & Digital Wellbeing
                </span>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  'border-radius': '8px',
                  padding: '12px 16px',
                }}
              >
                <strong style={{ color: 'white', 'font-size': '14px' }}>Later:</strong>{' '}
                <span style={{ color: 'rgba(255,255,255,0.6)', 'font-size': '14px' }}>
                  Health & Wellness, HR/Recruiting, Dating
                </span>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  'border-radius': '8px',
                  padding: '12px 16px',
                }}
              >
                <strong style={{ color: 'white', 'font-size': '14px' }}>Moonshots:</strong>{' '}
                <span style={{ color: 'rgba(255,255,255,0.6)', 'font-size': '14px' }}>
                  Data Custody, Phone as Server, TACo Launcher
                </span>
              </div>
            </div>
          </section>

          {/* Key Initiatives */}
          <section
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              'border-radius': '20px',
              padding: isMobile() ? '24px' : '40px',
            }}
          >
            <h2
              style={{
                'font-size': isMobile() ? '24px' : '32px',
                'font-weight': '600',
                margin: '0 0 20px 0',
                color: 'white',
                'font-family': navTokens.typography.brandFamily,
              }}
            >
              Key Initiatives
            </h2>
            <ul
              style={{
                'list-style': 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                'flex-direction': 'column',
                gap: '20px',
              }}
            >
              <li>
                <h3
                  style={{
                    'font-size': '18px',
                    'font-weight': '600',
                    margin: '0 0 8px 0',
                    color: '#FFE66D',
                    display: 'flex',
                    'align-items': 'center',
                    gap: '10px',
                  }}
                >
                  <DoodleRocket size={22} color="#FFE66D" />
                  Gamified Hackathons
                </h3>
                <p
                  style={{
                    'font-size': '15px',
                    'line-height': '1.6',
                    color: 'rgba(255,255,255,0.6)',
                    margin: 0,
                  }}
                >
                  Bi-weekly to monthly hackathons at universities and cohorts with cash prizes. Free
                  to join, sponsor-funded, powered by LLM coding tools like OpenCode.
                </p>
              </li>
              <li>
                <h3
                  style={{
                    'font-size': '18px',
                    'font-weight': '600',
                    margin: '0 0 8px 0',
                    color: '#4ECDC4',
                    display: 'flex',
                    'align-items': 'center',
                    gap: '10px',
                  }}
                >
                  <DoodleLightbulb size={22} color="#4ECDC4" />
                  Thoughtful Tech Education
                </h3>
                <p
                  style={{
                    'font-size': '15px',
                    'line-height': '1.6',
                    color: 'rgba(255,255,255,0.6)',
                    margin: 0,
                  }}
                >
                  Teaching developers to build ethical, user-respecting applications that align with
                  our anti-dark pattern philosophy.
                </p>
              </li>
              <li>
                <h3
                  style={{
                    'font-size': '18px',
                    'font-weight': '600',
                    margin: '0 0 8px 0',
                    color: '#FF6B6B',
                    display: 'flex',
                    'align-items': 'center',
                    gap: '10px',
                  }}
                >
                  <DoodleHandshake size={22} color="#FF6B6B" />
                  Vendor Sponsorships
                </h3>
                <p
                  style={{
                    'font-size': '15px',
                    'line-height': '1.6',
                    color: 'rgba(255,255,255,0.6)',
                    margin: 0,
                  }}
                >
                  Partnering with DevTool companies to sponsor apps and hackathons, creating win-win
                  relationships tied to our tech stack.
                </p>
              </li>
              <li>
                <h3
                  style={{
                    'font-size': '18px',
                    'font-weight': '600',
                    margin: '0 0 8px 0',
                    color: '#9333EA',
                    display: 'flex',
                    'align-items': 'center',
                    gap: '10px',
                  }}
                >
                  <DoodlePeople size={22} color="#9333EA" />
                  Community Funding Model
                </h3>
                <p
                  style={{
                    'font-size': '15px',
                    'line-height': '1.6',
                    color: 'rgba(255,255,255,0.6)',
                    margin: 0,
                  }}
                >
                  Similar to Obsidian: (1) Never enshittify, (2) Community rounds, (3) For
                  community, provided by community.
                </p>
              </li>
            </ul>
          </section>

          {/* Current Apps Status */}
          <section
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              'border-radius': '20px',
              padding: isMobile() ? '24px' : '40px',
            }}
          >
            <h2
              style={{
                'font-size': isMobile() ? '24px' : '32px',
                'font-weight': '600',
                margin: '0 0 20px 0',
                color: 'white',
                'font-family': navTokens.typography.brandFamily,
              }}
            >
              Current Development Status
            </h2>
            <div
              style={{
                display: 'grid',
                'grid-template-columns': isMobile() ? '1fr' : 'repeat(2, 1fr)',
                gap: isMobile() ? '16px' : '20px',
              }}
            >
              <div
                style={{
                  background: 'rgba(94,106,210,0.08)',
                  border: '1px solid rgba(94,106,210,0.2)',
                  'border-radius': '12px',
                  padding: '20px',
                }}
              >
                <h3
                  style={{
                    'font-size': '20px',
                    'font-weight': '600',
                    margin: '0 0 8px 0',
                    color: '#5E6AD2',
                  }}
                >
                  Tempo
                </h3>
                <p
                  style={{
                    'font-size': '14px',
                    color: 'rgba(255,255,255,0.6)',
                    margin: '0 0 8px 0',
                  }}
                >
                  A.D.H.D Task Master
                </p>
                <p style={{ 'font-size': '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  Status: <strong style={{ color: '#10B981' }}>Alpha Testing</strong>
                </p>
              </div>
              <div
                style={{
                  background: 'rgba(147,51,234,0.08)',
                  border: '1px solid rgba(147,51,234,0.2)',
                  'border-radius': '12px',
                  padding: '20px',
                }}
              >
                <h3
                  style={{
                    'font-size': '20px',
                    'font-weight': '600',
                    margin: '0 0 8px 0',
                    color: '#9333EA',
                  }}
                >
                  Tenure
                </h3>
                <p
                  style={{
                    'font-size': '14px',
                    color: 'rgba(255,255,255,0.6)',
                    margin: '0 0 8px 0',
                  }}
                >
                  Eternal Career Companion
                </p>
                <p style={{ 'font-size': '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  Status: <strong style={{ color: '#10B981' }}>Alpha Testing</strong>
                </p>
              </div>
              <div
                style={{
                  background: 'rgba(45,90,69,0.08)',
                  border: '1px solid rgba(45,90,69,0.2)',
                  'border-radius': '12px',
                  padding: '20px',
                }}
              >
                <h3
                  style={{
                    'font-size': '20px',
                    'font-weight': '600',
                    margin: '0 0 8px 0',
                    color: '#2D5A45',
                  }}
                >
                  Nurture
                </h3>
                <p
                  style={{
                    'font-size': '14px',
                    color: 'rgba(255,255,255,0.6)',
                    margin: '0 0 8px 0',
                  }}
                >
                  Relationship Management
                </p>
                <p style={{ 'font-size': '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  Status: <strong style={{ color: '#F59E0B' }}>Development</strong>
                </p>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  'border-radius': '12px',
                  padding: '20px',
                }}
              >
                <h3
                  style={{
                    'font-size': '20px',
                    'font-weight': '600',
                    margin: '0 0 8px 0',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  + 5 More Apps
                </h3>
                <p
                  style={{
                    'font-size': '14px',
                    color: 'rgba(255,255,255,0.5)',
                    margin: '0 0 8px 0',
                  }}
                >
                  JustInCase, FriendLy, Manifest, LoL, PaperTrail
                </p>
                <p style={{ 'font-size': '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                  Status: <strong>Planned</strong>
                </p>
              </div>
            </div>
          </section>

          {/* Get in Touch */}
          <section
            style={{
              background:
                'linear-gradient(135deg, rgba(255,107,107,0.15) 0%, rgba(78,205,196,0.15) 100%)',
              border: '1px solid rgba(255,255,255,0.15)',
              'border-radius': '20px',
              padding: isMobile() ? '32px 24px' : '48px 40px',
              'text-align': 'center',
            }}
          >
            <h2
              style={{
                'font-size': isMobile() ? '28px' : '36px',
                'font-weight': '600',
                margin: '0 0 16px 0',
                color: 'white',
                'font-family': navTokens.typography.brandFamily,
              }}
            >
              Let's Build the Future Together
            </h2>
            <p
              style={{
                'font-size': isMobile() ? '16px' : '18px',
                'line-height': '1.6',
                color: 'rgba(255,255,255,0.8)',
                margin: '0 0 32px 0',
                'max-width': '600px',
                'margin-left': 'auto',
                'margin-right': 'auto',
              }}
            >
              We're seeking mission-aligned strategic investors who believe in building ethical,
              sustainable technology that puts humans first and can actively contribute to our
              success.
            </p>
            <a
              href="mailto:launch@thoughtfulapp.co"
              style={{
                display: 'inline-block',
                padding: isMobile() ? '14px 28px' : '16px 40px',
                background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
                color: 'white',
                'font-size': isMobile() ? '16px' : '18px',
                'font-weight': '600',
                'border-radius': '12px',
                'text-decoration': 'none',
                transition: 'all 0.3s ease',
                'box-shadow': '0 8px 24px rgba(255,107,107,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(255,107,107,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,107,107,0.3)';
              }}
            >
              Get in Touch
            </a>
            <div
              style={{
                'margin-top': '24px',
                'font-size': '14px',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              launch@thoughtfulapp.co
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer apps={apps} isMobile={isMobile} navTokens={navTokens} />
    </div>
  );
};
