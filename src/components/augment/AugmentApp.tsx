import { Component, For, createSignal } from 'solid-js';
import { Strength, JobMatch } from '../../schemas/augment.schema';
import { maximalist, maxPalette, maxGradients, maxPatterns } from '../../theme/maximalist';

const sampleStrengths: Strength[] = [
  { id: '1', name: 'Strategic Thinking', category: 'strategic-thinking', score: 92, description: 'Sees patterns others miss', relatedRoles: ['Product Manager', 'Consultant'] },
  { id: '2', name: 'Ideation', category: 'strategic-thinking', score: 88, description: 'Generates creative solutions', relatedRoles: ['Designer', 'Innovator'] },
  { id: '3', name: 'Achiever', category: 'executing', score: 85, description: 'Driven to accomplish goals', relatedRoles: ['Project Lead', 'Entrepreneur'] },
  { id: '4', name: 'Communication', category: 'influencing', score: 79, description: 'Articulates ideas clearly', relatedRoles: ['Sales', 'Marketing'] },
];

const sampleJobs: JobMatch[] = [
  { id: '1', userId: '1', jobId: 'j1', company: 'Innovate Labs', role: 'Senior Product Strategist', location: 'Remote', strengthFitScore: 94, cultureFitScore: 88, overallScore: 91, matchedStrengths: ['Strategic Thinking', 'Ideation'], matchedValues: ['innovation', 'autonomy'], status: 'discovered' },
  { id: '2', userId: '1', jobId: 'j2', company: 'GrowthCo', role: 'Innovation Lead', location: 'NYC', salary: { min: 150000, max: 180000, currency: 'USD' }, strengthFitScore: 87, cultureFitScore: 92, overallScore: 89, matchedStrengths: ['Achiever', 'Communication'], matchedValues: ['growth', 'collaboration'], status: 'interested' },
];

