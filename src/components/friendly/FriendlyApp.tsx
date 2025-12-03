/**
 * FriendLy - Social Hangout Scheduling App
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying, modification,
 * or distribution of this code is strictly prohibited. The frontend logic is local-first
 * and protected intellectual property. No infringement or unauthorized use is permitted.
 */

import { Component, createSignal, For, Show, createMemo } from 'solid-js';
import { zenTouch, modernTokens, zenAnimations } from '../../theme/zenTouch';
import { store } from './store';
import { TimeSlot, Booking, BADGES } from '../../schemas/friendly.schema';

// --- DESIGN TOKENS SHORTHAND ---
const t = zenTouch;
const m = modernTokens;

// --- ICONS (Refined) ---
const Icons = {
  Calendar: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Settings: () => (
    <svg
      width="20"
      height="20"
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
  ),
  Check: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Users: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Plus: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  X: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Inbox: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  Party: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M5.8 11.3L2 22l10.7-3.8" />
      <path d="M4 3h.01" />
      <path d="M22 8h.01" />
      <path d="M15 2h.01" />
      <path d="M22 20h.01" />
      <path d="M22 2l-4.4 4.4" />
      <path d="M13.8 4.2l4 4" />
      <path d="M19.8 10.2l-4 4" />
    </svg>
  ),
  Eye: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Copy: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  ),
  Clock: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  UserPlus: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
  Globe: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
};

// --- SHARED COMPONENTS ---

const ToggleSwitch: Component<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}> = (toggleProps) => (
  <div
    style={{
      display: 'flex',
      'align-items': 'flex-start',
      gap: '12px',
      padding: '12px',
      background: toggleProps.checked ? `${t.colors.primary}15` : 'transparent',
      'border-radius': t.radii.md,
      border: `1px solid ${toggleProps.checked ? t.colors.primary : t.colors.border}`,
      cursor: 'pointer',
      transition: m.transition.fast,
    }}
    onClick={() => toggleProps.onChange(!toggleProps.checked)}
  >
    <div
      style={{
        width: '44px',
        height: '24px',
        'border-radius': '12px',
        background: toggleProps.checked ? t.colors.primary : t.colors.border,
        position: 'relative',
        transition: m.transition.fast,
        'flex-shrink': 0,
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          'border-radius': '50%',
          background: 'white',
          position: 'absolute',
          top: '2px',
          left: toggleProps.checked ? '22px' : '2px',
          transition: m.transition.fast,
        }}
      />
    </div>
    <div>
      <div
        style={{ color: 'white', 'font-weight': m.fontWeight.medium, 'font-size': m.fontSize.sm }}
      >
        {toggleProps.label}
      </div>
      <Show when={toggleProps.description}>
        <div style={{ color: t.colors.textMuted, 'font-size': m.fontSize.xs, 'margin-top': '2px' }}>
          {toggleProps.description}
        </div>
      </Show>
    </div>
  </div>
);

const GlassCard: Component<{ children: any; style?: any }> = (props) => (
  <div
    style={{
      background: m.glass.background,
      border: m.glass.border,
      'backdrop-filter': m.glass.backdropFilter,
      'border-radius': t.radii.lg,
      ...props.style,
    }}
  >
    {props.children}
  </div>
);

const GradientButton: Component<{
  children: any;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: any;
}> = (props) => {
  const sizes = {
    sm: { padding: '8px 16px', fontSize: m.fontSize.sm },
    md: { padding: '12px 24px', fontSize: m.fontSize.base },
    lg: { padding: '16px 32px', fontSize: m.fontSize.lg },
  };
  const size = sizes[props.size || 'md'];

  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      style={{
        padding: size.padding,
        'font-size': size.fontSize,
        'font-weight': m.fontWeight.semibold,
        'border-radius': t.radii.md,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        transition: m.transition.normal,
        display: 'inline-flex',
        'align-items': 'center',
        'justify-content': 'center',
        gap: '8px',
        ...(props.variant === 'ghost'
          ? {
              background: 'transparent',
              color: t.colors.textMuted,
              border: `1px solid ${t.colors.border}`,
            }
          : {
              background: props.disabled ? t.colors.border : m.gradients.primary,
              color: 'white',
              border: 'none',
              'box-shadow': props.disabled ? 'none' : m.glow.primary,
            }),
        ...props.style,
      }}
    >
      {props.children}
    </button>
  );
};

