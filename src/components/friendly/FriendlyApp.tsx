import { Component, For, createSignal } from 'solid-js';
import { Friend, Event } from '../../schemas/friendly.schema';
import { liquid, liquidAnimations, liquidGradients } from '../../theme/liquid';

const sampleFriends: Friend[] = [
  { id: '1', name: 'Maya Rodriguez', location: { city: 'Austin, TX', timezone: 'CST' }, connectionStrength: 85, checkInFrequency: 7, interests: ['hiking', 'photography'] },
  { id: '2', name: 'James Chen', location: { city: 'Seattle, WA', timezone: 'PST' }, connectionStrength: 92, checkInFrequency: 14, interests: ['gaming', 'cooking'] },
  { id: '3', name: 'Sophie Williams', location: { city: 'London, UK', timezone: 'GMT' }, connectionStrength: 65, checkInFrequency: 30, interests: ['reading', 'travel'] },
  { id: '4', name: 'Alex Thompson', location: { city: 'Denver, CO', timezone: 'MST' }, connectionStrength: 78, checkInFrequency: 21, interests: ['music', 'skiing'] },
];

const sampleEvents: Event[] = [
  { id: '1', title: 'Game Night', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), attendees: ['1', '2'], status: 'confirmed', location: "James's place" },
  { id: '2', title: 'Virtual Coffee', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), attendees: ['3'], status: 'planning' },
];

const ConnectionRing: Component<{ strength: number; size?: number }> = (props) => {
  const size = props.size || 64;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (props.strength / 100) * circumference;
  
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={liquid.colors.border}
        stroke-width={strokeWidth}
      />
      {/* Progress ring with gradient */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={liquid.colors.primary}
        stroke-width={strokeWidth}
        stroke-linecap="round"
        stroke-dasharray={String(circumference)}
        stroke-dashoffset={String(offset)}
        style={{ transition: `stroke-dashoffset 0.8s ${liquidAnimations.flow}` }}
      />
    </svg>
  );
};

const FriendCard: Component<{ friend: Friend }> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        background: liquid.colors.surface,
        'border-radius': liquid.radii.lg,
        padding: '24px',
        'box-shadow': isHovered() ? liquid.shadows.md : liquid.shadows.sm,
        border: `1px solid ${liquid.colors.border}`,
        cursor: 'pointer',
        transition: `all 0.4s ${liquidAnimations.bounce}`,
        transform: isHovered() ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
        overflow: 'hidden',
      }}
    >
      {/* Fluid background shape */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '120px',
        height: '120px',
        background: liquidGradients.primary,
        'border-radius': liquid.radii.organic,
        opacity: isHovered() ? 0.15 : 0.08,
        transition: `all 0.6s ${liquidAnimations.morph}`,
        transform: isHovered() ? 'scale(1.3) rotate(15deg)' : 'scale(1) rotate(0deg)',
      }} />
      
      <div style={{ display: 'flex', 'align-items': 'center', gap: '16px', position: 'relative', 'z-index': 1 }}>
        {/* Avatar with connection ring */}
        <div style={{ position: 'relative' }}>
          <ConnectionRing strength={props.friend.connectionStrength} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '48px',
            height: '48px',
            'border-radius': '50%',
            background: liquidGradients.primary,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            color: 'white',
            'font-weight': '600',
            'font-size': '18px',
          }}>
            {props.friend.name.charAt(0)}
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: '0 0 4px 0',
            'font-size': '18px',
            'font-weight': '600',
            color: liquid.colors.text,
          }}>
            {props.friend.name}
          </h3>
          
          <div style={{
            display: 'flex',
            'align-items': 'center',
            gap: '6px',
            'font-size': '14px',
            color: liquid.colors.textMuted,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {props.friend.location?.city}
          </div>
        </div>
      </div>
      
      {/* Interest tags */}
      <div style={{
        display: 'flex',
        gap: '8px',
        'margin-top': '16px',
        'flex-wrap': 'wrap',
      }}>
        {props.friend.interests?.map(interest => (
          <span style={{
            padding: '6px 12px',
            background: `${liquid.colors.primary}12`,
            'border-radius': liquid.radii.sm,
            'font-size': '12px',
            color: liquid.colors.primary,
            'font-weight': '500',
          }}>
            {interest}
          </span>
        ))}
      </div>
      
      {/* Action button - flows into view on hover */}
      <button style={{
        'margin-top': '16px',
        width: '100%',
        padding: '14px',
        background: isHovered() ? liquidGradients.primary : liquid.colors.background,
        border: isHovered() ? 'none' : `2px solid ${liquid.colors.border}`,
        'border-radius': liquid.radii.md,
        color: isHovered() ? 'white' : liquid.colors.primary,
        'font-size': '14px',
        'font-weight': '500',
        cursor: 'pointer',
        transition: `all 0.3s ${liquidAnimations.flow}`,
      }}>
        {props.friend.connectionStrength < 70 ? 'Reconnect' : 'Send Message'}
      </button>
    </div>
  );
};

