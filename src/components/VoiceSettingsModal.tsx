import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Dropdown,
  Option,
  Switch,
  Field,
  Slider,
  Text,
  MessageBar,
  Divider,
} from '@fluentui/react-components';
import { Settings24Regular, Speaker224Regular, SpeakerMute24Regular } from '@fluentui/react-icons';
import speechService, { SpeechProvider, BackendVoice } from '../services/speechService';

interface VoiceSettings {
  voiceEnabled: boolean;
  provider: SpeechProvider;
  selectedVoice: string;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  autoSpeak: boolean;
}

interface VoiceSettingsModalProps {
  trigger?: React.ReactElement;
  onSettingsChange?: (settings: VoiceSettings) => void;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  voiceEnabled: true,
  provider: 'browser',
  selectedVoice: '',
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 1.0,
  autoSpeak: false,
};

export default function VoiceSettingsModal({ trigger, onSettingsChange }: VoiceSettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const [availableVoices, setAvailableVoices] = useState<BackendVoice[] | SpeechSynthesisVoice[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('harisVoiceSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved voice settings:', error);
      }
    }
  }, []);

  const updateSetting = useCallback((key: keyof VoiceSettings, value: string | number | boolean) => {
    const newSettings = { ...settings, [key]: value };
    
    // If changing provider, reset voice selection to avoid compatibility issues
    if (key === 'provider') {
      newSettings.selectedVoice = '';
    }
    
    // Debug voice selection and validate it's not a display name
    if (key === 'selectedVoice' && typeof value === 'string') {
      console.log(`🎤 Voice selection changed:`, {
        provider: settings.provider,
        oldVoice: settings.selectedVoice,
        newVoice: value,
        isDisplayName: value.includes('Microsoft') || value.includes('(Natural)') || value.includes('undefined')
      });
      
      // Warn if the selected voice looks like a display name
      if (settings.provider === 'backend' && (value.includes('Microsoft') || value.includes('(Natural)') || value.includes('undefined'))) {
        console.warn('⚠️ Voice selection appears to be a display name, not a voice ID:', value);
      }
    }
    
    setSettings(newSettings);
  }, [settings]);

  // Load voices when provider changes
  const loadVoices = useCallback(async () => {
    setIsLoading(true);
    try {
      speechService.setProvider(settings.provider);
      const voices = await speechService.getAvailableVoices();
      setAvailableVoices(voices);
      
      console.log(`🎤 Loaded ${voices.length} voices for ${settings.provider} provider:`);
      
      // Debug the first few voices to see the structure
      if (settings.provider === 'backend' && voices.length > 0) {
        console.log('🎤 First 3 backend voices:', voices.slice(0, 3));
        voices.slice(0, 3).forEach((voice, index) => {
          const backendVoice = voice as BackendVoice;
          console.log(`🎤 Voice ${index + 1}:`, {
            name: backendVoice.name,
            locale: backendVoice.locale,
            gender: backendVoice.gender,
            nameType: typeof backendVoice.name,
            localeType: typeof backendVoice.locale
          });
        });
      }
      
      // Auto-select default voice if none selected or if switching providers
      if (!settings.selectedVoice && voices.length > 0) {
        let defaultVoice = '';
        if (settings.provider === 'backend') {
          // Look for a common English voice, fallback to first voice
          const ariaVoice = (voices as BackendVoice[]).find(v => 
            v.name?.includes('AriaNeural') || v.name === 'en-US-AriaNeural'
          );
          const anyEnglishVoice = (voices as BackendVoice[]).find(v => 
            v.name?.startsWith('en-') || v.locale?.startsWith('en')
          );
          defaultVoice = ariaVoice?.name || anyEnglishVoice?.name || (voices[0] as BackendVoice).name;
          console.log(`🎯 Auto-selected backend voice: ${defaultVoice}`);
        } else {
          const browserVoices = voices as SpeechSynthesisVoice[];
          const englishVoice = browserVoices.find(v => v.lang.startsWith('en'));
          defaultVoice = englishVoice?.name || browserVoices[0]?.name || '';
          console.log(`🎯 Auto-selected browser voice: ${defaultVoice}`);
        }
        
        if (defaultVoice) {
          updateSetting('selectedVoice', defaultVoice);
        }
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [settings.provider, settings.selectedVoice, updateSetting]);

  useEffect(() => {
    if (isOpen) {
      // Always reload voices when modal opens or provider changes
      loadVoices();
    }
  }, [isOpen, settings.provider, loadVoices]);

  const saveSettings = () => {
    localStorage.setItem('harisVoiceSettings', JSON.stringify(settings));
    speechService.setProvider(settings.provider);
    onSettingsChange?.(settings);
    setIsOpen(false);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('harisVoiceSettings');
  };

  const testVoice = async () => {
    if (!settings.selectedVoice) {
      alert('Please select a voice first');
      return;
    }

    const testText = "Hello! I'm Haris, your FinOps Guardian. This is how I'll sound when speaking to you.";

    try {
      setIsTesting(true);
      console.log(`🎤 Testing voice with settings:`, {
        provider: settings.provider,
        selectedVoice: settings.selectedVoice,
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        volume: settings.speechVolume
      });
      
      const options = {
        voice: settings.selectedVoice,
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        volume: settings.speechVolume,
      };
      
      await speechService.synthesizeSpeech(testText, options);
      console.log(`✅ Voice test completed successfully`);
    } catch (error) {
      console.error('Voice test failed:', error);
      alert(`Voice test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const stopVoiceTest = () => {
    speechService.stopSpeech();
    setIsTesting(false);
  };

  const renderVoiceSelector = () => {
    if (availableVoices.length === 0) {
      return (
        <Text size={200} style={{ fontStyle: 'italic', color: 'var(--colorNeutralForeground2)' }}>
          {isLoading ? 'Loading voices...' : 'No voices available'}
        </Text>
      );
    }

    return (
      <Dropdown
        placeholder="Select Haris's voice"
        value={settings.selectedVoice}
        selectedOptions={[settings.selectedVoice]}
        onOptionSelect={(_, data) => updateSetting('selectedVoice', data.optionValue || '')}
        disabled={!settings.voiceEnabled}
        style={{ width: '100%' }}
      >
        {availableVoices.map((voice) => {
          const isBackendVoice = settings.provider === 'backend';
          const voiceId = isBackendVoice ? (voice as BackendVoice).name : (voice as SpeechSynthesisVoice).name;
          
          let voiceName: string;
          if (isBackendVoice) {
            const backendVoice = voice as BackendVoice;
            // Handle cases where locale might be undefined
            const localeInfo = backendVoice.locale ? ` (${backendVoice.locale})` : '';
            const genderInfo = backendVoice.gender ? ` - ${backendVoice.gender}` : '';
            voiceName = `${backendVoice.name}${localeInfo}${genderInfo}`;
            
            // Debug log to see what we're getting from the backend
            console.log('🎤 Backend voice data:', {
              name: backendVoice.name,
              locale: backendVoice.locale,
              gender: backendVoice.gender,
              constructedName: voiceName
            });
          } else {
            const browserVoice = voice as SpeechSynthesisVoice;
            voiceName = `${browserVoice.name} (${browserVoice.lang})`;
          }
          
          return (
            <Option key={voiceId} value={voiceId}>
              {voiceName}
            </Option>
          );
        })}
      </Dropdown>
    );
  };

  const defaultTrigger = (
    <Button
      appearance="subtle"
      icon={<Settings24Regular />}
      size="medium"
    >
      Settings
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => setIsOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogSurface style={{ width: '520px', maxHeight: '80vh' }}>
        <DialogBody>
          <DialogTitle>🎤 Haris Voice Settings</DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Master Voice Toggle */}
            <Field label="Voice Features">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Switch
                  checked={settings.voiceEnabled}
                  onChange={(_, data) => updateSetting('voiceEnabled', data.checked)}
                />
                <Text size={300}>
                  {settings.voiceEnabled ? 'Voice features enabled' : 'Voice features disabled'}
                </Text>
              </div>
              <Text size={200} style={{ color: 'var(--colorNeutralForeground2)', marginTop: '4px' }}>
                {settings.voiceEnabled 
                  ? '🔊 Haris can speak and you can use voice input'
                  : '🔇 All voice functionality is turned off'
                }
              </Text>
            </Field>

            <Divider />

            <div style={{ opacity: settings.voiceEnabled ? 1 : 0.5 }}>
              {/* Provider Selection */}
              <Field label="Speech Provider">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Switch
                    checked={settings.provider === 'backend'}
                    onChange={(_, data) => updateSetting('provider', data.checked ? 'backend' : 'browser')}
                    disabled={!settings.voiceEnabled}
                  />
                  <Text size={300}>
                    {settings.provider === 'backend' ? 'Backend (Whisper + Azure)' : 'Browser (Web Speech API)'}
                  </Text>
                </div>
                <Text size={200} style={{ color: 'var(--colorNeutralForeground2)', marginTop: '4px' }}>
                  {settings.provider === 'backend' 
                    ? '🎯 Higher quality voices with Azure Speech Services'
                    : '🌐 Built-in browser voices, works offline'
                  }
                </Text>
              </Field>

              {/* Voice Selection */}
              <Field label="Haris's Voice">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {renderVoiceSelector()}
                    {settings.selectedVoice && (
                      <Text size={200} style={{ 
                        color: 'var(--colorNeutralForeground2)', 
                        marginTop: '4px',
                        fontStyle: 'italic'
                      }}>
                        Selected: {settings.selectedVoice}
                      </Text>
                    )}
                  </div>
                <Button
                  appearance="outline"
                  size="small"
                  icon={isTesting ? <SpeakerMute24Regular /> : <Speaker224Regular />}
                  onClick={isTesting ? stopVoiceTest : testVoice}
                  disabled={!settings.selectedVoice || isLoading || !settings.voiceEnabled}
                >
                  {isTesting ? 'Stop' : 'Test'}
                </Button>
              </div>
            </Field>

            <Divider />

            {/* Voice Parameters */}
            <Field label="Speech Rate">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Slider
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={settings.speechRate}
                  onChange={(_, data) => updateSetting('speechRate', data.value)}
                  disabled={!settings.voiceEnabled}
                  style={{ flex: 1 }}
                />
                <Text size={200} style={{ minWidth: '40px', textAlign: 'right' }}>
                  {settings.speechRate.toFixed(1)}x
                </Text>
              </div>
            </Field>

            <Field label="Speech Pitch">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Slider
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={settings.speechPitch}
                  onChange={(_, data) => updateSetting('speechPitch', data.value)}
                  disabled={!settings.voiceEnabled}
                  style={{ flex: 1 }}
                />
                <Text size={200} style={{ minWidth: '40px', textAlign: 'right' }}>
                  {settings.speechPitch.toFixed(1)}x
                </Text>
              </div>
            </Field>

            <Field label="Speech Volume">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Slider
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  value={settings.speechVolume}
                  onChange={(_, data) => updateSetting('speechVolume', data.value)}
                  disabled={!settings.voiceEnabled}
                  style={{ flex: 1 }}
                />
                <Text size={200} style={{ minWidth: '40px', textAlign: 'right' }}>
                  {Math.round(settings.speechVolume * 100)}%
                </Text>
              </div>
            </Field>

            <Divider />

            {/* Auto-speak Setting */}
            <Field label="Auto-speak Responses">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Switch
                  checked={settings.autoSpeak}
                  onChange={(_, data) => updateSetting('autoSpeak', data.checked)}
                  disabled={!settings.voiceEnabled}
                />
                <Text size={300}>
                  Automatically speak Haris's responses
                </Text>
              </div>
              <Text size={200} style={{ color: 'var(--colorNeutralForeground2)', marginTop: '4px' }}>
                When enabled, Haris will automatically speak responses in chat
              </Text>
            </Field>
            </div>

            {/* Info Message */}
            <MessageBar intent="info">
              <Text size={200}>
                These settings will be saved and applied globally to Haris's voice across the application.
              </Text>
            </MessageBar>

          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button appearance="outline" onClick={resetSettings}>
              Reset to Defaults
            </Button>
            <Button appearance="primary" onClick={saveSettings}>
              Save Settings
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

// Export the VoiceSettings type for use in other components
export type { VoiceSettings };