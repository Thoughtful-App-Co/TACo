import { Component } from 'solid-js';
import { LegalPage } from './common/LegalPage';

/**
 * PrivacyPolicyPage - TACo-branded Privacy Policy page
 *
 * Renders the privacy-policy.md content with proper branding and legible typography.
 */
export const PrivacyPolicyPage: Component = () => {
  return <LegalPage title="Privacy Policy" markdownPath="/privacy-policy.md" />;
};
