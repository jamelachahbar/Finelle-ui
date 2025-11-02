import { useState, useRef, useEffect } from 'react';
import { Button } from '@fluentui/react-components';
import ChatBubble from './ChatBubble';
import TypingBubble from './TypingBubble';
import './ChatWindow.css';
import { Send24Regular, Mic24Regular, MicOff24Regular } from '@fluentui/react-icons';
import { Citation, formatCitationsForMarkdown } from '../utils/citationUtils';
import { speechService } from '../services/speechService';
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


interface ApiResponse {
  content?: string;
  role?: string;
  agent?: string;
  sources?: string[];
  citations?: Citation[];
  chart_included?: boolean;
  chart?: {
    image_base64?: string;
    [key: string]: unknown;
  };
  chart_data?: string;
  chart_format?: string;
  chart_type?: string;
  memory_id?: string; // Memory ID from mem0 backend (snake_case)
  memoryId?: string; // Alternative camelCase format
  from_cache?: boolean; // Indicates cached response
  [key: string]: unknown;
}

type ChatMessage = {
  id?: string;
  role: 'user' | 'agent' | 'assistant' | 'system';
  agent: string;
  content: string;
  sources?: string[];
  processedContent?: string;
  citations?: Citation[];
  chartData?: string; // Base64 encoded chart image
  chartFormat?: string; // e.g., "png_base64"
  chartType?: string; // e.g., "time_series_anomaly"
  fromCache?: boolean; // Indicates if response came from memory cache
  feedbackGiven?: 'positive' | 'negative' | null; // Track user feedback
  userQuestion?: string; // Store original question for feedback API
  timestamp?: Date;
  memory_id?: string; // Memory ID from mem0 backend
};

const promptSuggestions = [
  'Give my Azure Hybrid Benefit summary',
  'What is my ESR?',
  'Perform a Commitment Discount Analysis',
  'Give me a detailed table of all my Reservation purchases',
  'Show me the utilization rate for each of my Azure reservations by resource group',
  'Analyze my Reservation utilization',
  'Run a multivariate outlier analysis on this dataset with columns for cost, network, and region.',
  'Are there any outliers in my cost data when considering AI and region looking back 30 days?',
  'Are there any outliers in my cost data when considering both network and region?',
  'Run a comprehensive anomaly analysis on [SERVICE or COST DIMENSION] for the last 20 days. Use both Isolation Forest and Level Shift methods.Present a clear table showing which dates are anomalies, which method flagged them, and a concise summary/conclusion of the findings.',
  'Show all Azure reservation purchases since 2024, including term, months elapsed, months remaining, and monthly payment, and provide a CSV export.',
  //   "Which resources are eligible for savings plans or reservations but aren’t covered?",
  'Show me the top 10 individual Azure resources with the largest decrease in cost from July to September (ignore October since it’s not a full month). For each, display the cost in July, August, and September, and the total change from July to September. Present the results in a markdown table and highlight any resources that went to zero. Also, provide a brief insight on what might have driven these changes and suggest next steps for further optimization.',
  'For my highest-cost resources with no discounts, recommend which type of Azure discount (reservation, savings plan, or negotiated) I should apply to each resource.',
  'Which of my high-cost virtual machines and SQL databases are eligible for reservations or savings plans, and what should I do?',
  'For each resource in my top 20 by cost with no discounts, tell me if it’s eligible for a reservation, savings plan, or negotiated discount, and what action I should take.',
  'How are my savings trending over the last 6/12 months?',
  'What is the savings rate for each of my subscriptions?',
  'How much am I saving with Azure Hybrid Benefit?',
  'For each of my top resources, tell me if I should use a savings plan or reservation based on my usage patterns.',
  //   "Analyze my Azure cost and usage data for the past 12 months. Calculate the average $/hour eligible for a savings plan across all subscriptions, including only compute resources (Virtual Machines, Virtual Machine Scale Sets, App Service Environments) that are not already covered by reservations. Exclude any costs already covered by reservations. Present the result as a single $/hour value I can confidently use for a shared-scope savings plan commitment.",
  'Analyze my Azure cost and usage data for the past 12 months. For each subscription, calculate the average $/hour eligible for a savings plan, including only compute resources (Virtual Machines, Virtual Machine Scale Sets, App Service Environments) that are not already covered by reservations. Exclude any costs already covered by reservations. Present the results in a table with columns: Subscription, Eligible Compute $/hr (avg, not covered by reservations).',
  //   "Analyze my Azure cost and usage data for the past 12 months. For my top resources by cost (including virtual machines, virtual machine scale sets, SQL databases, SQL elastic pools, and SQL managed instances), check whether it is already covered by a reservation or savings plan, then recommend for each: The optimal purchase scope (shared or single subscription). Whether I should buy a reservation, a savings plan (with recommended $/hour commitment), or reserved capacity. For reservations or reserved capacity: the estimated quantity (number of instances or vCores) I should purchase, based on my average or peak usage. For savings plans: the recommended $/hour commitment based on my eligible compute usage. Any additional notes or best practices for maximizing savings. Please include a table with resource name, type, scope, recommended purchase type, estimated quantity or $/hour, and notes.",
  'Show me resources with the highest cost but no discounts.',
  'Educate me on the Finops Framework.',
  'What is FOCUS and why should I care?',
  'What are the top 5 costly services?',
  'Show me monthly trends for storage costs',
  'Which region has the highest usage?',
  'What were my total savings of the last 3 months?',
  'Identify resource outliers for this month based on cost.',
  'What was the cost of the top consuming resource in West Europe?',
  'List untagged resources with high costs.',
  //   "Show me a table of all daily usage and cost anomalies for AI and Machine Learning Services in the last 30 days, using both the Hybrid and Isolation Forest methods, and explain.",
  'Show me a table of all daily cost anomalies detected in the last 30 days (excluding today), using both the Hybrid and Isolation Forest methods. For each anomaly, include the date, EffectiveCost, and indicate which method detected it. Also, explain the difference between the two methods and why their results might differ.',
  //   "Can you provide the monthly cost consumption forecast for the next six months based on historical data? Please ensure a linear or average growth rate method is applied if more advanced plugins are unavailable.",
  // "Based on averaging past monthly costs, create a forecast for this environment for the next 3 months"
  // "Based on averaging past monthly costs, create a forecast for resource group rg-finopshubs0-7-adx for the next 3 months"
  'Give me the list of the top 3 biggest consumers, meaning resource based on aggregated cost of the past 3 months.',
  //   "Can you provide a detailed analysis of aggregated costs for each individual resource in the resource group rg-mgmt over the past three months? I want to identify trends and spikes for Virtual Machines, Storage Accounts, and Azure Cognitive Services, and highlight any opportunities for cost optimization.Please ensure the analysis includes all costs across the entire three-month period.",
  // "Are there any cost optimization recommendations for this resource group, such as underutilized resources or resizing opportunities?",
  'Give me a summary table of the consumption for AI and Machine Learning service category of this month and list the resources by name meaning resource based on aggregated cost by subscription name.',
  // "Give me a list of the top 10 consumers of the service category of AI and Machine Learning by resource name and aggregated cost of the past 3 months.",
  //   "Can you detect any cost anomalies over the past 7 days by comparing daily cost deviations from the weekly average using standard deviation?"
];

