/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import './ChatBubble.css';
import { agentEmojis, agentIcons } from '../constants/agents';
import 'katex/dist/katex.min.css';
import rehypeKatex from 'rehype-katex';
import './jzy-markdown.css';
import { Citation } from '../utils/citationUtils';
import CitationHandler from './CitationHandler';
import { Button } from '@fluentui/react-components';
import { Speaker224Regular, SpeakerMute24Regular, ArrowDownload24Regular, ZoomIn24Regular, Dismiss24Regular } from '@fluentui/react-icons';

interface ChatBubbleProps {
  id?: string; // Message ID for feedback tracking
  role: 'user' | 'agent' | 'system' | 'assistant';
  agent?: string;
  content: string;
  sources?: string[];
  citations?: Citation[];
  onSpeak?: (text: string) => void;
  onStopSpeaking?: () => void;
  isSpeaking?: boolean;
  chartData?: string; // Base64 encoded chart image
  chartFormat?: string; // e.g., "png_base64"
  chartType?: string; // e.g., "time_series_anomaly"
  fromCache?: boolean; // Indicates if response came from memory cache
  feedbackGiven?: 'positive' | 'negative' | null; // Track user feedback
  onFeedback?: (messageId: string, isAccurate: boolean) => void; // Callback for feedback
}