// Helper to get current week date range
const getWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${format(monday)} - ${format(sunday)}`;
};

// Booking status colors
const bookingColors = {
  booked: '#F59E0B', // Amber/yellow for booked
  bookedGlow: '0 0 20px rgba(245, 158, 11, 0.4)',
  openToJoin: '#10B981', // Green for joinable
  openToJoinGlow: '0 0 20px rgba(16, 185, 129, 0.4)',
};

const TimeGrid: Component<{
  availability: TimeSlot[];
  bookings?: Booking[];
  onToggle?: (slot: TimeSlot) => void;
  onSlotClick?: (slot: TimeSlot, booking?: Booking) => void;
  highlightSlots?: TimeSlot[];
  disabled?: boolean;
  showLabels?: boolean;
  showBookings?: boolean;
}> = (props) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const periods = ['Morning', 'Afternoon', 'Evening'];
  const periodLabels = { Morning: 'AM', Afternoon: 'PM', Evening: 'EVE' };

  const getBookingForSlot = (day: string, period: string): Booking | undefined => {
    if (!props.bookings || !props.showBookings) return undefined;
    return props.bookings.find(
      (b) => b.slot.dayOfWeek === day && b.slot.period === period && b.status !== 'cancelled'
    );
  };

  return (
    <div>
      {/* Week indicator */}
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          'margin-bottom': '16px',
          'padding-bottom': '12px',
          'border-bottom': `1px solid ${t.colors.border}`,
        }}
      >
        <span style={{ 'font-size': m.fontSize.sm, color: t.colors.textMuted }}>This Week</span>
        <span style={{ 'font-size': m.fontSize.xs, color: t.colors.textMuted }}>
          {getWeekRange()}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        {/* Period labels column */}
        <Show when={props.showLabels !== false}>
          <div
            style={{
              display: 'flex',
              'flex-direction': 'column',
              gap: '6px',
              'padding-top': '24px',
              width: '32px',
              'flex-shrink': 0,
            }}
          >
            <For each={periods}>
              {(period) => (
                <div
                  style={{
                    height: '52px',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'font-size': '9px',
                    color: t.colors.textMuted,
                    'font-weight': m.fontWeight.semibold,
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.5px',
                  }}
                >
                  {periodLabels[period as keyof typeof periodLabels]}
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Days grid */}
        <For each={days}>
          {(day) => (
            <div style={{ flex: 1, display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
              <div
                style={{
                  'text-align': 'center',
                  'font-size': m.fontSize.xs,
                  color: t.colors.textMuted,
                  'font-weight': m.fontWeight.semibold,
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.5px',
                  'padding-bottom': '4px',
                }}
              >
                {day}
              </div>
              <For each={periods}>
                {(period) => {
                  const isAvailable = () =>
                    props.availability.some((s) => s.dayOfWeek === day && s.period === period);
                  const isHighlighted = () =>
                    props.highlightSlots?.some((s) => s.dayOfWeek === day && s.period === period);
                  const booking = () => getBookingForSlot(day, period);
                  const isBooked = () => !!booking();
                  const isOpenToJoin = () => booking()?.openToGroup === true;

                  // Determine slot state
                  const getSlotStyle = () => {
                    if (isBooked()) {
                      return {
                        background: isOpenToJoin()
                          ? `linear-gradient(135deg, ${bookingColors.openToJoin}, ${bookingColors.booked})`
                          : bookingColors.booked,
                        'box-shadow': isOpenToJoin()
                          ? bookingColors.openToJoinGlow
                          : bookingColors.bookedGlow,
                      };
                    }
                    if (isHighlighted() && isAvailable()) {
                      return {
                        background: m.gradients.primary,
                        'box-shadow': m.glow.primary,
                      };
                    }
                    if (isAvailable()) {
                      return {
                        background: t.colors.primary,
                        'box-shadow': 'none',
                      };
                    }
                    return {
                      background: `${t.colors.border}50`,
                      'box-shadow': 'none',
                    };
                  };

                  return (
                    <button
                      onClick={() => {
                        if (props.onSlotClick) {
                          props.onSlotClick(
                            { dayOfWeek: day as any, period: period as any },
                            booking()
                          );
                        } else if (props.onToggle) {
                          props.onToggle({ dayOfWeek: day as any, period: period as any });
                        }
                      }}
                      disabled={props.disabled}
                      style={{
                        height: '52px',
                        'border-radius': t.radii.sm,
                        border: 'none',
                        ...getSlotStyle(),
                        cursor: props.disabled ? 'default' : 'pointer',
                        transition: m.transition.fast,
                        opacity: props.disabled && !isAvailable() && !isBooked() ? 0.3 : 1,
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        'flex-direction': 'column',
                        'align-items': 'center',
                        'justify-content': 'center',
                        gap: '2px',
                      }}
                    >
                      {/* Booked slot indicator */}
                      <Show when={isBooked()}>
                        <div
                          style={{
                            color: 'white',
                            display: 'flex',
                            'flex-direction': 'column',
                            'align-items': 'center',
                            gap: '2px',
                          }}
                        >
                          <Icons.Clock />
                          <Show when={isOpenToJoin()}>
                            <div
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                color: 'white',
                                opacity: 0.9,
                              }}
                            >
                              <Icons.UserPlus />
                            </div>
                          </Show>
                        </div>
                      </Show>

                      {/* Checkmark for available (non-booked) slots */}
                      <Show when={isAvailable() && !isBooked()}>
                        <div
                          style={{
                            color: 'white',
                            opacity: isHighlighted() ? 1 : 0.8,
                          }}
                        >
                          <Icons.Check />
                        </div>
                      </Show>
                    </button>
                  );
                }}
              </For>
            </div>
          )}
        </For>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          'flex-wrap': 'wrap',
          'margin-top': '16px',
          'padding-top': '12px',
          'border-top': `1px solid ${t.colors.border}`,
        }}
      >
        <div style={{ display: 'flex', 'align-items': 'center', gap: '6px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              'border-radius': '4px',
              background: t.colors.primary,
            }}
          />
          <span style={{ 'font-size': m.fontSize.xs, color: t.colors.textMuted }}>Available</span>
        </div>
        <Show when={props.showBookings}>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '6px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                'border-radius': '4px',
                background: bookingColors.booked,
              }}
            />
            <span style={{ 'font-size': m.fontSize.xs, color: t.colors.textMuted }}>Booked</span>
          </div>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '6px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                'border-radius': '4px',
                background: `linear-gradient(135deg, ${bookingColors.openToJoin}, ${bookingColors.booked})`,
              }}
            />
            <span style={{ 'font-size': m.fontSize.xs, color: t.colors.textMuted }}>
              Open to join
            </span>
          </div>
        </Show>
        <div style={{ display: 'flex', 'align-items': 'center', gap: '6px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              'border-radius': '4px',
              background: `${t.colors.border}50`,
            }}
          />
          <span style={{ 'font-size': m.fontSize.xs, color: t.colors.textMuted }}>Not set</span>
        </div>
      </div>
    </div>
  );
};

const Modal: Component<{ onClose: () => void; title: string; children: any }> = (props) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.9)',
      'backdrop-filter': 'blur(20px)',
      'z-index': 200,
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      padding: '24px',
    }}
  >
    <GlassCard
      style={{
        width: '100%',
        'max-width': '420px',
        'max-height': '90vh',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          padding: '20px 24px',
          'border-bottom': `1px solid ${t.colors.border}`,
        }}
      >
        <h2
          style={{
            margin: 0,
            'font-size': m.fontSize.lg,
            color: 'white',
            'font-weight': m.fontWeight.semibold,
          }}
        >
          {props.title}
        </h2>
        <button
          onClick={props.onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: t.colors.textMuted,
            cursor: 'pointer',
            padding: '8px',
            'border-radius': t.radii.sm,
            transition: m.transition.fast,
          }}
        >
          <Icons.X />
        </button>
      </div>
      <div style={{ padding: '24px' }}>{props.children}</div>
    </GlassCard>
  </div>
);

// --- PUBLIC VIEW (Shareable Link) ---

const PublicView: Component = () => {
  const [selectedSlot, setSelectedSlot] = createSignal<TimeSlot | null>(null);
  const [selectedBooking, setSelectedBooking] = createSignal<Booking | null>(null);
  const [name, setName] = createSignal('');
  const [note, setNote] = createSignal('');
  const [openToGroup, setOpenToGroup] = createSignal(false);
  const [isPublic, setIsPublic] = createSignal(false);
  const [submitted, setSubmitted] = createSignal(false);
  const [joinMode, setJoinMode] = createSignal(false); // True when joining existing hangout

  // Get public bookings that are open to group
  const joinableBookings = createMemo(() =>
    store.state.bookings.filter((b) => b.isPublic && b.openToGroup && b.status === 'confirmed')
  );

  const handleSubmit = () => {
    if (selectedSlot() && name()) {
      if (joinMode() && selectedBooking()) {
        // Join existing hangout
        store.joinBooking(selectedBooking()!.id, name());
      } else {
        // Request new hangout
        store.submitRequest(name(), selectedSlot()!, note(), undefined, {
          openToGroup: openToGroup(),
          isPublic: isPublic(),
        });
      }
      setSubmitted(true);
    }
  };

  const handleSlotClick = (slot: TimeSlot, booking?: Booking) => {
    if (booking && booking.isPublic && booking.openToGroup) {
      // This slot has a joinable hangout
      setSelectedSlot(slot);
      setSelectedBooking(booking);
      setJoinMode(true);
    } else if (
      store.state.profile.availability.some(
        (s) => s.dayOfWeek === slot.dayOfWeek && s.period === slot.period
      )
    ) {
      // Regular available slot
      setSelectedSlot(slot);
      setSelectedBooking(null);
      setJoinMode(false);
    }
  };

  return (
    <div
      style={{
        'min-height': '100vh',
        background: t.colors.background,
        'background-image': m.gradients.mesh,
        color: t.colors.text,
        'font-family': t.fonts.body,
        position: 'relative',
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => store.setViewMode('dashboard')}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          'z-index': 100,
          background: m.glass.background,
          border: m.glass.border,
          'backdrop-filter': m.glass.backdropFilter,
          'border-radius': t.radii.organic,
          padding: '12px 16px',
          color: t.colors.text,
          cursor: 'pointer',
          display: 'flex',
          'align-items': 'center',
          gap: '8px',
          'font-size': m.fontSize.sm,
          'font-weight': m.fontWeight.medium,
          transition: m.transition.normal,
        }}
      >
        <Icons.ArrowLeft />
        <span>Back to Dashboard</span>
      </button>

      <div
        style={{
          'max-width': '480px',
          margin: '0 auto',
          padding: '80px 24px 40px',
        }}
      >
        {/* Profile Header */}
        <div style={{ 'text-align': 'center', 'margin-bottom': '48px' }}>
          {/* Avatar with Glow */}
          <div
            style={{
              width: '100px',
              height: '100px',
              'border-radius': '50%',
              background: m.gradients.primary,
              margin: '0 auto 20px',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'font-size': m.fontSize['4xl'],
              color: 'white',
              'font-weight': m.fontWeight.bold,
              'box-shadow': m.glow.primary,
              position: 'relative',
            }}
          >
            {store.state.profile.displayName.charAt(0)}
            {/* Pulse ring */}
            <div
              style={{
                position: 'absolute',
                inset: '-4px',
                'border-radius': '50%',
                border: `2px solid ${t.colors.primary}`,
                opacity: 0.5,
                animation: 'pulse-glow 2s infinite',
              }}
            />
          </div>

          <h1
            style={{
              margin: '0 0 8px',
              'font-size': m.fontSize['3xl'],
              'font-weight': m.fontWeight.bold,
              color: 'white',
              'line-height': m.lineHeight.tight,
            }}
          >
            {store.state.profile.displayName}
          </h1>

          <p
            style={{
              margin: '0 0 16px',
              color: t.colors.textMuted,
              'font-size': m.fontSize.base,
              'line-height': m.lineHeight.relaxed,
            }}
          >
            {store.state.profile.bio}
          </p>

          {/* Badges */}
          <Show when={store.state.profile.badges.length > 0}>
            <div
              style={{
                display: 'flex',
                'justify-content': 'center',
                gap: '8px',
                'flex-wrap': 'wrap',
              }}
            >
              <For each={store.state.profile.badges}>
                {(badgeId) => {
                  const badge = BADGES.find((b) => b.id === badgeId);
                  return badge ? (
                    <div
                      title={badge.description}
                      style={{
                        'font-size': '24px',
                        padding: '8px',
                        background: `${t.colors.primary}20`,
                        'border-radius': t.radii.sm,
                      }}
                    >
                      {badge.icon}
                    </div>
                  ) : null;
                }}
              </For>
            </div>
          </Show>
        </div>

        <Show
          when={!submitted()}
          fallback={
            <GlassCard style={{ 'text-align': 'center', padding: '48px 32px' }}>
              <div
                style={{
                  'font-size': '64px',
                  'margin-bottom': '20px',
                  filter: joinMode()
                    ? `drop-shadow(0 0 20px ${bookingColors.openToJoin}80)`
                    : 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))',
                }}
              >
                {joinMode() ? '🙌' : '🎉'}
              </div>
              <h2
                style={{
                  margin: '0 0 12px',
                  color: 'white',
                  'font-size': m.fontSize['2xl'],
                  'font-weight': m.fontWeight.bold,
                }}
              >
                {joinMode() ? "You're In!" : 'Request Sent!'}
              </h2>
              <p
                style={{
                  margin: '0 0 24px',
                  color: t.colors.textMuted,
                  'font-size': m.fontSize.base,
                }}
              >
                {joinMode()
                  ? `You've joined the hangout. See you there!`
                  : `${store.state.profile.displayName} will get back to you soon.`}
              </p>
              <GradientButton
                onClick={() => {
                  setSubmitted(false);
                  setJoinMode(false);
                  setSelectedSlot(null);
                  setSelectedBooking(null);
                  setName('');
                  setNote('');
                }}
                variant="ghost"
              >
                {joinMode() ? 'Back to Schedule' : 'Send Another Request'}
              </GradientButton>
            </GlassCard>
          }
        >
          {/* Availability Section */}
          <GlassCard style={{ padding: '24px', 'margin-bottom': '20px' }}>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
                'margin-bottom': '6px',
              }}
            >
              <Icons.Sparkles />
              <h2
                style={{
                  margin: 0,
                  'font-size': m.fontSize.sm,
                  color: t.colors.primary,
                  'font-weight': m.fontWeight.semibold,
                  'text-transform': 'uppercase',
                  'letter-spacing': '1px',
                }}
              >
                Available Times
              </h2>
            </div>
            <p
              style={{
                margin: '0 0 20px',
                'font-size': m.fontSize.sm,
                color: t.colors.textMuted,
              }}
            >
              Tap a slot to request that time, or join an open hangout
            </p>
            <TimeGrid
              availability={store.state.profile.availability}
              bookings={joinableBookings()}
              showBookings={true}
              highlightSlots={selectedSlot() ? [selectedSlot()!] : []}
              onSlotClick={handleSlotClick}
            />
          </GlassCard>

          {/* Joinable Hangouts Section */}
          <Show when={joinableBookings().length > 0}>
            <GlassCard style={{ padding: '24px', 'margin-bottom': '20px' }}>
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '8px',
                  'margin-bottom': '16px',
                }}
              >
                <div style={{ color: bookingColors.openToJoin }}>
                  <Icons.UserPlus />
                </div>
                <h2
                  style={{
                    margin: 0,
                    'font-size': m.fontSize.sm,
                    color: bookingColors.openToJoin,
                    'font-weight': m.fontWeight.semibold,
                    'text-transform': 'uppercase',
                    'letter-spacing': '1px',
                  }}
                >
                  Open Hangouts
                </h2>
              </div>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
                <For each={joinableBookings()}>
                  {(booking) => (
                    <button
                      onClick={() => handleSlotClick(booking.slot, booking)}
                      style={{
                        display: 'flex',
                        'align-items': 'center',
                        gap: '12px',
                        padding: '14px',
                        background:
                          selectedBooking()?.id === booking.id
                            ? `linear-gradient(135deg, ${bookingColors.openToJoin}20, ${bookingColors.booked}20)`
                            : `${bookingColors.booked}10`,
                        'border-radius': t.radii.md,
                        border:
                          selectedBooking()?.id === booking.id
                            ? `2px solid ${bookingColors.openToJoin}`
                            : `1px solid ${bookingColors.booked}30`,
                        cursor: 'pointer',
                        transition: m.transition.fast,
                        'text-align': 'left',
                        width: '100%',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          'border-radius': t.radii.sm,
                          background: `linear-gradient(135deg, ${bookingColors.openToJoin}, ${bookingColors.booked})`,
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                          color: 'white',
                          'flex-shrink': 0,
                        }}
                      >
                        <Icons.UserPlus />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            color: 'white',
                            'font-weight': m.fontWeight.semibold,
                            'font-size': m.fontSize.base,
                          }}
                        >
                          {booking.showParticipantNames ? booking.title : 'Join a hangout'}
                        </div>
                        <div
                          style={{
                            'font-size': m.fontSize.sm,
                            color: t.colors.textMuted,
                          }}
                        >
                          {booking.slot.dayOfWeek} {booking.slot.period}
                          <Show
                            when={booking.showParticipantNames && booking.participants.length > 0}
                          >
                            <span> · {booking.participants.length + 1} attending</span>
                          </Show>
                        </div>
                      </div>
                    </button>
                  )}
                </For>
              </div>
            </GlassCard>
          </Show>

          {/* Request Form */}
          <Show when={selectedSlot()}>
            <GlassCard style={{ padding: '24px' }}>
              {/* Header badge - different for join vs request */}
              <div
                style={{
                  display: 'inline-flex',
                  padding: '8px 16px',
                  background: joinMode()
                    ? `linear-gradient(135deg, ${bookingColors.openToJoin}, ${bookingColors.booked})`
                    : m.gradients.primary,
                  'border-radius': t.radii.organic,
                  'margin-bottom': '20px',
                  'font-size': m.fontSize.sm,
                  color: 'white',
                  'font-weight': m.fontWeight.semibold,
                  'box-shadow': joinMode() ? bookingColors.openToJoinGlow : m.glow.primary,
                  'align-items': 'center',
                  gap: '6px',
                }}
              >
                <Show when={joinMode()}>
                  <Icons.UserPlus />
                </Show>
                {selectedSlot()!.dayOfWeek} {selectedSlot()!.period}
              </div>

              {/* Join hangout info */}
              <Show when={joinMode() && selectedBooking()}>
                <div
                  style={{
                    padding: '12px',
                    background: `${bookingColors.booked}15`,
                    'border-radius': t.radii.md,
                    'margin-bottom': '20px',
                    border: `1px solid ${bookingColors.booked}30`,
                  }}
                >
                  <div
                    style={{
                      color: 'white',
                      'font-weight': m.fontWeight.semibold,
                      'margin-bottom': '4px',
                    }}
                  >
                    {selectedBooking()!.showParticipantNames
                      ? selectedBooking()!.title
                      : 'Join this hangout'}
                  </div>
                  <Show
                    when={
                      selectedBooking()!.showParticipantNames &&
                      selectedBooking()!.participants.length > 0
                    }
                  >
                    <div style={{ 'font-size': m.fontSize.sm, color: t.colors.textMuted }}>
                      with{' '}
                      {selectedBooking()!
                        .participants.map((p) => p.name)
                        .join(', ')}
                    </div>
                  </Show>
                </div>
              </Show>

              <div style={{ 'margin-bottom': '20px' }}>
                <label
                  style={{
                    display: 'block',
                    'font-size': m.fontSize.xs,
                    color: t.colors.textMuted,
                    'margin-bottom': '8px',
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.5px',
                    'font-weight': m.fontWeight.medium,
                  }}
                >
                  Your Name
                </label>
                <input
                  type="text"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  placeholder="What should they call you?"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: t.colors.background,
                    border: `1px solid ${t.colors.border}`,
                    color: 'white',
                    'border-radius': t.radii.md,
                    outline: 'none',
                    'box-sizing': 'border-box' as const,
                    'font-size': m.fontSize.base,
                    transition: m.transition.fast,
                  }}
                />
              </div>

              {/* Only show note field for new requests, not joins */}
              <Show when={!joinMode()}>
                <div style={{ 'margin-bottom': '24px' }}>
                  <label
                    style={{
                      display: 'block',
                      'font-size': m.fontSize.xs,
                      color: t.colors.textMuted,
                      'margin-bottom': '8px',
                      'text-transform': 'uppercase',
                      'letter-spacing': '0.5px',
                      'font-weight': m.fontWeight.medium,
                    }}
                  >
                    Quick Note (optional)
                  </label>
                  <textarea
                    value={note()}
                    onInput={(e) => setNote(e.currentTarget.value)}
                    placeholder="Coffee? Walk? Just say hi?"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: t.colors.background,
                      border: `1px solid ${t.colors.border}`,
                      color: 'white',
                      'border-radius': t.radii.md,
                      outline: 'none',
                      resize: 'none',
                      'box-sizing': 'border-box' as const,
                      'font-size': m.fontSize.base,
                      'font-family': 'inherit',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    'flex-direction': 'column',
                    gap: '12px',
                    'margin-bottom': '24px',
                  }}
                >
                  <ToggleSwitch
                    checked={openToGroup()}
                    onChange={setOpenToGroup}
                    label="Open to Join?"
                    description="Allow others to join this hangout if accepted"
                  />
                  <ToggleSwitch
                    checked={isPublic()}
                    onChange={setIsPublic}
                    label="Publicly Visible"
                    description="Show this on the public profile page"
                  />
                </div>
              </Show>

              <GradientButton
                onClick={handleSubmit}
                disabled={!name()}
                size="lg"
                style={{
                  width: '100%',
                  background: joinMode()
                    ? `linear-gradient(135deg, ${bookingColors.openToJoin}, ${bookingColors.booked})`
                    : undefined,
                  'box-shadow': joinMode() ? bookingColors.openToJoinGlow : undefined,
                }}
              >
                {joinMode() ? 'Join Hangout' : 'Request Hangout'}
              </GradientButton>
            </GlassCard>
          </Show>
        </Show>
      </div>
    </div>
  );
};

