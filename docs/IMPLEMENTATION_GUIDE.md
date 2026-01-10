# Implementation Guide: Microsoft Agent UX Principles for Haris

## Purpose

This guide provides actionable steps to implement Microsoft's Agent UX Design principles in the Haris AI interface. Each recommendation is tied directly to the framework's core dimensions: **People**, **Space**, **Time**, and the foundational pillars of **Trust**, **Transparency**, **Control**, and **Consistency**.

---

## Quick Reference: Principle to Implementation Mapping

| Principle | Current State | Target Implementation | Priority |
|-----------|---------------|----------------------|----------|
| **Activity Transparency** | Basic "thinking" message | Detailed status with data sources | High |
| **User Control** | Limited (voice toggle) | Stop/regenerate/refine controls | High |
| **Reasoning Visibility** | Hidden | Collapsible reasoning panel | High |
| **Confidence Communication** | Not shown | Confidence indicators + data quality | Medium |
| **Historical Context** | Session-based only | Cross-session learning | Medium |
| **Resource Connections** | None | Links to docs and best practices | Medium |
| **Proactive Insights** | None | Background monitoring + alerts | Low |
| **Customization** | Basic preferences | Full preference system | Low |

---

## Phase 1: Transparency & Basic Control (Weeks 1-2)

### 1.1 Activity Status Indicator

**Microsoft Principle:** Space - "Easily accessible, occasionally invisible"

**Goal:** Show users what Haris is doing without being intrusive

#### Component: AgentActivityIndicator

```typescript
// src/components/AgentActivityIndicator.tsx
import React from 'react';
import { Spinner } from '@fluentui/react-components';
import './AgentActivityIndicator.css';

type ActivityType = 
  | 'idle'
  | 'understanding_query'
  | 'accessing_data'
  | 'analyzing'
  | 'generating_response';

interface ActivityDetails {
  message: string;
  dataSource?: string;
  progress?: number;
}

interface Props {
  activity: ActivityType;
  details: ActivityDetails;
}

const ACTIVITY_CONFIG = {
  idle: { icon: '🤖', color: '#605E5C' },
  understanding_query: { icon: '🔍', color: '#0078D4' },
  accessing_data: { icon: '📊', color: '#8764B8' },
  analyzing: { icon: '🧠', color: '#0078D4' },
  generating_response: { icon: '✍️', color: '#107C10' }
};

export const AgentActivityIndicator: React.FC<Props> = ({ activity, details }) => {
  if (activity === 'idle') return null;

  const config = ACTIVITY_CONFIG[activity];

  return (
    <div className="agent-activity-indicator" role="status" aria-live="polite">
      <div className="activity-icon" style={{ color: config.color }}>
        {config.icon}
      </div>
      <div className="activity-content">
        <div className="activity-message">{details.message}</div>
        {details.dataSource && (
          <div className="activity-source">
            Accessing: {details.dataSource}
          </div>
        )}
        {details.progress !== undefined && (
          <div className="activity-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${details.progress}%` }}
              />
            </div>
            <span className="progress-text">{details.progress}%</span>
          </div>
        )}
      </div>
      <Spinner size="small" />
    </div>
  );
};
```

```css
/* src/components/AgentActivityIndicator.css */
.agent-activity-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0, 120, 212, 0.05);
  border-left: 3px solid #0078D4;
  border-radius: 4px;
  margin: 8px 0;
  font-size: 14px;
}

.activity-icon {
  font-size: 20px;
}

.activity-content {
  flex: 1;
}

.activity-message {
  font-weight: 500;
  color: #323130;
}

.activity-source {
  font-size: 12px;
  color: #605E5C;
  margin-top: 4px;
}

.activity-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #F3F2F1;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #0078D4;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #605E5C;
  min-width: 40px;
  text-align: right;
}
```

#### Integration in ChatWindow.tsx

```typescript
// Add to ChatWindow.tsx state
const [agentActivity, setAgentActivity] = useState<{
  type: ActivityType;
  details: ActivityDetails;
}>({
  type: 'idle',
  details: { message: '' }
});

// In EventSource message handler
eventSource.addEventListener('activity_status', (event) => {
  const data = JSON.parse(event.data);
  setAgentActivity({
    type: data.activity,
    details: {
      message: data.details.message,
      dataSource: data.details.dataSource,
      progress: data.details.progress
    }
  });
});

