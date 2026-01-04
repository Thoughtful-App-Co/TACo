/**
 * API Configuration Service
 * Manages user-provided API keys and AI model configuration
 * Supports two modes: "bring-your-own" (user provides key) and "managed" ($3/month)
 * Stores configuration in localStorage for persistence
 */

import { logger } from '../../../lib/logger';

const log = logger.create('APIConfig');

const STORAGE_KEY = 'tempo-api-config';

export type ApiKeyMode = 'bring-your-own' | 'managed';

export interface ApiConfig {
  claudeApiKey?: string;
  apiKeyMode: ApiKeyMode;
  aiModel: 'claude-opus' | 'claude-sonnet' | 'claude-haiku';
  lastUpdated?: string;
  /** For managed mode - tracks if user has an active subscription */
  managedSubscription?: {
    active: boolean;
    startDate?: string;
    stripeCustomerId?: string;
  };
}

export const ApiConfigService = {
  /**
   * Get the current API configuration from localStorage
   */
  getConfig(): ApiConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      log.error('Failed to parse stored API config:', error);
    }

    // Return default config
    return {
      aiModel: 'claude-opus',
      apiKeyMode: 'bring-your-own',
    };
  },

  /**
   * Get just the Claude API key
   */
  getClaudeApiKey(): string | undefined {
    const config = this.getConfig();
    return config.claudeApiKey;
  },

  /**
   * Check if API key is configured
   */
  hasApiKey(): boolean {
    const key = this.getClaudeApiKey();
    return !!key && key.trim().length > 0;
  },

  /**
   * Save API configuration to localStorage
   */
  saveConfig(config: Partial<ApiConfig>): ApiConfig {
    const current = this.getConfig();
    const updated: ApiConfig = {
      ...current,
      ...config,
      lastUpdated: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      log.info('API configuration saved successfully');
      return updated;
    } catch (error) {
      log.error('Failed to save API configuration:', error);
      throw new Error('Failed to save API configuration to localStorage');
    }
  },

  /**
   * Update just the Claude API key
   */
  setClaudeApiKey(apiKey: string): ApiConfig {
    return this.saveConfig({ claudeApiKey: apiKey.trim() });
  },

  /**
   * Clear all stored configuration
   */
  clearConfig(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      log.info('API configuration cleared');
    } catch (error) {
      log.error('Failed to clear API configuration:', error);
    }
  },

  /**
   * Validate API key format (basic check)
   */
  isValidApiKey(apiKey: string): boolean {
    // Claude API keys start with 'sk-'
    return apiKey.trim().startsWith('sk-') && apiKey.trim().length > 10;
  },

  /**
   * Set the API key mode (bring-your-own or managed)
   */
  setApiKeyMode(mode: ApiKeyMode): ApiConfig {
    return this.saveConfig({ apiKeyMode: mode });
  },

  /**
   * Get the current API key mode
   */
  getApiKeyMode(): ApiKeyMode {
    const config = this.getConfig();
    return config.apiKeyMode;
  },

  /**
   * Check if using managed mode
   */
  isManagedMode(): boolean {
    return this.getApiKeyMode() === 'managed';
  },

  /**
   * Check if using bring-your-own mode
   */
  isBringYourOwnMode(): boolean {
    return this.getApiKeyMode() === 'bring-your-own';
  },

  /**
   * Update managed subscription status
   */
  setManagedSubscription(subscription: ApiConfig['managedSubscription']): ApiConfig {
    return this.saveConfig({ managedSubscription: subscription });
  },

  /**
   * Get managed subscription status
   */
  getManagedSubscription() {
    const config = this.getConfig();
    return config.managedSubscription || { active: false };
  },

  /**
   * Check if managed subscription is active
   */
  hasManagedSubscription(): boolean {
    const subscription = this.getManagedSubscription();
    return subscription.active === true;
  },
} as const;
