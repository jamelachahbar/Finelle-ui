import { Text, Button } from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { trackEvent, trackPageView, trackTrace } from "../utils/applicationInsights";
import { speechService } from "../services/speechService";
import HarisLogo from '../assets/Harislogo.png';
import env from '../config/env';

interface VoiceSettings {
  voiceEnabled: boolean;
  provider: 'browser' | 'backend';
  selectedVoice: string;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  autoSpeak: boolean;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings | null>(null);

  const speakWelcomeMessage = useCallback(async (settings: VoiceSettings) => {
    try {
      const welcomeText = "Hello! I'm Haris, your FinOps Guardian. Discover insights on Azure costs, FinOps, and beyond. I'm here to shield your cloud from waste and empower you to master FinOps.";
      
      console.log('🏠 Speaking welcome message with settings:', {
        voiceEnabled: settings.voiceEnabled,
        provider: settings.provider,
        voice: settings.selectedVoice || 'default'
      });

      // Configure speech service
      speechService.setProvider(settings.provider);
      
      // For browser provider, ensure voices are loaded
      if (settings.provider === 'browser') {
        const voices = await speechService.getAvailableVoices();
        console.log('🎤 Available browser voices:', Array.isArray(voices) ? voices.length : 0);
        
        // Auto-select a voice if none is selected
        if (!settings.selectedVoice && Array.isArray(voices) && voices.length > 0) {
          const englishVoice = voices.find((v) => 'lang' in v && v.lang?.startsWith('en'));
          settings.selectedVoice = englishVoice?.name || voices[0]?.name || '';
          console.log('🎯 Auto-selected voice:', settings.selectedVoice);
        }
      }

      const options = {
        voice: settings.selectedVoice,
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        volume: settings.speechVolume,
      };

      await speechService.synthesizeSpeech(welcomeText, options);
      console.log('✅ Welcome message spoken successfully');
      
      trackEvent('Welcome_Speech_Played', {
        provider: settings.provider,
        voiceSelected: settings.selectedVoice ? 'yes' : 'no'
      });
    } catch (error) {
      console.error('❌ Failed to speak welcome message:', error);
      trackEvent('Welcome_Speech_Failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, []);

  // Load voice settings and speak welcome message if enabled
  const loadVoiceSettings = useCallback(async () => {
    try {
      const savedSettings = localStorage.getItem('harisVoiceSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        console.log('🏠 Loaded voice settings for homepage:', settings);
        setVoiceSettings(settings);
        
        // Configure speech service
        speechService.setProvider(settings.provider);
      } else {
        // Default settings if none saved
        const defaultSettings: VoiceSettings = {
          voiceEnabled: true,
          provider: 'browser',
          selectedVoice: '',
          speechRate: 1.0,
          speechPitch: 1.0,
          speechVolume: 1.0,
          autoSpeak: false,
        };
        setVoiceSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading voice settings on homepage:', error);
    }
  }, []);

  useEffect(() => {
    // Track page load (now uses runtime config)
    console.log('🔍 Environment Variable Debug:');
    console.log('VITE_APPINSIGHTS_CONNECTION_STRING present:', !!env.APPINSIGHTS_CONNECTION_STRING);
    console.log('Connection string length:', env.APPINSIGHTS_CONNECTION_STRING?.length || 0);
    console.log('VITE_BACKEND_URL:', env.BACKEND_URL);
    console.log('All available env vars:', Object.keys(import.meta.env));
    
    trackPageView('HomePage', window.location.href);
    trackEvent('HomePage_Loaded', {
      userAgent: navigator.userAgent,
      referrer: document.referrer || 'direct',
      hasConnectionString: env.APPINSIGHTS_CONNECTION_STRING ? 'true' : 'false',
      connectionStringLength: String(env.APPINSIGHTS_CONNECTION_STRING?.length || 0)
    });
    trackTrace('HomePage component mounted successfully');

    // Load voice settings
    loadVoiceSettings();
  }, [loadVoiceSettings]);

  // Handle user interaction to trigger welcome speech
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (voiceSettings?.voiceEnabled && !hasSpokenWelcome) {
        console.log('🎯 First user interaction detected, playing welcome speech');
        setHasSpokenWelcome(true);
        speakWelcomeMessage(voiceSettings);
      }
      
      // Remove listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    // Only add listeners if voice settings are loaded, voice is enabled, and we haven't spoken yet
    if (voiceSettings?.voiceEnabled && !hasSpokenWelcome) {
      document.addEventListener('click', handleFirstInteraction);
      document.addEventListener('keydown', handleFirstInteraction);
      document.addEventListener('touchstart', handleFirstInteraction);
    }

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [voiceSettings, hasSpokenWelcome, speakWelcomeMessage]);

  const handleChatNavigation = () => {
    trackEvent('Navigation_ToChatWindow', {
      source: 'HomePage'
    });
    navigate("/chat");
  };

  const handleTestTelemetry = () => {
    console.log('🧪 Testing telemetry manually...');
    trackEvent('Test_Button_Clicked', {
      timestamp: new Date().toISOString(),
      testType: 'manual'
    });
    trackTrace('Manual telemetry test triggered by user');
    alert('Telemetry test sent! Check console for details.');
  };

  const navigateToTelemetryTest = () => {
    trackEvent('Navigation_ToTelemetryTest', {
      source: 'HomePage'
    });
    navigate("/telemetry");
  };

  return (
    <div
      style={{
        height: "100vh",
        textAlign: "center",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "24px",
        padding: "0 16px",
      }}
    >
      {/* Haris Logo - Centered above welcome message */}
      <div style={{ marginBottom: "24px" }}>
        <img 
          src={HarisLogo} 
          alt="Haris" 
          style={{ 
            height: "180px", 
            width: "auto", 
            filter: "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15))"
          }} 
        />
      </div>

      <Text
        weight="bold"
        size={800}
        style={{
          background: "linear-gradient(to right, #2563eb, #9333ea)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Hello! I'm Haris, Your FinOps Guardian
      </Text>

      <Text size={400} style={{ color: "#666", maxWidth: "600px" }}>
        Discover insights on Azure costs, FinOps, and beyond. I'm here to shield your cloud from waste and empower you to master FinOps.
      </Text>

      {/* Voice indicator */}
      {voiceSettings?.voiceEnabled && !hasSpokenWelcome && (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px", 
          color: "#666", 
          fontSize: "14px",
          marginTop: "-8px"
        }}>
          <span>🔊</span>
          <Text size={200} style={{ color: "#666" }}>
            Click anywhere to hear Haris welcome you
          </Text>
        </div>
      )}

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        <Button
          appearance="primary"
          size="large"
          onClick={handleChatNavigation}
        >
          💬 Chat with Haris
        </Button>
        
        <Button
          appearance="outline"
          size="large"
          onClick={handleTestTelemetry}
        >
          🧪 Test Telemetry
        </Button>

        <Button
          appearance="outline"
          size="large"
          onClick={navigateToTelemetryTest}
        >
          📊 Full Telemetry Test
        </Button>
      </div>
    </div>
  );
}