const StrengthCard: Component<{ strength: Strength; index: number }> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);
  const colors = [maxPalette.coral, maxPalette.teal, maxPalette.gold, maxPalette.mint];
  const accentColor = colors[props.index % colors.length];
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        background: maximalist.colors.surface,
        'border-radius': maximalist.radii.lg,
        padding: '24px',
        'box-shadow': maximalist.shadows.md,
        border: `2px solid ${maximalist.colors.border}`,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isHovered() ? 'scale(1.05) rotate(1deg)' : 'scale(1) rotate(0deg)',
      }}
    >
      {/* Decorative background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        'background-image': maxPatterns.dots,
        opacity: 0.4,
        'pointer-events': 'none',
      }} />
      
      {/* Accent blob */}
      <div style={{
        position: 'absolute',
        top: '-30px',
        right: '-30px',
        width: '100px',
        height: '100px',
        background: accentColor,
        'border-radius': maximalist.radii.organic,
        opacity: 0.3,
        transition: 'transform 0.5s ease',
        transform: isHovered() ? 'scale(1.4) rotate(20deg)' : 'scale(1) rotate(0deg)',
      }} />
      
      <div style={{ position: 'relative', 'z-index': 1 }}>
        {/* Score badge - maximalist style */}
        <div style={{
          display: 'inline-flex',
          'align-items': 'center',
          gap: '8px',
          padding: '8px 16px',
          background: `linear-gradient(135deg, ${accentColor}, ${maximalist.colors.secondary})`,
          'border-radius': '50px',
          'margin-bottom': '16px',
        }}>
          <span style={{
            'font-family': maximalist.fonts.heading,
            'font-size': '24px',
            'font-weight': '700',
            color: 'white',
          }}>
            {props.strength.score}
          </span>
          <span style={{
            'font-size': '12px',
            color: 'rgba(255,255,255,0.8)',
            'font-weight': '500',
          }}>
            / 100
          </span>
        </div>
        
        <h3 style={{
          margin: '0 0 8px 0',
          'font-family': maximalist.fonts.heading,
          'font-size': '24px',
          'font-weight': '700',
          color: maximalist.colors.text,
        }}>
          {props.strength.name}
        </h3>
        
        <p style={{
          margin: '0 0 16px 0',
          'font-family': maximalist.fonts.body,
          'font-size': '14px',
          color: maximalist.colors.textMuted,
          'line-height': '1.5',
        }}>
          {props.strength.description}
        </p>
        
        {/* Related roles - decorative chips */}
        <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '8px' }}>
          {props.strength.relatedRoles.map(role => (
            <span style={{
              padding: '6px 12px',
              background: `${accentColor}25`,
              'border-radius': '20px',
              'font-size': '12px',
              color: maximalist.colors.text,
              'font-weight': '500',
              border: `1px solid ${accentColor}40`,
            }}>
              {role}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const JobCard: Component<{ job: JobMatch }> = (props) => {
  return (
    <div style={{
      background: maximalist.colors.surface,
      'border-radius': maximalist.radii.lg,
      overflow: 'hidden',
      border: `2px solid ${maximalist.colors.border}`,
      'box-shadow': maximalist.shadows.md,
    }}>
      {/* Gradient header */}
      <div style={{
        background: maxGradients.primary,
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '20px',
          width: '80px',
          height: '80px',
          background: 'rgba(255,255,255,0.1)',
          'border-radius': '50%',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          right: '80px',
          width: '60px',
          height: '60px',
          background: 'rgba(255,255,255,0.08)',
          'border-radius': '50%',
        }} />
        
        <div style={{ position: 'relative', 'z-index': 1 }}>
          <div style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'flex-start',
          }}>
            <div>
              <h3 style={{
                margin: '0 0 4px 0',
                'font-family': maximalist.fonts.heading,
                'font-size': '22px',
                'font-weight': '700',
                color: 'white',
              }}>
                {props.job.role}
              </h3>
              <p style={{
                margin: 0,
                'font-size': '14px',
                color: 'rgba(255,255,255,0.85)',
              }}>
                {props.job.company} • {props.job.location}
              </p>
            </div>
            
            {/* Overall score - prominent display */}
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              'backdrop-filter': 'blur(10px)',
              'border-radius': '12px',
              padding: '12px 16px',
              'text-align': 'center',
            }}>
              <div style={{
                'font-family': maximalist.fonts.heading,
                'font-size': '32px',
                'font-weight': '700',
                color: 'white',
                'line-height': '1',
              }}>
                {props.job.overallScore}%
              </div>
              <div style={{
                'font-size': '10px',
                color: 'rgba(255,255,255,0.7)',
                'text-transform': 'uppercase',
                'letter-spacing': '1px',
              }}>
                Match
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ padding: '24px' }}>
        {/* Fit scores - dual bars */}
        <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '16px', 'margin-bottom': '20px' }}>
          <div>
            <div style={{
              display: 'flex',
              'justify-content': 'space-between',
              'margin-bottom': '6px',
              'font-size': '12px',
            }}>
              <span style={{ color: maximalist.colors.textMuted }}>Strength Fit</span>
              <span style={{ color: maxPalette.coral, 'font-weight': '600' }}>{props.job.strengthFitScore}%</span>
            </div>
            <div style={{
              height: '8px',
              background: `${maxPalette.coral}25`,
              'border-radius': '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${props.job.strengthFitScore}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${maxPalette.coral}, ${maxPalette.gold})`,
                'border-radius': '4px',
              }} />
            </div>
          </div>
          
          <div>
            <div style={{
              display: 'flex',
              'justify-content': 'space-between',
              'margin-bottom': '6px',
              'font-size': '12px',
            }}>
              <span style={{ color: maximalist.colors.textMuted }}>Culture Fit</span>
              <span style={{ color: maxPalette.teal, 'font-weight': '600' }}>{props.job.cultureFitScore}%</span>
            </div>
            <div style={{
              height: '8px',
              background: `${maxPalette.teal}25`,
              'border-radius': '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${props.job.cultureFitScore}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${maxPalette.teal}, ${maxPalette.mint})`,
                'border-radius': '4px',
              }} />
            </div>
          </div>
        </div>
        
        {/* Matched values - decorative pills */}
        <div style={{ display: 'flex', gap: '8px', 'flex-wrap': 'wrap', 'margin-bottom': '20px' }}>
          {props.job.matchedStrengths.map(strength => (
            <span style={{
              padding: '6px 14px',
              background: maxGradients.sunset,
              'border-radius': '20px',
              'font-size': '12px',
              color: 'white',
              'font-weight': '500',
            }}>
              {strength}
            </span>
          ))}
          {props.job.matchedValues.map(value => (
            <span style={{
              padding: '6px 14px',
              background: `${maximalist.colors.border}`,
              'border-radius': '20px',
              'font-size': '12px',
              color: maximalist.colors.text,
              'font-weight': '500',
            }}>
              {value}
            </span>
          ))}
        </div>
        
        {/* Salary if available */}
        {props.job.salary && (
          <div style={{
            padding: '12px 16px',
            background: `${maximalist.colors.accent}15`,
            'border-radius': maximalist.radii.sm,
            'margin-bottom': '20px',
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={maximalist.colors.accent}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
            </svg>
            <span style={{ 'font-family': maximalist.fonts.body, 'font-size': '14px', color: maximalist.colors.text }}>
              ${(props.job.salary.min / 1000).toFixed(0)}k - ${(props.job.salary.max / 1000).toFixed(0)}k
            </span>
          </div>
        )}
        
        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            flex: 1,
            padding: '14px 20px',
            background: maxGradients.primary,
            border: 'none',
            'border-radius': maximalist.radii.md,
            color: 'white',
            'font-size': '14px',
            'font-weight': '600',
            cursor: 'pointer',
            'box-shadow': maximalist.shadows.sm,
          }}>
            View Details
          </button>
          <button style={{
            padding: '14px 20px',
            background: 'transparent',
            border: `2px solid ${maximalist.colors.border}`,
            'border-radius': maximalist.radii.md,
            color: maximalist.colors.text,
            'font-size': '14px',
            'font-weight': '600',
            cursor: 'pointer',
          }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export const AugmentApp: Component = () => {
  const [activeTab, setActiveTab] = createSignal<'strengths' | 'matches' | 'assess'>('strengths');
  
  return (
    <div style={{
      'min-height': '100vh',
      background: maximalist.colors.background,
      'font-family': maximalist.fonts.body,
      color: maximalist.colors.text,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        'pointer-events': 'none',
        'background-image': maxPatterns.zigzag,
        opacity: 0.5,
      }} />
      
      {/* Gradient orbs */}
      <div style={{
        position: 'fixed',
        top: '-200px',
        right: '-100px',
        width: '500px',
        height: '500px',
        background: `radial-gradient(circle, ${maximalist.colors.primary}40, transparent 70%)`,
        'border-radius': '50%',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-150px',
        left: '-50px',
        width: '400px',
        height: '400px',
        background: `radial-gradient(circle, ${maximalist.colors.secondary}30, transparent 70%)`,
        'border-radius': '50%',
        filter: 'blur(60px)',
      }} />
      
      <div style={{ position: 'relative', 'z-index': 1 }}>
        {/* Header */}
        <header style={{
          padding: '24px 32px',
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
        }}>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '16px' }}>
            {/* Logo with gradient */}
            <div style={{
              width: '56px',
              height: '56px',
              'border-radius': '16px',
              background: maxGradients.primary,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'box-shadow': maximalist.shadows.md,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h1 style={{
                margin: 0,
                'font-family': maximalist.fonts.heading,
                'font-size': '32px',
                'font-weight': '700',
                background: maxGradients.primary,
                '-webkit-background-clip': 'text',
                '-webkit-text-fill-color': 'transparent',
                'background-clip': 'text',
              }}>
                Augment
              </h1>
              <p style={{
                margin: 0,
                'font-size': '14px',
                color: maximalist.colors.textMuted,
              }}>
                Amplify Your Strengths
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', 'align-items': 'center', gap: '16px' }}>
            <div style={{
              padding: '10px 20px',
              background: `${maximalist.colors.accent}20`,
              'border-radius': '50px',
              'font-size': '14px',
              color: maximalist.colors.accent,
              'font-weight': '600',
            }}>
              4 New Matches
            </div>
            
            <button style={{
              width: '48px',
              height: '48px',
              'border-radius': '50%',
              background: maxGradients.sunset,
              border: 'none',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              cursor: 'pointer',
              'box-shadow': maximalist.shadows.sm,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </button>
          </div>
        </header>
        
        {/* Tab navigation - maximalist pills */}
        <nav style={{
          padding: '0 32px 32px',
        }}>
          <div style={{
            display: 'inline-flex',
            padding: '8px',
            background: maximalist.colors.surface,
            'border-radius': maximalist.radii.lg,
            'box-shadow': maximalist.shadows.sm,
            border: `1px solid ${maximalist.colors.border}`,
          }}>
            {(['strengths', 'matches', 'assess'] as const).map(tab => (
              <button
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '14px 28px',
                  background: activeTab() === tab ? maxGradients.primary : 'transparent',
                  border: 'none',
                  'border-radius': maximalist.radii.md,
                  color: activeTab() === tab ? 'white' : maximalist.colors.textMuted,
                  'font-size': '14px',
                  'font-weight': '600',
                  cursor: 'pointer',
                  'text-transform': 'capitalize',
                  transition: 'all 0.3s ease',
                }}
              >
                {tab === 'assess' ? 'Take Assessment' : tab}
              </button>
            ))}
          </div>
        </nav>
        
        {/* Main content */}
        <main style={{ padding: '0 32px 48px', 'max-width': '1400px', margin: '0 auto' }}>
          {activeTab() === 'strengths' && (
            <>
              <div style={{ 'margin-bottom': '32px' }}>
                <h2 style={{
                  margin: '0 0 8px 0',
                  'font-family': maximalist.fonts.heading,
                  'font-size': '36px',
                  'font-weight': '700',
                }}>
                  Your Top Strengths
                </h2>
                <p style={{
                  margin: 0,
                  'font-size': '16px',
                  color: maximalist.colors.textMuted,
                }}>
                  Based on your IO Psychology assessment results
                </p>
              </div>
              
              <div style={{
                display: 'grid',
                'grid-template-columns': 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px',
              }}>
                <For each={sampleStrengths}>
                  {(strength, i) => <StrengthCard strength={strength} index={i()} />}
                </For>
              </div>
            </>
          )}
          
          {activeTab() === 'matches' && (
            <>
              <div style={{ 'margin-bottom': '32px' }}>
                <h2 style={{
                  margin: '0 0 8px 0',
                  'font-family': maximalist.fonts.heading,
                  'font-size': '36px',
                  'font-weight': '700',
                }}>
                  Matched Opportunities
                </h2>
                <p style={{
                  margin: 0,
                  'font-size': '16px',
                  color: maximalist.colors.textMuted,
                }}>
                  Jobs that amplify your natural strengths and align with your values
                </p>
              </div>
              
              <div style={{
                display: 'grid',
                'grid-template-columns': 'repeat(auto-fill, minmax(400px, 1fr))',
                gap: '24px',
              }}>
                <For each={sampleJobs}>
                  {job => <JobCard job={job} />}
                </For>
              </div>
            </>
          )}
          
          {activeTab() === 'assess' && (
            <div style={{
              'max-width': '700px',
              margin: '0 auto',
              'text-align': 'center',
              'padding-top': '48px',
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                'border-radius': '50%',
                background: maxGradients.aurora,
                margin: '0 auto 32px',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'box-shadow': maximalist.shadows.lg,
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
                </svg>
              </div>
              
              <h2 style={{
                margin: '0 0 16px 0',
                'font-family': maximalist.fonts.heading,
                'font-size': '32px',
                'font-weight': '700',
              }}>
                Discover Your Strengths
              </h2>
              
              <p style={{
                margin: '0 0 32px 0',
                'font-size': '16px',
                color: maximalist.colors.textMuted,
                'line-height': '1.6',
              }}>
                Take our comprehensive IO Psychology assessment to uncover your unique strengths profile. 
                The assessment takes approximately 20 minutes and provides personalized insights.
              </p>
              
              <button style={{
                padding: '18px 48px',
                background: maxGradients.primary,
                border: 'none',
                'border-radius': maximalist.radii.md,
                color: 'white',
                'font-size': '16px',
                'font-weight': '700',
                cursor: 'pointer',
                'box-shadow': maximalist.shadows.md,
                display: 'inline-flex',
                'align-items': 'center',
                gap: '12px',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Start Assessment
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
