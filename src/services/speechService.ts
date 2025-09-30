/**
 * Enhanced Speech Service supporting both Web Speech API and Backend Speech Services
 */

import { BASE_URL } from '../api/harisApi';

export interface TranscriptionResult {
  text: string;
  language?: string;
  confidence?: number;
  duration?: number;
}

export interface SpeechSynthesisOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface BackendVoice {
  name: string;
  gender: string;
  locale: string;
  shortName: string;
}

export interface SpeechToSpeechResponse {
  success: boolean;
  transcription: {
    text: string;
    language: string;
    confidence: number;
  };
  agent_response: {
    text: string;
    agent: string;
  };
  audio_synthesis: {
    voice_used: string;
    audio_size_bytes: number;
  };
  session_id: string;
}

export type SpeechProvider = 'browser' | 'backend';

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => ISpeechRecognition;
    SpeechRecognition: new () => ISpeechRecognition;
  }
}

class SpeechService {
  private baseURL: string;
  private currentProvider: SpeechProvider = 'browser';
  private availableVoices: BackendVoice[] = [];
  private speechSynthesis: SpeechSynthesis | null = null;
  private speechRecognition: ISpeechRecognition | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || BASE_URL;
    this.initializeBrowserApis();
  }

  private initializeBrowserApis() {
    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
    }

    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      this.speechRecognition = new window.webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.speechRecognition = new (window as any).SpeechRecognition();
    }
  }

  /**
   * Set the speech provider (browser or backend)
   */
  setProvider(provider: SpeechProvider) {
    this.currentProvider = provider;
  }

  /**
   * Get current provider
   */
  getProvider(): SpeechProvider {
    return this.currentProvider;
  }

  /**
   * Check if speech recognition is supported
   */
  isSpeechRecognitionSupported(): boolean {
    if (this.currentProvider === 'backend') return true;
    return this.speechRecognition !== null;
  }

  /**
   * Check if speech synthesis is supported
   */
  isSpeechSynthesisSupported(): boolean {
    if (this.currentProvider === 'backend') return true;
    return this.speechSynthesis !== null;
  }

  /**
   * Transcribe audio using the selected provider
   */
  async transcribeAudio(audioBlob: Blob, modelSize: string = 'base'): Promise<TranscriptionResult> {
    if (this.currentProvider === 'backend') {
      return this.transcribeWithBackend(audioBlob, modelSize);
    } else {
      return this.transcribeWithBrowser(audioBlob);
    }
  }

  /**
   * Transcribe audio using backend Whisper service
   */
  private async transcribeWithBackend(audioBlob: Blob, modelSize: string): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.wav');

    const response = await fetch(`${this.baseURL}/api/speech/transcribe?model_size=${modelSize}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      text: result.transcription,
      language: result.language,
      confidence: result.confidence,
      duration: result.duration,
    };
  }

  /**
   * Transcribe audio using browser Speech Recognition
   * Note: Browser API doesn't support blob transcription, use live recognition instead
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async transcribeWithBrowser(_audioBlob: Blob): Promise<TranscriptionResult> {
    throw new Error('Browser transcription from blob not implemented. Use live recognition instead.');
  }

  /**
   * Start live speech recognition (browser only)
   */
  startLiveRecognition(): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      if (!this.speechRecognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = 'en-US';

      this.speechRecognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        resolve({
          text: transcript,
          confidence: confidence,
        });
      };

      this.speechRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.speechRecognition.start();
    });
  }

  /**
   * Stop live speech recognition
   */
  stopLiveRecognition() {
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
  }

  /**
   * Synthesize speech using the selected provider
   */
  async synthesizeSpeech(text: string, options?: SpeechSynthesisOptions): Promise<void> {
    if (this.currentProvider === 'backend') {
      // For backend, use the voice directly or default to Aria
      const voice = options?.voice || 'en-US-AriaNeural';
      return this.synthesizeWithBackend(text, voice);
    } else {
      return this.synthesizeWithBrowser(text, options);
    }
  }

  /**
   * Synthesize speech using backend Azure Speech Services
   */
  private async synthesizeWithBackend(text: string, voice: string): Promise<void> {
    const url = `${this.baseURL}/api/speech/synthesize?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}&format=mp3`;
    console.log(`🔊 Backend synthesis request:`, {
      url,
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      voice,
      baseURL: this.baseURL
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
      });

      console.log(`📡 Synthesis response:`, {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        console.error(`❌ Backend synthesis error:`, errorText);
        throw new Error(`Speech synthesis failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const audioBlob = await response.blob();
      console.log(`🎵 Audio blob created:`, {
        size: audioBlob.size,
        type: audioBlob.type
      });

      if (audioBlob.size === 0) {
        throw new Error('Received empty audio file from backend');
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Track current audio for stopping
      this.currentAudio = audio;
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          console.log(`✅ Audio playback completed`);
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          resolve();
        };
        audio.onerror = (event) => {
          console.error(`❌ Audio playback failed:`, event);
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          reject(new Error('Audio playback failed'));
        };
        audio.onloadstart = () => {
          console.log(`🎵 Audio loading started`);
        };
        audio.oncanplay = () => {
          console.log(`🎵 Audio can play`);
        };
        
        console.log(`🎵 Starting audio playback...`);
        audio.play().catch(error => {
          console.error(`❌ Audio play() failed:`, error);
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          reject(new Error(`Audio play failed: ${error.message}`));
        });
      });
    } catch (error) {
      console.error(`❌ Backend synthesis error:`, error);
      throw error;
    }
  }

  /**
   * Synthesize speech using browser Speech Synthesis
   */
  private async synthesizeWithBrowser(text: string, options?: SpeechSynthesisOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      if (options) {
        if (options.rate) utterance.rate = options.rate;
        if (options.pitch) utterance.pitch = options.pitch;
        if (options.volume) utterance.volume = options.volume;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      this.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Get available voices from the selected provider
   */
  async getAvailableVoices(): Promise<BackendVoice[] | SpeechSynthesisVoice[]> {
    if (this.currentProvider === 'backend') {
      return this.getBackendVoices();
    } else {
      return this.getBrowserVoices();
    }
  }

  /**
   * Get available voices from backend
   */
  private async getBackendVoices(): Promise<BackendVoice[]> {
    if (this.availableVoices.length > 0) {
      return this.availableVoices;
    }

    const response = await fetch(`${this.baseURL}/api/speech/voices`);
    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    const result = await response.json();
    this.availableVoices = result.voices;
    return this.availableVoices;
  }

  /**
   * Get available voices from browser
   */
  private getBrowserVoices(): SpeechSynthesisVoice[] {
    if (!this.speechSynthesis) return [];
    return this.speechSynthesis.getVoices();
  }

  /**
   * Complete speech-to-speech chat using backend
   */
  async speechToSpeechChat(audioBlob: Blob, sessionId?: string, voice?: string, modelSize?: string): Promise<SpeechToSpeechResponse> {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.wav');

    const params = new URLSearchParams();
    if (sessionId) params.append('sessionId', sessionId);
    if (voice) params.append('voice', voice);
    if (modelSize) params.append('model_size', modelSize);

    const response = await fetch(`${this.baseURL}/api/speech/quick-chat?${params.toString()}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Speech-to-speech chat failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Stop any ongoing speech synthesis
   */
  stopSpeech() {
    // Stop browser speech synthesis
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
    
    // Stop audio element (backend synthesis)
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }
}

// Export singleton instance
export const speechService = new SpeechService();
export default speechService;