function tryRenderJsonTable(jsonString: string): JSX.Element | null {
  try {
    const parsed = JSON.parse(jsonString.trim());

    if (!Array.isArray(parsed) || parsed.length === 0 || typeof parsed[0] !== 'object') {
      return null;
    }

    const headers = Object.keys(parsed[0]);

    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="jzy-table">
          <thead>
            <tr>
              {headers.map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.map((row, idx) => (
              <tr key={idx}>
                {headers.map((key) => (
                  <td key={key}>{String(row[key] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return null;
  }
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  id,
  role, 
  agent = 'TeamLeader', 
  content, 
  sources = [], 
  citations = [],
  onSpeak,
  onStopSpeaking,
  isSpeaking = false,
  chartData,
  chartFormat,
  chartType,
  fromCache = false,
  feedbackGiven = null,
  onFeedback
}) => {
  const isUser = role === 'user';
  const [enlargedChart, setEnlargedChart] = useState<{src: string, alt: string} | null>(null);

  // Chart utility functions
  const downloadChart = (imageSrc: string, altText: string) => {
    try {
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = `${altText.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_chart.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('📥 Chart downloaded:', altText);
    } catch (error) {
      console.error('❌ Failed to download chart:', error);
      // Fallback: open in new tab
      window.open(imageSrc, '_blank');
    }
  };

  const openChartModal = (imageSrc: string, altText: string) => {
    setEnlargedChart({ src: imageSrc, alt: altText });
    console.log('🔍 Opening chart in fullscreen:', altText);
  };

  const closeChartModal = () => {
    setEnlargedChart(null);
  };

  // Close modal on Escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && enlargedChart) {
        closeChartModal();
      }
    };
    
    if (enlargedChart) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [enlargedChart]);

  // Log for debugging
  if (citations && citations.length > 0) {
    console.log(
      `ChatBubble rendering with ${citations.length} citations:`,
      citations.map((c) => ({ id: c.id, title: c.title || c.document_name })),
    );
  }

  // Debug chart data
  if (chartData) {
    console.log('📊 ChatBubble received chart data:', {
      chartDataLength: chartData.length,
      chartFormat,
      chartType,
      chartDataPreview: chartData.substring(0, 50) + '...'
    });
  }

  // Debug markdown content for embedded charts (only log once per unique content)
  const contentHash = content.substring(0, 100); // Simple hash for deduplication
  if (content.includes('data:image/png;base64,') && !(window as any).loggedCharts?.has(contentHash)) {
    if (!(window as any).loggedCharts) (window as any).loggedCharts = new Set();
    (window as any).loggedCharts.add(contentHash);
    console.log('🖼️ Markdown image detected in content:', {
      contentLength: content.length,
      imageStart: content.indexOf('data:image/png;base64,'),
      imagePreview: content.substring(content.indexOf('data:image/png;base64,'), content.indexOf('data:image/png;base64,') + 50) + '...'
    });
  }
  const cleanedContent = useMemo(() => {
    let processed = content;

    // Debug: Check for base64 content before any processing
    if (processed.includes('data:image/png;base64,')) {
      console.log('📋 Raw content contains base64 before processing:', {
        hasBase64: true,
        base64Start: processed.indexOf('data:image/png;base64,'),
        base64Preview: processed.substring(processed.indexOf('data:image/png;base64,'), processed.indexOf('data:image/png;base64,') + 100) + '...'
      });
    }

    // Clean up service references
    if (content.includes('Service1.') || content.includes('Service2.')) {
      processed = processed.replace(/Service\d+\./g, '');
    }

    // Remove citation section from content if it will be rendered separately
    if (citations && citations.length > 0) {
      // Remove the citations section
      if (processed.includes('## 📚 Citations and References')) {
        processed = processed.split('## 📚 Citations and References')[0].trim();
      }

      // Remove legacy citation formats to avoid duplication
      // Match patterns like (Source: doc), (Reference: doc), etc.
      processed = processed.replace(/\((?:Source|Reference|From|Ref|Citation):?\s*([^)]+)\)/gi, '');

      // Remove standalone citation lines at the end of the content
      processed = processed.replace(/(?:Source|Reference|From|Ref|Citation)s?:[ \t]+([^\n]+)(?:\n|$)/gi, '');

      // Clean up any empty lines at the end
      processed = processed.replace(/\n+$/g, '');
    }

    // Debug: Check if base64 content survived processing
    if (content.includes('data:image/png;base64,') && processed.includes('data:image/png;base64,')) {
      console.log('✅ Base64 content survived cleanedContent processing');
    } else if (content.includes('data:image/png;base64,') && !processed.includes('data:image/png;base64,')) {
      console.log('❌ Base64 content was removed during cleanedContent processing!');
    }

    return processed.trim();
  }, [content, citations]);

  // Extract base64 images and direct chart links for rendering
  const base64Images = useMemo(() => {
    const images: Array<{src: string, alt: string}> = [];
    
    // First, let's see what we're working with - log the actual content
    console.log('🔍 Content analysis for chart detection:', {
      contentLength: content.length,
      hasDataImage: content.includes('data:image/'),
      hasBase64: content.includes('base64,'),
      hasDirectLink: content.includes('📊') && content.includes('chart'),
      contentPreview: content.substring(0, 400) + '...',
      fullContent: content.length < 500 ? content : content.substring(0, 500) + '...[TRUNCATED]'
    });
    
    // Check for chartData prop as PRIMARY source (prevents duplicates)
    if (chartData) {
      console.log('📊 Using chart data from props (PRIMARY SOURCE - prevents duplicates):', {
        chartDataLength: chartData.length,
        chartFormat,
        chartType,
        chartDataPreview: chartData.substring(0, 50) + '...'
      });
      
      // Add chart from props as the ONLY source
      images.push({
        alt: chartType || 'Chart from props',
        src: `data:image/${chartFormat || 'png'};base64,${chartData}`
      });
      
      // IMPORTANT: Early return to prevent duplicate processing
      console.log('✅ Using props-based chart data exclusively - skipping content extraction to prevent duplicates');
      return images;
    }
    
    // FALLBACK: Only extract from content if no chartData props available
    console.log('🔍 No chart props found, extracting from content as fallback...');
    
    // NEW: Enhanced detection for backend-generated charts (matplotlib, seaborn, etc.)
    const chartLinkPatterns = [
      /📊\s*([^-\n]+)\s*-\s*\(Rendered below\)/gi,
      /📊\s*([^-\n]+)\s*-\s*\([^)]*below[^)]*\)/gi,
      /Here's a chart[^:]*:\s*📊\s*([^\n]+)/gi,
      /chart showing[^:]*:\s*📊\s*([^\n]+)/gi,
      /Visual Chart:\s*([^\n]+)/gi,
      /Here's the chart:\s*([^\n]+)/gi
    ];
    
    // Comprehensive URL detection for backend chart tools
    const allImageUrls = [
      // Standard image formats
      ...(content.match(/https?:\/\/[^\s<>"'()]+\.(png|jpg|jpeg|gif|svg|webp)/gi) || []),
      // CDN URLs (common for chart hosting)
      ...(content.match(/https:\/\/mdn\.alipayobjects\.com\/[^\s<>"'()]+/gi) || []),
      // Azure blob storage
      ...(content.match(/https:\/\/[^.]+\.blob\.core\.windows\.net\/[^\s<>"'()]+/gi) || []),
      // AWS S3
      ...(content.match(/https:\/\/[^.]+\.s3[^.]*\.amazonaws\.com\/[^\s<>"'()]+/gi) || []),
      // Google Cloud Storage
      ...(content.match(/https:\/\/storage\.googleapis\.com\/[^\s<>"'()]+/gi) || []),
      // Generic chart hosting services
      ...(content.match(/https:\/\/[^/]+\/[^\s<>"'()]*chart[^\s<>"'()]*/gi) || []),
      // Base64 data URLs (fallback)
      ...(content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g) || [])
    ];
    
    // Remove duplicates
    const uniqueImageUrls = [...new Set(allImageUrls)];
    
    console.log('🔍 Backend chart detection:', {
      totalUrls: uniqueImageUrls.length,
      urlTypes: {
        standardImages: uniqueImageUrls.filter(url => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(url)).length,
        cdnUrls: uniqueImageUrls.filter(url => url.includes('mdn.alipayobjects.com')).length,
        base64: uniqueImageUrls.filter(url => url.startsWith('data:image/')).length,
        cloudStorage: uniqueImageUrls.filter(url => /blob\.core\.windows\.net|s3.*\.amazonaws\.com|storage\.googleapis\.com/.test(url)).length
      },
      urls: uniqueImageUrls.slice(0, 3) // Show first 3 URLs for debugging
    });
    
    // Add all detected image URLs (these come from backend tools like matplotlib)
    uniqueImageUrls.forEach((imageUrl, index) => {
      const isBase64 = imageUrl.startsWith('data:image/');
      const needsProxy = !isBase64 && !imageUrl.includes(window.location.hostname);
      
      const urlType = isBase64 ? 'base64' : 
                     imageUrl.includes('mdn.alipayobjects.com') ? 'CDN' :
                     imageUrl.includes('blob.core.windows.net') ? 'Azure' :
                     imageUrl.includes('amazonaws.com') ? 'AWS' :
                     imageUrl.includes('googleapis.com') ? 'Google Cloud' : 
                     imageUrl.includes('microsoft.com') ? 'Microsoft Docs' : 'Direct URL';
      
      console.log(`📊 Adding backend chart ${index + 1} (${urlType}, proxy: ${needsProxy}):`, imageUrl.substring(0, 100) + '...');
      
      // Use proxy for external URLs to avoid CORS issues
      const finalUrl = needsProxy 
        ? `/api/proxy/image?url=${encodeURIComponent(imageUrl)}`
        : imageUrl;
      
      images.push({
        alt: `Chart ${index + 1} (${urlType})`,
        src: finalUrl
      });
    });
    
    chartLinkPatterns.forEach((pattern, patternIndex) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const chartTitle = match[1]?.trim() || `Chart ${images.length + 1}`;
        console.log(`📊 Detected HARIS chart reference (pattern ${patternIndex + 1}):`, {
          title: chartTitle,
          fullMatch: match[0],
          contentAround: content.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50)
        });
        
        // Only add placeholder if we haven't already added direct URLs
        if (uniqueImageUrls.length === 0) {
          images.push({
            alt: chartTitle,
            src: 'data:image/svg+xml;base64,' + btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
                <rect width="400" height="200" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2" rx="8"/>
                <text x="200" y="80" text-anchor="middle" fill="#6c757d" font-family="Arial, sans-serif" font-size="14">
                  📊 ${chartTitle}
                </text>
                <text x="200" y="105" text-anchor="middle" fill="#6c757d" font-family="Arial, sans-serif" font-size="12">
                  Chart detected but not yet converted to base64
                </text>
                <text x="200" y="125" text-anchor="middle" fill="#495057" font-family="Arial, sans-serif" font-size="11">
                  HARIS provided a direct link - conversion needed
                </text>
                <circle cx="50" cy="150" r="8" fill="#007bff"/>
                <circle cx="120" cy="130" r="8" fill="#28a745"/>
                <circle cx="190" cy="140" r="8" fill="#ffc107"/>
                <circle cx="260" cy="120" r="8" fill="#dc3545"/>
                <circle cx="330" cy="160" r="8" fill="#6f42c1"/>
              </svg>
            `)
          });
        }
      }
    });
    
    // Multiple regex patterns to catch different formats
    const patterns = [
      /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[^)]+)\)/g,  // Standard markdown
      /\[([^\]]*)\]\s*\((data:image\/[^;]+;base64,[^)]+)\)/g,  // Markdown without !
      /(data:image\/png;base64,[A-Za-z0-9+/=]+)/g,        // Raw base64 URLs - PNG specific
      /(data:image\/[^;\s]+;base64,[A-Za-z0-9+/=]{100,})/g // Any image format with long base64
    ];
    
    // Also search for any occurrence of base64 data in the content
    const base64Matches = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g);
    if (base64Matches) {
      console.log('🔍 Found raw base64 matches:', base64Matches.length);
      base64Matches.forEach((match, index) => {
        images.push({
          alt: `Chart ${index + 1}`,
          src: match
        });
        console.log(`✅ Added raw base64 match ${index + 1}:`, {
          srcLength: match.length,
          srcPreview: match.substring(0, 50) + '...'
        });
      });
    }
    
    patterns.forEach((regex, index) => {
      let match;
      const patternName = ['Standard markdown', 'Markdown without !', 'Raw base64'][index];
      
      while ((match = regex.exec(content)) !== null) {
        const alt = match[1] || 'Chart';
        const src = match[2] || match[1];  // For raw URLs, the data is in match[1]
        
        // Enhanced debugging for base64 data
        console.log(`🎯 ${patternName} - Extracted base64 image:`, {
          alt,
          srcLength: src.length,
          srcPreview: src.substring(0, 50) + '...',
          isValidDataUrl: src.startsWith('data:image/'),
          hasBase64: src.includes('base64,'),
          base64DataLength: src.split('base64,')[1]?.length || 0,
          imageFormat: src.match(/data:image\/([^;]+)/)?.[1] || 'unknown'
        });
        
        // Validate the base64 data
        try {
          const base64Data = src.split('base64,')[1];
          if (base64Data && base64Data.length > 100) {
            images.push({ alt, src });
            console.log(`✅ Valid base64 image added to render queue from ${patternName}`);
          } else {
            console.error(`❌ Invalid base64 data from ${patternName} - too short or missing:`, base64Data?.length);
          }
        } catch (error) {
          console.error(`❌ Error validating base64 data from ${patternName}:`, error);
        }
      }
    });
    
    console.log(`📊 Total base64 images to render: ${images.length}`);
    return images;
  }, [content, chartData, chartFormat, chartType]);

  // Remove base64 images and direct chart URLs from markdown content to prevent duplication
  const contentWithoutBase64Images = useMemo(() => {
    let processed = cleanedContent;
    
    console.log('🔄 Processing content for chart URL removal:', {
      originalLength: processed.length,
      hasDataImage: processed.includes('data:image/'),
      hasDirectUrls: processed.includes('https://'),
      extractedImagesCount: base64Images.length,
      contentPreview: processed.substring(0, 300) + '...'
    });
    
    // Remove direct chart URLs that we've extracted to prevent duplication
    if (base64Images.length > 0) {
      base64Images.forEach((image, index) => {
        if (!image.src.startsWith('data:image/')) {
          // This is a direct URL, remove it from content
          const urlToRemove = image.src;
          console.log(`🔄 Removing direct URL ${index + 1} from content:`, urlToRemove.substring(0, 80) + '...');
          
          // Remove the URL in various markdown formats
          processed = processed.replace(new RegExp(`!\\[([^\\]]*)\\]\\(\\s*${urlToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\)`, 'g'), '');
          processed = processed.replace(new RegExp(`\\[([^\\]]*)\\]\\s*\\(\\s*${urlToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\)`, 'g'), '');
          // Also remove raw URLs
          processed = processed.replace(new RegExp(urlToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
        }
      });
    }
    
    // Always try to remove base64 content regardless of extraction method
    if (processed.includes('data:image/')) {
      // Enhanced replacement patterns to catch more formats
      const replacements = [
        { pattern: /!\[([^\]]*)\]\(data:image\/[^;]+;base64,[^)]+\)/g, name: 'Standard markdown' },
        { pattern: /\[([^\]]*)\]\s*\(data:image\/[^;]+;base64,[^)]+\)/g, name: 'Markdown without !' },
        { pattern: /data:image\/png;base64,[A-Za-z0-9+/=]+/g, name: 'Raw base64 PNG' },
        { pattern: /data:image\/[^;\s]+;base64,[A-Za-z0-9+/=]{100,}/g, name: 'Raw base64 any format' },
        // Additional patterns for different formats
        { pattern: /!\[([^\]]*)\]\s*\(\s*data:image[^)]+\)/g, name: 'Markdown with spaces' },
        { pattern: /\[([^\]]*)\]\s*\(\s*data:image[^)]+\)/g, name: 'Brackets with spaces' }
      ];
      
      replacements.forEach(({ pattern, name }) => {
        const matches = [...processed.matchAll(pattern)];
        if (matches.length > 0) {
          console.log(`🔄 Replacing ${matches.length} ${name} patterns`);
          processed = processed.replace(pattern, (match, alt) => {
            const placeholder = `📊 **Chart: ${alt || 'Resource Cost Outliers Chart'}** _(Chart rendered below)_`;
            console.log(`   Replaced: ${match.substring(0, 100)}... -> ${placeholder}`);
            return placeholder;
          });
        }
      });
      
      // Fallback: Remove any remaining standalone base64 data URLs
      if (processed.includes('data:image/')) {
        console.log('🔄 Applying fallback base64 removal...');
        processed = processed.replace(/data:image\/[^;\s]+;base64,[A-Za-z0-9+/=]+/g, '📊 **Chart** _(Rendered below)_');
      }
      
      console.log('✅ Content processing complete, remarkGfm will handle other markdown features');
    }
    
    return processed;
  }, [cleanedContent, base64Images]);

  const jsonTable = role === 'user' ? tryRenderJsonTable(cleanedContent) : null;

  return (
    <div className={`jzy-chat-bubble ${isUser ? 'jzy-user' : 'jzy-agent'}`}>
      <div className="jzy-chat-meta">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {/* Agent name on the left */}
          <span className={`jzy-chat-role jzy-tag-${role}`}>
            {isUser ? (
              '🧑 You'
            ) : (
              <>
                {agentIcons[agent] ? (
                  <img 
                    src={agentIcons[agent]} 
                    alt={agent} 
                    style={{ width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle' }} 
                  />
                ) : (
                  `${agentEmojis[agent] || '🤖'} `
                )}
                {agent}
              </>
            )}
          </span>
          
          {/* All icons grouped on the right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Memory cache badge */}
            {!isUser && fromCache && (
              <span 
                className="memory-badge"
                style={{
                  fontSize: '11px',
                  padding: '2px 6px',
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  borderRadius: '4px',
                  fontWeight: 500
                }}
              >
                📚 From Memory
              </span>
            )}
            
            {/* Feedback buttons */}
            {!isUser && id && onFeedback && (
              <div style={{ display: 'flex', gap: '4px' }}>
                {feedbackGiven === null ? (
                  <>
                    <Button
                      appearance="subtle"
                      size="small"
                      onClick={() => onFeedback(id, true)}
                      aria-label="Thumbs up - This response was helpful"
                      className="feedback-btn feedback-btn-positive"
                      style={{
                        minWidth: '28px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        color: '#5f6368',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      👍
                    </Button>
                    <Button
                      appearance="subtle"
                      size="small"
                      onClick={() => onFeedback(id, false)}
                      aria-label="Thumbs down - This response was not helpful"
                      className="feedback-btn feedback-btn-negative"
                      style={{
                        minWidth: '28px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        color: '#5f6368',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      👎
                    </Button>
                  </>
                ) : (
                  <span 
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      backgroundColor: feedbackGiven === 'positive' ? '#e8f5e9' : '#ffebee',
                      color: feedbackGiven === 'positive' ? '#2e7d32' : '#c62828',
                      borderRadius: '4px',
                      fontWeight: 500
                    }}
                  >
                    {feedbackGiven === 'positive' ? '✓ Helpful' : '✗ Not Helpful'}
                  </span>
                )}
              </div>
            )}
            
            {/* Speaker button for agent messages */}
            {!isUser && onSpeak && (
              <Button
                appearance="subtle"
                size="small"
                onClick={() => isSpeaking ? onStopSpeaking?.() : onSpeak(content)}
                disabled={!content.trim()}
                aria-label={isSpeaking ? "Stop speaking" : "Read message aloud"}
                style={{
                  minWidth: '28px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  color: isSpeaking ? '#ff4444' : '#5f6368'
                }}
              >
                {isSpeaking ? <SpeakerMute24Regular style={{ width: '14px', height: '14px' }} /> : <Speaker224Regular style={{ width: '14px', height: '14px' }} />}
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="jzy-chat-content">
        {jsonTable ? (
          jsonTable
        ) : (
          <>
            <ReactMarkdown
              children={contentWithoutBase64Images}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeKatex]}
              components={{
              a: (props) => (
                <a {...props} target="_blank" rel="noopener noreferrer">
                  {props.children}
                </a>
              ),              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              img: ({ node, ...props }) => {
                // Debug all images being processed
                console.log('🖼️ ReactMarkdown processing image:', {
                  src: props.src?.substring(0, 80) + '...',
                  alt: props.alt,
                  isBase64: props.src?.startsWith('data:image/'),
                  srcLength: props.src?.length,
                  actualSrcStart: props.src?.substring(0, 30)
                });

                // Check if this is a custom tool icon
                const isResourceGraphIcon = props.src === '/Resource-Graph-Explorer.svg' && props.alt === 'Resource Graph Explorer';
                const isAdxIcon = props.src === '/adx.png' && props.alt === 'Azure Data Explorer';
                const isBase64Chart = props.src?.startsWith('data:image/') && props.src?.includes('base64,');
                
                // Check if remarkGfm transformed a base64 image to a CDN URL (fallback detection)
                const isCdnTransformedChart = props.src?.includes('mdn.alipayobjects.com') && 
                                           (props.alt?.toLowerCase().includes('chart') || 
                                            props.alt?.toLowerCase().includes('anomaly') ||
                                            props.alt?.toLowerCase().includes('plot'));

                if (isResourceGraphIcon || isAdxIcon) {
                  return (
                    <img
                      {...props}
                      style={{
                        width: '30px',
                        height: '18px',
                        display: 'inline',
                        verticalAlign: 'midddle'
                      }}
                    />
                  );
                }

                // Enhanced styling for base64 chart images
                if (isBase64Chart) {
                  console.log('📊 Rendering base64 chart image with preserved backend styling:', {
                    alt: props.alt,
                    srcStart: props.src?.substring(0, 50) + '...',
                    preservedStyling: true
                  });
                  return (
                    <div className="backend-chart-container" style={{ 
                      margin: '16px 0', 
                      textAlign: 'center',
                      // Complete CSS isolation to prevent frontend interference
                      isolation: 'isolate',
                      contain: 'style layout paint',
                      colorScheme: 'normal'
                    }}>
                      <img 
                        {...props} 
                        style={{ 
                          maxWidth: '100%', 
                          height: 'auto', 
                          borderRadius: '6px', 
                          border: '1px solid #e0e0e0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          display: 'block',
                          margin: '0 auto',
                          // CRITICAL: Preserve backend chart colors and styling
                          filter: 'none !important',
                          imageRendering: 'auto',
                          mixBlendMode: 'normal',
                          isolation: 'isolate',
                          // Prevent color modifications
                          colorAdjust: 'exact',
                          printColorAdjust: 'exact',
                          // Prevent any transforms or effects
                          transform: 'none',
                          opacity: '1',
                          // Ensure original image quality
                          imageOrientation: 'none',
                          objectFit: 'contain'
                        }} 
                        // Prevent dragging to maintain chart integrity
                        draggable={false}
                        // Accessibility and loading optimization
                        loading="lazy"
                        decoding="async"
                        onLoad={() => console.log('✅ Backend chart image loaded with preserved styling:', props.alt)}
                        onError={(e) => console.error('❌ Backend chart image failed to load:', props.alt, e)}
                      />
                    </div>
                  );
                }

                // Handle CDN-transformed charts by finding the original base64 data
                if (isCdnTransformedChart) {
                  console.log('🔄 CDN-transformed chart detected - using placeholder since base64 will render below:', {
                    alt: props.alt,
                    cdnSrc: props.src,
                    availableBase64Images: base64Images.length,
                    availableAlts: base64Images.map(img => img.alt)
                  });
                  
                  // Instead of trying to find the original, just show a simple placeholder
                  // The base64 images will render separately below
                  return (
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: '#e8f4fd',
                      borderRadius: '6px',
                      border: '1px solid #b3d9ff',
                      color: '#0066cc',
                      fontSize: '14px',
                      fontStyle: 'italic',
                      marginTop: '8px',
                      textAlign: 'center'
                    }}>
                      📊 {props.alt || 'Chart'} - (Rendered below)
                    </div>
                  );
                }

                // Default styling for other images
                return <img {...props} style={{ maxWidth: '100%', borderRadius: 6, marginTop: 8 }} alt="chart" />;
              },
              code: (props) => {
                const { inline, className, children } = props as any;
                const codeText = (children || '').toString().trim();

                // only intercept fenced JSON blocks
                if (!inline && className?.includes('language-json')) {
                  try {
                    const parsed = JSON.parse(codeText);

                    // if it looks like { summary, preview: [ … ] }
                    if (parsed && typeof parsed === 'object' && typeof parsed.summary === 'string' && Array.isArray(parsed.preview)) {
                      // render the summary
                      const summaryEl = (
                        <div style={{ marginBottom: '1em' }}>
                          <strong>Summary</strong>
                          <p>{parsed.summary}</p>
                        </div>
                      );

                      // render the preview array as a table
                      const headers = Object.keys(parsed.preview[0] || {});
                      const rows = parsed.preview;

                      const tableEl = (
                        <div style={{ overflowX: 'auto' }}>
                          <table className="jzy-table">
                            <thead>
                              <tr>
                                {headers.map((h) => (
                                  <th key={h}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((row: any, i: number) => (
                                <tr key={i}>
                                  {headers.map((h) => (
                                    <td key={h}>{String(row[h] ?? '')}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );

                      return (
                        <div style={{ margin: '1em 0' }}>
                          {summaryEl}
                          {tableEl}
                        </div>
                      );
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  } catch (e) {
                    // fall back to normal code block
                  }
                }

                return inline ? (
                  <code className={className}>{children}</code>
                ) : (
                  <pre className="jzy-code-block">
                    <code className={className}>{children}</code>
                  </pre>
                );
              },
              details: ({ children }) => <details style={{ marginTop: 8 }}>{children}</details>,
              summary: ({ children }) => <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{children}</summary>,

              table: ({ children }) => (
                <div style={{ overflowX: 'auto' }}>
                  <table className="jzy-table">{children}</table>
                </div>
              ),
            }}
          />
          
          {/* Render extracted base64 images - React optimized */}
          {base64Images.length > 0 && (
            <section role="img" aria-label="Charts and visualizations">
              <div style={{ 
                marginTop: '16px', 
                padding: '8px', 
                backgroundColor: '#f0f8ff', 
                borderRadius: '4px', 
                fontSize: '12px',
                border: '1px solid #d0e7ff'
              }}>
                📊 Displaying {base64Images.length} chart{base64Images.length > 1 ? 's' : ''}
              </div>
              {base64Images.map((image, index) => {
                // Generate stable key from image content
                const imageKey = `chart-${index}-${image.src.slice(-20)}`;
                
                return (
                  <figure 
                    key={imageKey} 
                    className="backend-chart-container"
                    style={{ 
                      margin: '16px 0', 
                      textAlign: 'center',
                      padding: '8px',
                      backgroundColor: '#fafafa',
                      borderRadius: '8px',
                      // CRITICAL: Complete CSS isolation for backend charts
                      filter: 'none !important',
                      isolation: 'isolate',
                      colorScheme: 'normal',
                      contain: 'style layout paint',
                      // Prevent any CSS cascade interference
                      position: 'relative',
                      zIndex: 'auto',
                      // Reset any inherited transformations
                      transform: 'none',
                      transformStyle: 'flat'
                    }}
                    // Prevent context menu on charts to maintain integrity
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {/* Chart interaction buttons */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      display: 'flex',
                      gap: '4px',
                      zIndex: 10,
                      opacity: 0.8,
                      transition: 'opacity 0.2s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
                    >
                      <Button
                        appearance="subtle"
                        size="small"
                        onClick={() => downloadChart(image.src, image.alt || `Chart_${index + 1}`)}
                        aria-label="Download chart"
                        title="Download chart as PNG"
                        style={{
                          minWidth: '28px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          color: '#5f6368'
                        }}
                      >
                        <ArrowDownload24Regular style={{ width: '14px', height: '14px' }} />
                      </Button>
                      <Button
                        appearance="subtle"
                        size="small"
                        onClick={() => openChartModal(image.src, image.alt || `Chart_${index + 1}`)}
                        aria-label="View chart fullscreen"
                        title="View chart in fullscreen"
                        style={{
                          minWidth: '28px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          color: '#5f6368'
                        }}
                      >
                        <ZoomIn24Regular style={{ width: '14px', height: '14px' }} />
                      </Button>
                    </div>
                    <img 
                      src={image.src}
                      alt={image.alt || `Anomaly detection chart ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      style={{ 
                        maxWidth: '100%', 
                        height: 'auto', 
                        borderRadius: '6px', 
                        border: '1px solid #e0e0e0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        display: 'block',
                        margin: '0 auto',
                        // CRITICAL: Complete backend chart styling preservation
                        filter: 'none !important',
                        imageRendering: 'auto',
                        colorAdjust: 'exact',
                        printColorAdjust: 'exact',
                        WebkitPrintColorAdjust: 'exact', // Safari support
                        // Prevent React/CSS from modifying the image
                        mixBlendMode: 'normal',
                        isolation: 'isolate',
                        // Additional protection against CSS inheritance
                        transform: 'none',
                        opacity: '1',
                        // Preserve original image characteristics
                        imageOrientation: 'none' as any,
                        objectFit: 'contain',
                        objectPosition: 'center'
                      }}
                      // Preserve original image quality and colors
                      draggable={false}
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement;
                        const isBase64 = image.src.startsWith('data:');
                        
                        // Ensure no CSS filters are applied that could change colors
                        img.style.filter = 'none';
                        img.style.imageRendering = 'auto';
                        
                        console.log(`✅ Chart ${index + 1} loaded with preserved styling:`, {
                          alt: image.alt,
                          type: isBase64 ? 'base64' : 'direct URL',
                          dimensions: `${img.naturalWidth}x${img.naturalHeight}`,
                          size: isBase64 ? `${(image.src.length / 1024).toFixed(1)}KB` : 'external',
                          url: isBase64 ? 'base64 data' : image.src,
                          stylingPreserved: true
                        });
                      }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        const isBase64 = image.src.startsWith('data:');
                        
                        console.error(`❌ Chart ${index + 1} failed to load:`, {
                          alt: image.alt,
                          type: isBase64 ? 'base64' : 'direct URL',
                          srcLength: image.src.length,
                          srcPrefix: image.src.substring(0, 100) + '...',
                          naturalDimensions: `${img.naturalWidth || 0}x${img.naturalHeight || 0}`,
                          currentSrc: img.currentSrc,
                          errorType: isBase64 ? 'base64_decode_error' : 'url_load_error'
                        });
                        
                        if (isBase64) {
                          // Validate base64 format
                          try {
                            const base64Match = image.src.match(/^data:image\/[^;]+;base64,(.+)$/);
                            if (base64Match) {
                              const base64Data = base64Match[1];
                              // Test base64 validity
                              atob(base64Data.substring(0, 100));
                              console.log('✅ Base64 format is valid');
                            } else {
                              console.error('❌ Invalid data URL format');
                            }
                          } catch (validationError) {
                            console.error('❌ Base64 validation failed:', validationError);
                          }
                        } else {
                          console.error(`❌ Chart ${index + 1} failed to load:`, {
                            alt: image.alt,
                            type: isBase64 ? 'base64' : 'direct URL',
                            url: image.src.substring(0, 100) + '...'
                          });
                        }
                      }}
                    />
                    <figcaption style={{ 
                      fontSize: '12px', 
                      color: '#666', 
                      marginTop: '8px', 
                      fontStyle: 'italic',
                      lineHeight: '1.4'
                    }}>
                      {image.alt || `Anomaly Detection Chart ${index + 1}`}
                    </figcaption>
                  </figure>
                );
              })}
            </section>
          )}
        
        {/* Chart Fullscreen Modal */}
        {enlargedChart && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              cursor: 'pointer'
            }}
            onClick={closeChartModal}
            role="dialog"
            aria-modal="true"
            aria-label="Chart fullscreen view"
          >
            {/* Close button */}
            <Button
              appearance="subtle"
              onClick={closeChartModal}
              aria-label="Close fullscreen view"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#333',
                zIndex: 1001
              }}
            >
              <Dismiss24Regular style={{ width: '20px', height: '20px' }} />
            </Button>
            
            {/* Download button in modal */}
            <Button
              appearance="subtle"
              onClick={(e) => {
                e.stopPropagation();
                downloadChart(enlargedChart.src, enlargedChart.alt);
              }}
              aria-label="Download chart"
              title="Download chart as PNG"
              style={{
                position: 'absolute',
                top: '20px',
                right: '80px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#333',
                zIndex: 1001
              }}
            >
              <ArrowDownload24Regular style={{ width: '20px', height: '20px' }} />
            </Button>
            
            {/* Enlarged chart */}
            <div 
              style={{
                maxWidth: '95vw',
                maxHeight: '95vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={enlargedChart.src}
                alt={enlargedChart.alt}
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  // Preserve backend chart styling in modal
                  filter: 'none !important',
                  imageRendering: 'auto',
                  colorAdjust: 'exact',
                  printColorAdjust: 'exact',
                  mixBlendMode: 'normal',
                  isolation: 'isolate'
                }}
                draggable={false}
              />
              <div style={{
                marginTop: '16px',
                color: 'white',
                fontSize: '14px',
                textAlign: 'center',
                maxWidth: '80%'
              }}>
                {enlargedChart.alt}
              </div>
              <div style={{
                marginTop: '8px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '12px',
                textAlign: 'center'
              }}>
                Click outside to close • Press Esc to close
              </div>
            </div>
          </div>
        )}
        
        {sources.length > 0 && (
          <div className="jzy-chat-sources">
            <strong>📚 Sources:</strong>
            <ul>
              {sources.map((src, i) => (
                <li key={i}>
                  <a href={src} target="_blank" rel="noopener noreferrer">
                    [{i + 1}] {src}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}{' '}
        {/* Render citations if available */}
        {citations && citations.length > 0 && (
          <div className="jzy-chat-citations">
            <CitationHandler content={cleanedContent} citations={citations} />
            {/* Debug info for citation data - only show in development */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ fontSize: '12px', padding: '8px', marginTop: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', border: '1px dashed #ccc' }}>
                <div>
                  <strong>Citation Debug:</strong> {citations.length} found
                </div>
                <div>
                  <strong>Fields:</strong> {citations.length > 0 ? Object.keys(citations[0]).join(', ') : 'none'}
                </div>
                <div style={{ maxHeight: '200px', overflow: 'auto', fontSize: '11px', marginTop: '4px', fontFamily: 'monospace' }}>
                  {citations.map((c, i) => (
                    <div key={i} style={{ marginBottom: '8px', padding: '4px', borderBottom: '1px dotted #ccc' }}>
                      <div>
                        <strong>
                          [{i + 1}] {c.document_name || c.title}
                        </strong>{' '}
                        (ID: {c.id})
                      </div>
                      {c.section && (
                        <div style={{ color: '#444' }}>
                          <strong>Section:</strong> {c.section}
                        </div>
                      )}
                      {c.filepath && (
                        <div style={{ color: '#444' }}>
                          <strong>Path:</strong> {c.filepath}
                        </div>
                      )}
                      {c.chunkId && (
                        <div style={{ color: '#444' }}>
                          <strong>Chunk:</strong> {c.chunkId}
                        </div>
                      )}
                      {c.content && (
                        <div style={{ marginTop: '4px', color: '#555', fontStyle: 'italic', padding: '4px', backgroundColor: '#f8f8f8', borderRadius: '2px', border: '1px solid #eee' }}>
                          <strong>Content:</strong> "{c.content.substring(0, 100)}..."
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
