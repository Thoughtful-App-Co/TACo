import { Component } from 'solid-js';
import { LegalPage } from './common/LegalPage';

/**
 * TermsOfServicePage - TACo-branded Terms of Service page
 *
 * Renders the terms-of-service.md content with proper branding and legible typography.
 */
export const TermsOfServicePage: Component = () => {
  return <LegalPage title="Terms of Service" markdownPath="/terms-of-service.md" />;
};
