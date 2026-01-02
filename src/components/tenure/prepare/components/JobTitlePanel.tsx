/**
 * JobTitlePanel - Create resume variant for a specific job title/role
 *
 * Different from MutationPanel (JD-based):
 * - Uses O*NET occupation search instead of JD text
 * - Fetches role requirements from O*NET API
 * - Shows RIASEC-based suggestions as clickable chips
 * - Transforms resume to match role archetype
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show, For, createEffect, onCleanup } from 'solid-js';
import {
  searchOccupationByTitle,
  getOccupationDetails,
  type OnetOccupationSkills,
} from '../../../../services/onet';
import { getMutationsRemaining, getUsageSummary } from '../../../../lib/usage-tracker';
import { canUseMutation } from '../../../../lib/feature-gates';
import { IconSearch, IconLoader } from '../../pipeline/ui/Icons';

interface JobTitlePanelProps {
  onMutate: (params: {
    occupationCode: string;
    occupationTitle: string;
    occupationData: OnetOccupationSkills;
    tone: 'professional' | 'technical' | 'executive' | 'casual';
    length: 'concise' | 'detailed';
  }) => void;
  isLoading?: boolean;
  riasecScores?: { code: string; score: number; label: string }[];
  currentTheme: () => any;
}

interface OccupationResult {
  code: string;
  title: string;
}

export const JobTitlePanel: Component<JobTitlePanelProps> = (props) => {
  const theme = () => props.currentTheme();

  const [searchQuery, setSearchQuery] = createSignal('');
  const [searchResults, setSearchResults] = createSignal<OccupationResult[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [selectedOccupation, setSelectedOccupation] = createSignal<OccupationResult | null>(null);
  const [occupationData, setOccupationData] = createSignal<OnetOccupationSkills | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = createSignal(false);
  const [tone, setTone] = createSignal<'professional' | 'technical' | 'executive' | 'casual'>(
    'professional'
  );
  const [length, setLength] = createSignal<'concise' | 'detailed'>('concise');
  const [error, setError] = createSignal<string | null>(null);
  const [showDropdown, setShowDropdown] = createSignal(false);

  // Debounced search
  let searchTimeout: ReturnType<typeof setTimeout>;

  createEffect(() => {
    const query = searchQuery();
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchOccupationByTitle(query);
        setSearchResults(results.slice(0, 10)); // Limit to 10 results
        setShowDropdown(results.length > 0);
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  });

  onCleanup(() => clearTimeout(searchTimeout));

  // Load occupation details when selected
  createEffect(() => {
    const occupation = selectedOccupation();
    if (!occupation) {
      setOccupationData(null);
      return;
    }

    setIsLoadingDetails(true);
    getOccupationDetails(occupation.code)
      .then((data) => {
        setOccupationData(data);
      })
      .catch((e) => {
        console.error('Failed to load occupation details:', e);
        setError('Failed to load occupation details');
      })
      .finally(() => {
        setIsLoadingDetails(false);
      });
  });

  const handleSelectOccupation = (occupation: OccupationResult) => {
    setSelectedOccupation(occupation);
    setSearchQuery(occupation.title);
    setShowDropdown(false);
  };

  const handleSelectSuggestion = (title: string) => {
    setSearchQuery(title);
    // Trigger search
  };

  const usageSummary = () => getUsageSummary();
  const canMutate = () => {
    const access = canUseMutation();
    const hasQuota = getMutationsRemaining() > 0;
    return access.allowed && hasQuota;
  };

  const handleMutate = () => {
    setError(null);

    if (!selectedOccupation()) {
      setError('Please select a job title from the search results');
      return;
    }

    if (!occupationData()) {
      setError('Please wait for occupation data to load');
      return;
    }

    if (!canMutate()) {
      setError('You have reached your mutation limit for this month');
      return;
    }

    props.onMutate({
      occupationCode: selectedOccupation()!.code,
      occupationTitle: selectedOccupation()!.title,
      occupationData: occupationData()!,
      tone: tone(),
      length: length(),
    });
  };

  // RIASEC-based suggestions
  const getRiasecSuggestions = (): string[] => {
    if (!props.riasecScores || props.riasecScores.length === 0) {
      return [];
    }

    const topCode = props.riasecScores[0].code.toUpperCase();
    const suggestions: Record<string, string[]> = {
      R: [
        'Mechanical Engineer',
        'Electrician',
        'Construction Manager',
        'Lab Technician',
        'Civil Engineer',
      ],
      I: [
        'Data Scientist',
        'Software Developer',
        'Research Scientist',
        'Financial Analyst',
        'Pharmacist',
      ],
      A: ['Graphic Designer', 'UX Designer', 'Marketing Manager', 'Content Writer', 'Architect'],
      S: [
        'Registered Nurse',
        'Teacher',
        'Social Worker',
        'Human Resources Manager',
        'Physical Therapist',
      ],
      E: [
        'Sales Manager',
        'Business Analyst',
        'Project Manager',
        'Real Estate Agent',
        'Operations Manager',
      ],
      C: [
        'Accountant',
        'Financial Analyst',
        'Administrative Manager',
        'Quality Assurance',
        'Compliance Officer',
      ],
    };

    return suggestions[topCode] || [];
  };

  return (
    <div
      style={{
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${theme().colors.border}`,
        'border-radius': '16px',
      }}
    >
      {/* Header */}
      <div style={{ 'margin-bottom': '24px' }}>
        <h3
          style={{
            margin: '0 0 8px',
            'font-size': '24px',
            color: theme().colors.text,
            'font-family': theme().fonts.heading,
          }}
        >
          Create Resume for Job Title
        </h3>
        <p
          style={{
            margin: 0,
            'font-size': '14px',
            color: theme().colors.textMuted,
          }}
        >
          Search for a role and we'll optimize your resume using industry-standard requirements from
          O*NET
        </p>
      </div>

      {/* RIASEC Suggestions */}
      <Show when={getRiasecSuggestions().length > 0}>
        <div style={{ 'margin-bottom': '24px' }}>
          <label
            style={{
              display: 'block',
              'margin-bottom': '12px',
              'font-size': '14px',
              'font-weight': '600',
              color: theme().colors.text,
            }}
          >
            Suggested based on your profile
          </label>
          <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '10px' }}>
            <For each={getRiasecSuggestions()}>
              {(suggestion) => (
                <button
                  onClick={() => handleSelectSuggestion(suggestion)}
                  style={{
                    padding: '10px 16px',
                    background: `${theme().colors.primary}15`,
                    border: `1px solid ${theme().colors.primary}40`,
                    'border-radius': '8px',
                    color: theme().colors.text,
                    'font-size': '14px',
                    'font-weight': '500',
                    cursor: 'pointer',
                    'font-family': theme().fonts.body,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${theme().colors.primary}25`;
                    e.currentTarget.style.borderColor = theme().colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${theme().colors.primary}15`;
                    e.currentTarget.style.borderColor = `${theme().colors.primary}40`;
                  }}
                >
                  {suggestion}
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Job Title Search */}
      <div style={{ 'margin-bottom': '24px', position: 'relative' }}>
        <label
          style={{
            display: 'block',
            'margin-bottom': '8px',
            'font-size': '14px',
            'font-weight': '600',
            color: theme().colors.text,
          }}
        >
          Search Job Title *
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={searchQuery()}
            onInput={(e) => {
              setSearchQuery(e.currentTarget.value);
              setSelectedOccupation(null);
            }}
            onFocus={() => searchResults().length > 0 && setShowDropdown(true)}
            placeholder="e.g., Software Developer, Registered Nurse, Project Manager..."
            disabled={props.isLoading}
            style={{
              width: '100%',
              padding: '14px 16px',
              'padding-left': '44px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${selectedOccupation() ? theme().colors.success : theme().colors.border}`,
              'border-radius': '10px',
              color: theme().colors.text,
              'font-family': theme().fonts.body,
              'font-size': '15px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme().colors.textMuted,
            }}
          >
            <Show when={isSearching()} fallback={<IconSearch size={18} />}>
              <IconLoader size={18} />
            </Show>
          </div>
        </div>

        {/* Search Results Dropdown */}
        <Show when={showDropdown() && searchResults().length > 0}>
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              'margin-top': '4px',
              background: theme().colors.background,
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '10px',
              'box-shadow': '0 8px 24px rgba(0, 0, 0, 0.4)',
              'z-index': 100,
              overflow: 'hidden',
              'max-height': '300px',
              'overflow-y': 'auto',
            }}
          >
            <For each={searchResults()}>
              {(result) => (
                <button
                  onClick={() => handleSelectOccupation(result)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'transparent',
                    border: 'none',
                    'border-bottom': `1px solid ${theme().colors.border}`,
                    color: theme().colors.text,
                    'font-size': '14px',
                    'text-align': 'left',
                    cursor: 'pointer',
                    'font-family': theme().fonts.body,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ 'font-weight': '500' }}>{result.title}</div>
                  <div
                    style={{
                      'font-size': '12px',
                      color: theme().colors.textMuted,
                      'margin-top': '2px',
                    }}
                  >
                    O*NET Code: {result.code}
                  </div>
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* Selected Occupation Details */}
      <Show when={selectedOccupation()}>
        <div
          style={{
            'margin-bottom': '24px',
            padding: '20px',
            background: `${theme().colors.success}10`,
            border: `1px solid ${theme().colors.success}40`,
            'border-radius': '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'flex-start',
            }}
          >
            <div>
              <h4
                style={{
                  margin: '0 0 4px',
                  'font-size': '18px',
                  color: theme().colors.text,
                  'font-family': theme().fonts.heading,
                }}
              >
                {selectedOccupation()!.title}
              </h4>
              <p style={{ margin: 0, 'font-size': '13px', color: theme().colors.textMuted }}>
                O*NET Code: {selectedOccupation()!.code}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedOccupation(null);
                setSearchQuery('');
              }}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '6px',
                color: theme().colors.textMuted,
                'font-size': '12px',
                cursor: 'pointer',
              }}
            >
              Change
            </button>
          </div>

          {/* Occupation Data Preview */}
          <Show when={isLoadingDetails()}>
            <div
              style={{ 'margin-top': '16px', display: 'flex', 'align-items': 'center', gap: '8px' }}
            >
              <IconLoader size={16} color={theme().colors.textMuted} />
              <span style={{ 'font-size': '13px', color: theme().colors.textMuted }}>
                Loading role requirements...
              </span>
            </div>
          </Show>

          <Show when={occupationData() && !isLoadingDetails()}>
            <div style={{ 'margin-top': '16px' }}>
              <div style={{ 'margin-bottom': '12px' }}>
                <div
                  style={{
                    'font-size': '12px',
                    'font-weight': '600',
                    color: theme().colors.text,
                    'margin-bottom': '6px',
                  }}
                >
                  Key Skills ({occupationData()!.skills.length})
                </div>
                <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '6px' }}>
                  <For each={occupationData()!.skills.slice(0, 6)}>
                    {(skill) => (
                      <span
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          'border-radius': '4px',
                          'font-size': '12px',
                          color: theme().colors.text,
                        }}
                      >
                        {skill.name}
                      </span>
                    )}
                  </For>
                  <Show when={occupationData()!.skills.length > 6}>
                    <span
                      style={{
                        'font-size': '12px',
                        color: theme().colors.textMuted,
                        'align-self': 'center',
                      }}
                    >
                      +{occupationData()!.skills.length - 6} more
                    </span>
                  </Show>
                </div>
              </div>

              <div>
                <div
                  style={{
                    'font-size': '12px',
                    'font-weight': '600',
                    color: theme().colors.text,
                    'margin-bottom': '6px',
                  }}
                >
                  Technologies ({occupationData()!.technologies.length})
                </div>
                <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '6px' }}>
                  <For each={occupationData()!.technologies.slice(0, 6)}>
                    {(tech) => (
                      <span
                        style={{
                          padding: '4px 10px',
                          background: `${theme().colors.primary}20`,
                          'border-radius': '4px',
                          'font-size': '12px',
                          color: theme().colors.primary,
                        }}
                      >
                        {tech}
                      </span>
                    )}
                  </For>
                  <Show when={occupationData()!.technologies.length > 6}>
                    <span
                      style={{
                        'font-size': '12px',
                        color: theme().colors.textMuted,
                        'align-self': 'center',
                      }}
                    >
                      +{occupationData()!.technologies.length - 6} more
                    </span>
                  </Show>
                </div>
              </div>
            </div>
          </Show>
        </div>
      </Show>

      {/* Preferences */}
      <div style={{ 'margin-bottom': '24px' }}>
        <h4
          style={{
            margin: '0 0 16px',
            'font-size': '16px',
            color: theme().colors.text,
            'font-family': theme().fonts.heading,
          }}
        >
          Preferences
        </h4>

        {/* Tone */}
        <div style={{ 'margin-bottom': '16px' }}>
          <label
            style={{
              display: 'block',
              'margin-bottom': '8px',
              'font-size': '14px',
              'font-weight': '600',
              color: theme().colors.text,
            }}
          >
            Tone
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <For each={['professional', 'technical', 'executive', 'casual'] as const}>
              {(option) => (
                <button
                  onClick={() => setTone(option)}
                  disabled={props.isLoading}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background:
                      tone() === option ? theme().gradients.primary : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${tone() === option ? 'transparent' : theme().colors.border}`,
                    'border-radius': '8px',
                    color: tone() === option ? theme().colors.textOnPrimary : theme().colors.text,
                    'font-family': theme().fonts.body,
                    'font-size': '14px',
                    'font-weight': '600',
                    cursor: props.isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    'text-transform': 'capitalize',
                  }}
                >
                  {option}
                </button>
              )}
            </For>
          </div>
        </div>

        {/* Length */}
        <div>
          <label
            style={{
              display: 'block',
              'margin-bottom': '8px',
              'font-size': '14px',
              'font-weight': '600',
              color: theme().colors.text,
            }}
          >
            Length
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <For each={['concise', 'detailed'] as const}>
              {(option) => (
                <button
                  onClick={() => setLength(option)}
                  disabled={props.isLoading}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background:
                      length() === option ? theme().gradients.primary : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${length() === option ? 'transparent' : theme().colors.border}`,
                    'border-radius': '8px',
                    color: length() === option ? theme().colors.textOnPrimary : theme().colors.text,
                    'font-family': theme().fonts.body,
                    'font-size': '14px',
                    'font-weight': '600',
                    cursor: props.isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    'text-transform': 'capitalize',
                  }}
                >
                  {option}
                </button>
              )}
            </For>
          </div>
        </div>
      </div>

      {/* Error Message */}
      <Show when={error()}>
        <div
          style={{
            'margin-bottom': '16px',
            padding: '12px 16px',
            background: `${theme().colors.error}20`,
            border: `1px solid ${theme().colors.error}`,
            'border-radius': '8px',
            color: theme().colors.error,
            'font-size': '14px',
          }}
        >
          {error()}
        </div>
      </Show>

      {/* Action Button */}
      <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between' }}>
        <button
          onClick={handleMutate}
          disabled={props.isLoading || !canMutate() || !selectedOccupation() || !occupationData()}
          style={{
            padding: '14px 32px',
            background:
              canMutate() && selectedOccupation() && occupationData()
                ? theme().gradients.primary
                : theme().colors.border,
            border: 'none',
            'border-radius': '10px',
            color:
              canMutate() && selectedOccupation()
                ? theme().colors.textOnPrimary
                : theme().colors.textMuted,
            'font-family': theme().fonts.body,
            'font-size': '16px',
            'font-weight': '600',
            cursor:
              props.isLoading || !canMutate() || !selectedOccupation() ? 'not-allowed' : 'pointer',
            opacity: props.isLoading ? 0.6 : 1,
          }}
        >
          {props.isLoading ? 'Creating Variant...' : 'Create Resume Variant'}
        </button>

        <div
          style={{
            'font-size': '14px',
            color: theme().colors.textMuted,
          }}
        >
          {usageSummary().mutations.remaining === -1
            ? 'Unlimited mutations'
            : `${usageSummary().mutations.remaining}/${usageSummary().mutations.limit} mutations left`}
        </div>
      </div>
    </div>
  );
};
