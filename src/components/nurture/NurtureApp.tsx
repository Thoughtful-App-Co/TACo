import { Component, For, createSignal } from 'solid-js';
import { Contact } from '../../schemas/nurture.schema';
import { biophilic } from '../../theme/biophilic';

// Sample data
const sampleContacts: Contact[] = [
  { id: '1', name: 'Sarah Chen', relationship: 'friend', lastContact: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), nurtureCycle: 7, growthStage: 'flourishing', notes: 'Coffee dates' },
  { id: '2', name: 'Mom', relationship: 'family', lastContact: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), nurtureCycle: 5, growthStage: 'needs-water', notes: 'Sunday calls' },
  { id: '3', name: 'Alex Rivera', relationship: 'colleague', lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), nurtureCycle: 14, growthStage: 'growing' },
  { id: '4', name: 'Jamie Park', relationship: 'friend', lastContact: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), nurtureCycle: 21, growthStage: 'seedling' },
];

const GrowthIcon: Component<{ stage: Contact['growthStage'] }> = (props) => {
  const icons = {
    'seedling': (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 28V18" stroke={biophilic.colors.primary} stroke-width="2" stroke-linecap="round"/>
        <path d="M16 18C16 14 12 12 8 14C12 10 16 12 16 18Z" fill={biophilic.colors.accent}/>
        <circle cx="16" cy="28" r="2" fill={biophilic.colors.secondary}/>
      </svg>
    ),
    'growing': (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 28V14" stroke={biophilic.colors.primary} stroke-width="2" stroke-linecap="round"/>
        <path d="M16 14C16 10 20 8 24 10C20 6 16 8 16 14Z" fill={biophilic.colors.secondary}/>
        <path d="M16 20C16 16 12 14 8 16C12 12 16 14 16 20Z" fill={biophilic.colors.accent}/>
      </svg>
    ),
    'flourishing': (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 28V10" stroke={biophilic.colors.primary} stroke-width="2" stroke-linecap="round"/>
        <circle cx="16" cy="8" r="6" fill={biophilic.colors.primary} opacity="0.2"/>
        <circle cx="16" cy="8" r="4" fill={biophilic.colors.secondary}/>
        <path d="M12 12C8 12 6 16 8 20" stroke={biophilic.colors.accent} stroke-width="2" stroke-linecap="round"/>
        <path d="M20 12C24 12 26 16 24 20" stroke={biophilic.colors.accent} stroke-width="2" stroke-linecap="round"/>
      </svg>
    ),
    'needs-water': (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 28V16" stroke={biophilic.colors.textMuted} stroke-width="2" stroke-linecap="round"/>
        <path d="M14 16C10 14 8 10 12 8" stroke={biophilic.colors.textMuted} stroke-width="2" stroke-linecap="round" opacity="0.5"/>
        <ellipse cx="20" cy="24" rx="4" ry="2" fill="#7EB8E2" opacity="0.6"/>
      </svg>
    ),
  };
  return icons[props.stage];
};

