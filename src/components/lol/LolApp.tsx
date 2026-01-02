/**
 * LOL (Laugh Out Loud) - Chore Management & Gamification App
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying, modification,
 * or distribution of this code is strictly prohibited. The frontend logic is local-first
 * and protected intellectual property. No infringement or unauthorized use is permitted.
 */

import { Component, For, createSignal } from 'solid-js';
import { Chore, HouseholdMember } from '../../schemas/lol.schema';
import { papermorphic, paperElevation, paperChips } from '../../theme/papermorphic';
import { AppMenuTrigger } from '../common/AppMenuTrigger';

const sampleMembers: HouseholdMember[] = [
  {
    id: '1',
    name: 'You',
    avatar: '',
    color: '#2196F3',
    totalPoints: 1245,
    weeklyPoints: 320,
    streak: 7,
    level: 12,
    achievements: ['Early Bird', 'Kitchen Master'],
  },
  {
    id: '2',
    name: 'Partner',
    avatar: '',
    color: '#E91E63',
    totalPoints: 1180,
    weeklyPoints: 285,
    streak: 5,
    level: 11,
    achievements: ['Laundry Pro', 'Streak Master'],
  },
];

const sampleChores: Chore[] = [
  {
    id: '1',
    name: 'Do the dishes',
    category: 'kitchen',
    estimatedMinutes: 15,
    points: 25,
    frequency: 'daily',
    icon: 'dishes',
  },
  {
    id: '2',
    name: 'Vacuum living room',
    category: 'general',
    estimatedMinutes: 20,
    points: 35,
    frequency: 'weekly',
    icon: 'vacuum',
  },
  {
    id: '3',
    name: 'Laundry - wash & fold',
    category: 'laundry',
    estimatedMinutes: 45,
    points: 50,
    frequency: 'weekly',
    icon: 'laundry',
  },
  {
    id: '4',
    name: 'Clean bathroom',
    category: 'bathroom',
    estimatedMinutes: 30,
    points: 45,
    frequency: 'weekly',
    icon: 'bathroom',
  },
  {
    id: '5',
    name: 'Take out trash',
    category: 'general',
    estimatedMinutes: 5,
    points: 10,
    frequency: 'daily',
    icon: 'trash',
  },
];

const recentCompletions: { chore: string; member: string; time: string; points: number }[] = [
  { chore: 'Did the dishes', member: 'You', time: '2h ago', points: 25 },
  { chore: 'Vacuumed bedroom', member: 'Partner', time: '4h ago', points: 30 },
  { chore: 'Took out trash', member: 'You', time: '6h ago', points: 10 },
];

const CategoryChip: Component<{ category: Chore['category'] }> = (props) => {
  const chip = paperChips[props.category] || paperChips.chores;
  return (
    <span
      style={{
        display: 'inline-flex',
        'align-items': 'center',
        gap: '4px',
        padding: '4px 10px',
        background: chip.bg,
        color: chip.text,
        'border-radius': '16px',
        'font-size': '12px',
        'font-weight': '500',
        'text-transform': 'capitalize',
      }}
    >
      {props.category}
    </span>
  );
};

const PaperCard: Component<{ elevation?: number; children: any; style?: any }> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);
  const baseElevation = props.elevation || 1;
  const hoverElevation = Math.min(baseElevation + 1, 5) as keyof typeof paperElevation;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: papermorphic.colors.surface,
        'border-radius': papermorphic.radii.lg,
        'box-shadow': isHovered()
          ? paperElevation[hoverElevation]
          : paperElevation[baseElevation as keyof typeof paperElevation],
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        transform: isHovered() ? 'translateY(-2px)' : 'translateY(0)',
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
};

