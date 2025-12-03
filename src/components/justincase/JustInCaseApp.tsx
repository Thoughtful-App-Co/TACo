/**
 * JustInCase - Legal Case Management App
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying, modification,
 * or distribution of this code is strictly prohibited. The frontend logic is local-first
 * and protected intellectual property. No infringement or unauthorized use is permitted.
 */

import { Component, For, createSignal } from 'solid-js';
import { Case, Evidence } from '../../schemas/case.schema';
import { daylight, highlights } from '../../theme/daylight';

const sampleCase: Case = {
  id: '1',
  title: 'Landlord Security Deposit Dispute',
  status: 'active',
  claimAmount: 2400,
  defendant: 'Oakwood Properties LLC',
  description:
    'Wrongful withholding of security deposit after move-out on September 15, 2024. Property was left in good condition with documented evidence.',
  filingDate: new Date('2024-10-01'),
  courtDate: new Date('2024-12-15'),
};

const sampleEvidence: Evidence[] = [
  {
    id: '1',
    caseId: '1',
    type: 'photo',
    title: 'Move-out Photos',
    description: 'Dated photographs showing property condition',
    dateAdded: new Date(),
    highlighted: true,
  },
  {
    id: '2',
    caseId: '1',
    type: 'document',
    title: 'Original Lease Agreement',
    description: 'Section 8.2 details deposit return terms',
    dateAdded: new Date(),
    highlighted: false,
  },
  {
    id: '3',
    caseId: '1',
    type: 'correspondence',
    title: 'Email Communications',
    description: 'All email exchanges with landlord',
    dateAdded: new Date(),
    highlighted: true,
  },
  {
    id: '4',
    caseId: '1',
    type: 'receipt',
    title: 'Cleaning Service Receipt',
    description: 'Professional cleaning receipt dated Sept 14',
    dateAdded: new Date(),
    highlighted: false,
  },
];

const StatusBadge: Component<{ status: Case['status'] }> = (props) => {
  const colors: Record<Case['status'], string> = {
    draft: '#8B8B8B',
    active: '#2563EB',
    filed: '#7C3AED',
    resolved: '#059669',
    closed: '#6B7280',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        'align-items': 'center',
        gap: '6px',
        padding: '4px 12px',
        background: `${colors[props.status]}12`,
        'border-radius': '4px',
        'font-family': daylight.fonts.heading,
        'font-size': '12px',
        'font-weight': '500',
        color: colors[props.status],
        'text-transform': 'uppercase',
        'letter-spacing': '0.5px',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          'border-radius': '50%',
          background: colors[props.status],
        }}
      />
      {props.status}
    </span>
  );
};

const HighlightedText: Component<{ children: any; color?: keyof typeof highlights }> = (props) => {
  const bgColor = props.color ? highlights[props.color] : highlights.yellow;
  return (
    <span
      style={{
        background: `linear-gradient(180deg, transparent 50%, ${bgColor} 50%)`,
        padding: '0 2px',
        'border-radius': '2px',
      }}
    >
      {props.children}
    </span>
  );
};

const EvidenceItem: Component<{ evidence: Evidence }> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);

  const typeIcons: Record<Evidence['type'], string> = {
    document: 'M9 2H15L21 8V20C21 21.1 20.1 22 19 22H9C7.9 22 7 21.1 7 20V4C7 2.9 7.9 2 9 2Z',
    photo:
      'M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z',
    receipt:
      'M19.5 3.5L18 2L16.5 3.5L15 2L13.5 3.5L12 2L10.5 3.5L9 2L7.5 3.5L6 2V22L7.5 20.5L9 22L10.5 20.5L12 22L13.5 20.5L15 22L16.5 20.5L18 22L19.5 20.5L21 22V2L19.5 3.5ZM18 19H9V17H18V19ZM18 15H9V13H18V15ZM18 11H9V9H18V11Z',
    correspondence:
      'M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z',
    witness:
      'M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z',
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        'align-items': 'flex-start',
        gap: '16px',
        padding: '16px 20px',
        background: isHovered() ? daylight.colors.background : daylight.colors.surface,
        'border-bottom': `1px solid ${daylight.colors.border}`,
        cursor: 'pointer',
        transition: 'background 0.2s ease',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          'border-radius': daylight.radii.md,
          background: props.evidence.highlighted ? highlights.yellow : daylight.colors.background,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'flex-shrink': 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={daylight.colors.secondary}>
          <path d={typeIcons[props.evidence.type]} />
        </svg>
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            'font-family': daylight.fonts.heading,
            'font-size': '15px',
            'font-weight': '500',
            color: daylight.colors.text,
            'margin-bottom': '4px',
          }}
        >
          {props.evidence.title}
          {props.evidence.highlighted && (
            <span style={{ 'margin-left': '8px', color: daylight.colors.accent }}>*</span>
          )}
        </div>
        <div
          style={{
            'font-family': daylight.fonts.body,
            'font-size': '14px',
            color: daylight.colors.textMuted,
            'line-height': '1.5',
          }}
        >
          {props.evidence.description}
        </div>
      </div>

      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={daylight.colors.textMuted}
        style={{ 'flex-shrink': 0, opacity: isHovered() ? 1 : 0.3, transition: 'opacity 0.2s' }}
      >
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
      </svg>
    </div>
  );
};