// --- DASHBOARD VIEW ---

const DashboardView: Component = () => {
  const [tab, setTab] = createSignal<'schedule' | 'requests' | 'circles' | 'events' | 'settings'>(
    'schedule'
  );
  const [showCreateGroup, setShowCreateGroup] = createSignal(false);
  const [showCreateEvent, setShowCreateEvent] = createSignal(false);
  const [linkCopied, setLinkCopied] = createSignal(false);

  const copyProfileLink = async () => {
    const link = `friendly.app/${store.state.profile.username}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const [acceptingRequest, setAcceptingRequest] = createSignal<string | null>(null);

  const pendingRequests = createMemo(() =>
    store.state.requests.filter((r) => r.status === 'pending')
  );

  const getRequestById = (id: string) => store.state.requests.find((r) => r.id === id);

  return (
    <div
      style={{
        'min-height': '100vh',
        background: t.colors.background,
        'background-image': m.gradients.mesh,
        color: t.colors.text,
        'font-family': t.fonts.body,
      }}
    >
      {/* Header */}
      <header style={{ padding: '24px 24px 0' }}>
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'flex-start',
            'margin-bottom': '24px',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                'font-size': m.fontSize['2xl'],
                color: 'white',
                'font-weight': m.fontWeight.bold,
                // 'background': m.gradients.primary, // Removed for better contrast
                // '-webkit-background-clip': 'text',
                // '-webkit-text-fill-color': 'transparent',
                // 'background-clip': 'text',
              }}
            >
              FriendLy
            </h1>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
                'margin-top': '4px',
              }}
            >
              <span
                style={{
                  'font-size': m.fontSize.sm,
                  color: t.colors.textMuted,
                }}
              >
                friendly.app/{store.state.profile.username}
              </span>
              <button
                onClick={copyProfileLink}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: linkCopied() ? t.colors.primary : t.colors.textMuted,
                  cursor: 'pointer',
                  padding: '4px',
                  transition: m.transition.fast,
                  display: 'flex',
                  'align-items': 'center',
                  gap: '4px',
                }}
              >
                <Show when={linkCopied()} fallback={<Icons.Copy />}>
                  <Icons.Check />
                </Show>
              </button>
              <Show when={linkCopied()}>
                <span
                  style={{
                    'font-size': m.fontSize.xs,
                    color: t.colors.primary,
                    'font-weight': m.fontWeight.medium,
                    animation: 'fadeIn 0.2s ease-out',
                  }}
                >
                  Copied!
                </span>
              </Show>
            </div>
          </div>

          <GradientButton onClick={() => store.setViewMode('public')} variant="ghost" size="sm">
            <Icons.Eye /> Preview Link
          </GradientButton>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: 'grid',
            'grid-template-columns': 'repeat(4, 1fr)',
            gap: '12px',
            'margin-bottom': '24px',
          }}
        >
          <For
            each={[
              {
                label: 'Hosted',
                value: store.state.profile.stats.hangoutsHosted,
                color: t.colors.primary,
              },
              {
                label: 'Attended',
                value: store.state.profile.stats.hangoutsAttended,
                color: t.colors.secondary,
              },
              {
                label: 'Friends',
                value: store.state.profile.stats.friendsMade,
                color: t.colors.accent,
              },
              {
                label: 'Streak',
                value: `${store.state.profile.stats.streakWeeks}w`,
                color: '#F59E0B',
              },
            ]}
          >
            {(stat) => (
              <GlassCard style={{ padding: '16px', 'text-align': 'center' }}>
                <div
                  style={{
                    'font-size': m.fontSize['2xl'],
                    color: stat.color,
                    'font-weight': m.fontWeight.bold,
                    'line-height': 1,
                    'margin-bottom': '4px',
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    'font-size': m.fontSize.xs,
                    color: t.colors.textMuted,
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.5px',
                  }}
                >
                  {stat.label}
                </div>
              </GlassCard>
            )}
          </For>
        </div>

        {/* Badges */}
        <Show when={store.state.profile.badges.length > 0}>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              'margin-bottom': '24px',
              'flex-wrap': 'wrap',
            }}
          >
            <For each={store.state.profile.badges}>
              {(badgeId) => {
                const badge = BADGES.find((b) => b.id === badgeId);
                return badge ? (
                  <GlassCard
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '8px',
                      padding: '8px 12px',
                    }}
                  >
                    <span style={{ 'font-size': '16px' }}>{badge.icon}</span>
                    <span
                      style={{
                        'font-size': m.fontSize.sm,
                        color: t.colors.textMuted,
                        'font-weight': m.fontWeight.medium,
                      }}
                    >
                      {badge.name}
                    </span>
                  </GlassCard>
                ) : null;
              }}
            </For>
          </div>
        </Show>
      </header>

      {/* Content */}
      <main style={{ padding: '0 24px 140px' }}>
        <Show when={tab() === 'schedule'}>
          <GlassCard style={{ padding: '24px', 'margin-bottom': '16px' }}>
            <h2
              style={{
                margin: '0 0 16px',
                'font-size': m.fontSize.sm,
                color: t.colors.primary,
                'text-transform': 'uppercase',
                'letter-spacing': '1px',
                'font-weight': m.fontWeight.semibold,
              }}
            >
              Your Availability
            </h2>
            <p
              style={{
                margin: '0 0 20px',
                'font-size': m.fontSize.sm,
                color: t.colors.textMuted,
              }}
            >
              Tap slots to toggle when you're free. Yellow slots have confirmed hangouts.
            </p>
            <TimeGrid
              availability={store.state.profile.availability}
              bookings={store.state.bookings}
              showBookings={true}
              onToggle={(slot) => store.toggleAvailability(slot)}
            />
          </GlassCard>

          {/* Upcoming Bookings List */}
          <Show when={store.state.bookings.filter((b) => b.status === 'confirmed').length > 0}>
            <GlassCard style={{ padding: '24px' }}>
              <h2
                style={{
                  margin: '0 0 16px',
                  'font-size': m.fontSize.sm,
                  color: bookingColors.booked,
                  'text-transform': 'uppercase',
                  'letter-spacing': '1px',
                  'font-weight': m.fontWeight.semibold,
                }}
              >
                Upcoming Hangouts
              </h2>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
                <For each={store.state.bookings.filter((b) => b.status === 'confirmed')}>
                  {(booking) => (
                    <div
                      style={{
                        display: 'flex',
                        'align-items': 'center',
                        gap: '12px',
                        padding: '12px',
                        background: `${bookingColors.booked}15`,
                        'border-radius': t.radii.md,
                        border: `1px solid ${bookingColors.booked}30`,
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          'border-radius': t.radii.sm,
                          background: bookingColors.booked,
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                          color: 'white',
                          'flex-shrink': 0,
                        }}
                      >
                        <Icons.Clock />
                      </div>
                      <div style={{ flex: 1, 'min-width': 0 }}>
                        <div
                          style={{
                            color: 'white',
                            'font-weight': m.fontWeight.semibold,
                            'font-size': m.fontSize.base,
                            'white-space': 'nowrap',
                            overflow: 'hidden',
                            'text-overflow': 'ellipsis',
                          }}
                        >
                          {booking.title || 'Hangout'}
                        </div>
                        <div
                          style={{
                            'font-size': m.fontSize.sm,
                            color: t.colors.textMuted,
                            display: 'flex',
                            'align-items': 'center',
                            gap: '8px',
                          }}
                        >
                          <span>
                            {booking.slot.dayOfWeek} {booking.slot.period}
                          </span>
                          <Show when={booking.participants.length > 0}>
                            <span>· {booking.participants.map((p) => p.name).join(', ')}</span>
                          </Show>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', 'align-items': 'center' }}>
                        <Show when={booking.openToGroup}>
                          <div title="Open to group" style={{ color: bookingColors.openToJoin }}>
                            <Icons.UserPlus />
                          </div>
                        </Show>
                        <Show when={booking.isPublic}>
                          <div title="Public" style={{ color: t.colors.textMuted }}>
                            <Icons.Globe />
                          </div>
                        </Show>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </GlassCard>
          </Show>
        </Show>

        <Show when={tab() === 'requests'}>
          <Show when={pendingRequests().length === 0}>
            <GlassCard
              style={{
                'text-align': 'center',
                padding: '48px 24px',
              }}
            >
              <div style={{ 'font-size': '48px', 'margin-bottom': '16px', opacity: 0.5 }}>📬</div>
              <p style={{ margin: 0, color: t.colors.textMuted }}>
                No pending requests. Share your link to get some!
              </p>
            </GlassCard>
          </Show>
          <For each={pendingRequests()}>
            {(request) => (
              <GlassCard style={{ padding: '20px', 'margin-bottom': '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'align-items': 'flex-start',
                    'margin-bottom': '12px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: 'white',
                        'font-weight': m.fontWeight.semibold,
                        'font-size': m.fontSize.lg,
                      }}
                    >
                      {request.requesterName}
                    </div>
                    <Show when={request.requesterNote}>
                      <p
                        style={{
                          margin: '4px 0 0',
                          'font-size': m.fontSize.sm,
                          color: t.colors.textMuted,
                          'font-style': 'italic',
                        }}
                      >
                        "{request.requesterNote}"
                      </p>
                    </Show>
                  </div>
                  <div
                    style={{
                      padding: '6px 12px',
                      background: m.gradients.primary,
                      'border-radius': t.radii.organic,
                      'font-size': m.fontSize.xs,
                      color: 'white',
                      'font-weight': m.fontWeight.semibold,
                    }}
                  >
                    {request.requestedSlot.dayOfWeek} {request.requestedSlot.period}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <GradientButton
                    onClick={() => setAcceptingRequest(request.id)}
                    size="sm"
                    style={{ flex: 1 }}
                  >
                    Accept
                  </GradientButton>
                  <GradientButton
                    onClick={() => store.respondToRequest(request.id, 'declined')}
                    variant="ghost"
                    size="sm"
                    style={{ flex: 1 }}
                  >
                    Decline
                  </GradientButton>
                </div>
              </GlassCard>
            )}
          </For>
        </Show>

        <Show when={tab() === 'circles'}>
          <For each={store.state.groups}>
            {(group) => (
              <GlassCard
                style={{
                  padding: '20px',
                  'margin-bottom': '12px',
                  display: 'flex',
                  'align-items': 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    'font-size': '32px',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    background: `${t.colors.primary}20`,
                    'border-radius': t.radii.md,
                  }}
                >
                  {group.emoji || '👥'}
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      margin: 0,
                      'font-size': m.fontSize.lg,
                      color: 'white',
                      'font-weight': m.fontWeight.semibold,
                    }}
                  >
                    {group.name}
                  </h3>
                  <p
                    style={{
                      margin: '2px 0 0',
                      'font-size': m.fontSize.sm,
                      color: t.colors.textMuted,
                    }}
                  >
                    {group.members.length} members
                  </p>
                </div>
              </GlassCard>
            )}
          </For>
          <GradientButton
            onClick={() => setShowCreateGroup(true)}
            variant="ghost"
            style={{ width: '100%', 'border-style': 'dashed' }}
          >
            <Icons.Plus /> New Circle
          </GradientButton>
        </Show>

        <Show when={tab() === 'events'}>
          <For each={store.state.events}>
            {(event) => (
              <GlassCard style={{ padding: '20px', 'margin-bottom': '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '16px',
                    'margin-bottom': '12px',
                  }}
                >
                  <div
                    style={{
                      'font-size': '32px',
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      background: m.gradients.primary,
                      'border-radius': t.radii.md,
                    }}
                  >
                    {event.emoji || '🎉'}
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        'font-size': m.fontSize.lg,
                        color: 'white',
                        'font-weight': m.fontWeight.semibold,
                      }}
                    >
                      {event.title}
                    </h3>
                    <p
                      style={{
                        margin: '2px 0 0',
                        'font-size': m.fontSize.sm,
                        color: t.colors.textMuted,
                      }}
                    >
                      {event.date.toLocaleDateString()} · {event.location || 'TBD'}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    'font-size': m.fontSize.sm,
                  }}
                >
                  <span style={{ color: t.colors.primary, 'font-weight': m.fontWeight.medium }}>
                    {event.rsvps.filter((r) => r.status === 'going').length} going
                  </span>
                  <span style={{ color: t.colors.textMuted }}>
                    {event.rsvps.filter((r) => r.status === 'maybe').length} maybe
                  </span>
                </div>
              </GlassCard>
            )}
          </For>
          <GradientButton
            onClick={() => setShowCreateEvent(true)}
            variant="ghost"
            style={{ width: '100%', 'border-style': 'dashed' }}
          >
            <Icons.Plus /> Create Event
          </GradientButton>
        </Show>

        <Show when={tab() === 'settings'}>
          <SettingsView />
        </Show>
      </main>

      {/* Bottom Navigation */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          background: m.glass.background,
          'backdrop-filter': m.glass.backdropFilter,
          'border-top': m.glass.border,
          padding: '16px 0 32px',
          display: 'flex',
          'justify-content': 'space-around',
          'z-index': 100,
        }}
      >
        <For
          each={[
            { id: 'schedule', icon: Icons.Calendar, label: 'Schedule' },
            {
              id: 'requests',
              icon: Icons.Inbox,
              label: 'Requests',
              badge: pendingRequests().length,
            },
            { id: 'circles', icon: Icons.Users, label: 'Circles' },
            { id: 'events', icon: Icons.Party, label: 'Events' },
            { id: 'settings', icon: Icons.Settings, label: 'Settings' },
          ]}
        >
          {(item) => (
            <button
              onClick={() => setTab(item.id as any)}
              style={{
                background: 'transparent',
                border: 'none',
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                gap: '6px',
                color: tab() === item.id ? t.colors.primary : t.colors.textMuted,
                cursor: 'pointer',
                position: 'relative',
                padding: '8px 16px',
                transition: m.transition.fast,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  color: tab() === item.id ? t.colors.primary : t.colors.textMuted,
                }}
              >
                <item.icon />
                <Show when={item.badge && item.badge > 0}>
                  <div
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-10px',
                      width: '18px',
                      height: '18px',
                      background: m.gradients.primary,
                      'border-radius': '50%',
                      'font-size': '10px',
                      color: 'white',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'font-weight': m.fontWeight.bold,
                      'box-shadow': m.glow.primary,
                    }}
                  >
                    {item.badge}
                  </div>
                </Show>
              </div>
              <span
                style={{
                  'font-size': m.fontSize.xs,
                  'font-weight': tab() === item.id ? m.fontWeight.semibold : m.fontWeight.medium,
                }}
              >
                {item.label}
              </span>
              {/* Active Indicator */}
              <Show when={tab() === item.id}>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    width: '4px',
                    height: '4px',
                    background: t.colors.primary,
                    'border-radius': '50%',
                    'box-shadow': m.glow.primary,
                  }}
                />
              </Show>
            </button>
          )}
        </For>
      </nav>

      {/* Modals */}
      <Show when={showCreateGroup()}>
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      </Show>
      <Show when={showCreateEvent()}>
        <CreateEventModal onClose={() => setShowCreateEvent(false)} />
      </Show>
      <Show when={acceptingRequest()}>
        <AcceptRequestModal
          request={getRequestById(acceptingRequest()!)!}
          onClose={() => setAcceptingRequest(null)}
        />
      </Show>
    </div>
  );
};

// --- ACCEPT REQUEST MODAL ---

const AcceptRequestModal: Component<{ request: any; onClose: () => void }> = (props) => {
  const [openToGroup, setOpenToGroup] = createSignal(false);
  const [isPublic, setIsPublic] = createSignal(false);
  const [showNames, setShowNames] = createSignal(true);
  const [title, setTitle] = createSignal(`Hangout with ${props.request.requesterName}`);

  const handleAccept = () => {
    store.respondToRequest(props.request.id, 'accepted', {
      openToGroup: openToGroup(),
      isPublic: isPublic(),
      showParticipantNames: showNames(),
      title: title(),
    });
    props.onClose();
  };

  return (
    <Modal title="Accept Hangout" onClose={props.onClose}>
      {/* Request Summary */}
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: '12px',
          padding: '16px',
          background: `${bookingColors.booked}15`,
          'border-radius': t.radii.md,
          border: `1px solid ${bookingColors.booked}30`,
          'margin-bottom': '20px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            'border-radius': '50%',
            background: bookingColors.booked,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            color: 'white',
            'font-size': m.fontSize.xl,
            'font-weight': m.fontWeight.bold,
          }}
        >
          {props.request.requesterName.charAt(0)}
        </div>
        <div>
          <div style={{ color: 'white', 'font-weight': m.fontWeight.semibold }}>
            {props.request.requesterName}
          </div>
          <div style={{ color: t.colors.textMuted, 'font-size': m.fontSize.sm }}>
            {props.request.requestedSlot.dayOfWeek} {props.request.requestedSlot.period}
          </div>
        </div>
      </div>

      {/* Title Input */}
      <div style={{ 'margin-bottom': '16px' }}>
        <label
          style={{
            display: 'block',
            'font-size': m.fontSize.xs,
            color: t.colors.textMuted,
            'margin-bottom': '8px',
            'text-transform': 'uppercase',
            'letter-spacing': '0.5px',
            'font-weight': m.fontWeight.medium,
          }}
        >
          Hangout Title
        </label>
        <input
          type="text"
          value={title()}
          onInput={(e) => setTitle(e.currentTarget.value)}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: t.colors.background,
            border: `1px solid ${t.colors.border}`,
            color: 'white',
            'border-radius': t.radii.md,
            'box-sizing': 'border-box' as const,
            'font-size': m.fontSize.base,
            outline: 'none',
          }}
        />
      </div>

      {/* Toggle Options */}
      <div
        style={{
          display: 'flex',
          'flex-direction': 'column',
          gap: '12px',
          'margin-bottom': '24px',
        }}
      >
        <ToggleSwitch
          checked={openToGroup()}
          onChange={setOpenToGroup}
          label="Open to Group"
          description="Let others join this hangout if they're free"
        />
        <ToggleSwitch
          checked={isPublic()}
          onChange={setIsPublic}
          label="Show on Profile"
          description="Visible to anyone viewing your public link"
        />
        <Show when={isPublic()}>
          <div style={{ 'margin-left': '16px' }}>
            <ToggleSwitch
              checked={showNames()}
              onChange={setShowNames}
              label="Show Participant Names"
              description="If off, shows 'Busy' instead of who's attending"
            />
          </div>
        </Show>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <GradientButton onClick={props.onClose} variant="ghost" style={{ flex: 1 }}>
          Cancel
        </GradientButton>
        <GradientButton onClick={handleAccept} style={{ flex: 1 }}>
          Confirm
        </GradientButton>
      </div>
    </Modal>
  );
};

// --- SETTINGS VIEW ---

const SettingsView: Component = () => {
  const [username, setUsername] = createSignal(store.state.profile.username);
  const [displayName, setDisplayName] = createSignal(store.state.profile.displayName);
  const [bio, setBio] = createSignal(store.state.profile.bio);
  const [saved, setSaved] = createSignal(false);

  const handleSave = () => {
    store.updateProfile({
      username: username(),
      displayName: displayName(),
      bio: bio(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasChanges = () =>
    username() !== store.state.profile.username ||
    displayName() !== store.state.profile.displayName ||
    bio() !== store.state.profile.bio;

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: t.colors.background,
    border: `1px solid ${t.colors.border}`,
    color: 'white',
    'border-radius': t.radii.md,
    'box-sizing': 'border-box' as const,
    'font-size': m.fontSize.base,
    outline: 'none',
    transition: m.transition.fast,
  };

  const labelStyle = {
    display: 'block',
    'font-size': m.fontSize.xs,
    color: t.colors.textMuted,
    'margin-bottom': '8px',
    'text-transform': 'uppercase',
    'letter-spacing': '0.5px',
    'font-weight': m.fontWeight.medium,
  };

  return (
    <div>
      <GlassCard style={{ padding: '24px', 'margin-bottom': '16px' }}>
        <h2
          style={{
            margin: '0 0 24px',
            'font-size': m.fontSize.sm,
            color: t.colors.primary,
            'text-transform': 'uppercase',
            'letter-spacing': '1px',
            'font-weight': m.fontWeight.semibold,
          }}
        >
          Profile Settings
        </h2>

        <div style={{ 'margin-bottom': '20px' }}>
          <label style={labelStyle}>Username</label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: t.colors.textMuted,
                'font-size': m.fontSize.sm,
                'pointer-events': 'none',
                'z-index': 1,
              }}
            >
              friendly.app/
            </span>
            <input
              type="text"
              value={username()}
              onInput={(e) =>
                setUsername(e.currentTarget.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
              }
              placeholder="yourname"
              style={{
                ...inputStyle,
                'padding-left': '110px',
              }}
            />
          </div>
          <p
            style={{
              margin: '8px 0 0',
              'font-size': m.fontSize.xs,
              color: t.colors.textMuted,
            }}
          >
            This is your shareable link. Use only letters, numbers, dashes, and underscores.
          </p>
        </div>

        <div style={{ 'margin-bottom': '20px' }}>
          <label style={labelStyle}>Display Name</label>
          <input
            type="text"
            value={displayName()}
            onInput={(e) => setDisplayName(e.currentTarget.value)}
            placeholder="Your Name"
            style={inputStyle}
          />
          <p
            style={{
              margin: '8px 0 0',
              'font-size': m.fontSize.xs,
              color: t.colors.textMuted,
            }}
          >
            This is shown on your public profile page.
          </p>
        </div>

        <div style={{ 'margin-bottom': '24px' }}>
          <label style={labelStyle}>Bio</label>
          <textarea
            value={bio()}
            onInput={(e) => setBio(e.currentTarget.value)}
            placeholder="Tell friends what you're looking for..."
            rows={3}
            maxLength={160}
            style={{
              ...inputStyle,
              resize: 'none',
              'font-family': 'inherit',
            }}
          />
          <p
            style={{
              margin: '8px 0 0',
              'font-size': m.fontSize.xs,
              color: t.colors.textMuted,
              display: 'flex',
              'justify-content': 'space-between',
            }}
          >
            <span>A short message for your profile visitors.</span>
            <span>{(bio() || '').length}/160</span>
          </p>
        </div>

        <GradientButton
          onClick={handleSave}
          disabled={!hasChanges()}
          size="lg"
          style={{ width: '100%' }}
        >
          <Show when={saved()} fallback="Save Changes">
            <Icons.Check /> Saved!
          </Show>
        </GradientButton>
      </GlassCard>

      {/* Preview Card */}
      <GlassCard style={{ padding: '20px' }}>
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
            'margin-bottom': '16px',
          }}
        >
          <Icons.Eye />
          <span
            style={{
              'font-size': m.fontSize.sm,
              color: t.colors.textMuted,
              'font-weight': m.fontWeight.medium,
            }}
          >
            Preview
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              'border-radius': '50%',
              background: m.gradients.primary,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'font-size': m.fontSize['2xl'],
              color: 'white',
              'font-weight': m.fontWeight.bold,
              'flex-shrink': 0,
            }}
          >
            {displayName().charAt(0) || '?'}
          </div>
          <div style={{ flex: 1, 'min-width': 0 }}>
            <h3
              style={{
                margin: 0,
                'font-size': m.fontSize.lg,
                color: 'white',
                'font-weight': m.fontWeight.semibold,
                'white-space': 'nowrap',
                overflow: 'hidden',
                'text-overflow': 'ellipsis',
              }}
            >
              {displayName() || 'Your Name'}
            </h3>
            <p
              style={{
                margin: '2px 0 0',
                'font-size': m.fontSize.sm,
                color: t.colors.textMuted,
                'white-space': 'nowrap',
                overflow: 'hidden',
                'text-overflow': 'ellipsis',
              }}
            >
              {bio() || 'Your bio goes here...'}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

// --- MODALS ---

const CreateGroupModal: Component<{ onClose: () => void }> = (props) => {
  const [name, setName] = createSignal('');
  const [emoji, setEmoji] = createSignal('');
  const [selectedMembers, setSelectedMembers] = createSignal<string[]>([]);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (name() && selectedMembers().length > 0) {
      store.createGroup(name(), selectedMembers(), emoji() || undefined);
      props.onClose();
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: t.colors.background,
    border: `1px solid ${t.colors.border}`,
    color: 'white',
    'border-radius': t.radii.md,
    'box-sizing': 'border-box' as const,
    'font-size': m.fontSize.base,
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    'font-size': m.fontSize.xs,
    color: t.colors.textMuted,
    'margin-bottom': '8px',
    'text-transform': 'uppercase',
    'letter-spacing': '0.5px',
    'font-weight': m.fontWeight.medium,
  };

  return (
    <Modal title="New Circle" onClose={props.onClose}>
      <div style={{ 'margin-bottom': '20px' }}>
        <label style={labelStyle}>Circle Name</label>
        <input
          type="text"
          value={name()}
          onInput={(e) => setName(e.currentTarget.value)}
          placeholder="e.g. Hiking Crew"
          style={inputStyle}
        />
      </div>

      <div style={{ 'margin-bottom': '20px' }}>
        <label style={labelStyle}>Emoji (optional)</label>
        <input
          type="text"
          value={emoji()}
          onInput={(e) => setEmoji(e.currentTarget.value)}
          placeholder="🥾"
          maxLength={2}
          style={{ ...inputStyle, width: '80px', 'text-align': 'center', 'font-size': '24px' }}
        />
      </div>

      <div style={{ 'margin-bottom': '24px' }}>
        <label style={labelStyle}>Members</label>
        <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '8px' }}>
          <For each={store.state.friends}>
            {(friend) => (
              <button
                onClick={() => toggleMember(friend.id)}
                style={{
                  padding: '10px 14px',
                  background: selectedMembers().includes(friend.id)
                    ? m.gradients.primary
                    : 'transparent',
                  border: `1px solid ${selectedMembers().includes(friend.id) ? t.colors.primary : t.colors.border}`,
                  color: selectedMembers().includes(friend.id) ? 'white' : t.colors.textMuted,
                  'border-radius': t.radii.md,
                  'font-size': m.fontSize.sm,
                  cursor: 'pointer',
                  transition: m.transition.fast,
                  'font-weight': m.fontWeight.medium,
                }}
              >
                {friend.name}
              </button>
            )}
          </For>
        </div>
      </div>

      <GradientButton
        onClick={handleCreate}
        disabled={!name() || selectedMembers().length === 0}
        size="lg"
        style={{ width: '100%' }}
      >
        Create Circle
      </GradientButton>
    </Modal>
  );
};

const CreateEventModal: Component<{ onClose: () => void }> = (props) => {
  const [title, setTitle] = createSignal('');
  const [emoji, setEmoji] = createSignal('');
  const [location, setLocation] = createSignal('');
  const [selectedCircle, setSelectedCircle] = createSignal<string | null>(null);

  const handleCreate = () => {
    if (title()) {
      const invitedIds = selectedCircle()
        ? store.state.groups.find((g) => g.id === selectedCircle())?.members || []
        : [];

      store.createEvent({
        title: title(),
        emoji: emoji() || undefined,
        location: location() || undefined,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        hostId: store.state.profile.id,
        invitedIds,
        visibility: selectedCircle() ? 'circle' : 'private',
        circleId: selectedCircle() || undefined,
      });
      props.onClose();
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: t.colors.background,
    border: `1px solid ${t.colors.border}`,
    color: 'white',
    'border-radius': t.radii.md,
    'box-sizing': 'border-box' as const,
    'font-size': m.fontSize.base,
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    'font-size': m.fontSize.xs,
    color: t.colors.textMuted,
    'margin-bottom': '8px',
    'text-transform': 'uppercase',
    'letter-spacing': '0.5px',
    'font-weight': m.fontWeight.medium,
  };

  return (
    <Modal title="Create Event" onClose={props.onClose}>
      <div style={{ 'margin-bottom': '20px' }}>
        <label style={labelStyle}>What's Happening?</label>
        <input
          type="text"
          value={title()}
          onInput={(e) => setTitle(e.currentTarget.value)}
          placeholder="e.g. Game Night"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', 'margin-bottom': '20px' }}>
        <div style={{ width: '100px' }}>
          <label style={labelStyle}>Emoji</label>
          <input
            type="text"
            value={emoji()}
            onInput={(e) => setEmoji(e.currentTarget.value)}
            placeholder="🎉"
            maxLength={2}
            style={{ ...inputStyle, 'text-align': 'center', 'font-size': '24px' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Where?</label>
          <input
            type="text"
            value={location()}
            onInput={(e) => setLocation(e.currentTarget.value)}
            placeholder="My place, park, etc."
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ 'margin-bottom': '24px' }}>
        <label style={labelStyle}>Invite a Circle (optional)</label>
        <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '8px' }}>
          <For each={store.state.groups}>
            {(group) => (
              <button
                onClick={() => setSelectedCircle((prev) => (prev === group.id ? null : group.id))}
                style={{
                  padding: '10px 14px',
                  background: selectedCircle() === group.id ? m.gradients.primary : 'transparent',
                  border: `1px solid ${selectedCircle() === group.id ? t.colors.primary : t.colors.border}`,
                  color: selectedCircle() === group.id ? 'white' : t.colors.textMuted,
                  'border-radius': t.radii.md,
                  'font-size': m.fontSize.sm,
                  cursor: 'pointer',
                  transition: m.transition.fast,
                  'font-weight': m.fontWeight.medium,
                }}
              >
                {group.emoji || '👥'} {group.name}
              </button>
            )}
          </For>
        </div>
      </div>

      <GradientButton
        onClick={handleCreate}
        disabled={!title()}
        size="lg"
        style={{ width: '100%' }}
      >
        Create Event
      </GradientButton>
    </Modal>
  );
};

// --- MAIN APP ---

export const FriendlyApp: Component = () => {
  return (
    <Show when={store.state.viewMode === 'dashboard'} fallback={<PublicView />}>
      <DashboardView />
    </Show>
  );
};