const ChoreItem: Component<{ chore: Chore }> = (props) => {
  const [isChecking, setIsChecking] = createSignal(false);

  return (
    <PaperCard elevation={1} style={{ 'margin-bottom': '12px' }}>
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          padding: '16px 20px',
          gap: '16px',
        }}
      >
        {/* Checkbox - large touch target */}
        <button
          onClick={() => setIsChecking(!isChecking())}
          style={{
            width: '44px',
            height: '44px',
            'border-radius': '50%',
            border: `2px solid ${isChecking() ? papermorphic.colors.primary : papermorphic.colors.border}`,
            background: isChecking() ? papermorphic.colors.primary : 'transparent',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            'flex-shrink': 0,
          }}
        >
          {isChecking() && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          )}
        </button>

        <div style={{ flex: 1, 'min-width': 0 }}>
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '10px',
              'margin-bottom': '4px',
            }}
          >
            <span
              style={{
                'font-size': '16px',
                'font-weight': '500',
                color: papermorphic.colors.text,
              }}
            >
              {props.chore.name}
            </span>
            <CategoryChip category={props.chore.category} />
          </div>

          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '16px',
              'font-size': '13px',
              color: papermorphic.colors.textMuted,
            }}
          >
            <span style={{ display: 'flex', 'align-items': 'center', gap: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
              ~{props.chore.estimatedMinutes}min
            </span>
            <span style={{ 'text-transform': 'capitalize' }}>{props.chore.frequency}</span>
          </div>
        </div>

        {/* Points badge */}
        <div
          style={{
            padding: '8px 16px',
            background: `${papermorphic.colors.accent}15`,
            'border-radius': papermorphic.radii.md,
            display: 'flex',
            'align-items': 'center',
            gap: '4px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={papermorphic.colors.accent}>
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          <span
            style={{
              'font-size': '14px',
              'font-weight': '600',
              color: papermorphic.colors.accent,
            }}
          >
            {props.chore.points}
          </span>
        </div>
      </div>
    </PaperCard>
  );
};

const MemberProgress: Component<{ member: HouseholdMember; isLeader: boolean }> = (props) => {
  return (
    <div
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '16px',
        padding: '16px 20px',
        background: props.isLeader ? `${props.member.color}08` : 'transparent',
        'border-radius': papermorphic.radii.md,
        transition: 'background 0.2s ease',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '48px',
          height: '48px',
          'border-radius': '50%',
          background: props.member.color,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          color: 'white',
          'font-weight': '600',
          'font-size': '18px',
          position: 'relative',
        }}
      >
        {props.member.name.charAt(0)}
        {props.isLeader && (
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '20px',
              height: '20px',
              background: papermorphic.colors.accent,
              'border-radius': '50%',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              border: `2px solid ${papermorphic.colors.surface}`,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
            'margin-bottom': '4px',
          }}
        >
          <span
            style={{
              'font-size': '16px',
              'font-weight': '500',
              color: papermorphic.colors.text,
            }}
          >
            {props.member.name}
          </span>
          <span
            style={{
              'font-size': '14px',
              'font-weight': '600',
              color: props.member.color,
            }}
          >
            {props.member.weeklyPoints} pts
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: '6px',
            background: papermorphic.colors.border,
            'border-radius': '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(props.member.weeklyPoints / 400) * 100}%`,
              height: '100%',
              background: props.member.color,
              'border-radius': '3px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '12px',
            'margin-top': '8px',
            'font-size': '12px',
            color: papermorphic.colors.textMuted,
          }}
        >
          <span>Level {props.member.level}</span>
          <span style={{ display: 'flex', 'align-items': 'center', gap: '4px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill={papermorphic.colors.accent}>
              <path d="M17.66 8L12 2.35 6.34 8A8.02 8.02 0 004 13.64c0 2 .78 4.11 2.34 5.67a7.99 7.99 0 0011.32 0c1.56-1.56 2.34-3.67 2.34-5.67S19.22 9.56 17.66 8zM6 14c.01-2 .62-3.27 1.76-4.4L12 5.27l4.24 4.38C17.38 10.77 17.99 12 18 14H6z" />
            </svg>
            {props.member.streak} day streak
          </span>
        </div>
      </div>
    </div>
  );
};