// In render, before typing bubble
{agentActivity.type !== 'idle' && (
  <AgentActivityIndicator 
    activity={agentActivity.type}
    details={agentActivity.details}
  />
)}
```

#### Backend Changes Required

```typescript
// Backend should send EventSource messages:
{
  type: 'activity_status',
  activity: 'understanding_query',
  details: {
    message: 'Analyzing your cost optimization question...',
  }
}

{
  type: 'activity_status',
  activity: 'accessing_data',
  details: {
    message: 'Querying Azure Cost Management API...',
    dataSource: 'Azure Cost Management',
    progress: 45
  }
}

{
  type: 'activity_status',
  activity: 'analyzing',
  details: {
    message: 'Running anomaly detection analysis...',
  }
}
```

---

### 1.2 Stop Generation Control

**Microsoft Principle:** Control - "User control and opt-out mechanisms"

**Goal:** Give users the ability to stop long-running operations

#### Component: ResponseControls

```typescript
// src/components/ResponseControls.tsx
import React from 'react';
import { Button } from '@fluentui/react-components';
import { 
  Stop24Regular, 
  ArrowClockwise24Regular,
  Edit24Regular 
} from '@fluentui/react-icons';

interface Props {
  isGenerating: boolean;
  canRegenerate: boolean;
  onStop: () => void;
  onRegenerate: () => void;
  onRefine?: () => void;
}

export const ResponseControls: React.FC<Props> = ({
  isGenerating,
  canRegenerate,
  onStop,
  onRegenerate,
  onRefine
}) => {
  return (
    <div className="response-controls">
      {isGenerating ? (
        <Button
          appearance="outline"
          icon={<Stop24Regular />}
          onClick={onStop}
          aria-label="Stop generating response"
        >
          Stop generating
        </Button>
      ) : (
        <>
          {canRegenerate && (
            <Button
              appearance="subtle"
              icon={<ArrowClockwise24Regular />}
              onClick={onRegenerate}
              aria-label="Regenerate response"
            >
              Regenerate
            </Button>
          )}
          {onRefine && (
            <Button
              appearance="subtle"
              icon={<Edit24Regular />}
              onClick={onRefine}
              aria-label="Refine response"
            >
              Refine
            </Button>
          )}
        </>
      )}
    </div>
  );
};
```

#### Integration in ChatWindow.tsx

```typescript
// Add to state
const eventSourceRef = useRef<EventSource | null>(null);
const [canStopGeneration, setCanStopGeneration] = useState(false);

// Stop function
const stopGeneration = () => {
  if (eventSourceRef.current) {
    eventSourceRef.current.close();
    eventSourceRef.current = null;
    setIsTyping(false);
    setCanStopGeneration(false);
    setAgentActivity({ type: 'idle', details: { message: '' } });
    
    // Add system message
    setMessages(prev => [...prev, {
      role: 'system',
      agent: 'System',
      content: '⏹️ Generation stopped by user'
    }]);
  }
};

// In handleSend, save reference
eventSourceRef.current = eventSource;
setCanStopGeneration(true);

// In render
{canStopGeneration && (
  <ResponseControls
    isGenerating={true}
    canRegenerate={false}
    onStop={stopGeneration}
    onRegenerate={() => {}}
  />
)}
```

---

### 1.3 Confidence Indicators

**Microsoft Principle:** Trust - "Embrace uncertainty, establish trust"

**Goal:** Show confidence levels to set appropriate expectations

#### Component: ConfidenceIndicator

```typescript
// src/components/ConfidenceIndicator.tsx
import React, { useState } from 'react';
import { 
  Info24Regular,
  ChevronDown24Regular,
  ChevronRight24Regular 
} from '@fluentui/react-icons';

interface Props {
  confidence: number; // 0-100
  dataQuality: 'complete' | 'partial' | 'limited';
  factors?: Array<{
    factor: string;
    impact: 'positive' | 'negative';
  }>;
}

