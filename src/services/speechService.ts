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
  name: string;    // This is the voice ID like "en-US-AriaNeural"
  gender: string;  // This is "Female" or "Male"
  locale: string;  // This is "en-US"
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
  private currentAbortController: AbortController | null = null;

  constructor(baseURL?: string) {
    // In development mode, use relative URLs to work with Vite proxy
    // In production, use the provided baseURL or the imported BASE_URL
    const isDevelopment = import.meta.env.DEV;
    
    // Debug environment variables in production
    console.log('🔧 Speech service environment debug:', {
      isDevelopment,
      providedBaseURL: baseURL,
      importedBASE_URL: BASE_URL,
      windowEnv: window._env_,
      importMetaEnvDev: import.meta.env.DEV,
      importMetaEnvViteBackendUrl: import.meta.env.VITE_BACKEND_URL
    });
    
    if (isDevelopment && !baseURL) {
      this.baseURL = ''; // Use relative URLs for proxy
      console.log('🔧 Speech service using relative URLs for development proxy');
    } else {
      this.baseURL = baseURL || BASE_URL;
      console.log('🔧 Speech service using base URL:', this.baseURL);
    }
    
    // In production, if we don't have a valid baseURL and window._env_ exists, reinitialize
    if (!isDevelopment && (!this.baseURL || this.baseURL === 'http://localhost:8000') && window._env_?.VITE_BACKEND_URL) {
      console.log('🔄 Reinitializing speech service with runtime environment');
      this.baseURL = window._env_.VITE_BACKEND_URL;
      console.log('🔧 Updated speech service base URL:', this.baseURL);
    }
    
    this.initializeBrowserApis();
  }
  
  /**
   * Reinitialize the base URL after runtime environment is loaded
   */
  private reinitializeBaseURL() {
    const isDevelopment = import.meta.env.DEV;
    if (!isDevelopment && window._env_?.VITE_BACKEND_URL) {
      this.baseURL = window._env_.VITE_BACKEND_URL;
      console.log('🔄 Speech service base URL updated to:', this.baseURL);
    }
  }

  private generateSessionId(): string {
    return `speech_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    // Ensure we have the correct base URL from runtime environment
    this.reinitializeBaseURL();
    
    // Cancel any existing request
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
    
    // Create new abort controller for this request
    this.currentAbortController = new AbortController();
    const sessionId = this.generateSessionId(); // Generate new session for each request
    
    const url = `${this.baseURL}/api/speech/synthesize?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}&format=mp3&sessionId=${encodeURIComponent(sessionId)}`;
    console.log(`🔊 Backend synthesis request:`, {
      url,
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      voice,
      sessionId,
      baseURL: this.baseURL
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        signal: this.currentAbortController.signal,
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
          this.currentAbortController = null;
          resolve();
        };
        audio.onerror = (event) => {
          console.error(`❌ Audio playback failed:`, event);
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          this.currentAbortController = null;
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
          this.currentAbortController = null;
          reject(new Error(`Audio play failed: ${error.message}`));
        });
      });
    } catch (error) {
      // Clear abort controller
      this.currentAbortController = null;
      
      // Handle abort as expected behavior, not an error
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🛑 Speech synthesis request was cancelled');
        return; // Don't throw for intentional cancellation
      }
      
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
    // Ensure we have the correct base URL from runtime environment
    this.reinitializeBaseURL();
    
    if (this.availableVoices.length > 0) {
      return this.availableVoices;
    }

    const response = await fetch(`${this.baseURL}/api/speech/voices`);
    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Process and validate voices to handle cases where backend returns display names
    const processedVoices = result.voices?.map((voice: { name: string; gender?: string; locale?: string }) => {
      // If the name field contains display text, try to extract or map to actual voice ID
      let processedName = voice.name;
      
      // Check if this looks like a display name rather than a voice ID
      if (voice.name && (voice.name.includes('Microsoft') || voice.name.includes('(Natural)'))) {
        console.warn('⚠️ Backend returned display name instead of voice ID:', voice.name);
        
        // Try to extract voice ID from display name patterns
        // This is a fallback - the backend should be fixed to return proper voice IDs
        if (voice.name.includes('Aria')) processedName = 'en-US-AriaNeural';
        else if (voice.name.includes('Liam') && voice.name.includes('Canada')) processedName = 'en-CA-LiamNeural';
        else if (voice.name.includes('Brian') && voice.name.includes('United States')) processedName = 'en-US-BrianMultilingualNeural';
        // Add more mappings as needed
        
        console.log('🔧 Mapped display name to voice ID:', { original: voice.name, mapped: processedName });
      }
      
      return {
        name: processedName,
        gender: voice.gender || 'Unknown',
        locale: voice.locale || 'Unknown'
      };
    }) || [];
    
    this.availableVoices = processedVoices;
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
    console.log('🛑 Stopping all speech synthesis...');
    
    // Stop browser speech synthesis
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
      console.log('🛑 Browser speech synthesis cancelled');
    }
    
    // Stop audio element (backend synthesis)
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      console.log('🛑 Audio playback stopped');
    }
    
    // Abort any ongoing network request
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
      console.log('🛑 Network request aborted');
    }
  }
}

// Export singleton instance
export const speechService = new SpeechService();
export default speechService;