/**
 * ProfileBuilder - Job search preferences and target occupation selection
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, For, Show } from 'solid-js';
import { pipelineStore } from '../store';
import { liquidTenure, pipelineAnimations } from '../theme/liquid-tenure';
import { FluidCard } from '../ui';
import { UserLocationPreference } from '../../../../schemas/pipeline.schema';
import { STATE_FIPS } from '../../../../data/geographic-codes';
import { searchCareersEnhanced, EnhancedOnetCareer } from '../../../../services/onet';
import { IconPipeline, IconBriefcase, IconCheck } from '../ui/Icons';
import { StarIcon, XIcon } from 'solid-phosphor/bold';

interface ProfileBuilderProps {
  currentTheme: () => Partial<typeof liquidTenure> & typeof liquidTenure;
}

const REMOTE_OPTIONS = [
  { value: 'remote-only', label: 'Remote Only' },
  { value: 'remote-preferred', label: 'Remote Preferred' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site Only' },
  { value: 'flexible', label: 'Flexible / No Preference' },
] as const;

type RemotePreference = (typeof REMOTE_OPTIONS)[number]['value'];

const states = Object.values(STATE_FIPS)
  .filter((s) => s.region !== 'territory')
  .sort((a, b) => a.name.localeCompare(b.name));

export const ProfileBuilder: Component<ProfileBuilderProps> = (props) => {
  const theme = () => props.currentTheme();
  const profile = () => pipelineStore.state.profile;

  // Form state
  const [name, setName] = createSignal(profile()?.name || '');
  const [email, setEmail] = createSignal(profile()?.email || '');
  const [primaryOccupation, setPrimaryOccupation] = createSignal(
    profile()?.primaryOccupation || ''
  );
  const [isEditing, setIsEditing] = createSignal(!profile());
  const [geoCity, setGeoCity] = createSignal(profile()?.geolocation?.city || '');
  const [currentState, setCurrentState] = createSignal(
    profile()?.locationPreferences?.current?.state || profile()?.geolocation?.state || ''
  );
  const [willingToRelocate, setWillingToRelocate] = createSignal(
    profile()?.locationPreferences?.willingToRelocate || false
  );
  const [targetStates, setTargetStates] = createSignal<string[]>(
    profile()?.locationPreferences?.targetLocations?.states || []
  );
  const [remotePreference, setRemotePreference] = createSignal<RemotePreference>(
    (profile()?.locationPreferences?.remotePreference as RemotePreference) || 'flexible'
  );
  const [occupationQuery, setOccupationQuery] = createSignal('');
  const [searchResults, setSearchResults] = createSignal<EnhancedOnetCareer[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [selectedOccupations, setSelectedOccupations] = createSignal<
    { socCode: string; title: string }[]
  >(profile()?.targetOccupations || []);

  let searchTimeout: number;
  const handleOccupationSearch = (query: string) => {
    setOccupationQuery(query);
    clearTimeout(searchTimeout);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    searchTimeout = window.setTimeout(async () => {
      const results = await searchCareersEnhanced(query);
      setSearchResults(results.slice(0, 10));
      setIsSearching(false);
    }, 300);
  };

  const addOccupation = (career: EnhancedOnetCareer) => {
    if (selectedOccupations().length >= 5) return;
    if (selectedOccupations().some((o) => o.socCode === career.code)) return;
    setSelectedOccupations([
      ...selectedOccupations(),
      { socCode: career.code, title: career.title },
    ]);
    setOccupationQuery('');
    setSearchResults([]);
  };

  const removeOccupation = (socCode: string) =>
    setSelectedOccupations(selectedOccupations().filter((o) => o.socCode !== socCode));
  const toggleTargetState = (abbrev: string) => {
    if (targetStates().includes(abbrev))
      setTargetStates(targetStates().filter((s) => s !== abbrev));
    else if (targetStates().length < 5) setTargetStates([...targetStates(), abbrev]);
  };

  const inputStyle = () => ({
    width: '100%',
    padding: '12px 16px',
    background: theme().colors.background,
    border: `1px solid ${theme().colors.border}`,
    'border-radius': '10px',
    color: theme().colors.text,
    'font-size': '14px',
    outline: 'none',
    transition: `border-color ${pipelineAnimations.fast}`,
    'box-sizing': 'border-box' as const,
  });
  const selectStyle = () => ({
    ...inputStyle(),
    cursor: 'pointer',
    appearance: 'none' as const,
    'background-image': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    'background-repeat': 'no-repeat',
    'background-position': 'right 12px center',
    'padding-right': '36px',
  });
  const labelStyle = () => ({
    display: 'block',
    'margin-bottom': '6px',
    'font-size': '13px',
    'font-weight': '500',
    color: theme().colors.textMuted,
  });
  const btnStyle = (active = true) => ({
    padding: '12px 24px',
    background: '#0A0A0A',
    border: active ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.2)',
    'border-radius': '10px',
    color: '#FFFFFF',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-weight': '600',
    cursor: active ? 'pointer' : 'not-allowed',
    opacity: active ? 1 : 0.5,
  });

  const handleSaveProfile = () => {
    if (!name()) return;
    const locationPreferences: UserLocationPreference = {
      current: { state: currentState(), city: geoCity() || undefined },
      willingToRelocate: willingToRelocate(),
      targetLocations: willingToRelocate() ? { states: targetStates() } : undefined,
      remotePreference: remotePreference(),
    };
    if (!profile()) {
      pipelineStore.createProfile(name(), email() || undefined);
      pipelineStore.updateProfile({
        primaryOccupation: primaryOccupation() || undefined,
        geolocation: { city: geoCity(), state: currentState(), country: 'USA' },
        locationPreferences,
        targetOccupations: selectedOccupations(),
      });
    } else {
      pipelineStore.updateProfile({
        name: name(),
        email: email() || undefined,
        primaryOccupation: primaryOccupation() || undefined,
        geolocation: { city: geoCity(), state: currentState(), country: 'USA' },
        locationPreferences,
        targetOccupations: selectedOccupations(),
      });
    }
    setIsEditing(false);
  };

  return (
    <div style={{ 'max-width': '800px' }}>
      {/* Profile Header */}
      <FluidCard style={{ 'margin-bottom': '24px' }}>
        <div
          style={{
            display: 'flex',
            'align-items': 'flex-start',
            'justify-content': 'space-between',
            'margin-bottom': '20px',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 4px', 'font-size': '20px', color: theme().colors.text }}>
              {profile() ? 'Your Profile' : 'Create Your Profile'}
            </h3>
            <p style={{ margin: 0, 'font-size': '14px', color: theme().colors.textMuted }}>
              Set up your job search preferences for personalized labor market insights
            </p>
          </div>
          <Show when={profile() && !isEditing()}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '8px',
                color: theme().colors.textMuted,
                cursor: 'pointer',
                'font-size': '13px',
              }}
            >
              Edit
            </button>
          </Show>
        </div>

        <Show when={isEditing()}>
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
            <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle()}>Name *</label>
                <input
                  type="text"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  placeholder="Your full name"
                  style={inputStyle()}
                />
              </div>
              <div>
                <label style={labelStyle()}>Email</label>
                <input
                  type="email"
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                  placeholder="your@email.com"
                  style={inputStyle()}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle()}>Primary Occupation</label>
              <input
                type="text"
                value={primaryOccupation()}
                onInput={(e) => setPrimaryOccupation(e.currentTarget.value)}
                placeholder="e.g., Software Engineer, Product Manager"
                style={inputStyle()}
              />
            </div>
            <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle()}>City</label>
                <input
                  type="text"
                  value={geoCity()}
                  onInput={(e) => setGeoCity(e.currentTarget.value)}
                  placeholder="San Francisco"
                  style={inputStyle()}
                />
              </div>
              <div>
                <label style={labelStyle()}>State</label>
                <select
                  value={currentState()}
                  onChange={(e) => setCurrentState(e.currentTarget.value)}
                  style={selectStyle()}
                >
                  <option value="">Select state...</option>
                  <For each={states}>
                    {(state) => <option value={state.abbrev}>{state.name}</option>}
                  </For>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', 'margin-top': '8px' }}>
              <button
                class="pipeline-btn"
                onClick={handleSaveProfile}
                disabled={!name()}
                style={btnStyle(!!name())}
              >
                {profile() ? 'Save Changes' : 'Create Profile'}
              </button>
              <Show when={profile()}>
                <button
                  class="pipeline-btn"
                  onClick={() => setIsEditing(false)}
                  style={{
                    ...btnStyle(),
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    opacity: 0.8,
                  }}
                >
                  Cancel
                </button>
              </Show>
            </div>
          </div>
        </Show>

        <Show when={!isEditing() && profile()}>
          <div style={{ display: 'flex', gap: '24px', 'flex-wrap': 'wrap' }}>
            <div>
              <div style={{ 'font-size': '12px', color: theme().colors.textMuted }}>Name</div>
              <div style={{ 'font-size': '16px', color: theme().colors.text }}>
                {profile()!.name}
              </div>
            </div>
            <Show when={profile()!.email}>
              <div>
                <div style={{ 'font-size': '12px', color: theme().colors.textMuted }}>Email</div>
                <div style={{ 'font-size': '16px', color: theme().colors.text }}>
                  {profile()!.email}
                </div>
              </div>
            </Show>
            <Show when={profile()!.primaryOccupation}>
              <div>
                <div style={{ 'font-size': '12px', color: theme().colors.textMuted }}>
                  Looking for
                </div>
                <div style={{ 'font-size': '16px', color: theme().colors.text }}>
                  {profile()!.primaryOccupation}
                </div>
              </div>
            </Show>
            <Show when={geoCity() || currentState()}>
              <div>
                <div style={{ 'font-size': '12px', color: theme().colors.textMuted }}>Location</div>
                <div style={{ 'font-size': '16px', color: theme().colors.text }}>
                  {[geoCity(), currentState()].filter(Boolean).join(', ')}
                </div>
              </div>
            </Show>
          </div>
        </Show>
      </FluidCard>

      {/* Location Preferences */}
      <Show when={profile()}>
        <FluidCard style={{ 'margin-bottom': '24px' }}>
          <h4
            style={{
              margin: '0 0 16px',
              'font-size': '16px',
              'font-family': "'Playfair Display', Georgia, serif",
              'font-weight': '600',
              color: theme().colors.text,
              display: 'flex',
              'align-items': 'center',
              gap: '10px',
            }}
          >
            <IconPipeline size={18} color={theme().colors.primary} /> Location Preferences
          </h4>
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle()}>Remote Preference</label>
              <select
                value={remotePreference()}
                onChange={(e) => setRemotePreference(e.currentTarget.value as RemotePreference)}
                style={selectStyle()}
              >
                <For each={REMOTE_OPTIONS}>
                  {(option) => <option value={option.value}>{option.label}</option>}
                </For>
              </select>
            </div>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '12px',
                padding: '12px 16px',
                background: theme().colors.surfaceLight,
                'border-radius': '10px',
              }}
            >
              <button
                onClick={() => setWillingToRelocate(!willingToRelocate())}
                style={{
                  width: '44px',
                  height: '24px',
                  'border-radius': '12px',
                  border: 'none',
                  background: willingToRelocate() ? theme().colors.primary : theme().colors.border,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    'border-radius': '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: '3px',
                    left: willingToRelocate() ? '23px' : '3px',
                    transition: 'left 0.2s',
                  }}
                />
              </button>
              <span style={{ 'font-size': '14px', color: theme().colors.text }}>
                Willing to relocate
              </span>
            </div>
            <Show when={willingToRelocate()}>
              <div>
                <label style={labelStyle()}>Target States (max 5)</label>
                <div
                  style={{
                    display: 'flex',
                    'flex-wrap': 'wrap',
                    gap: '8px',
                    'max-height': '200px',
                    'overflow-y': 'auto',
                    padding: '12px',
                    background: theme().colors.surfaceLight,
                    'border-radius': '10px',
                  }}
                >
                  <For each={states}>
                    {(state) => {
                      const isSelected = () => targetStates().includes(state.abbrev);
                      const isDisabled = () => !isSelected() && targetStates().length >= 5;
                      return (
                        <button
                          onClick={() => toggleTargetState(state.abbrev)}
                          disabled={isDisabled()}
                          style={{
                            padding: '6px 12px',
                            'border-radius': '16px',
                            border: isSelected()
                              ? `2px solid ${theme().colors.primary}`
                              : `1px solid ${theme().colors.border}`,
                            background: isSelected()
                              ? `${theme().colors.primary}20`
                              : 'transparent',
                            color: isSelected() ? theme().colors.primary : theme().colors.textMuted,
                            'font-size': '12px',
                            cursor: isDisabled() ? 'not-allowed' : 'pointer',
                            opacity: isDisabled() ? 0.5 : 1,
                            display: 'flex',
                            'align-items': 'center',
                            gap: '4px',
                          }}
                        >
                          <Show when={isSelected()}>
                            <IconCheck size={12} color={theme().colors.primary} />
                          </Show>
                          {state.abbrev}
                        </button>
                      );
                    }}
                  </For>
                </div>
              </div>
            </Show>
            <button
              class="pipeline-btn"
              onClick={handleSaveProfile}
              style={{ ...btnStyle(), 'align-self': 'flex-start' }}
            >
              Save Preferences
            </button>
          </div>
        </FluidCard>
      </Show>

      {/* Target Occupations */}
      <Show when={profile()}>
        <FluidCard
          style={{
            overflow: 'visible',
            'padding-bottom': searchResults().length > 0 ? '320px' : '24px',
            'margin-bottom': '24px',
          }}
        >
          <h4
            style={{
              margin: '0 0 8px',
              'font-size': '16px',
              'font-family': "'Playfair Display', Georgia, serif",
              'font-weight': '600',
              color: theme().colors.text,
              display: 'flex',
              'align-items': 'center',
              gap: '10px',
            }}
          >
            <IconBriefcase size={18} color={theme().colors.primary} /> Target Occupations
          </h4>
          <p style={{ margin: '0 0 16px', 'font-size': '13px', color: theme().colors.textMuted }}>
            Search for occupations to get tailored labor market insights (max 5)
          </p>

          <Show when={selectedOccupations().length > 0}>
            <div
              style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '8px', 'margin-bottom': '16px' }}
            >
              <For each={selectedOccupations()}>
                {(occ) => (
                  <span
                    style={{
                      display: 'inline-flex',
                      'align-items': 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: `${theme().colors.primary}15`,
                      border: `1px solid ${theme().colors.primary}40`,
                      'border-radius': '20px',
                      'font-size': '13px',
                      color: theme().colors.text,
                    }}
                  >
                    <span style={{ color: theme().colors.textMuted, 'font-size': '11px' }}>
                      {occ.socCode}
                    </span>
                    {occ.title}
                    <button
                      onClick={() => removeOccupation(occ.socCode)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme().colors.textMuted,
                        cursor: 'pointer',
                        padding: '0',
                        'font-size': '16px',
                        'line-height': '1',
                        display: 'flex',
                        'align-items': 'center',
                      }}
                    >
                      <XIcon width={14} height={14} />
                    </button>
                  </span>
                )}
              </For>
            </div>
          </Show>

          <Show when={selectedOccupations().length < 5}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={occupationQuery()}
                onInput={(e) => handleOccupationSearch(e.currentTarget.value)}
                placeholder="Search occupations (e.g., Software Developer, Nurse)..."
                style={inputStyle()}
              />
              <Show when={isSearching()}>
                <div
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: theme().colors.textMuted,
                    'font-size': '12px',
                  }}
                >
                  Searching...
                </div>
              </Show>
              <Show when={searchResults().length > 0}>
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    'margin-top': '4px',
                    background: theme().colors.surface,
                    border: `1px solid ${theme().colors.border}`,
                    'border-radius': '10px',
                    'box-shadow': '0 4px 12px rgba(0,0,0,0.15)',
                    'max-height': '300px',
                    'overflow-y': 'auto',
                    'z-index': 1000,
                  }}
                >
                  <For each={searchResults()}>
                    {(career) => {
                      const isSelected = () =>
                        selectedOccupations().some((o) => o.socCode === career.code);
                      return (
                        <button
                          onClick={() => addOccupation(career)}
                          disabled={isSelected()}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'transparent',
                            border: 'none',
                            'border-bottom': `1px solid ${theme().colors.border}`,
                            'text-align': 'left',
                            cursor: isSelected() ? 'not-allowed' : 'pointer',
                            opacity: isSelected() ? 0.5 : 1,
                            display: 'flex',
                            'flex-direction': 'column',
                            gap: '4px',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected())
                              e.currentTarget.style.background = theme().colors.surfaceLight;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              'align-items': 'center',
                              gap: '8px',
                              'flex-wrap': 'wrap',
                            }}
                          >
                            <span
                              style={{
                                'font-size': '14px',
                                'font-weight': '500',
                                color: theme().colors.text,
                              }}
                            >
                              {career.title}
                            </span>
                            <Show
                              when={
                                career.matchSource === 'mapped' || career.matchSource === 'both'
                              }
                            >
                              <span
                                style={{
                                  padding: '2px 6px',
                                  background:
                                    career.confidence === 'high' ? '#8B5CF620' : '#8B5CF615',
                                  color: '#8B5CF6',
                                  'border-radius': '4px',
                                  'font-size': '10px',
                                  'font-weight': '600',
                                  display: 'inline-flex',
                                  'align-items': 'center',
                                  gap: '2px',
                                }}
                              >
                                <Show when={career.confidence === 'high'}>
                                  <StarIcon
                                    width={12}
                                    height={12}
                                    style={{ 'margin-right': '2px' }}
                                  />{' '}
                                </Show>
                                Suggested
                              </span>
                            </Show>
                            <Show when={career.tags?.bright_outlook}>
                              <span
                                style={{
                                  padding: '2px 6px',
                                  background: '#22c55e20',
                                  color: '#22c55e',
                                  'border-radius': '4px',
                                  'font-size': '10px',
                                  'font-weight': '600',
                                }}
                              >
                                Bright Outlook
                              </span>
                            </Show>
                            <Show when={career.tags?.green}>
                              <span
                                style={{
                                  padding: '2px 6px',
                                  background: '#16a34a20',
                                  color: '#16a34a',
                                  'border-radius': '4px',
                                  'font-size': '10px',
                                  'font-weight': '600',
                                }}
                              >
                                Green
                              </span>
                            </Show>
                          </div>
                          <Show when={career.mappedFrom}>
                            <span
                              style={{
                                'font-size': '11px',
                                color: '#8B5CF6',
                                'font-style': 'italic',
                              }}
                            >
                              Matches "{career.mappedFrom}"
                            </span>
                          </Show>
                          <span style={{ 'font-size': '12px', color: theme().colors.textMuted }}>
                            SOC: {career.code}
                          </span>
                        </button>
                      );
                    }}
                  </For>
                </div>
              </Show>
            </div>
          </Show>

          <Show when={selectedOccupations().length > 0}>
            <button
              class="pipeline-btn"
              onClick={handleSaveProfile}
              style={{ ...btnStyle(), 'margin-top': '16px' }}
            >
              Save Occupations
            </button>
          </Show>
        </FluidCard>
      </Show>
    </div>
  );
};

export default ProfileBuilder;