const ContactCard: Component<{ contact: Contact }> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);
  const daysSince = Math.floor((Date.now() - props.contact.lastContact.getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: biophilic.colors.surface,
        'border-radius': '24px',
        padding: '24px',
        'box-shadow': isHovered() ? biophilic.shadows.md : biophilic.shadows.sm,
        border: `1px solid ${biophilic.colors.border}`,
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isHovered() ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Organic background blob */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        background: `linear-gradient(135deg, ${biophilic.colors.accent}20, ${biophilic.colors.secondary}10)`,
        'border-radius': biophilic.radii.organic,
        transform: isHovered() ? 'scale(1.2) rotate(10deg)' : 'scale(1) rotate(0deg)',
        transition: 'transform 0.6s ease-out',
      }} />
      
      <div style={{ display: 'flex', 'align-items': 'flex-start', gap: '16px', position: 'relative', 'z-index': 1 }}>
        <div style={{
          width: '56px',
          height: '56px',
          'border-radius': '50%',
          background: `linear-gradient(135deg, ${biophilic.colors.primary}, ${biophilic.colors.secondary})`,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          color: 'white',
          'font-weight': '600',
          'font-size': '18px',
          'flex-shrink': 0,
        }}>
          {props.contact.name.charAt(0)}
        </div>
        
        <div style={{ flex: 1, 'min-width': 0 }}>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '12px', 'margin-bottom': '4px' }}>
            <h3 style={{
              margin: 0,
              'font-size': '18px',
              'font-weight': '600',
              color: biophilic.colors.text,
            }}>{props.contact.name}</h3>
            <GrowthIcon stage={props.contact.growthStage} />
          </div>
          
          <p style={{
            margin: '0 0 12px 0',
            'font-size': '14px',
            color: biophilic.colors.textMuted,
            'text-transform': 'capitalize',
          }}>{props.contact.relationship}</p>
          
          <div style={{
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
            'font-size': '13px',
            color: props.contact.growthStage === 'needs-water' ? '#C77A4E' : biophilic.colors.textMuted,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13zm.5-10h-1v4.5l3.5 2.1.5-.8-3-1.8V4.5z"/>
            </svg>
            {daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince} days ago`}
          </div>
        </div>
      </div>
      
      {/* Action button - Fitt's Law: large touch target */}
      <button style={{
        'margin-top': '16px',
        width: '100%',
        padding: '14px 20px',
        background: props.contact.growthStage === 'needs-water' 
          ? `linear-gradient(135deg, ${biophilic.colors.primary}, ${biophilic.colors.secondary})`
          : biophilic.colors.background,
        color: props.contact.growthStage === 'needs-water' ? 'white' : biophilic.colors.primary,
        border: props.contact.growthStage === 'needs-water' ? 'none' : `2px solid ${biophilic.colors.border}`,
        'border-radius': '16px',
        'font-size': '15px',
        'font-weight': '500',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}>
        {props.contact.growthStage === 'needs-water' ? 'Reach Out Now' : 'Log Interaction'}
      </button>
    </div>
  );
};

export const NurtureApp: Component = () => {
  return (
    <div style={{
      'min-height': '100vh',
      background: biophilic.colors.background,
      'font-family': biophilic.fonts.body,
      padding: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative organic shapes */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 'pointer-events': 'none', opacity: 0.4 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ 'stop-color': biophilic.colors.accent, 'stop-opacity': 0.2 }} />
            <stop offset="100%" style={{ 'stop-color': biophilic.colors.secondary, 'stop-opacity': 0.05 }} />
          </linearGradient>
        </defs>
        <path d="M-50,100 Q200,50 400,150 T800,100 T1200,200" stroke="url(#leafGrad)" stroke-width="200" fill="none" />
        <ellipse cx="90%" cy="20%" rx="150" ry="100" fill={biophilic.colors.accent} opacity="0.08" />
      </svg>
      
      <div style={{ 'max-width': '1200px', margin: '0 auto', position: 'relative', 'z-index': 1 }}>
        {/* Header */}
        <header style={{ 'margin-bottom': '48px' }}>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '16px', 'margin-bottom': '8px' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" fill={biophilic.colors.primary} opacity="0.1"/>
              <path d="M24 40V20" stroke={biophilic.colors.primary} stroke-width="3" stroke-linecap="round"/>
              <path d="M24 20C24 12 32 8 40 12C32 4 24 8 24 20Z" fill={biophilic.colors.secondary}/>
              <path d="M24 28C24 20 16 16 8 20C16 12 24 16 24 28Z" fill={biophilic.colors.accent}/>
              <path d="M24 36C24 30 18 28 14 30" stroke={biophilic.colors.primary} stroke-width="2" stroke-linecap="round"/>
            </svg>
            <h1 style={{
              margin: 0,
              'font-size': '36px',
              'font-weight': '600',
              color: biophilic.colors.text,
              'letter-spacing': '-0.5px',
            }}>Nurture</h1>
          </div>
          <p style={{
            margin: 0,
            'font-size': '18px',
            color: biophilic.colors.textMuted,
            'max-width': '500px',
            'line-height': '1.6',
          }}>Grow meaningful connections. Water your relationships.</p>
          
          {/* Status Banner */}
          <div style={{
            'margin-top': '20px',
            padding: '12px 20px',
            background: `linear-gradient(135deg, ${biophilic.colors.primary}15, ${biophilic.colors.secondary}15)`,
            border: `1px solid ${biophilic.colors.primary}30`,
            'border-radius': '12px',
            display: 'inline-flex',
            'align-items': 'center',
            gap: '10px',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              'border-radius': '50%',
              background: biophilic.colors.secondary,
              animation: 'pulse 2s infinite',
            }} />
            <span style={{
              'font-size': '14px',
              color: biophilic.colors.text,
              'font-weight': '500',
            }}>
              Mobile-first alpha coming Q1 2026
            </span>
          </div>
        </header>
        
        {/* Stats row */}
        <div style={{
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          'margin-bottom': '40px',
        }}>
          {[
            { label: 'Flourishing', value: '1', color: biophilic.colors.primary },
            { label: 'Growing', value: '1', color: biophilic.colors.secondary },
            { label: 'Needs Attention', value: '1', color: '#C77A4E' },
            { label: 'New Seedlings', value: '1', color: biophilic.colors.accent },
          ].map(stat => (
            <div style={{
              background: `linear-gradient(135deg, ${stat.color}08, ${stat.color}15)`,
              'border-radius': '20px',
              padding: '20px 24px',
              border: `1px solid ${stat.color}20`,
            }}>
              <div style={{ 'font-size': '32px', 'font-weight': '700', color: stat.color, 'margin-bottom': '4px' }}>
                {stat.value}
              </div>
              <div style={{ 'font-size': '14px', color: biophilic.colors.textMuted }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        
        {/* Contact grid */}
        <h2 style={{
          'font-size': '20px',
          'font-weight': '600',
          color: biophilic.colors.text,
          'margin-bottom': '20px',
        }}>Your Garden</h2>
        
        <div style={{
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          <For each={sampleContacts}>
            {contact => <ContactCard contact={contact} />}
          </For>
        </div>
        
        {/* FAB - Large touch target for Fitt's law */}
        <button style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: '64px',
          height: '64px',
          'border-radius': '50%',
          background: `linear-gradient(135deg, ${biophilic.colors.primary}, ${biophilic.colors.secondary})`,
          border: 'none',
          'box-shadow': biophilic.shadows.lg,
          cursor: 'pointer',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="white">
            <path d="M14 4v20M4 14h20" stroke="white" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};