const EventCard: Component<{ event: Event }> = (props) => {
  
  return (
    <div style={{
      display: 'flex',
      'align-items': 'center',
      gap: '16px',
      padding: '16px 20px',
      background: liquid.colors.surface,
      'border-radius': liquid.radii.md,
      border: `1px solid ${liquid.colors.border}`,
    }}>
      {/* Date bubble */}
      <div style={{
        width: '56px',
        height: '56px',
        'border-radius': liquid.radii.sm,
        background: liquidGradients.accent,
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
        color: 'white',
        'flex-shrink': 0,
      }}>
        <span style={{ 'font-size': '11px', 'font-weight': '500', opacity: 0.9 }}>
          {props.event.date.toLocaleDateString('en-US', { weekday: 'short' })}
        </span>
        <span style={{ 'font-size': '20px', 'font-weight': '700' }}>
          {props.event.date.getDate()}
        </span>
      </div>
      
      <div style={{ flex: 1 }}>
        <h4 style={{
          margin: '0 0 4px 0',
          'font-size': '16px',
          'font-weight': '600',
          color: liquid.colors.text,
        }}>
          {props.event.title}
        </h4>
        <div style={{ 'font-size': '13px', color: liquid.colors.textMuted }}>
          {props.event.location || 'Virtual'}
        </div>
      </div>
      
      <div style={{
        padding: '6px 12px',
        background: props.event.status === 'confirmed' 
          ? `${liquid.colors.primary}15` 
          : `${liquid.colors.accent}15`,
        'border-radius': liquid.radii.sm,
        'font-size': '12px',
        'font-weight': '500',
        color: props.event.status === 'confirmed' ? liquid.colors.primary : liquid.colors.accent,
        'text-transform': 'capitalize',
      }}>
        {props.event.status}
      </div>
    </div>
  );
};

