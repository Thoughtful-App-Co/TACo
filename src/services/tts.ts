import { logger } from '../lib/logger';
import type { TTSSettings } from '../schemas/echoprax.schema';

const log = logger.create('TTS');

/**
 * Text-to-Speech Service using Web Speech Synthesis API
 * Provides voice coaching for workout sessions
 */
class TTSService {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private settings: TTSSettings;

  constructor() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      throw new Error('Speech Synthesis API not available');
    }

    this.synth = window.speechSynthesis;
    this.settings = this.loadSettings();

    // Load voices when available
    if (this.synth.getVoices().length > 0) {
      this.loadPreferredVoice();
    } else {
      this.synth.addEventListener('voiceschanged', () => this.loadPreferredVoice());
    }

    log.info('TTS Service initialized');
  }

  /**
   * Load TTS settings from localStorage
   */
  private loadSettings(): TTSSettings {
    const stored = localStorage.getItem('echoprax_tts_settings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        log.error('Failed to parse TTS settings', error);
      }
    }

    // Default settings
    return {
      enabled: true,
      volume: 0.8,
      rate: 1.0,
      pitch: 1.0,
    };
  }

  /**
   * Save TTS settings to localStorage
   */
  private saveSettings(): void {
    localStorage.setItem('echoprax_tts_settings', JSON.stringify(this.settings));
  }

  /**
   * Load preferred voice or select best available
   */
  private loadPreferredVoice(): void {
    const voices = this.synth.getVoices();

    if (voices.length === 0) {
      log.warn('No voices available');
      return;
    }

    // Try to load saved voice
    if (this.settings.voiceUri) {
      const savedVoice = voices.find((v) => v.voiceURI === this.settings.voiceUri);
      if (savedVoice) {
        this.voice = savedVoice;
        log.info('Loaded saved voice', { name: savedVoice.name });
        return;
      }
    }

    // Select best default voice
    this.voice = this.selectBestDefaultVoice(voices);
    if (this.voice) {
      this.settings.voiceUri = this.voice.voiceURI;
      this.saveSettings();
      log.info('Selected default voice', { name: this.voice.name });
    }
  }

  /**
   * Select best default voice based on platform
   */
  private selectBestDefaultVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const preferredVoices = [
      'Samantha', // iOS/macOS
      'Google US English', // Android
      'Microsoft David Desktop', // Windows
      'Google UK English Male', // Cross-platform
    ];

    for (const preferred of preferredVoices) {
      const voice = voices.find((v) => v.name.includes(preferred));
      if (voice) return voice;
    }

    // Fallback: first English voice or any voice
    return voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
  }

  /**
   * Speak text with TTS
   */
  speak(text: string, options?: { onEnd?: () => void; priority?: boolean }): void {
    if (!this.settings.enabled) {
      log.debug('TTS disabled, skipping', { text });
      return;
    }

    // Cancel existing speech if priority
    if (options?.priority) {
      this.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);

    if (this.voice) {
      utterance.voice = this.voice;
    }

    utterance.volume = this.settings.volume;
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;

    if (options?.onEnd) {
      utterance.onend = options.onEnd;
    }

    utterance.onerror = (event) => {
      log.error('TTS error', event);
    };

    this.synth.speak(utterance);
    log.debug('Speaking', { text });
  }

  /**
   * Cancel all pending speech
   */
  cancel(): void {
    this.synth.cancel();
  }

  /**
   * Pause speech
   */
  pause(): void {
    this.synth.pause();
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    this.synth.resume();
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synth.speaking;
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  /**
   * Set voice by URI
   */
  setVoice(voiceUri: string): void {
    const voices = this.getVoices();
    const voice = voices.find((v) => v.voiceURI === voiceUri);

    if (voice) {
      this.voice = voice;
      this.settings.voiceUri = voiceUri;
      this.saveSettings();
      log.info('Voice changed', { name: voice.name });
    } else {
      log.warn('Voice not found', { voiceUri });
    }
  }

  /**
   * Update TTS settings
   */
  updateSettings(settings: Partial<TTSSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();
    log.info('Settings updated', settings);
  }

  /**
   * Get current settings
   */
  getSettings(): TTSSettings {
    return { ...this.settings };
  }

  /**
   * Get current voice
   */
  getCurrentVoice(): SpeechSynthesisVoice | null {
    return this.voice;
  }
}

// Singleton instance
let ttsInstance: TTSService | null = null;

/**
 * Get TTS service instance (creates if needed)
 */
export const getTTSService = (): TTSService => {
  if (!ttsInstance) {
    try {
      ttsInstance = new TTSService();
    } catch (error) {
      log.error('Failed to initialize TTS service', error);
      throw error;
    }
  }
  return ttsInstance;
};

/**
 * Convenience function to speak text
 */
export const speak = (text: string, options?: { onEnd?: () => void; priority?: boolean }): void => {
  getTTSService().speak(text, options);
};

/**
 * Convenience function to cancel speech
 */
export const cancelSpeech = (): void => {
  getTTSService().cancel();
};
