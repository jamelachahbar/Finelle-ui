import { useState, useRef, useEffect } from 'react';
import { Button } from '@fluentui/react-components';
import ChatBubble from './ChatBubble';
import TypingBubble from './TypingBubble';
import './ChatWindow.css';
import { ChevronDown24Regular, Send24Regular } from '@fluentui/react-icons';
import { Citation, formatCitationsForMarkdown } from '../utils/citationUtils';

type ChatMessage = {
  role: 'user' | 'agent' | 'assistant' | 'system';
  agent: string;
  content: string;
  sources?: string[];
  processedContent?: string;
  citations?: Citation[];
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
  }, []);  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState<string>('Finelle is thinking...');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Simple scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll when messages change or typing state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, typingMessage]);
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        agent: 'You',
        content: input,
      },
    ]);    // Immediately scroll to bottom when user sends a message
    scrollToBottom();

    setIsTyping(true);
    const encodedPrompt = encodeURIComponent(input);
    const baseUrl = import.meta.env.VITE_BACKEND_URL;
    const eventSource = new EventSource(`${baseUrl}/api/ask-stream?prompt=${encodedPrompt}&sessionId=${sessionIdRef.current}`);    eventSource.onmessage = (event) => {
      console.log('Raw event data:', event.data); // Debug the raw data first
      console.log('Event data type:', typeof event.data);
      
      let data;
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
        
        console.log('API Response Data:', {
          content: data.content?.substring(0, 50) + '...',
          fullContent: data.content, // Add full content for debugging
          hasCitations: data.citations ? true : false,
          citationsCount: data.citations?.length || 0,
          citationFields: data.citations?.length > 0 ? Object.keys(data.citations[0]) : [],
          firstCitation: data.citations?.length > 0 ? JSON.stringify(data.citations[0]).substring(0, 100) + '...' : null,
          responseProperties: Object.keys(data),
        });

        if (data.content === '[DONE]') {
          setIsTyping(false);
          setTypingMessage('');
        eventSource.close();
        return;
      }

      // Validate API response structure
      if (!data || typeof data !== 'object') {
        console.error('Invalid API response:', data);
        return;
      } // Check if content is present      if (!data.content?.trim()) return;      // Special check for custom tool icons
      if (data.content.includes('[RESOURCE_GRAPH_ICON]')) {
        console.log('🎯 Detected Resource Graph Explorer icon replacement marker!');
      } else if (data.content.includes('[ADX_ICON]')) {
        console.log('🎯 Detected ADX icon replacement marker!');
      } // Process citations if present
      let processedContent = data.content;
      let citations: Citation[] = [];

      // Improved citation detection - check data.citations for array type and length
      const hasCitations = Array.isArray(data.citations) && data.citations.length > 0;
      console.log('Citation detection:', {
        hasCitations,
        citationsLength: Array.isArray(data.citations) ? data.citations.length : 'not an array',
        firstCitationSample: hasCitations ? JSON.stringify(data.citations[0]).substring(0, 80) + '...' : 'none',
      });

      if (hasCitations) {
        try {
          console.log('Processing citations from API:', data.citations.length, 'first citation:', data.citations[0]); // Use the citations directly rather than trying to parse from content
          citations = data.citations.map((citation: unknown, index: number) => {
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
      const msg: ChatMessage = {
        role: data.role || 'agent',
        agent: data.agent || 'Finelle',
        content: processedContent,
        sources: data.sources || [],
        // Ensure citations are explicitly set if available
        citations: citations && citations.length > 0 ? citations : undefined,
      };

      // Create a final check to ensure citations are included in the message
      // If there are citations in the original data, make sure they're passed along
      if (msg.citations === undefined && hasCitations) {
        console.log('Citations were found in data but not properly processed - fixing', {
          citationsInMsg: msg.citations ? 'present' : 'undefined',
          citationsInData: hasCitations ? data.citations.length : 0,
        });

        // Process citations thoroughly to ensure complete information
        msg.citations = processCitations(data.citations);
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
        }        setMessages((prev) => [...prev, msg]);
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
        setMessages((prev) => [...prev, {
          role: 'agent',
          agent: 'Finelle',
          content: fallbackContent,
        }]);
        
        // Auto-scroll after adding fallback message
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }
    }
    };

    eventSource.onerror = (err) => {
      console.error('❌ Stream error:', err);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          agent: 'Finelle',
          content: '⚠️ Something went wrong. Please try again or check the server.',
        },
      ]);
      eventSource.close();
    };

    setInput('');

    // Focus back on the input field after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };  // Simple scroll detection for showing scroll button
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      // Show scroll button if user scrolled up more than 150px from bottom
      const isNearBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 150;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initially
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'linear-gradient(180deg, #fafbfc 0%, #f8f9fa 100%)',
      fontFamily: "'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>      <div
        ref={containerRef}
        id="chat-container"        
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: 140,
          position: 'relative',
          maxWidth: '100%',
          margin: '0 auto',
          width: '100%',
          scrollBehavior: 'smooth',
        }}
      >
        {messages.length === 0 ? (
          <div className="welcome-container">
            <div className="welcome-title">
              Hello, FinOps Explorer
            </div>
            <div className="welcome-subtitle">
              Ask Finelle anything about your Azure environment and get intelligent insights.
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
                  <ChatBubble role={msg.role} agent={msg.agent} content={processedContent} sources={msg.sources} citations={msg.citations} />
                  {/* Debug info - only show in development */}
                  {process.env.NODE_ENV === 'development' && msg.citations && msg.citations.length > 0 && (
                    <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px', textAlign: 'right' }}>{msg.citations.length} citations</div>
                  )}
                </div>
              ) : (
                <ChatBubble key={idx} role={msg.role} agent={msg.agent} content={processedContent} sources={msg.sources} citations={msg.citations} />
              );            })}
            {isTyping && <TypingBubble message={typingMessage} />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      {/* Floating scroll-to-bottom button OUTSIDE chat container */}{' '}
      {showScrollButton && (
        <button className="jzy-scroll-btn" onClick={scrollToBottom} aria-label="Scroll to bottom">
          <ChevronDown24Regular style={{ width: '18px', height: '18px' }} />
        </button>
      )}
      {/* Input Bar */}
      <div className="jzy-chat-inputbar">
        <div className="jzy-chat-inputbar-inner">
          <textarea
            ref={inputRef}
            className="jzy-chat-textarea"
            rows={1}
            value={input}
            placeholder="Ask Finelle anything... (Press Enter to send)"
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
          <Button appearance="primary" className="jzy-chat-send-btn" onClick={handleSend} disabled={!input.trim() || isTyping} aria-label="Send message">
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
