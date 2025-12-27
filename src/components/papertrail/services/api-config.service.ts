/**
 * Paper Trail - API Configuration Service
 * Manages optional AI configuration for entity extraction
 * News is fetched server-side - no user API keys needed!
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { ApiConfig, AI_PRESETS } from '../../../schemas/papertrail.schema';

const STORAGE_KEY = 'papertrail-api-config';

export const ApiConfigService = {
  /**
   * Get the current API configuration from localStorage
   */
  getConfig(): ApiConfig | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[PaperTrail] Failed to parse stored API config:', error);
    }
    return null;
  },

  /**
   * Get the AI configuration if enabled
   */
  getAIConfig(): { baseUrl: string; apiKey: string; model: string } | null {
    const config = this.getConfig();
    if (config?.aiEnabled && config?.aiApiKey && config?.aiBaseUrl && config?.aiModel) {
      return {
        baseUrl: config.aiBaseUrl,
        apiKey: config.aiApiKey,
        model: config.aiModel,
      };
    }
    return null;
  },

  /**
   * Check if AI is enabled and configured
   */
  isAIEnabled(): boolean {
    return this.getAIConfig() !== null;
  },

  /**
   * Save API configuration to localStorage
   */
  saveConfig(config: Partial<ApiConfig>): ApiConfig {
    const current = this.getConfig() || {
      aiEnabled: false,
    };

    const updated: ApiConfig = {
      ...current,
      ...config,
      lastUpdated: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log('[PaperTrail] API configuration saved');
      return updated;
    } catch (error) {
      console.error('[PaperTrail] Failed to save API configuration:', error);
      throw new Error('Failed to save API configuration');
    }
  },

  /**
   * Set AI configuration
   */
  setAIConfig(enabled: boolean, baseUrl?: string, apiKey?: string, model?: string): ApiConfig {
    return this.saveConfig({
      aiEnabled: enabled,
      aiBaseUrl: baseUrl?.trim(),
      aiApiKey: apiKey?.trim(),
      aiModel: model?.trim(),
    });
  },

  /**
   * Clear all stored configuration
   */
  clearConfig(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[PaperTrail] API configuration cleared');
    } catch (error) {
      console.error('[PaperTrail] Failed to clear API configuration:', error);
    }
  },

  /**
   * Get AI preset options for UI
   */
  getAIPresets() {
    return Object.entries(AI_PRESETS).map(([id, info]) => ({
      id,
      ...info,
    }));
  },
} as const;
