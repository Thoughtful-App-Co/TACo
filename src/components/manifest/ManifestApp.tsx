import { Component, For, createSignal } from 'solid-js';
import { Profile, Match, SelfDiscovery } from '../../schemas/manifest.schema';
import { brutalist, brutalScale, brutalAccents } from '../../theme/brutalist';

const sampleProfile: Profile = {
  id: '1',
  displayName: 'USER_001',
  age: 28,
  location: 'Brooklyn, NY',
  bio: 'I build things. I break things. Looking for someone who gets it.',
  photos: ['/avatar.jpg'],
  commitmentScore: 72,
};

const sampleMatches: Match[] = [
  { id: '1', userId: '1', matchedUserId: '2', compatibilityScore: 87, sharedValues: ['creativity', 'adventure'], matchedAt: new Date(), status: 'pending' },
  { id: '2', userId: '1', matchedUserId: '3', compatibilityScore: 74, sharedValues: ['career', 'stability'], matchedAt: new Date(), status: 'accepted' },
];

const sampleQuestions: SelfDiscovery[] = [
  { id: '1', userId: '1', question: 'What does a successful relationship look like to you?', answer: '', category: 'relationship', completedAt: new Date() },
  { id: '2', userId: '1', question: 'Describe your ideal weekend.', answer: '', category: 'lifestyle', completedAt: new Date() },
];

const BrutalButton: Component<{ children: any; primary?: boolean; onClick?: () => void }> = (props) => {
  return (
    <button
      onClick={props.onClick}
      style={{
        padding: '16px 32px',
        background: props.primary ? brutalist.colors.primary : brutalist.colors.background,
        color: props.primary ? brutalist.colors.background : brutalist.colors.primary,
        border: `3px solid ${brutalist.colors.primary}`,
        'border-radius': '0',
        'font-family': brutalist.fonts.heading,
        'font-size': '14px',
        'font-weight': '900',
        'text-transform': 'uppercase',
        'letter-spacing': '2px',
        cursor: 'pointer',
        'box-shadow': props.primary ? brutalist.shadows.sm : 'none',
        transition: 'transform 0.1s, box-shadow 0.1s',
      }}
    >
      {props.children}
    </button>
  );
};

const MatchCard: Component<{ match: Match }> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: brutalist.colors.background,
        border: `3px solid ${brutalist.colors.primary}`,
        padding: '0',
        'box-shadow': isHovered() ? brutalist.shadows.md : brutalist.shadows.sm,
        transform: isHovered() ? 'translate(-4px, -4px)' : 'none',
        transition: 'transform 0.1s, box-shadow 0.1s',
        cursor: 'pointer',
      }}
    >
      {/* Header stripe */}
      <div style={{
        background: brutalist.colors.primary,
        color: brutalist.colors.background,
        padding: '12px 16px',
        'font-family': brutalist.fonts.body,
        'font-size': '12px',
        display: 'flex',
        'justify-content': 'space-between',
        'align-items': 'center',
      }}>
        <span>MATCH #{props.match.id}</span>
        <span style={{ color: props.match.status === 'accepted' ? brutalAccents.success : brutalAccents.warning }}>
          [{props.match.status.toUpperCase()}]
        </span>
      </div>
      
      <div style={{ padding: '24px' }}>
        {/* Compatibility score - brutally large */}
        <div style={{
          'font-family': brutalist.fonts.heading,
          'font-size': brutalScale.display,
          'font-weight': '900',
          'line-height': '1',
          'margin-bottom': '16px',
        }}>
          {props.match.compatibilityScore}%
        </div>
        
        <div style={{
          'font-family': brutalist.fonts.body,
          'font-size': '14px',
          color: brutalist.colors.textMuted,
          'margin-bottom': '16px',
        }}>
          COMPATIBILITY SCORE
        </div>
        
        {/* Shared values - exposed as raw data */}
        <div style={{
          'font-family': brutalist.fonts.body,
          'font-size': '12px',
          'margin-bottom': '24px',
        }}>
          <div style={{ color: brutalist.colors.textMuted, 'margin-bottom': '8px' }}>
            SHARED_VALUES: [
          </div>
          <For each={props.match.sharedValues}>
            {(value, i) => (
              <span style={{
                display: 'inline-block',
                padding: '4px 8px',
                background: brutalist.colors.surface,
                'margin-right': '8px',
                'margin-bottom': '8px',
                border: `1px solid ${brutalist.colors.border}`,
              }}>
                "{value}"{i() < props.match.sharedValues.length - 1 ? ',' : ''}
              </span>
            )}
          </For>
          <div style={{ color: brutalist.colors.textMuted }}>]</div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <BrutalButton primary>VIEW PROFILE</BrutalButton>
          <BrutalButton>PASS</BrutalButton>
        </div>
      </div>
    </div>
  );
};

