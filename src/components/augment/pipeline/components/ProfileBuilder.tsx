/**
 * ProfileBuilder - Resume and experience management with AI parsing
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, For, Show } from 'solid-js';
import { pipelineStore } from '../store';
import { liquidAugment, pipelineAnimations } from '../theme/liquid-augment';
import { FluidCard } from '../ui';
import { WorkExperience } from '../../../../schemas/pipeline.schema';
import { IconBriefcase, IconFileText, IconZap, IconPlus, IconX } from '../ui/Icons';

interface ProfileBuilderProps {
  currentTheme: () => Partial<typeof liquidAugment> & typeof liquidAugment;
}

export const ProfileBuilder: Component<ProfileBuilderProps> = (props) => {
  const theme = () => props.currentTheme();
  const profile = () => pipelineStore.state.profile;

  // Form state
  const [name, setName] = createSignal(profile()?.name || '');
  const [email, setEmail] = createSignal(profile()?.email || '');
  const [resumeText, setResumeText] = createSignal(profile()?.rawResumeText || '');
  const [skills, setSkills] = createSignal<string[]>(profile()?.skills || []);
  const [newSkill, setNewSkill] = createSignal('');
  const [isEditing, setIsEditing] = createSignal(!profile());
  const [activeExperience, setActiveExperience] = createSignal<string | null>(null);

  // Experience form
  const [expCompany, setExpCompany] = createSignal('');
  const [expTitle, setExpTitle] = createSignal('');
  const [expDescription, setExpDescription] = createSignal('');
  const [expElaboration, setExpElaboration] = createSignal('');
  const [showAddExperience, setShowAddExperience] = createSignal(false);

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

  const labelStyle = () => ({
    display: 'block',
    'margin-bottom': '6px',
    'font-size': '13px',
    'font-weight': '500',
    color: theme().colors.textMuted,
  });

  const handleSaveProfile = () => {
    if (!name()) return;

    if (!profile()) {
      pipelineStore.createProfile(name(), email() || undefined);
    } else {
      pipelineStore.updateProfile({
        name: name(),
        email: email() || undefined,
        rawResumeText: resumeText() || undefined,
        skills: skills(),
      });
    }
    setIsEditing(false);
  };

  const handleAddSkill = () => {
    if (newSkill() && !skills().includes(newSkill())) {
      setSkills([...skills(), newSkill()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills().filter((s) => s !== skill));
  };

  const handleAddExperience = () => {
    if (!expCompany() || !expTitle()) return;

    const exp: Omit<WorkExperience, 'id'> = {
      company: expCompany(),
      title: expTitle(),
      description: expDescription(),
      elaboration: expElaboration() || undefined,
      startDate: new Date(),
      skills: [],
      achievements: [],
    };

    pipelineStore.addExperience(exp);

    // Reset form
    setExpCompany('');
    setExpTitle('');
    setExpDescription('');
    setExpElaboration('');
    setShowAddExperience(false);
  };

  const handleUpdateElaboration = (expId: string, elaboration: string) => {
    pipelineStore.updateExperience(expId, { elaboration });
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
            <h3
              style={{
                margin: '0 0 4px',
                'font-size': '20px',
                color: theme().colors.text,
              }}
            >
              {profile() ? 'Your Profile' : 'Create Your Profile'}
            </h3>
            <p
              style={{
                margin: 0,
                'font-size': '14px',
                color: theme().colors.textMuted,
              }}
            >
              {profile()
                ? 'Your profile is used to match against job requirements'
                : 'Set up your profile to get personalized job matching'}
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

            <div style={{ display: 'flex', gap: '12px', 'margin-top': '8px' }}>
              <button
                class="pipeline-btn"
                onClick={handleSaveProfile}
                disabled={!name()}
                style={{
                  padding: '12px 24px',
                  background: '#0A0A0A',
                  border: name() ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.2)',
                  'border-radius': '10px',
                  color: '#FFFFFF',
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  'font-weight': '600',
                  cursor: name() ? 'pointer' : 'not-allowed',
                  opacity: name() ? 1 : 0.5,
                }}
              >
                {profile() ? 'Save Changes' : 'Create Profile'}
              </button>
              <Show when={profile()}>
                <button
                  class="pipeline-btn"
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '12px 24px',
                    background: '#0A0A0A',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    'border-radius': '10px',
                    color: '#FFFFFF',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    cursor: 'pointer',
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
          <div style={{ display: 'flex', gap: '24px' }}>
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
          </div>
        </Show>
      </FluidCard>

      {/* Skills Section */}
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
            <IconZap size={18} color={theme().colors.primary} /> Skills
          </h4>

          {/* Skill Tags */}
          <div
            style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '8px', 'margin-bottom': '16px' }}
          >
            <For each={skills()}>
              {(skill) => (
                <span
                  style={{
                    display: 'inline-flex',
                    'align-items': 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: `${theme().colors.primary}20`,
                    border: `1px solid ${theme().colors.primary}40`,
                    'border-radius': '20px',
                    'font-size': '13px',
                    color: theme().colors.primary,
                  }}
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: theme().colors.primary,
                      cursor: 'pointer',
                      padding: '0',
                      'font-size': '14px',
                      'line-height': '1',
                    }}
                  >
                    ×
                  </button>
                </span>
              )}
            </For>
          </div>

          {/* Add Skill Input */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newSkill()}
              onInput={(e) => setNewSkill(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
              placeholder="Add a skill..."
              style={{ ...inputStyle(), flex: '1' }}
            />
            <button
              class="pipeline-btn"
              onClick={handleAddSkill}
              disabled={!newSkill()}
              style={{
                padding: '12px 20px',
                background: '#0A0A0A',
                border: newSkill() ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.2)',
                'border-radius': '10px',
                color: '#FFFFFF',
                cursor: newSkill() ? 'pointer' : 'not-allowed',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'font-weight': '600',
                opacity: newSkill() ? 1 : 0.5,
              }}
            >
              Add
            </button>
          </div>
        </FluidCard>
      </Show>

      {/* Experience Section */}
      <Show when={profile()}>
        <FluidCard style={{ 'margin-bottom': '24px' }}>
          <div
            style={{
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'center',
              'margin-bottom': '16px',
            }}
          >
            <h4
              style={{
                margin: 0,
                'font-size': '16px',
                'font-family': "'Playfair Display', Georgia, serif",
                'font-weight': '600',
                color: theme().colors.text,
                display: 'flex',
                'align-items': 'center',
                gap: '10px',
              }}
            >
              <IconBriefcase size={18} color={theme().colors.primary} /> Experience
            </h4>
            <button
              onClick={() => setShowAddExperience(!showAddExperience())}
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '6px',
                padding: '6px 14px',
                background: 'transparent',
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '8px',
                color: theme().colors.textMuted,
                cursor: 'pointer',
                'font-size': '13px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
              }}
            >
              {showAddExperience() ? (
                <>
                  <IconX size={14} /> Cancel
                </>
              ) : (
                <>
                  <IconPlus size={14} /> Add
                </>
              )}
            </button>
          </div>

          {/* Add Experience Form */}
          <Show when={showAddExperience()}>
            <div
              style={{
                padding: '16px',
                background: theme().colors.surfaceLight,
                'border-radius': '12px',
                'margin-bottom': '16px',
              }}
            >
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle()}>Company *</label>
                    <input
                      type="text"
                      value={expCompany()}
                      onInput={(e) => setExpCompany(e.currentTarget.value)}
                      placeholder="Company name"
                      style={inputStyle()}
                    />
                  </div>
                  <div>
                    <label style={labelStyle()}>Title *</label>
                    <input
                      type="text"
                      value={expTitle()}
                      onInput={(e) => setExpTitle(e.currentTarget.value)}
                      placeholder="Job title"
                      style={inputStyle()}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle()}>Description</label>
                  <textarea
                    value={expDescription()}
                    onInput={(e) => setExpDescription(e.currentTarget.value)}
                    placeholder="What did you do in this role?"
                    rows={3}
                    style={{ ...inputStyle(), resize: 'vertical', 'font-family': 'inherit' }}
                  />
                </div>
                <div>
                  <label style={labelStyle()}>Your Story (elaborate on this experience)</label>
                  <textarea
                    value={expElaboration()}
                    onInput={(e) => setExpElaboration(e.currentTarget.value)}
                    placeholder="Write about your achievements, challenges overcome, skills gained..."
                    rows={4}
                    style={{ ...inputStyle(), resize: 'vertical', 'font-family': 'inherit' }}
                  />
                </div>
                <button
                  class="pipeline-btn"
                  onClick={handleAddExperience}
                  disabled={!expCompany() || !expTitle()}
                  style={{
                    padding: '12px',
                    background: '#0A0A0A',
                    border:
                      expCompany() && expTitle()
                        ? '2px solid #FFFFFF'
                        : '1px solid rgba(255, 255, 255, 0.2)',
                    'border-radius': '10px',
                    color: '#FFFFFF',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    'font-weight': '600',
                    cursor: expCompany() && expTitle() ? 'pointer' : 'not-allowed',
                    opacity: expCompany() && expTitle() ? 1 : 0.5,
                  }}
                >
                  Add Experience
                </button>
              </div>
            </div>
          </Show>

          {/* Experience List */}
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
            <For each={profile()!.experiences}>
              {(exp) => (
                <div
                  style={{
                    padding: '16px',
                    background: theme().colors.surfaceLight,
                    'border-radius': '12px',
                    border: `1px solid ${theme().colors.border}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      'justify-content': 'space-between',
                      'margin-bottom': '8px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          'font-size': '15px',
                          'font-weight': '600',
                          color: theme().colors.text,
                        }}
                      >
                        {exp.title}
                      </div>
                      <div
                        style={{
                          'font-size': '13px',
                          color: theme().colors.textMuted,
                        }}
                      >
                        {exp.company}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setActiveExperience(activeExperience() === exp.id ? null : exp.id)
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme().colors.primary,
                        cursor: 'pointer',
                        'font-size': '13px',
                      }}
                    >
                      {activeExperience() === exp.id ? 'Close' : 'Elaborate'}
                    </button>
                  </div>

                  <Show when={exp.description}>
                    <p
                      style={{
                        margin: '0 0 12px',
                        'font-size': '13px',
                        color: theme().colors.textMuted,
                        'line-height': '1.5',
                      }}
                    >
                      {exp.description}
                    </p>
                  </Show>

                  <Show when={activeExperience() === exp.id}>
                    <div style={{ 'margin-top': '12px' }}>
                      <label style={{ ...labelStyle(), color: theme().colors.primary }}>
                        Tell your story for this role:
                      </label>
                      <textarea
                        value={exp.elaboration || ''}
                        onInput={(e) => handleUpdateElaboration(exp.id, e.currentTarget.value)}
                        placeholder="What did you accomplish? What challenges did you overcome? What skills did you develop?"
                        rows={5}
                        style={{ ...inputStyle(), resize: 'vertical', 'font-family': 'inherit' }}
                      />
                      <p
                        style={{
                          margin: '8px 0 0',
                          'font-size': '12px',
                          color: theme().colors.textMuted,
                        }}
                      >
                        This helps us better match you to job requirements
                      </p>
                    </div>
                  </Show>
                </div>
              )}
            </For>

            <Show when={profile()!.experiences.length === 0}>
              <div
                style={{
                  'text-align': 'center',
                  padding: '32px',
                  color: theme().colors.textMuted,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'center',
                    'margin-bottom': '12px',
                    opacity: '0.7',
                  }}
                >
                  <IconBriefcase size={32} color={theme().colors.textMuted} />
                </div>
                <p
                  style={{
                    margin: 0,
                    'font-size': '14px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                  }}
                >
                  No experience added yet. Add your work history to improve job matching.
                </p>
              </div>
            </Show>
          </div>
        </FluidCard>
      </Show>

      {/* Resume Paste Section */}
      <Show when={profile()}>
        <FluidCard>
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
            <IconFileText size={18} color={theme().colors.primary} /> Resume Text
          </h4>
          <p
            style={{
              margin: '0 0 16px',
              'font-size': '13px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: theme().colors.textMuted,
            }}
          >
            Paste your resume text here. We'll use it to extract keywords for job matching.
          </p>
          <textarea
            value={resumeText()}
            onInput={(e) => setResumeText(e.currentTarget.value)}
            placeholder="Paste your resume content here..."
            rows={8}
            style={{ ...inputStyle(), resize: 'vertical', 'font-family': 'inherit' }}
          />
          <Show when={resumeText() !== (profile()?.rawResumeText || '')}>
            <button
              class="pipeline-btn"
              onClick={() => {
                pipelineStore.updateProfile({ rawResumeText: resumeText() });
              }}
              style={{
                'margin-top': '12px',
                padding: '12px 24px',
                background: '#0A0A0A',
                border: '2px solid #FFFFFF',
                'border-radius': '10px',
                color: '#FFFFFF',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'font-weight': '600',
                cursor: 'pointer',
              }}
            >
              Save Resume
            </button>
          </Show>
        </FluidCard>
      </Show>
    </div>
  );
};

export default ProfileBuilder;