export const JustInCaseApp: Component = () => {
  const [activeSection, setActiveSection] = createSignal<'overview' | 'evidence' | 'timeline'>(
    'overview'
  );

  return (
    <div
      style={{
        'min-height': '100vh',
        background: daylight.colors.background,
        'font-family': daylight.fonts.body,
      }}
    >
      {/* Paper texture overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          'pointer-events': 'none',
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.015,
        }}
      />

      <div
        style={{
          'max-width': '900px',
          margin: '0 auto',
          padding: '40px 32px',
          position: 'relative',
        }}
      >
        {/* Header */}
        <header style={{ 'margin-bottom': '40px' }}>
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '12px',
              'margin-bottom': '24px',
            }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect
                x="6"
                y="4"
                width="24"
                height="28"
                rx="2"
                stroke={daylight.colors.primary}
                stroke-width="2"
                fill="none"
              />
              <path
                d="M11 12H25M11 18H25M11 24H20"
                stroke={daylight.colors.primary}
                stroke-width="2"
                stroke-linecap="round"
              />
              <circle cx="28" cy="28" r="6" fill={daylight.colors.accent} opacity="0.3" />
            </svg>
            <h1
              style={{
                margin: 0,
                'font-family': daylight.fonts.heading,
                'font-size': '28px',
                'font-weight': '600',
                color: daylight.colors.text,
                'letter-spacing': '-0.3px',
              }}
            >
              JustInCase
            </h1>
          </div>

          <p
            style={{
              margin: 0,
              'font-size': '17px',
              color: daylight.colors.textMuted,
              'line-height': '1.6',
            }}
          >
            Build your small claims case with confidence.
          </p>
        </header>

        {/* Case Card */}
        <article
          style={{
            background: daylight.colors.surface,
            'border-radius': daylight.radii.lg,
            'box-shadow': daylight.shadows.md,
            overflow: 'hidden',
            'margin-bottom': '32px',
          }}
        >
          {/* Case header */}
          <div
            style={{
              padding: '28px 32px',
              'border-bottom': `1px solid ${daylight.colors.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                'justify-content': 'space-between',
                'align-items': 'flex-start',
                'margin-bottom': '16px',
              }}
            >
              <StatusBadge status={sampleCase.status} />
              <div
                style={{
                  'font-family': daylight.fonts.heading,
                  'font-size': '24px',
                  'font-weight': '700',
                  color: daylight.colors.primary,
                }}
              >
                ${sampleCase.claimAmount.toLocaleString()}
              </div>
            </div>

            <h2
              style={{
                margin: '0 0 8px 0',
                'font-family': daylight.fonts.body,
                'font-size': '24px',
                'font-weight': '500',
                color: daylight.colors.text,
                'line-height': '1.3',
              }}
            >
              {sampleCase.title}
            </h2>

            <p
              style={{
                margin: 0,
                'font-size': '15px',
                color: daylight.colors.textMuted,
              }}
            >
              vs. <HighlightedText color="blue">{sampleCase.defendant}</HighlightedText>
            </p>
          </div>

          {/* Navigation tabs - large touch targets */}
          <nav
            style={{
              display: 'flex',
              'border-bottom': `1px solid ${daylight.colors.border}`,
              padding: '0 24px',
            }}
          >
            <For each={['overview', 'evidence', 'timeline'] as const}>
              {(section) => (
                <button
                  onClick={() => setActiveSection(section)}
                  style={{
                    padding: '16px 20px',
                    background: 'none',
                    border: 'none',
                    'font-family': daylight.fonts.heading,
                    'font-size': '14px',
                    'font-weight': activeSection() === section ? '600' : '400',
                    color:
                      activeSection() === section
                        ? daylight.colors.primary
                        : daylight.colors.textMuted,
                    cursor: 'pointer',
                    'border-bottom': `2px solid ${activeSection() === section ? daylight.colors.primary : 'transparent'}`,
                    'margin-bottom': '-1px',
                    'text-transform': 'capitalize',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {section}
                </button>
              )}
            </For>
          </nav>

          {/* Content area */}
          <div style={{ padding: '28px 32px' }}>
            {activeSection() === 'overview' && (
              <div>
                <h3
                  style={{
                    margin: '0 0 16px 0',
                    'font-family': daylight.fonts.heading,
                    'font-size': '13px',
                    'font-weight': '600',
                    color: daylight.colors.textMuted,
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.5px',
                  }}
                >
                  Case Summary
                </h3>

                <p
                  style={{
                    margin: '0 0 24px 0',
                    'font-size': '18px',
                    'line-height': '1.75',
                    color: daylight.colors.text,
                  }}
                >
                  {sampleCase.description.split('September 15, 2024').map((part, i, arr) => (
                    <>
                      {part}
                      {i < arr.length - 1 && <HighlightedText>September 15, 2024</HighlightedText>}
                    </>
                  ))}
                </p>

                {/* Key dates */}
                <div
                  style={{
                    display: 'grid',
                    'grid-template-columns': 'repeat(2, 1fr)',
                    gap: '16px',
                    'margin-top': '24px',
                  }}
                >
                  <div
                    style={{
                      padding: '16px 20px',
                      background: daylight.colors.background,
                      'border-radius': daylight.radii.md,
                    }}
                  >
                    <div
                      style={{
                        'font-family': daylight.fonts.heading,
                        'font-size': '12px',
                        color: daylight.colors.textMuted,
                        'margin-bottom': '4px',
                        'text-transform': 'uppercase',
                        'letter-spacing': '0.5px',
                      }}
                    >
                      Filed
                    </div>
                    <div
                      style={{
                        'font-size': '16px',
                        'font-weight': '500',
                        color: daylight.colors.text,
                      }}
                    >
                      October 1, 2024
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '16px 20px',
                      background: `linear-gradient(135deg, ${highlights.yellow}, ${highlights.yellow})`,
                      'border-radius': daylight.radii.md,
                    }}
                  >
                    <div
                      style={{
                        'font-family': daylight.fonts.heading,
                        'font-size': '12px',
                        color: daylight.colors.textMuted,
                        'margin-bottom': '4px',
                        'text-transform': 'uppercase',
                        'letter-spacing': '0.5px',
                      }}
                    >
                      Court Date
                    </div>
                    <div
                      style={{
                        'font-size': '16px',
                        'font-weight': '600',
                        color: daylight.colors.text,
                      }}
                    >
                      December 15, 2024
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection() === 'evidence' && (
              <div style={{ margin: '-28px -32px' }}>
                <For each={sampleEvidence}>
                  {(evidence) => <EvidenceItem evidence={evidence} />}
                </For>

                {/* Add evidence button - large target */}
                <button
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '20px',
                    background: 'none',
                    border: `2px dashed ${daylight.colors.border}`,
                    'border-radius': 0,
                    'font-family': daylight.fonts.heading,
                    'font-size': '14px',
                    'font-weight': '500',
                    color: daylight.colors.textMuted,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  Add Evidence
                </button>
              </div>
            )}

            {activeSection() === 'timeline' && (
              <div
                style={{
                  'font-size': '16px',
                  color: daylight.colors.textMuted,
                  'text-align': 'center',
                  padding: '40px 0',
                }}
              >
                Timeline view coming soon...
              </div>
            )}
          </div>
        </article>

        {/* Quick actions - Fitt's Law optimized */}
        <div
          style={{
            display: 'grid',
            'grid-template-columns': 'repeat(2, 1fr)',
            gap: '12px',
          }}
        >
          <button
            style={{
              padding: '18px 24px',
              background: daylight.colors.surface,
              border: `1px solid ${daylight.colors.border}`,
              'border-radius': daylight.radii.md,
              'font-family': daylight.fonts.heading,
              'font-size': '15px',
              'font-weight': '500',
              color: daylight.colors.text,
              cursor: 'pointer',
              'text-align': 'left',
              transition: 'box-shadow 0.2s ease',
            }}
          >
            Export Case Brief
          </button>
          <button
            style={{
              padding: '18px 24px',
              background: daylight.colors.primary,
              border: 'none',
              'border-radius': daylight.radii.md,
              'font-family': daylight.fonts.heading,
              'font-size': '15px',
              'font-weight': '500',
              color: 'white',
              cursor: 'pointer',
              'text-align': 'left',
            }}
          >
            Prepare for Court
          </button>
        </div>
      </div>
    </div>
  );
};