const QuestionBlock: Component<{ question: SelfDiscovery; index: number }> = (props) => {
  return (
    <div style={{
      background: brutalist.colors.surface,
      border: `3px solid ${brutalist.colors.primary}`,
      'margin-bottom': '24px',
    }}>
      {/* Question number - visible structure */}
      <div style={{
        background: brutalist.colors.primary,
        color: brutalist.colors.background,
        padding: '8px 16px',
        'font-family': brutalist.fonts.body,
        'font-size': '12px',
      }}>
        QUESTION_{String(props.index + 1).padStart(3, '0')} // {props.question.category.toUpperCase()}
      </div>
      
      <div style={{ padding: '24px' }}>
        <h3 style={{
          margin: '0 0 24px 0',
          'font-family': brutalist.fonts.heading,
          'font-size': brutalScale.h2,
          'font-weight': '900',
          'line-height': '1.2',
          color: brutalist.colors.text,
        }}>
          {props.question.question}
        </h3>
        
        <textarea
          placeholder="TYPE YOUR ANSWER HERE..."
          style={{
            width: '100%',
            'min-height': '120px',
            padding: '16px',
            background: brutalist.colors.background,
            border: `2px solid ${brutalist.colors.border}`,
            'font-family': brutalist.fonts.body,
            'font-size': '14px',
            'line-height': '1.6',
            resize: 'vertical',
          }}
        />
      </div>
    </div>
  );
};