export const LolApp: Component = () => {
  const [activeTab, setActiveTab] = createSignal<'chores' | 'leaderboard' | 'rewards'>('chores');
  const happinessScore = 78; // equity score

  return (
    <div
      style={{
        'min-height': '100vh',
        background: papermorphic.colors.background,
        'font-family': papermorphic.fonts.body,
      }}
    >
      {/* Header card - elevated paper */}
      <header
        style={{
          background: papermorphic.colors.surface,
          'box-shadow': paperElevation[2],
          padding: '20px 24px',
          position: 'sticky',
          top: 0,
          'z-index': 100,
        }}
      >
        <div
          style={{
            'max-width': '900px',
            margin: '0 auto',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
          }}
        >
          <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
            <AppMenuTrigger>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  'border-radius': papermorphic.radii.md,
                  background: papermorphic.colors.primary,
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  'box-shadow': paperElevation[1],
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z" />
                </svg>
              </div>
            </AppMenuTrigger>
            <div>
              <h1
                style={{
                  margin: 0,
                  'font-size': '22px',
                  'font-weight': '600',
                  color: papermorphic.colors.text,
                }}
              >
                Labor of Love
              </h1>
              <p
                style={{
                  margin: 0,
                  'font-size': '13px',
                  color: papermorphic.colors.textMuted,
                }}
              >
                Keep the house happy
              </p>
            </div>
          </div>

          {/* Happiness meter */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '12px',
              padding: '8px 16px',
              background:
                happinessScore >= 75 ? '#E8F5E9' : happinessScore >= 50 ? '#FFF3E0' : '#FFEBEE',
              'border-radius': '50px',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={happinessScore >= 75 ? '#4CAF50' : happinessScore >= 50 ? '#FF9800' : '#F44336'}
            >
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
            <span
              style={{
                'font-size': '14px',
                'font-weight': '600',
                color:
                  happinessScore >= 75 ? '#2E7D32' : happinessScore >= 50 ? '#E65100' : '#C62828',
              }}
            >
              {happinessScore}% Happy
            </span>
          </div>
        </div>
      </header>

      <div style={{ 'max-width': '900px', margin: '0 auto', padding: '24px' }}>
        {/* Tab navigation - paper tabs */}
        <nav
          style={{
            display: 'flex',
            gap: '4px',
            'margin-bottom': '24px',
            background: papermorphic.colors.surface,
            'border-radius': papermorphic.radii.lg,
            padding: '6px',
            'box-shadow': paperElevation[1],
          }}
        >
          <For each={['chores', 'leaderboard', 'rewards'] as const}>
            {(tab) => (
              <button
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: activeTab() === tab ? papermorphic.colors.primary : 'transparent',
                  border: 'none',
                  'border-radius': papermorphic.radii.md,
                  color: activeTab() === tab ? 'white' : papermorphic.colors.textMuted,
                  'font-size': '14px',
                  'font-weight': '500',
                  cursor: 'pointer',
                  'text-transform': 'capitalize',
                  transition: 'all 0.2s ease',
                  'box-shadow': activeTab() === tab ? paperElevation[1] : 'none',
                }}
              >
                {tab}
              </button>
            )}
          </For>
        </nav>

        {activeTab() === 'chores' && (
          <>
            {/* Quick stats */}
            <div
              style={{
                display: 'grid',
                'grid-template-columns': 'repeat(3, 1fr)',
                gap: '12px',
                'margin-bottom': '24px',
              }}
            >
              <For
                each={[
                  { label: 'Today', value: '3', subtext: 'tasks left' },
                  { label: 'This Week', value: '12', subtext: 'completed' },
                  { label: 'Your Points', value: '320', subtext: 'this week' },
                ]}
              >
                {(stat) => (
                  <PaperCard elevation={1} style={{ padding: '16px', 'text-align': 'center' }}>
                    <div
                      style={{
                        'font-size': '28px',
                        'font-weight': '600',
                        color: papermorphic.colors.primary,
                        'line-height': '1',
                        'margin-bottom': '4px',
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      style={{
                        'font-size': '12px',
                        color: papermorphic.colors.textMuted,
                      }}
                    >
                      {stat.label}
                    </div>
                  </PaperCard>
                )}
              </For>
            </div>

            {/* Chore list */}
            <h2
              style={{
                margin: '0 0 16px 0',
                'font-size': '18px',
                'font-weight': '600',
                color: papermorphic.colors.text,
              }}
            >
              Today's Chores
            </h2>

            <For each={sampleChores}>{(chore) => <ChoreItem chore={chore} />}</For>

            {/* Add chore FAB */}
            <button
              style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '56px',
                height: '56px',
                'border-radius': '50%',
                background: papermorphic.colors.primary,
                border: 'none',
                'box-shadow': paperElevation[4],
                cursor: 'pointer',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </button>
          </>
        )}

        {activeTab() === 'leaderboard' && (
          <>
            <PaperCard elevation={2} style={{ padding: '20px', 'margin-bottom': '24px' }}>
              <h2
                style={{
                  margin: '0 0 16px 0',
                  'font-size': '18px',
                  'font-weight': '600',
                  color: papermorphic.colors.text,
                }}
              >
                Weekly Standings
              </h2>

              <For each={sampleMembers.sort((a, b) => b.weeklyPoints - a.weeklyPoints)}>
                {(member, i) => <MemberProgress member={member} isLeader={i() === 0} />}
              </For>
            </PaperCard>

            {/* Recent activity */}
            <PaperCard elevation={1} style={{ padding: '20px' }}>
              <h3
                style={{
                  margin: '0 0 16px 0',
                  'font-size': '16px',
                  'font-weight': '600',
                  color: papermorphic.colors.text,
                }}
              >
                Recent Activity
              </h3>

              <For each={recentCompletions}>
                {(completion) => (
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'space-between',
                      padding: '12px 0',
                      'border-bottom': `1px solid ${papermorphic.colors.border}`,
                    }}
                  >
                    <div>
                      <div style={{ 'font-size': '14px', color: papermorphic.colors.text }}>
                        {completion.member} {completion.chore.toLowerCase()}
                      </div>
                      <div style={{ 'font-size': '12px', color: papermorphic.colors.textMuted }}>
                        {completion.time}
                      </div>
                    </div>
                    <span
                      style={{
                        'font-size': '14px',
                        'font-weight': '500',
                        color: papermorphic.colors.accent,
                      }}
                    >
                      +{completion.points}
                    </span>
                  </div>
                )}
              </For>
            </PaperCard>
          </>
        )}

        {activeTab() === 'rewards' && (
          <>
            <div
              style={{
                'text-align': 'center',
                padding: '48px 24px',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  'border-radius': '50%',
                  background: `${papermorphic.colors.accent}15`,
                  margin: '0 auto 24px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill={papermorphic.colors.accent}>
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </div>

              <h2
                style={{
                  margin: '0 0 8px 0',
                  'font-size': '24px',
                  'font-weight': '600',
                  color: papermorphic.colors.text,
                }}
              >
                Your Points: 1,245
              </h2>

              <p
                style={{
                  margin: '0 0 32px 0',
                  'font-size': '14px',
                  color: papermorphic.colors.textMuted,
                }}
              >
                Redeem your points for household rewards
              </p>

              {/* Sample rewards */}
              <div
                style={{ display: 'grid', 'grid-template-columns': 'repeat(2, 1fr)', gap: '16px' }}
              >
                <For
                  each={[
                    {
                      title: 'Movie Night Pick',
                      points: 200,
                      icon: 'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z',
                    },
                    {
                      title: 'Sleep In Pass',
                      points: 350,
                      icon: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm.5-11.5h-1v6l5.2 3.15.8-1.3-5-3V7.5z',
                    },
                    {
                      title: 'Dinner Choice',
                      points: 500,
                      icon: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z',
                    },
                    {
                      title: 'Back Massage',
                      points: 750,
                      icon: 'M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z',
                    },
                  ]}
                >
                  {(reward) => (
                    <PaperCard elevation={1} style={{ padding: '20px', 'text-align': 'center' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          'border-radius': '50%',
                          background: `${papermorphic.colors.primary}15`,
                          margin: '0 auto 12px',
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                        }}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill={papermorphic.colors.primary}
                        >
                          <path d={reward.icon} />
                        </svg>
                      </div>
                      <h3
                        style={{
                          margin: '0 0 8px 0',
                          'font-size': '15px',
                          'font-weight': '500',
                          color: papermorphic.colors.text,
                        }}
                      >
                        {reward.title}
                      </h3>
                      <button
                        style={{
                          padding: '8px 20px',
                          background: papermorphic.colors.primary,
                          border: 'none',
                          'border-radius': papermorphic.radii.md,
                          color: 'white',
                          'font-size': '13px',
                          'font-weight': '500',
                          cursor: 'pointer',
                          'box-shadow': paperElevation[1],
                        }}
                      >
                        {reward.points} pts
                      </button>
                    </PaperCard>
                  )}
                </For>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