export const FriendlyApp: Component = () => {
  const [activeTab, setActiveTab] = createSignal<'friends' | 'events'>('friends');
  
  return (
    <div style={{
      'min-height': '100vh',
      background: liquid.colors.background,
      'font-family': liquid.fonts.body,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Fluid background shapes */}
      <svg style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        'pointer-events': 'none',
      }}>
        <defs>
          <linearGradient id="fluidGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ 'stop-color': liquid.colors.primary, 'stop-opacity': 0.08 }} />
            <stop offset="100%" style={{ 'stop-color': liquid.colors.secondary, 'stop-opacity': 0.04 }} />
          </linearGradient>
          <linearGradient id="fluidGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ 'stop-color': liquid.colors.accent, 'stop-opacity': 0.06 }} />
            <stop offset="100%" style={{ 'stop-color': liquid.colors.primary, 'stop-opacity': 0.03 }} />
          </linearGradient>
        </defs>
        <ellipse cx="10%" cy="20%" rx="300" ry="200" fill="url(#fluidGrad1)" />
        <ellipse cx="90%" cy="70%" rx="250" ry="180" fill="url(#fluidGrad2)" />
      </svg>
      
      <div style={{ 'max-width': '1200px', margin: '0 auto', padding: '32px', position: 'relative', 'z-index': 1 }}>
        {/* Header */}
        <header style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          'margin-bottom': '40px',
        }}>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              'border-radius': '50%',
              background: liquidGradients.primary,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div>
              <h1 style={{
                margin: 0,
                'font-size': '28px',
                'font-weight': '700',
                color: liquid.colors.text,
                'letter-spacing': '-0.5px',
              }}>
                FriendLy
              </h1>
              <p style={{
                margin: 0,
                'font-size': '14px',
                color: liquid.colors.textMuted,
              }}>
                Nurture your connections
              </p>
            </div>
          </div>
          
          <button style={{
            padding: '12px 24px',
            background: liquidGradients.primary,
            border: 'none',
            'border-radius': liquid.radii.md,
            color: 'white',
            'font-size': '14px',
            'font-weight': '600',
            cursor: 'pointer',
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
            'box-shadow': liquid.shadows.sm,
            transition: `all 0.3s ${liquidAnimations.bounce}`,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Friend
          </button>
        </header>
        
        {/* Tab navigation - fluid pills */}
        <nav style={{
          display: 'inline-flex',
          padding: '6px',
          background: liquid.colors.surface,
          'border-radius': liquid.radii.lg,
          'box-shadow': liquid.shadows.sm,
          'margin-bottom': '32px',
        }}>
          {(['friends', 'events'] as const).map(tab => (
            <button
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 32px',
                background: activeTab() === tab ? liquidGradients.primary : 'transparent',
                border: 'none',
                'border-radius': liquid.radii.md,
                color: activeTab() === tab ? 'white' : liquid.colors.textMuted,
                'font-size': '14px',
                'font-weight': '600',
                cursor: 'pointer',
                'text-transform': 'capitalize',
                transition: `all 0.3s ${liquidAnimations.flow}`,
              }}
            >
              {tab}
            </button>
          ))}
        </nav>
        
        {/* Content */}
        {activeTab() === 'friends' ? (
          <>
            {/* Connection summary */}
            <div style={{
              display: 'grid',
              'grid-template-columns': 'repeat(3, 1fr)',
              gap: '16px',
              'margin-bottom': '32px',
            }}>
              {[
                { label: 'Strong Connections', value: 2, color: liquid.colors.primary },
                { label: 'Need Attention', value: 1, color: liquid.colors.accent },
                { label: 'Upcoming Events', value: 2, color: liquid.colors.secondary },
              ].map(stat => (
                <div style={{
                  padding: '20px 24px',
                  background: liquid.colors.surface,
                  'border-radius': liquid.radii.md,
                  border: `1px solid ${liquid.colors.border}`,
                  display: 'flex',
                  'align-items': 'center',
                  gap: '16px',
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    'border-radius': '50%',
                    background: `${stat.color}15`,
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'font-size': '20px',
                    'font-weight': '700',
                    color: stat.color,
                  }}>
                    {stat.value}
                  </div>
                  <span style={{ 'font-size': '14px', color: liquid.colors.textMuted }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Friend grid */}
            <div style={{
              display: 'grid',
              'grid-template-columns': 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}>
              <For each={sampleFriends}>
                {friend => <FriendCard friend={friend} />}
              </For>
            </div>
          </>
        ) : (
          <>
            <h2 style={{
              margin: '0 0 20px 0',
              'font-size': '20px',
              'font-weight': '600',
              color: liquid.colors.text,
            }}>
              Upcoming Events
            </h2>
            
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
              <For each={sampleEvents}>
                {event => <EventCard event={event} />}
              </For>
            </div>
            
            {/* Create event CTA */}
            <button style={{
              'margin-top': '24px',
              width: '100%',
              padding: '20px',
              background: 'transparent',
              border: `2px dashed ${liquid.colors.border}`,
              'border-radius': liquid.radii.md,
              color: liquid.colors.textMuted,
              'font-size': '14px',
              'font-weight': '500',
              cursor: 'pointer',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              gap: '8px',
              transition: `all 0.3s ${liquidAnimations.flow}`,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              Plan a New Event
            </button>
          </>
        )}
      </div>
    </div>
  );
};