export default function ChatWindow() {
  const [input, setInput] = useState('');
  const sessionIdRef = useRef(localStorage.getItem('sessionId') || crypto.randomUUID());
  useEffect(() => {
    localStorage.setItem('sessionId', sessionIdRef.current);
    // Clear any cached agent names that might reference old branding
    localStorage.removeItem('lastAgentName');
  }, []);  
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState<string>('Haris is thinking...');
  
  // Voice settings state
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voiceEnabled: true,
    provider: 'browser',
    selectedVoice: '',
    speechRate: 1.0,
    speechPitch: 1.0,
    speechVolume: 1.0,
    autoSpeak: false,
  });
  
  // Speech functionality state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [speechSynthesis] = useState(window.speechSynthesis);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load voice settings on component mount
  useEffect(() => {
    const loadVoiceSettings = () => {
      try {
        const savedSettings = localStorage.getItem('harisVoiceSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          console.log('📢 Loaded voice settings for chat:', settings);
          setVoiceSettings(settings);
          
          // Apply settings to speech service
          speechService.setProvider(settings.provider);
          console.log(`🎤 Speech service configured for ${settings.provider} provider`);
        }
      } catch (error) {
        console.error('Error loading voice settings:', error);
      }
    };

    loadVoiceSettings();

    // Listen for voice settings changes from the modal
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'harisVoiceSettings') {
        loadVoiceSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Scroll to bottom using page-level scrolling instead of internal container scroll
  const scrollToBottom = () => {
    // Use smooth scrolling to the bottom of the page
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  // Auto-scroll to bottom when messages change or typing status changes
  useEffect(() => {
    // Small delay to ensure DOM has updated before scrolling
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages, isTyping, typingMessage]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };
      
      recognition.onerror = () => {
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      setSpeechRecognition(recognition);
    }
  }, []);

  // Speech recognition functions
  const startRecording = () => {
    // Stop any ongoing speech before starting recording
    if (isSpeaking) {
      stopSpeaking();
    }
    
    if (speechRecognition && !isRecording) {
      setIsRecording(true);
      speechRecognition.start();
    }
  };

  const stopRecording = () => {
    if (speechRecognition && isRecording) {
      speechRecognition.stop();
      setIsRecording(false);
    }
  };

  // Enhanced Text-to-Speech function using voice settings
  const speakText = async (text: string) => {
    if (!voiceSettings.voiceEnabled) return;
    
    // Stop any ongoing speech before starting new speech
    if (isSpeaking) {
      console.log('🛑 Stopping current speech to start new speech');
      stopSpeaking();
      // Longer delay to ensure speech completely stops
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    try {
      setIsSpeaking(true);
      console.log('🔊 Speaking with voice settings:', {
        voiceEnabled: voiceSettings.voiceEnabled,
        provider: voiceSettings.provider,
        voice: voiceSettings.selectedVoice,
        rate: voiceSettings.speechRate,
        pitch: voiceSettings.speechPitch,
        volume: voiceSettings.speechVolume
      });
      
      // Clean text for better speech (remove markdown, etc.)
      const cleanText = text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/`(.*?)`/g, '$1') // Remove code markdown
        .replace(/#{1,6}\s/g, '') // Remove headers
        .replace(/\n+/g, '. ') // Replace newlines with pauses
        .trim();
      
      const options = {
        voice: voiceSettings.selectedVoice,
        rate: voiceSettings.speechRate,
        pitch: voiceSettings.speechPitch,
        volume: voiceSettings.speechVolume,
      };
      
      await speechService.synthesizeSpeech(cleanText, options);
      console.log('✅ Speech completed successfully');
    } catch (error) {
      // Handle aborted requests gracefully (not really an error)
      if (error instanceof Error && error.message.includes('cancelled')) {
        console.log('🛑 Speech was cancelled by user');
        return;
      }
      console.error('❌ Speech failed:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    console.log('🛑 Stopping speech...');
    
    // Stop speech service (handles both browser and backend)
    speechService.stopSpeech();
    
    // Also stop browser speech synthesis directly as backup
    if (speechSynthesis && isSpeaking) {
      speechSynthesis.cancel();
    }
    
    // Reset state
    setIsSpeaking(false);
    console.log('✅ Speech stopped and state reset');
  };

  // ============================================================
  // FEEDBACK FUNCTIONS - mem0 Integration
  // ============================================================

  const submitFeedback = async (
    messageIndex: number,
    isAccurate: boolean,
    feedbackReason?: string
  ) => {
    try {
      const message = messages[messageIndex];
      
      console.log('🔍 submitFeedback called:', {
        messageIndex,
        totalMessages: messages.length,
        currentMessage: message,
        currentRole: message?.role,
        previousMessage: messages[messageIndex - 1],
        previousRole: messages[messageIndex - 1]?.role
      });
      
      // Find the most recent user message before this agent message
      let userMessage = null;
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          userMessage = messages[i];
          console.log(`✅ Found user message at index ${i}:`, userMessage.content.substring(0, 50));
          break;
        }
      }
      
      if (!userMessage) {
        console.error('❌ Cannot find user question for feedback', {
          messageIndex,
          totalMessages: messages.length,
          allRoles: messages.map((m, i) => `${i}: ${m.role}`)
        });
        return;
      }

      const isDevelopment = import.meta.env.DEV;
      const baseUrl = isDevelopment ? '' : env.BACKEND_URL;
      
      const params = new URLSearchParams({
        user_question: userMessage.content,
        session_id: sessionIdRef.current,
        is_accurate: String(isAccurate),
      });
      
      if (message.memory_id) {
        params.append('memory_id', message.memory_id);
        console.log('📝 Including memory_id in feedback:', message.memory_id);
      } else {
        console.log('⚠️ No memory_id available for this message');
      }
      
      if (feedbackReason) {
        params.append('feedback_reason', feedbackReason);
      }
      
      console.log('📝 Submitting feedback:', {
        isAccurate,
        hasMemoryId: !!message.memory_id,
        hasFeedbackReason: !!feedbackReason,
        messageIndex
      });

      const response = await fetch(`${baseUrl}/api/memory/feedback?${params}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Feedback failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Feedback recorded:', result);
      
      // Update the message state to show feedback was given
      setMessages(prev => prev.map((msg, idx) => 
        idx === messageIndex 
          ? { ...msg, feedbackGiven: isAccurate ? 'positive' : 'negative' }
          : msg
      ));
      
    } catch (error) {
      console.error('❌ Failed to submit feedback:', error);
    }
  };

  const handleThumbsUp = (messageIndex: number) => {
    console.log('👍 handleThumbsUp called in ChatWindow for message', messageIndex);
    console.log('📊 Total messages:', messages.length);
    console.log('📝 Message at index:', messages[messageIndex]);
    submitFeedback(messageIndex, true, 'User marked as accurate');
  };

  const handleThumbsDown = (messageIndex: number) => {
    console.log('👎 handleThumbsDown called in ChatWindow for message', messageIndex);
    console.log('📊 Total messages:', messages.length);
    console.log('📝 Message at index:', messages[messageIndex]);
    
    const reason = prompt(
      '💭 What was wrong with this response? (Optional)\n\n' +
      '💡 Tip: Type "wrong" to delete this memory completely.'
    );
    
    // User cancelled
    if (reason === null) {
      console.log('User cancelled feedback');
      return;
    }
    
    submitFeedback(
      messageIndex, 
      false, 
      reason || 'User marked as inaccurate'
    );
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping || isSpeaking) return;

    const userQuestion = input.trim(); // Store the question for memory tracking
    
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        agent: 'You',
        content: userQuestion,
      },
    ]);    // Auto-scroll to bottom after sending message
    setTimeout(() => {
      scrollToBottom();
    }, 100);

    setIsTyping(true);
    const encodedPrompt = encodeURIComponent(userQuestion);
    
    // In development mode, use relative URLs to work with Vite proxy
    // In production, use the configured backend URL
    const isDevelopment = import.meta.env.DEV;
    const baseUrl = isDevelopment ? '' : env.BACKEND_URL;
    
    console.log('🔍 Chat environment debug:', {
      isDevelopment,
      envBackendUrl: env.BACKEND_URL,
      baseUrl: baseUrl || '(relative URLs for proxy)',
      windowEnv: window._env_
    });
    
    let eventSource: EventSource | null = null;
    let receivedMessage = false; // Track if we got at least one message
    
    try {
      const eventSourceUrl = `${baseUrl}/api/ask-stream?prompt=${encodedPrompt}&sessionId=${sessionIdRef.current}`;
      console.log('🔍 Creating EventSource with URL:', eventSourceUrl);
      
      eventSource = new EventSource(eventSourceUrl);
      
      // Add error handling for EventSource
      eventSource.onerror = (error) => {
        console.error('❌ EventSource error:', error);
        console.error('❌ EventSource readyState:', eventSource?.readyState);
        console.error('❌ EventSource URL was:', eventSourceUrl);
        
        // EventSource readyState values: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
        const stateNames = ['CONNECTING', 'OPEN', 'CLOSED'];
        console.error('❌ EventSource state:', stateNames[eventSource?.readyState || 0]);
        
        setIsTyping(false);
      };
      
      eventSource.onopen = () => {
        console.log('✅ EventSource connection opened successfully');
      };
      
    } catch (error) {
      console.error('❌ Failed to create EventSource:', error);
      setIsTyping(false);
      return;
    }

    eventSource.onmessage = (event) => {
      receivedMessage = true; // Mark that we received a message
      console.log('🔍 Raw event data received:', event.data); // Debug the raw data first
      console.log('📊 Event data type:', typeof event.data);
      
      // Also log the first 200 characters to see structure
      const preview = typeof event.data === 'string' ? event.data.substring(0, 200) : JSON.stringify(event.data).substring(0, 200);
      console.log('📝 Event data preview:', preview + '...');
      
      let data: ApiResponse;
      try {
        // Handle both string and object responses
        if (typeof event.data === 'string') {
          data = JSON.parse(event.data);
        } else if (typeof event.data === 'object' && event.data !== null) {
          data = event.data; // Already an object
        } else {
          console.error('Unexpected event data type:', typeof event.data, event.data);
          return;
        }
        
        // CRITICAL: Check for memory_id in raw data
        if (typeof event.data === 'string') {
          const hasMemoryIdInRaw = event.data.includes('memory_id') || 
                                    event.data.includes('memoryId') || 
                                    event.data.includes('memory-id');
          console.log('🔍 Raw memory_id check:', {
            hasMemoryIdInRaw,
            memoryIdVariations: {
              memory_id: event.data.includes('memory_id'),
              memoryId: event.data.includes('memoryId'),
              'memory-id': event.data.includes('memory-id')
            }
          });
        }
        
        // Raw chart debugging - check if chart data exists at all
        console.log('🔍 Raw chart debugging:', {
          rawDataIncludes_chart: event.data.includes('chart'),
          rawDataIncludes_image_base64: event.data.includes('image_base64'),
          rawDataIncludes_chart_included: event.data.includes('chart_included'),
          rawDataLength: event.data.length
        });
        
        console.log('API Response Data:', {
          content: data.content?.substring(0, 50) + '...',
          fullContent: data.content, // Add full content for debugging
          hasCitations: data.citations ? true : false,
          citationsCount: data.citations?.length || 0,
          citationFields: (data.citations && data.citations.length > 0) ? Object.keys(data.citations[0]) : [],
          firstCitation: (data.citations && data.citations.length > 0) ? JSON.stringify(data.citations[0]).substring(0, 100) + '...' : null,
          responseProperties: Object.keys(data),
          // Enhanced chart debugging
          hasChartIncluded: data.chart_included ? true : false,
          hasChart: data.chart ? true : false,
          chartStructure: data.chart ? Object.keys(data.chart) : null,
          chartImageBase64Length: data.chart?.image_base64?.length || 0,
          chartFormat: data.chart_format,
          chartType: data.chart_type,
          // CRITICAL: Memory ID debugging
          memory_id: data.memory_id,
          hasMemoryId: !!data.memory_id,
          from_cache: data.from_cache
        });

        if (data.content === '[DONE]') {
          setIsTyping(false);
          setTypingMessage('');
          
          // Safely close the connection
          try {
            if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
              eventSource.close();
            }
          } catch (closeError) {
            console.warn('EventSource already closed on DONE:', closeError);
          }
          return;
        }

      // Validate API response structure
      if (!data || typeof data !== 'object') {
        console.error('Invalid API response:', data);
        return;
      }

      // Check if we have either content OR chart data - don't skip chart-only messages
      const hasContent = data.content?.trim();
      const hasChartData = data.chart_included || data.chart || data.chart_data;
      
      if (!hasContent && !hasChartData) {
        console.log('⏭️ Skipping message - no content or chart data');
        return;
      }      // Special check for custom tool icons
      if (data.content?.includes('[RESOURCE_GRAPH_ICON]')) {
        console.log('🎯 Detected Resource Graph Explorer icon replacement marker!');
      } else if (data.content?.includes('[ADX_ICON]')) {
        console.log('🎯 Detected ADX icon replacement marker!');
      } 

      // Check for chart data in the response - try multiple possible structures
      let chartData = null;
      
      // Method 1: Expected structure (chart.image_base64)
      if (data.chart_included && data.chart && data.chart.image_base64) {
        console.log('🎨 Chart data detected in response (Method 1 - chart.image_base64):', {
          chart_included: data.chart_included,
          chart_format: data.chart_format,
          chart_size: data.chart.image_base64?.length,
          chart_type: data.chart_type,
          chart_structure: Object.keys(data.chart)
        });
        chartData = data.chart.image_base64;
      }
      // Method 2: Direct chart_data field (fallback)
      else if (data.chart_included && data.chart_data) {
        console.log('🎨 Chart data detected in response (Method 2 - chart_data):', {
          chart_included: data.chart_included,
          chart_format: data.chart_format,
          chart_size: data.chart_data?.length,
          chart_type: data.chart_type
        });
        chartData = data.chart_data;
      }
      // Method 3: Any base64 data in chart object
      else if (data.chart && typeof data.chart === 'object') {
        console.log('🎨 Chart object found, exploring structure:', Object.keys(data.chart));
        
        // Look for any base64-like data in the chart object
        const chartKeys = Object.keys(data.chart);
        const base64Key = chartKeys.find(key => 
          typeof data.chart![key] === 'string' && 
          (data.chart![key] as string).startsWith('iVBORw0KGgo')
        );
        
        if (base64Key) {
          console.log('🎨 Chart data detected in response (Method 3 - found base64 data):', {
            key: base64Key,
            chart_size: (data.chart![base64Key] as string)?.length,
            chart_preview: (data.chart![base64Key] as string)?.substring(0, 50) + '...'
          });
          chartData = data.chart[base64Key];
        }
      }

      // Process citations if present
      let processedContent = data.content;
      let citations: Citation[] = [];

      // Improved citation detection - check data.citations for array type and length
      const hasCitations = Array.isArray(data.citations) && data.citations.length > 0;
      console.log('Citation detection:', {
        hasCitations,
        citationsLength: Array.isArray(data.citations) ? data.citations.length : 'not an array',
        firstCitationSample: (hasCitations && data.citations) ? JSON.stringify(data.citations[0]).substring(0, 80) + '...' : 'none',
      });

      if (hasCitations) {
        try {
          console.log('Processing citations from API:', data.citations?.length, 'first citation:', data.citations?.[0]); // Use the citations directly rather than trying to parse from content
          citations = (data.citations || []).map((citation: unknown, index: number) => {
            // Ensure citation is an object before spreading
            const citationObj = typeof citation === 'object' && citation !== null ? citation : {};

            // Verify all backend fields are present
            const backendFields = ['id', 'title', 'section', 'filepath', 'document_name', 'chunkId', 'content'];

            // Log any missing fields for debugging
            const missingFields = backendFields.filter((field) => !(field in citationObj));

            if (missingFields.length > 0) {
              console.warn(`Citation missing fields: ${missingFields.join(', ')}`);
            }

            // Create properly typed citation object, preserving all fields
            // Use type assertion to access specific fields
            const partialCitation = citationObj as Partial<Citation>;
            // Handle possible field name variations with a type-safe approach
            const content = partialCitation.content || ((citationObj as Record<string, unknown>)['content_sample'] as string) || partialCitation.snippet || '';

            const title = partialCitation.title || partialCitation.document_name || `Citation ${index + 1}`;

            return {
              ...citationObj,
              id: partialCitation.id || String(index + 1),
              reindex_id: String(index + 1), // Ensure each citation has a display ID
              content: content,
              title: title,
            };
          });

          // Format and append citations section at the end for visibility
          const formattedCitations = formatCitationsForMarkdown(citations);

          // Keep the original content but add citations section at the end
          processedContent = `${data.content}\n\n${formattedCitations}`;

          console.log('Processed citations:', citations.length, 'with IDs:', citations.map((c) => c.id).join(', '));
        } catch (error) {
          console.error('Error processing citations:', error);
          processedContent = data.content;
        }
      } // Create message with correct structure for proper citation handling
      // Check if response is from cache (backend may include from_cache flag or marker)
      const isFromCache = data.from_cache === true || 
                          (typeof data.content === 'string' && data.content.includes('📚 *From memory:*'));
      
      // Extract memory_id - handle both snake_case and camelCase
      const memoryId = data.memory_id || data.memoryId || (data as Record<string, unknown>)['memory-id'] as string | undefined;
      
      if (memoryId) {
        console.log('✅ Found memory_id in response:', memoryId, 'using field:', 
          data.memory_id ? 'memory_id' : data.memoryId ? 'memoryId' : 'memory-id');
      }
      
      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
        role: (data.role as 'user' | 'agent' | 'assistant' | 'system') || 'agent',
        agent: data.agent || 'Haris',
        content: processedContent || '',
        sources: data.sources || [],
        // Ensure citations are explicitly set if available
        citations: citations && citations.length > 0 ? citations : undefined,
        // Add chart data if available
        chartData: chartData as string,
        chartFormat: data.chart_format,
        chartType: data.chart_type,
        // Memory tracking fields
        fromCache: isFromCache,
        userQuestion: userQuestion, // Associate with the user's question
        timestamp: new Date(),
        memory_id: memoryId, // Use extracted memory ID
      };

      // Debug log for memory_id
      if (memoryId) {
        console.log('✅ Successfully captured memory_id from backend:', memoryId);
        console.log('✅ Message object with memory_id:', {
          role: msg.role,
          agent: msg.agent,
          memory_id: msg.memory_id,
          hasMemoryId: !!msg.memory_id,
          fromCache: msg.fromCache
        });
      } else {
        console.warn('⚠️ ====== NO MEMORY_ID IN RESPONSE ======');
        console.warn('⚠️ This means feedback WILL NOT be saved to mem0!');
        console.warn('⚠️ Backend needs to include memory_id in the response');
        console.warn('⚠️ Backend response keys:', Object.keys(data));
        console.warn('⚠️ Checking for memory_id variations:', {
          'data.memory_id': data.memory_id,
          'data.memoryId': data.memoryId,
          'data["memory-id"]': (data as Record<string, unknown>)['memory-id']
        });
        console.warn('⚠️ ========================================');
      }

      // Create a final check to ensure citations are included in the message
      // If there are citations in the original data, make sure they're passed along
      if (msg.citations === undefined && hasCitations) {
        console.log('Citations were found in data but not properly processed - fixing', {
          citationsInMsg: msg.citations ? 'present' : 'undefined',
          citationsInData: (hasCitations && data.citations) ? data.citations.length : 0,
        });

        // Process citations thoroughly to ensure complete information
        msg.citations = processCitations((data.citations || []) as unknown as Record<string, unknown>[]);
      }

      // Final legacy citation check
      if (!msg.citations && msg.content.includes('(Source:')) {
        console.log('No structured citations found, but source references exist in text - will be processed by CitationHandler');
      }

      if (msg.role === 'system') {
        setIsTyping(true);
        setTypingMessage(msg.content);
      } else {
        // Log the message structure for debugging
        if (msg.citations) {
          console.log('Adding message with citations:', msg.citations.length);
        } else {
          console.log('Adding message with NO citations');
        }        
        setMessages((prev) => [...prev, msg]);
        
        // Auto-speak new agent responses if enabled
        if (voiceSettings.voiceEnabled && voiceSettings.autoSpeak && (msg.role === 'agent' || msg.role === 'assistant') && msg.content) {
          // Small delay to ensure message is rendered before speaking
          setTimeout(() => {
            console.log('🔊 Auto-speaking new agent message (will stop current speech if any)');
            speakText(msg.content);
          }, 500);
        }
      }    } catch (error) {
      console.error('❌ Data processing error:', error);
      console.error('❌ Raw event data that failed to process:', event.data);
      console.error('❌ Event data type:', typeof event.data);
      
      // Try to handle malformed responses gracefully
      let fallbackContent = '';
      
      if (typeof event.data === 'string') {
        // If it's a string that looks like JSON but failed to parse, try to extract content
        if (event.data.includes('"content"')) {
          try {
            // Try to extract content with regex as last resort
            const contentMatch = event.data.match(/"content":\s*"([^"]+)"/);
            if (contentMatch) {
              fallbackContent = contentMatch[1];
            } else {
              fallbackContent = event.data;
            }
          } catch {
            fallbackContent = event.data;
          }
        } else {
          fallbackContent = event.data;
        }
      } else if (typeof event.data === 'object' && event.data !== null) {
        // If it's an object but somehow failed processing, try to extract content
        fallbackContent = (event.data as Record<string, unknown>).content as string || JSON.stringify(event.data);
      } else {
        fallbackContent = String(event.data);
      }
      
      // Display the fallback content if we have any
      if (fallbackContent.trim()) {
        const agentMessage = {
          role: 'agent' as const,
          agent: 'Haris',
          content: fallbackContent,
        };
        setMessages((prev) => [...prev, agentMessage]);
        
        // Auto-speak agent response if enabled
        if (voiceSettings.voiceEnabled && voiceSettings.autoSpeak && agentMessage.content) {
          setTimeout(() => {
            console.log('🔊 Auto-speaking fallback agent response (will stop current speech if any)');
            speakText(agentMessage.content);
          }, 500);
        }
        
        // Auto-scroll after adding fallback message
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    }
    };

    eventSource.onerror = (err) => {
      console.error('❌ Stream error:', err);
      setIsTyping(false);
      
      // Only show error message if we haven't received any messages
      // (For cached responses, the stream closes immediately after sending the message)
      if (!receivedMessage && eventSource && eventSource.readyState !== EventSource.CLOSED) {
        console.error('❌ EventSource error - no messages received');
        setMessages((prev) => [
          ...prev,
          {
            role: 'agent',
            agent: 'Haris',
            content: '⚠️ Something went wrong. Please try again or check the server.',
          },
        ]);
      } else if (receivedMessage) {
        console.log('✅ EventSource closed after receiving message (expected for cached responses)');
      }
      
      // Safely close the connection
      try {
        if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
          eventSource.close();
        }
      } catch (closeError) {
        console.warn('EventSource already closed:', closeError);
      }
    };

    setInput('');

    // Focus back on the input field after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };  // Remove scroll detection since we don't have internal scrolling
  // useEffect(() => {
  //   const container = containerRef.current;
  //   if (!container) return;
  //   
  //   const handleScroll = () => {
  //     const isNearBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 150;
  //     setShowScrollButton(!isNearBottom);
  //   };
  //   container.addEventListener('scroll', handleScroll);
  //   handleScroll();
  //   
  //   return () => {
  //     container.removeEventListener('scroll', handleScroll);
  //   };
  // }, []);

  // Update input rows based on content, but keep it compact and auto-expand
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  };
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // Focus input field on component mount
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
  }, []);
  return (
    <div style={{ 
      minHeight: '100vh',  // Use minHeight instead of height to allow content to expand
      display: 'flex', 
      flexDirection: 'column', 
      background: 'linear-gradient(180deg, #fafbfc 0%, #f8f9fa 100%)',
      fontFamily: "'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      paddingBottom: '120px' // Add padding to account for fixed input bar
    }}>      <div
        ref={containerRef}
        id="chat-container"        
        style={{
          width: '100%',
          overflowY: 'visible', // Allow natural content flow
          overflowX: 'hidden',
          position: 'relative',
          maxWidth: '100%',
          margin: '0 auto',
        }}
      >
        {messages.length === 0 ? (
          <div className="welcome-container">
            <div className="welcome-title">
              Hello, I'm Haris
            </div>
            <div className="welcome-subtitle">
              Ask Haris anything about your Azure environment and get intelligent insights.
            </div>
            <div className="suggestions-grid">
              {promptSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="prompt-tile-glow"
                  onClick={() => {
                    setInput(suggestion);
                    // Focus the input field after setting the text
                    setTimeout(() => {
                      inputRef.current?.focus();
                      // Position cursor at the end
                      if (inputRef.current) {
                        inputRef.current.setSelectionRange(suggestion.length, suggestion.length);
                      }
                    }, 50);
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              maxWidth: 768,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              padding: '20px 24px',
            }}
            className="jzy-chat-messages"
          >
            {' '}
            {messages.map((msg, idx) => {
              // Special handling for custom tool icons
              let processedContent = msg.content;
              if (msg.content?.includes('[RESOURCE_GRAPH_ICON]')) {
                // Replace the Resource Graph Explorer marker with a markdown image
                processedContent = msg.content.replace('[RESOURCE_GRAPH_ICON]', '![Resource Graph Explorer](/Resource-Graph-Explorer.svg)');
              } else if (msg.content?.includes('[ADX_ICON]')) {
                // Replace the ADX marker with a markdown image
                processedContent = msg.content.replace('[ADX_ICON]', '![Azure Data Explorer](/adx.png)');
              }

              return msg.role === 'agent' || msg.role === 'assistant' ? (
                <div key={idx}>
                  <ChatBubble 
                    role={msg.role} 
                    agent={msg.agent} 
                    content={processedContent} 
                    sources={msg.sources} 
                    citations={msg.citations}
                    onSpeak={speakText}
                    onStopSpeaking={stopSpeaking}
                    isSpeaking={isSpeaking}
                    chartData={msg.chartData}
                    chartFormat={msg.chartFormat}
                    chartType={msg.chartType}
                    feedbackGiven={msg.feedbackGiven}
                    onThumbsUp={() => {
                      console.log('🔵 Arrow function for thumbs up called, idx:', idx);
                      handleThumbsUp(idx);
                    }}
                    onThumbsDown={() => {
                      console.log('🔵 Arrow function for thumbs down called, idx:', idx);
                      handleThumbsDown(idx);
                    }}
                  />
                  
                  {/* Debug info - only show in development */}
                  {process.env.NODE_ENV === 'development' && msg.citations && msg.citations.length > 0 && (
                    <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px', textAlign: 'right' }}>
                      {msg.citations.length} citations
                    </div>
                  )}
                </div>
              ) : (
                <ChatBubble 
                  key={idx}
                  role={msg.role} 
                  agent={msg.agent} 
                  content={processedContent} 
                  sources={msg.sources} 
                  citations={msg.citations}
                  onSpeak={speakText}
                  onStopSpeaking={stopSpeaking}
                  isSpeaking={isSpeaking}
                  chartData={msg.chartData}
                  chartFormat={msg.chartFormat}
                  chartType={msg.chartType}
                />
              );            })}
            {isTyping && <TypingBubble message={typingMessage} />}
            <div ref={messagesEndRef} style={{ height: '40px' }} /> {/* Reduced spacer for natural layout */}
          </div>
        )}
      </div>
      {/* Remove scroll-to-bottom button since we don't have internal scrolling */}
      {/* Input Bar */}
      <div className="jzy-chat-inputbar">
        {/* Auto-speak toggle */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          paddingBottom: '8px',
          fontSize: '0.75rem',
          color: '#5f6368'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={voiceSettings.autoSpeak}
              onChange={(e) => {
                const newSettings = { ...voiceSettings, autoSpeak: e.target.checked };
                setVoiceSettings(newSettings);
                localStorage.setItem('harisVoiceSettings', JSON.stringify(newSettings));
                console.log('🔊 Auto-speak toggled:', e.target.checked);
              }}
              style={{ margin: 0 }}
            />
            🔊 Auto-speak Haris responses {!voiceSettings.voiceEnabled ? '(Voice disabled in settings)' : '(using saved voice settings)'}
          </label>
        </div>
        
        <div className="jzy-chat-inputbar-inner">
          <textarea
            ref={inputRef}
            className="jzy-chat-textarea"
            rows={1}
            value={input}
            placeholder={isSpeaking ? "Speech in progress..." : "Ask Haris anything... (Press Enter to send)"}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
              // Focus back on input after Escape
              if (e.key === 'Escape') {
                e.preventDefault();
                inputRef.current?.blur();
                setTimeout(() => inputRef.current?.focus(), 100);
              }
            }}
          />
          {/* Speaking indicator */}
          {isSpeaking && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                marginRight: '8px',
                color: '#1a73e8',
                fontSize: '12px',
                fontWeight: '500',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ marginRight: '4px', animation: 'speakingPulse 1.5s ease-in-out infinite' }}>🔊</span>
              Speaking...
            </div>
          )}
          {/* Microphone Button for Speech Recognition */}
          <Button 
            appearance="outline" 
            className={`jzy-chat-mic-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTyping || isSpeaking}
            aria-label={isRecording ? "Stop recording" : isSpeaking ? "Speech in progress" : "Start voice input"}
            style={{
              backgroundColor: isRecording ? '#ff4444' : 'transparent',
              color: isRecording ? 'white' : '#5f6368',
              border: isRecording ? 'none' : '1px solid #dadce0',
            }}
          >
            {isRecording ? <MicOff24Regular /> : <Mic24Regular />}
          </Button>
          <Button appearance="primary" className="jzy-chat-send-btn" onClick={handleSend} disabled={!input.trim() || isTyping || isSpeaking} aria-label={isSpeaking ? "Speech in progress" : "Send message"}>
            <Send24Regular />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper function to thoroughly process citations
function processCitations(rawCitations: Record<string, unknown>[]): Citation[] {
  if (!Array.isArray(rawCitations) || rawCitations.length === 0) return [];

  console.log('Processing citations:', rawCitations.length);

  return rawCitations.map((citation: Record<string, unknown>, idx: number) => {
    // Extract core fields with type safety
    const id = (citation.id as string) || String(idx + 1);
    const reindex_id = String(idx + 1);

    // Try multiple field names for title
    const title = (citation.title as string) || (citation.document_name as string) || `Citation ${idx + 1}`;

    // Try multiple field names for content
    const content = (citation.content as string) || (citation.content_sample as string) || (citation.snippet as string) || '';

    // Extract document name with fallbacks
    const document_name = (citation.document_name as string) || (citation.title as string) || `Document ${idx + 1}`;

    // Extract filename with multiple strategies
    let file_name = (citation.file_name as string) || '';

    // If no direct filename, try to extract from filepath
    if (!file_name && citation.filepath) {
      const filepath = citation.filepath as string;
      const pathParts = filepath.split(/[/\\]/);
      file_name = pathParts[pathParts.length - 1] || '';
    }

    // If still no filename but we have a document name, try to extract filename pattern
    if (!file_name && document_name) {
      const filePattern = document_name.match(/(\w+[-_]?\w+\.(pdf|docx|xlsx|html?|md|json|txt|csv))/i);
      if (filePattern) {
        file_name = filePattern[0];
      }
    }

    // For debugging
    console.log(`Processed citation ${idx + 1}:`, {
      id,
      title: title.substring(0, 30) + (title.length > 30 ? '...' : ''),
      document_name: document_name.substring(0, 30) + (document_name.length > 30 ? '...' : ''),
      file_name,
    });

    return {
      id,
      reindex_id,
      title,
      content,
      section: (citation.section as string) || '',
      filepath: (citation.filepath as string) || '',
      chunkId: (citation.chunkId as string) || '',
      document_name,
      file_name,
      // Include any additional metadata that might be useful
      url: (citation.url as string) || '',
      source_info: (citation.source_info as string) || '',
    };
  });
}