export const ConfidenceIndicator: React.FC<Props> = ({
  confidence,
  dataQuality,
  factors
}) => {
  const [expanded, setExpanded] = useState(false);

  const getConfidenceLevel = () => {
    if (confidence >= 80) return { level: 'High', color: '#107C10' };
    if (confidence >= 60) return { level: 'Medium', color: '#FFA500' };
    return { level: 'Low', color: '#D13438' };
  };

  const { level, color } = getConfidenceLevel();

  return (
    <div className="confidence-indicator">
      <button
        className="confidence-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <Info24Regular style={{ color }} />
        <span>Confidence: {level} ({confidence}%)</span>
        <span className="data-quality">Data: {dataQuality}</span>
        {expanded ? <ChevronDown24Regular /> : <ChevronRight24Regular />}
      </button>

      {expanded && factors && (
        <div className="confidence-details">
          <div className="confidence-explanation">
            This confidence level is based on:
          </div>
          <ul>
            {factors.map((factor, i) => (
              <li key={i} className={`factor-${factor.impact}`}>
                {factor.impact === 'positive' ? '✓' : '⚠'} {factor.factor}
              </li>
            ))}
          </ul>
          {confidence < 80 && (
            <div className="verification-note">
              💡 Consider verifying this recommendation with additional data sources
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

#### Integration with ChatBubble

```typescript
// In ChatBubble component, add confidence prop
interface ChatBubbleProps {
  // ... existing props
  confidence?: {
    level: number;
    dataQuality: 'complete' | 'partial' | 'limited';
    factors?: Array<{ factor: string; impact: 'positive' | 'negative' }>;
  };
}

// In render
{confidence && (
  <ConfidenceIndicator
    confidence={confidence.level}
    dataQuality={confidence.dataQuality}
    factors={confidence.factors}
  />
)}
```

---

## Phase 2: Reasoning & Learning (Weeks 3-4)

### 2.1 Reasoning Panel

**Microsoft Principle:** Transparency - "Explain behavior"

**Goal:** Show how Haris arrived at recommendations

#### Component: ReasoningPanel

```typescript
// src/components/ReasoningPanel.tsx
import React, { useState } from 'react';
import { Accordion, AccordionItem, AccordionHeader, AccordionPanel } from '@fluentui/react-components';

interface ReasoningStep {
  step: string;
  data: string;
  method: string;
}

interface Props {
  steps: ReasoningStep[];
  assumptions: string[];
  limitations: string[];
}

export const ReasoningPanel: React.FC<Props> = ({
  steps,
  assumptions,
  limitations
}) => {
  return (
    <div className="reasoning-panel">
      <Accordion collapsible>
        <AccordionItem value="reasoning">
          <AccordionHeader>
            🧠 How I arrived at this recommendation
          </AccordionHeader>
          <AccordionPanel>
            <div className="reasoning-content">
              <div className="reasoning-section">
                <h4>Analysis Steps:</h4>
                <ol>
                  {steps.map((step, i) => (
                    <li key={i}>
                      <strong>{step.step}</strong>
                      <div className="step-details">
                        <span className="step-data">Data: {step.data}</span>
                        <span className="step-method">Method: {step.method}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {assumptions.length > 0 && (
                <div className="reasoning-section">
                  <h4>Assumptions:</h4>
                  <ul>
                    {assumptions.map((assumption, i) => (
                      <li key={i}>{assumption}</li>
                    ))}
                  </ul>
                </div>
              )}

              {limitations.length > 0 && (
                <div className="reasoning-section">
                  <h4>Limitations:</h4>
                  <ul>
                    {limitations.map((limitation, i) => (
                      <li key={i}>{limitation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
```

---

### 2.2 Learning Tips

**Microsoft Principle:** People - "Enable personal growth"

**Goal:** Help users learn FinOps concepts through interactions

#### Component: LearningTip

```typescript
// src/components/LearningTip.tsx
import React, { useState } from 'react';
import { Lightbulb24Regular, Dismiss24Regular } from '@fluentui/react-icons';

interface Props {
  concept: string;
  explanation: string;
  resources?: Array<{
    title: string;
    url: string;
    type: 'article' | 'video' | 'documentation';
  }>;
}

export const LearningTip: React.FC<Props> = ({
  concept,
  explanation,
  resources
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="learning-tip">
      <div className="tip-header">
        <Lightbulb24Regular />
        <span>Learn: {concept}</span>
        <button 
          className="dismiss-btn"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss learning tip"
        >
          <Dismiss24Regular />
        </button>
      </div>
      <div className="tip-content">
        <p>{explanation}</p>
        {resources && resources.length > 0 && (
          <div className="tip-resources">
            <strong>Learn more:</strong>
            <ul>
              {resources.map((resource, i) => (
                <li key={i}>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    {resource.title} ({resource.type})
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## Phase 3: Temporal Context (Weeks 5-6)

### 3.1 Historical Context

**Microsoft Principle:** Time - "Use contextual history"

**Goal:** Reference previous interactions and build on them

#### Service: HistoricalContextService

```typescript
// src/services/historicalContextService.ts

interface PastInteraction {
  query: string;
  date: Date;
  outcome: string;
  implemented: boolean;
}

interface HistoricalContext {
  relatedQueries: PastInteraction[];
  previousRecommendations: Array<{
    recommendation: string;
    implemented: boolean;
    outcome?: string;
  }>;
  userExpertiseLevel: number; // 1-10
}

export class HistoricalContextService {
  private storageKey = 'haris_historical_context';

  saveInteraction(query: string, response: string, implemented: boolean = false) {
    const history = this.getHistory();
    history.interactions.push({
      query,
      date: new Date(),
      outcome: response,
      implemented
    });

    // Keep only last 50 interactions
    if (history.interactions.length > 50) {
      history.interactions = history.interactions.slice(-50);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(history));
  }

  getRelatedQueries(currentQuery: string): PastInteraction[] {
    const history = this.getHistory();
    // Simple keyword matching - could be enhanced with semantic similarity
    const keywords = currentQuery.toLowerCase().split(' ');
    
    return history.interactions
      .filter(interaction => 
        keywords.some(keyword => 
          interaction.query.toLowerCase().includes(keyword)
        )
      )
      .slice(-5); // Return last 5 related queries
  }

  getUserExpertiseLevel(): number {
    const history = this.getHistory();
    // Simple heuristic: more interactions = higher expertise
    const interactionCount = history.interactions.length;
    return Math.min(10, Math.floor(interactionCount / 5) + 1);
  }

  private getHistory(): { interactions: PastInteraction[] } {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : { interactions: [] };
  }
}
```

#### Component: HistoricalContext Display

```typescript
// src/components/HistoricalContextCard.tsx
import React from 'react';
import { History24Regular } from '@fluentui/react-icons';

interface Props {
  relatedQueries: Array<{
    query: string;
    date: Date;
    outcome: string;
  }>;
}

export const HistoricalContextCard: React.FC<Props> = ({ relatedQueries }) => {
  if (relatedQueries.length === 0) return null;

  return (
    <div className="historical-context-card">
      <div className="context-header">
        <History24Regular />
        <span>Related to your previous queries:</span>
      </div>
      <ul className="related-queries">
        {relatedQueries.map((query, i) => (
          <li key={i}>
            <span className="query-text">{query.query}</span>
            <span className="query-date">
              {new Date(query.date).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

---

## Phase 4: Customization & Control (Weeks 7-8)

### 4.1 User Preferences System

**Microsoft Principle:** Control - "Customization and opt-out mechanisms"

**Goal:** Let users customize their experience

#### Service: PreferencesService

```typescript
// src/services/preferencesService.ts

export interface UserPreferences {
  responseDetail: 'concise' | 'balanced' | 'comprehensive';
  proactiveInsights: boolean;
  showReasoning: boolean;
  showConfidence: boolean;
  showLearningTips: boolean;
  voiceEnabled: boolean;
  autoSpeak: boolean;
  notificationLevel: 'all' | 'important' | 'none';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  responseDetail: 'balanced',
  proactiveInsights: true,
  showReasoning: true,
  showConfidence: true,
  showLearningTips: true,
  voiceEnabled: true,
  autoSpeak: false,
  notificationLevel: 'important'
};

export class PreferencesService {
  private storageKey = 'haris_user_preferences';

  getPreferences(): UserPreferences {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
  }

  updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): void {
    const preferences = this.getPreferences();
    preferences[key] = value;
    localStorage.setItem(this.storageKey, JSON.stringify(preferences));
    
    // Dispatch event for listeners
    window.dispatchEvent(new CustomEvent('preferencesChanged', { 
      detail: preferences 
    }));
  }

  resetToDefaults(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(DEFAULT_PREFERENCES));
    window.dispatchEvent(new CustomEvent('preferencesChanged', { 
      detail: DEFAULT_PREFERENCES 
    }));
  }
}
```

#### Component: SettingsPanel

```typescript
// src/components/SettingsPanel.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Switch,
  Radio,
  RadioGroup,
} from '@fluentui/react-components';
import { Settings24Regular } from '@fluentui/react-icons';
import { PreferencesService, UserPreferences } from '../services/preferencesService';

const preferencesService = new PreferencesService();

export const SettingsPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(
    preferencesService.getPreferences()
  );

  const handlePreferenceChange = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    preferencesService.updatePreference(key, value);
    setPreferences({ ...preferences, [key]: value });
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger>
        <Button appearance="subtle" icon={<Settings24Regular />}>
          Settings
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogTitle>Haris Settings</DialogTitle>
        <DialogBody>
          <div className="settings-section">
            <h3>Response Style</h3>
            <RadioGroup
              value={preferences.responseDetail}
              onChange={(_, data) => 
                handlePreferenceChange('responseDetail', data.value as any)
              }
            >
              <Radio value="concise" label="Concise - Brief, to-the-point answers" />
              <Radio value="balanced" label="Balanced - Standard detail level" />
              <Radio value="comprehensive" label="Comprehensive - Detailed explanations" />
            </RadioGroup>
          </div>

          <div className="settings-section">
            <h3>Agent Behavior</h3>
            <Switch
              checked={preferences.proactiveInsights}
              onChange={(_, data) => 
                handlePreferenceChange('proactiveInsights', data.checked)
              }
              label="Proactive insights and suggestions"
            />
            <Switch
              checked={preferences.showReasoning}
              onChange={(_, data) => 
                handlePreferenceChange('showReasoning', data.checked)
              }
              label="Show reasoning behind recommendations"
            />
            <Switch
              checked={preferences.showConfidence}
              onChange={(_, data) => 
                handlePreferenceChange('showConfidence', data.checked)
              }
              label="Display confidence indicators"
            />
            <Switch
              checked={preferences.showLearningTips}
              onChange={(_, data) => 
                handlePreferenceChange('showLearningTips', data.checked)
              }
              label="Show learning tips"
            />
          </div>

          <div className="settings-section">
            <h3>Voice</h3>
            <Switch
              checked={preferences.voiceEnabled}
              onChange={(_, data) => 
                handlePreferenceChange('voiceEnabled', data.checked)
              }
              label="Enable voice features"
            />
            <Switch
              checked={preferences.autoSpeak}
              onChange={(_, data) => 
                handlePreferenceChange('autoSpeak', data.checked)
              }
              label="Auto-speak responses"
              disabled={!preferences.voiceEnabled}
            />
          </div>
        </DialogBody>
        <DialogActions>
          <Button 
            appearance="secondary" 
            onClick={() => {
              preferencesService.resetToDefaults();
              setPreferences(preferencesService.getPreferences());
            }}
          >
            Reset to Defaults
          </Button>
          <Button appearance="primary" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};
```

---

## Testing Checklist

### Transparency Testing
- [ ] Activity indicator appears for all operations
- [ ] Data sources are clearly identified
- [ ] Progress shows when available
- [ ] Status messages are descriptive

### Control Testing
- [ ] Stop button halts generation immediately
- [ ] Regenerate produces new response
- [ ] Settings persist across sessions
- [ ] All preferences work as expected

### Trust Testing
- [ ] Confidence levels display correctly
- [ ] Low confidence triggers verification suggestions
- [ ] Reasoning is clear and accurate
- [ ] Assumptions are explicitly stated

### Accessibility Testing
- [ ] All controls keyboard accessible
- [ ] Screen reader announces status changes
- [ ] WCAG AA contrast ratios met
- [ ] Focus indicators visible

---

## Summary

This implementation guide translates Microsoft's Agent UX principles into concrete, actionable components for the Haris AI interface. By following this phased approach, you will create an agent experience that:

1. **Builds Trust** through transparency and honest communication
2. **Respects Users** by providing control and customization
3. **Enables Growth** through educational support
4. **Maintains Context** across time and space
5. **Stays Consistent** in behavior and appearance

Each phase builds on the previous, creating a progressively more sophisticated agent experience that embodies Microsoft's human-centric design philosophy.

---

## Quick Start

**Week 1 Priority:**
1. Implement `AgentActivityIndicator` - Show what Haris is doing
2. Add stop generation control - Give users power to interrupt
3. Display confidence levels - Set appropriate expectations

**Files to create:**
- `src/components/AgentActivityIndicator.tsx`
- `src/components/ResponseControls.tsx`
- `src/components/ConfidenceIndicator.tsx`

**Backend must provide:**
- Activity status events via EventSource
- Confidence metrics with responses
- Cancellation endpoint

Start here, validate with users, then proceed to Phase 2.