export const ManifestApp: Component = () => {
  const [activeSection, setActiveSection] = createSignal<'matches' | 'discover' | 'criteria'>('matches');
  
  return (
    <div style={{
      'min-height': '100vh',
      background: brutalist.colors.background,
      'font-family': brutalist.fonts.body,
    }}>
      {/* Brutalist header - visible grid lines */}
      <header style={{
        'border-bottom': `3px solid ${brutalist.colors.primary}`,
        padding: '0',
      }}>
        <div style={{
          display: 'flex',
          'align-items': 'stretch',
          'max-width': '1400px',
          margin: '0 auto',
        }}>
          {/* Logo block */}
          <div style={{
            padding: '24px 32px',
            'border-right': `3px solid ${brutalist.colors.primary}`,
          }}>
            <h1 style={{
              margin: 0,
              'font-family': brutalist.fonts.heading,
              'font-size': brutalScale.h1,
              'font-weight': '900',
              'letter-spacing': '-2px',
              color: brutalist.colors.text,
            }}>
              MANIFEST
            </h1>
            <div style={{
              'font-size': '11px',
              color: brutalist.colors.textMuted,
              'letter-spacing': '1px',
              'margin-top': '4px',
            }}>
              QUALITY {'>'} QUANTITY
            </div>
          </div>
          
          {/* Navigation - exposed structure */}
          <nav style={{
            display: 'flex',
            flex: 1,
          }}>
            {(['matches', 'discover', 'criteria'] as const).map((section) => (
              <button
                onClick={() => setActiveSection(section)}
                style={{
                  flex: 1,
                  padding: '24px 32px',
                  background: activeSection() === section ? brutalist.colors.primary : 'transparent',
                  color: activeSection() === section ? brutalist.colors.background : brutalist.colors.text,
                  border: 'none',
                  'border-right': `3px solid ${brutalist.colors.primary}`,
                  'font-family': brutalist.fonts.heading,
                  'font-size': '14px',
                  'font-weight': '900',
                  'text-transform': 'uppercase',
                  'letter-spacing': '2px',
                  cursor: 'pointer',
                }}
              >
                {section}
              </button>
            ))}
          </nav>
          
          {/* Score display - raw number */}
          <div style={{
            padding: '16px 32px',
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'flex-end',
            'justify-content': 'center',
          }}>
            <div style={{
              'font-family': brutalist.fonts.heading,
              'font-size': brutalScale.h2,
              'font-weight': '900',
            }}>
              {sampleProfile.commitmentScore}
            </div>
            <div style={{
              'font-size': '10px',
              color: brutalist.colors.textMuted,
              'letter-spacing': '1px',
            }}>
              COMMITMENT_SCORE
            </div>
          </div>
        </div>
      </header>
      
      <main style={{ 'max-width': '1400px', margin: '0 auto', padding: '48px 32px' }}>
        {activeSection() === 'matches' && (
          <>
            {/* Section header - brutalist type scale */}
            <div style={{ 'margin-bottom': '48px' }}>
              <h2 style={{
                margin: '0 0 16px 0',
                'font-family': brutalist.fonts.heading,
                'font-size': brutalScale.display,
                'font-weight': '900',
                'line-height': '0.9',
                'letter-spacing': '-3px',
              }}>
                TODAY'S<br/>MATCHES
              </h2>
              <div style={{
                'font-family': brutalist.fonts.body,
                'font-size': '14px',
                color: brutalist.colors.textMuted,
              }}>
                // {sampleMatches.length} MATCHES AVAILABLE // EXPIRES IN 23:47:12
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              'grid-template-columns': 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: '32px',
            }}>
              <For each={sampleMatches}>
                {match => <MatchCard match={match} />}
              </For>
            </div>
            
            {/* Blind date CTA - stark contrast */}
            <div style={{
              'margin-top': '64px',
              padding: '48px',
              background: brutalist.colors.primary,
              color: brutalist.colors.background,
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'center',
            }}>
              <div>
                <h3 style={{
                  margin: '0 0 8px 0',
                  'font-family': brutalist.fonts.heading,
                  'font-size': brutalScale.h2,
                  'font-weight': '900',
                }}>
                  LOCK IN A BLIND DATE
                </h3>
                <p style={{
                  margin: 0,
                  'font-family': brutalist.fonts.body,
                  'font-size': '14px',
                  opacity: 0.8,
                }}>
                  +25 COMMITMENT POINTS // REAL CONNECTIONS REQUIRE REAL ACTION
                </p>
              </div>
              <button style={{
                padding: '20px 40px',
                background: brutalist.colors.background,
                color: brutalist.colors.primary,
                border: 'none',
                'font-family': brutalist.fonts.heading,
                'font-size': '16px',
                'font-weight': '900',
                'letter-spacing': '2px',
                cursor: 'pointer',
              }}>
                I'M IN
              </button>
            </div>
          </>
        )}
        
        {activeSection() === 'discover' && (
          <>
            <div style={{ 'margin-bottom': '48px' }}>
              <h2 style={{
                margin: '0 0 16px 0',
                'font-family': brutalist.fonts.heading,
                'font-size': brutalScale.display,
                'font-weight': '900',
                'line-height': '0.9',
                'letter-spacing': '-3px',
              }}>
                SELF<br/>DISCOVERY
              </h2>
              <div style={{
                'font-family': brutalist.fonts.body,
                'font-size': '14px',
                color: brutalist.colors.textMuted,
              }}>
                // KNOW YOURSELF BEFORE YOU SEEK ANOTHER
              </div>
            </div>
            
            <For each={sampleQuestions}>
              {(q, i) => <QuestionBlock question={q} index={i()} />}
            </For>
            
            <BrutalButton primary>SAVE + CONTINUE</BrutalButton>
          </>
        )}
        
        {activeSection() === 'criteria' && (
          <>
            <div style={{ 'margin-bottom': '48px' }}>
              <h2 style={{
                margin: '0 0 16px 0',
                'font-family': brutalist.fonts.heading,
                'font-size': brutalScale.display,
                'font-weight': '900',
                'line-height': '0.9',
                'letter-spacing': '-3px',
              }}>
                YOUR<br/>CRITERIA
              </h2>
              <div style={{
                'font-family': brutalist.fonts.body,
                'font-size': '14px',
                color: brutalist.colors.textMuted,
              }}>
                // DEFINE YOUR NON-NEGOTIABLES
              </div>
            </div>
            
            {/* Criteria form - exposed structure */}
            <div style={{
              background: brutalist.colors.surface,
              border: `3px solid ${brutalist.colors.primary}`,
              padding: '32px',
            }}>
              <div style={{ 'margin-bottom': '32px' }}>
                <label style={{
                  display: 'block',
                  'font-family': brutalist.fonts.body,
                  'font-size': '12px',
                  'margin-bottom': '8px',
                  color: brutalist.colors.textMuted,
                }}>
                  AGE_RANGE:
                </label>
                <div style={{ display: 'flex', gap: '16px', 'align-items': 'center' }}>
                  <input
                    type="number"
                    value="25"
                    style={{
                      width: '80px',
                      padding: '12px',
                      border: `2px solid ${brutalist.colors.border}`,
                      'font-family': brutalist.fonts.body,
                      'font-size': '16px',
                    }}
                  />
                  <span style={{ 'font-size': '20px', 'font-weight': '900' }}>-</span>
                  <input
                    type="number"
                    value="35"
                    style={{
                      width: '80px',
                      padding: '12px',
                      border: `2px solid ${brutalist.colors.border}`,
                      'font-family': brutalist.fonts.body,
                      'font-size': '16px',
                    }}
                  />
                </div>
              </div>
              
              <div style={{ 'margin-bottom': '32px' }}>
                <label style={{
                  display: 'block',
                  'font-family': brutalist.fonts.body,
                  'font-size': '12px',
                  'margin-bottom': '8px',
                  color: brutalist.colors.textMuted,
                }}>
                  DEAL_BREAKERS[]:
                </label>
                <textarea
                  placeholder="Enter each dealbreaker on a new line..."
                  style={{
                    width: '100%',
                    'min-height': '100px',
                    padding: '12px',
                    border: `2px solid ${brutalist.colors.border}`,
                    'font-family': brutalist.fonts.body,
                    'font-size': '14px',
                    resize: 'vertical',
                  }}
                />
              </div>
              
              <BrutalButton primary>UPDATE CRITERIA</BrutalButton>
            </div>
          </>
        )}
      </main>
      
      {/* Footer - visible technical info */}
      <footer style={{
        'border-top': `3px solid ${brutalist.colors.primary}`,
        padding: '16px 32px',
        'font-family': brutalist.fonts.body,
        'font-size': '11px',
        color: brutalist.colors.textMuted,
        display: 'flex',
        'justify-content': 'space-between',
      }}>
        <span>MANIFEST v0.1.0 // BUILD 2024.01.15</span>
        <span>USER: {sampleProfile.displayName} // SESSION: ACTIVE</span>
      </footer>
    </div>
  );
};
