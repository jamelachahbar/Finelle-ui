# Agent UX Design Principles for Haris AI Interface

## Overview

This document provides guidance for improving the Haris AI chat interface based on **Microsoft's UX Design for Agents** framework. These principles address the unique challenges of building AI-powered agentic experiences that collaborate with users, automate tasks, and scale human capabilities.

**Source:** [Microsoft Design: UX Design for Agents](https://microsoft.design/articles/ux-design-for-agents/)

---

## Core Framework: People, Space, and Time

Microsoft's agent UX framework is built around three fundamental dimensions:

### 1. **People: Human-Centric Design**

Agents should broaden and scale human capacities, not replace them.

#### Principles

**Broaden and scale human capacities**
- Help users brainstorm and problem-solve
- Automate repetitive tasks
- Fill knowledge gaps with intelligent insights
- Support complex decision-making

**Support collaboration, don't replace it**
- Connect people with relevant experts and resources
- Foster teamwork rather than isolation
- Bridge knowledge across teams and departments
- Enable human-to-human connections

**Enable personal growth**
- Help users become better versions of themselves
- Provide coaching and skill development
- Support emotional regulation and resilience
- Adapt to user's evolving needs and capabilities

#### Application to Haris

For the Haris AI interface, this means:

1. **Show collaborative context**
   - Display when Haris is connecting to Azure resources on user's behalf
   - Surface relevant documentation or best practices
   - Suggest connections to related cost optimization insights

2. **Support user learning**
   - Explain reasoning behind cost recommendations
   - Teach FinOps concepts through interactions
   - Build user confidence in Azure cost management

3. **Empower decision-making**
   - Present options with clear trade-offs
   - Allow users to refine and adjust recommendations
   - Make complex data accessible and actionable

**Implementation Example:**
```typescript
interface AgentResponse {
  content: string;
  reasoning?: string; // Explain why this recommendation
  learningTip?: string; // Educational insight
  relatedResources?: Array<{
    title: string;
    type: 'documentation' | 'expert' | 'similar_analysis';
    url: string;
  }>;
}
```

---

### 2. **Space: Agent Environment**

Agents should be easily accessible yet occasionally invisible, operating across contexts and modalities.

#### Principles

**Connecting, not collapsing**
- Facilitate collaboration across teams and systems
- Bring people and information together
- Maintain human connections while providing AI assistance
- Avoid creating information silos

**Easily accessible, occasionally invisible**
- Available on any device or platform
- Operate in the background when appropriate
- Surface insights at the right moment
- Don't interrupt unnecessarily

**Multi-modal support**
- Support various input methods (text, voice, gesture)
- Adapt output to user context and preferences
- Transition smoothly between active and passive modes
- Work across different interfaces and platforms

#### Application to Haris

For the Haris AI interface, this means:

1. **Background intelligence**
   - Monitor for cost anomalies without constant user input
   - Surface proactive insights when relevant
   - Respect user focus and flow state
   - Be discoverable but not intrusive

2. **Contextual presence**
   - Understand where user is in their workflow
   - Adapt suggestions based on current task
   - Provide quick actions for common operations
   - Minimize context switching

3. **Multi-modal flexibility**
   - Already supports voice input/output
   - Could expand to visual query building
   - Support different interaction depths (quick answer vs. deep analysis)
   - Work across desktop and mobile

**Implementation Example:**
```typescript
interface AgentPresence {
  mode: 'active' | 'background' | 'silent';
  notificationLevel: 'urgent' | 'important' | 'informational' | 'none';
  proactiveInsights: boolean;
  contextAwareness: {
    currentWorkflow: 'cost_analysis' | 'optimization' | 'forecasting';
    userFocus: 'high' | 'medium' | 'low';
    suggestionsEnabled: boolean;
  };
}
```

---

### 3. **Time: Past, Present, Future**

Agents should leverage history, be helpful in the present, and anticipate future needs.

#### Principles

**Use contextual history**
- Leverage past interactions for personalization
- Remember user preferences and patterns
- Build on previous analyses
- Maintain conversation continuity

**Be proactively helpful in the present**
- Offer relevant suggestions based on current context
- Provide timely notifications
- Respond to immediate needs
- Don't overwhelm with information

**Anticipate future needs**
- Adapt to changing requirements
- Learn from user behavior patterns
- Prepare for upcoming scenarios
- Evolve with user's growing expertise

#### Application to Haris

For the Haris AI interface, this means:

1. **Historical context**
   - Remember previous cost optimization discussions
   - Track which recommendations were acted upon
   - Build on past analyses for deeper insights
   - Reference earlier findings when relevant

2. **Present-moment relevance**
   - Suggest next logical steps in analysis
   - Highlight time-sensitive opportunities (e.g., reservation purchases)
   - Provide context-appropriate detail level
   - Surface insights at decision points

3. **Future anticipation**
   - Forecast potential cost trends
   - Prepare for budget planning cycles
   - Suggest proactive optimizations
   - Adapt to user's increasing sophistication

**Implementation Example:**
```typescript
interface TemporalContext {
  history: {
    previousQueries: string[];
    actionsTaken: Array<{ recommendation: string; implemented: boolean }>;
    learningProgress: number; // User's FinOps expertise level
  };
  present: {
    currentGoal: string;
    urgency: 'immediate' | 'planned' | 'exploratory';
    availableTime: 'quick' | 'detailed' | 'comprehensive';
  };
  future: {
    anticipatedNeeds: string[];
    upcomingEvents: Array<{ type: string; date: Date }>;
    suggestedPreparations: string[];
  };
}
```

---

## Core Foundations: Trust, Transparency, and Control

### Embrace Uncertainty, Establish Trust

Agents must build and maintain user trust through honesty about capabilities and limitations.

#### Principles

**Communicate capabilities clearly**
- Be explicit about what the agent can and cannot do
- Set realistic expectations
- Acknowledge limitations upfront
- Don't overpromise

**Admit uncertainty**
- Be transparent when confidence is low
- Offer alternatives when unsure
- Explain confidence levels in recommendations
- Allow users to verify critical decisions

**Build trust over time**
- Deliver consistent, reliable experiences
- Follow through on commitments
- Learn from mistakes and adapt
- Respect user autonomy

#### Application to Haris

1. **Capability transparency**
   ```typescript
   interface AgentCapabilities {
     canDo: string[];
     cannotDo: string[];
     limitations: string[];
     confidenceLevel: 'high' | 'medium' | 'low';
   }
   ```

2. **Uncertainty communication**
   - Show confidence scores for recommendations
   - Indicate when data is incomplete
   - Suggest verification steps for critical actions
   - Offer alternative approaches

3. **Trust building**
   - Track recommendation accuracy
   - Learn from user corrections
   - Explain reasoning transparently
   - Provide undo/revert options

**Implementation Example:**
```typescript
interface RecommendationWithTrust {
  recommendation: string;
  confidence: number; // 0-100
  reasoning: string;
  dataQuality: 'complete' | 'partial' | 'limited';
  verificationSteps?: string[];
  alternativeOptions?: string[];
  riskLevel: 'low' | 'medium' | 'high';
}
```

---

### Transparency

Users must understand how the agent works and what it does with their data.

#### Principles

**Explain behavior**
- Make agent's reasoning visible
- Show data sources used
- Indicate when agent is working
- Clarify how decisions are made

**Data transparency**
- Be clear about data collection and usage
- Explain how user data improves the experience
- Provide data access and export options
- Allow data deletion

**Feedback mechanisms**
- Enable users to rate responses
- Provide ways to correct mistakes
- Offer channels for reporting issues
- Show how feedback is used

#### Application to Haris

1. **Reasoning visibility**
   ```typescript
   interface TransparentResponse {
     answer: string;
     reasoning: {
       dataSource: string[];
       analysisMethod: string;
       assumptions: string[];
       limitations: string[];
     };
     citationsAndSources: Array<{
       source: string;
       reliability: 'verified' | 'estimated' | 'calculated';
     }>;
   }
   ```

2. **Activity transparency**
   - Show when querying Azure APIs
   - Display data processing steps
   - Indicate analysis methods used
   - Reveal calculation formulas

3. **Data privacy**
   - Explain what data is stored
   - Show how conversations are used
   - Provide conversation export
   - Allow session clearing

**Implementation Example:**
```typescript
interface AgentActivity {
  status: 'idle' | 'querying_api' | 'analyzing' | 'generating';
  currentStep: string;
  dataAccessed: Array<{
    source: 'Azure Cost Management' | 'Azure Advisor' | 'User History';
    records: number;
    timeRange: string;
  }>;
  processingMethods: string[];
}
```

---

### User Control

Users must feel in control of the agent experience.

#### Principles

**Customization**
- Allow preference adjustments
- Support different interaction styles
- Enable feature toggling
- Respect user choices

**Opt-out mechanisms**
- Provide clear ways to decline suggestions
- Allow disabling of proactive features
- Support granular control
- Make opt-out reversible

**Data control**
- Enable data deletion
- Support data export
- Allow conversation management
- Provide privacy controls

#### Application to Haris

1. **Interaction preferences**
   ```typescript
   interface UserPreferences {
     responseDetail: 'concise' | 'balanced' | 'comprehensive';
     proactiveInsights: boolean;
     voiceEnabled: boolean;
     autoSpeak: boolean;
     notificationLevel: 'all' | 'important' | 'none';
     visualStyle: 'minimal' | 'standard' | 'rich';
   }
   ```

2. **Agent behavior control**
   - Stop generation mid-stream
   - Regenerate with different parameters
   - Adjust analysis depth
   - Choose visualization types

3. **Data management**
   - Clear conversation history
   - Export chat sessions
   - Delete personal insights
   - Manage stored preferences

**Implementation Example:**
```typescript
interface UserControl {
  interactionControls: {
    stopGeneration: () => void;
    regenerate: (params?: GenerationParams) => void;
    refine: (instruction: string) => void;
  };
  privacyControls: {
    clearHistory: () => void;
    exportData: () => Promise<Blob>;
    deletePreferences: () => void;
    optOutProactive: () => void;
  };
}
```

---

### Consistency

Maintain uniform experiences across platforms and interactions.

#### Principles

**Consistent behavior**
- Predictable responses to similar queries
- Stable interaction patterns
- Reliable feature availability
- Uniform quality standards

**Visual consistency**
- Use familiar UI patterns
- Maintain design system compliance
- Ensure cross-platform coherence
- Provide recognizable elements

**Conversational consistency**
- Maintain agent personality
- Use consistent terminology
- Keep communication style stable
- Preserve context across sessions

#### Application to Haris

1. **Behavioral consistency**
   - Same query types produce similar structures
   - Error handling follows patterns
   - Success feedback is predictable
   - Navigation remains constant

2. **Visual consistency**
   - Fluent UI component usage
   - Consistent spacing and typography
   - Predictable animation patterns
   - Standard iconography

3. **Conversational consistency**
   - Maintain "Haris" personality
   - Use Azure/FinOps terminology consistently
   - Keep explanation style uniform
   - Preserve formality level

**Implementation Example:**
```typescript
interface ConsistencyGuidelines {
  conversationalTone: {
    formality: 'professional' | 'friendly-professional';
    expertise: 'expert' | 'explainer';
    personality: string[];
  };
  visualPatterns: {
    componentLibrary: '@fluentui/react-components';
    colorScheme: 'fluent-light' | 'fluent-dark';
    animationTiming: { fast: 200, normal: 300, slow: 500 };
  };
  behavioralPatterns: {
    errorFormat: ErrorResponseFormat;
    successFormat: SuccessResponseFormat;
    loadingPattern: LoadingStatePattern;
  };
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Focus: Transparency and Basic Control**

1. **Activity Transparency**
   - Show what Haris is doing (querying API, analyzing, etc.)
   - Display data sources being accessed
   - Indicate processing steps

2. **Stop/Control Mechanisms**
   - Add stop generation button
   - Allow response regeneration
   - Enable conversation clearing

3. **Confidence Indicators**
   - Show confidence levels in recommendations
   - Indicate data quality
   - Highlight assumptions

**Files to Create/Modify:**
```
src/components/
├── AgentActivityIndicator.tsx (new)
├── ConfidenceLevel.tsx (new)
├── ChatWindow.tsx (modify - add controls)
└── ChatBubble.tsx (modify - add confidence display)
```

---

### Phase 2: Collaboration Support (Weeks 3-4)

**Focus: Connecting People and Knowledge**

1. **Resource Connections**
   - Link to relevant Azure documentation
   - Suggest related analyses
   - Connect to FinOps best practices

2. **Learning Support**
   - Add "Why?" explanations for recommendations
   - Provide educational tips
   - Link to deeper resources

3. **Reasoning Visibility**
   - Show calculation methods
   - Display data sources with reliability indicators
   - Explain logic behind insights

**Files to Create/Modify:**
```
src/components/
├── ReasoningPanel.tsx (new)
├── ResourceLinks.tsx (new)
├── LearningTip.tsx (new)
└── ChatBubble.tsx (modify - integrate reasoning)
```

---

### Phase 3: Temporal Intelligence (Weeks 5-6)

**Focus: History, Present, Future**

1. **Historical Context**
   - Reference previous recommendations
   - Track implemented actions
   - Build on past analyses

2. **Present Relevance**
   - Context-aware suggestions
   - Time-sensitive alerts
   - Workflow-appropriate detail

3. **Future Anticipation**
   - Proactive cost alerts
   - Budget planning reminders
   - Optimization opportunity forecasts

**Files to Create/Modify:**
```
src/
├── contexts/TemporalContext.tsx (new)
├── hooks/useHistoricalInsights.ts (new)
├── components/ProactiveInsights.tsx (new)
└── components/ChatWindow.tsx (modify - temporal awareness)
```

---

### Phase 4: Advanced Control & Customization (Weeks 7-8)

**Focus: User Control and Preferences**

1. **Interaction Customization**
   - Response detail level control
   - Proactive insight toggling
   - Notification preferences

2. **Data Management**
   - Conversation export
   - History management
   - Privacy controls

3. **Adaptation**
   - Learn user preferences
   - Adjust to expertise level
   - Personalize suggestions

**Files to Create/Modify:**
```
src/
├── components/SettingsPanel.tsx (new)
├── components/DataManagement.tsx (new)
├── hooks/useUserPreferences.ts (new)
└── services/personalizationService.ts (new)
```

---

## Design Patterns for Agent UX

### 1. Status Communication Pattern

**Purpose:** Keep users informed about agent activity

**Pattern:**
```typescript
type AgentActivity = 
  | { type: 'idle' }
  | { type: 'understanding_query'; message: string }
  | { type: 'accessing_data'; source: string; progress?: number }
  | { type: 'analyzing'; method: string; confidence?: number }
  | { type: 'generating_response'; stage: string };

// Display component
<AgentActivityIndicator activity={currentActivity} />
```

**Visual Design:**
- Subtle, non-intrusive indicator
- Clear icon for activity type
- Progress when available
- Descriptive but concise text

---

### 2. Reasoning Disclosure Pattern

**Purpose:** Build trust through transparency

**Pattern:**
```typescript
interface ResponseWithReasoning {
  content: string;
  reasoning: {
    title: string;
    steps: Array<{
      step: string;
      data: string;
      method: string;
    }>;
    assumptions: string[];
    limitations: string[];
  };
  showReasoning: boolean; // User can toggle
}

// Display component
<ResponseWithReasoning 
  content={content}
  reasoning={reasoning}
  onToggleReasoning={() => setShowReasoning(!showReasoning)}
/>
```

**Visual Design:**
- Collapsible reasoning section
- Clear step-by-step display
- Highlight assumptions and limitations
- Easy to expand/collapse

---

### 3. Confidence Communication Pattern

**Purpose:** Set appropriate expectations

**Pattern:**
```typescript
interface ConfidenceIndicator {
  level: number; // 0-100
  dataQuality: 'complete' | 'partial' | 'limited';
  reasoning: string;
  verificationSuggested: boolean;
}

// Display component
<ConfidenceLevel
  confidence={confidence}
  dataQuality={dataQuality}
  onVerify={() => showVerificationSteps()}
/>
```

**Visual Design:**
- Clear visual indicator (color, icon)
- Explain what affects confidence
- Suggest verification when needed
- Don't hide low confidence

---

### 4. User Control Pattern

**Purpose:** Maintain user agency

**Pattern:**
```typescript
interface ResponseControls {
  canStop: boolean;
  canRegenerate: boolean;
  canRefine: boolean;
  customizations: {
    detailLevel: 'concise' | 'standard' | 'detailed';
    includeReferences: boolean;
    visualizationPreference: string;
  };
}

// Display component
<ResponseControls
  onStop={handleStop}
  onRegenerate={handleRegenerate}
  onRefine={handleRefine}
  customizations={customizations}
/>
```

**Visual Design:**
- Clear, accessible controls
- Always visible when applicable
- Keyboard shortcuts supported
- Confirmation for destructive actions

---

### 5. Learning Support Pattern

**Purpose:** Enable user growth and understanding

**Pattern:**
```typescript
interface LearningSupport {
  conceptExplained: string;
  relatedConcepts: string[];
  educationalResources: Array<{
    title: string;
    type: 'article' | 'video' | 'interactive';
    url: string;
  }>;
  practiceExercise?: string;
}

// Display component
<LearningSidebar
  concept={concept}
  resources={resources}
  onLearnMore={(concept) => expandConcept(concept)}
/>
```

**Visual Design:**
- Non-intrusive educational hints
- Expandable detail sections
- Links to deeper resources
- Progressive disclosure

---

## Backend Requirements

To support these UX principles, the backend must provide:

### 1. Activity Status Updates

```typescript
// EventSource message types
{
  type: 'activity_status',
  activity: 'understanding_query' | 'accessing_data' | 'analyzing' | 'generating',
  details: {
    message: string;
    dataSource?: string;
    progress?: number;
    method?: string;
  }
}
```

### 2. Reasoning Information

```typescript
{
  type: 'reasoning',
  steps: Array<{
    step: string;
    data: string;
    method: string;
  }>,
  assumptions: string[],
  limitations: string[],
  confidenceFactors: Array<{ factor: string; impact: 'positive' | 'negative' }>
}
```

### 3. Confidence Metrics

```typescript
{
  type: 'confidence',
  overall: number, // 0-100
  dataQuality: 'complete' | 'partial' | 'limited',
  factors: {
    dataCompleteness: number;
    methodReliability: number;
    historicalAccuracy: number;
  },
  verificationRecommended: boolean
}
```

### 4. Historical Context

```typescript
{
  type: 'historical_context',
  relatedQueries: Array<{ query: string; date: Date; outcome: string }>,
  previousRecommendations: Array<{
    recommendation: string;
    implemented: boolean;
    outcome?: string;
  }>,
  userExpertiseLevel: number // 1-10
}
```

### 5. Learning Resources

```typescript
{
  type: 'learning_resources',
  concepts: Array<{
    concept: string;
    explanation: string;
    resources: Array<{ title: string; url: string; type: string }>;
  }>
}
```

---

## Accessibility Considerations

Following Microsoft's accessibility principles for agents:

### 1. **Screen Reader Support**
- All agent activities announced via ARIA live regions
- Clear status updates
- Descriptive button labels
- Semantic HTML structure

### 2. **Keyboard Navigation**
- All controls accessible via keyboard
- Logical tab order
- Keyboard shortcuts documented
- No keyboard traps

### 3. **Visual Accessibility**
- WCAG AA contrast ratios
- Don't rely on color alone
- Scalable text
- Motion can be disabled

### 4. **Cognitive Accessibility**
- Clear, simple language
- Progressive disclosure
- Consistent patterns
- Sufficient time for reading

**Implementation:**
```typescript
// ARIA live region for agent status
<div role="status" aria-live="polite" aria-atomic="true">
  {agentActivityMessage}
</div>

// Accessible controls
<button
  aria-label="Stop generating response"
  onClick={stopGeneration}
  disabled={!canStop}
>
  Stop
</button>

// Keyboard shortcuts
useKeyboardShortcut('Escape', stopGeneration);
useKeyboardShortcut('Ctrl+R', regenerateResponse);
```

---

## Responsible AI Integration

Following Microsoft's Responsible AI principles:

### 1. **Fairness**
- Ensure recommendations don't favor specific vendors unnecessarily
- Provide balanced options
- Explain trade-offs clearly

### 2. **Reliability & Safety**
- Validate data before presenting
- Test edge cases thoroughly
- Handle errors gracefully
- Provide safe defaults

### 3. **Privacy & Security**
- Minimize data collection
- Encrypt sensitive information
- Clear data retention policies
- User data control

### 4. **Inclusiveness**
- Support multiple languages (future)
- Work across devices
- Accessible to all abilities
- Consider diverse user contexts

### 5. **Transparency**
- Explain AI involvement
- Show data sources
- Reveal limitations
- Enable feedback

### 6. **Accountability**
- Log important decisions
- Enable audit trails
- Provide support channels
- Clear escalation paths

---

## Measuring Success

### Key Metrics

**Trust Indicators:**
- User acceptance rate of recommendations
- Feedback sentiment analysis
- Return user rate
- Session depth (questions per session)

**Transparency Metrics:**
- Reasoning panel usage rate
- Verification action frequency
- Confidence indicator interactions
- Data source view rate

**Control Metrics:**
- Stop/regenerate usage
- Preference customization rate
- Data management actions
- Feedback submission rate

**Learning Metrics:**
- Educational resource clicks
- Concept explanation views
- User expertise progression
- Repeat query patterns (decreasing over time)

### Success Criteria

**Phase 1 (Transparency):**
- 80% of users view reasoning at least once
- 90% confidence in activity status clarity
- <3% confusion about what agent is doing

**Phase 2 (Collaboration):**
- 60% resource link click-through rate
- 50% users report improved understanding
- 40% reduction in clarification questions

**Phase 3 (Temporal):**
- 70% find historical references helpful
- 80% appreciate proactive insights
- 50% act on future-oriented suggestions

**Phase 4 (Control):**
- 85% satisfaction with customization options
- 90% confidence in data privacy
- 95% can find and use control features

---

## Summary

Microsoft's UX Design for Agents framework provides comprehensive guidance for building trustworthy, transparent, and user-centric AI experiences. The framework centers on three dimensions:

1. **People**: Broaden human capacity, support collaboration, enable growth
2. **Space**: Be accessible yet invisible, connect rather than isolate, support multimodal interaction
3. **Time**: Leverage history, be present-focused, anticipate future needs

Underpinning these dimensions are core foundations:
- **Trust**: Acknowledge uncertainty, build credibility over time
- **Transparency**: Explain behavior, show reasoning, enable feedback
- **Control**: Allow customization, provide opt-outs, respect user agency
- **Consistency**: Maintain predictable patterns and reliable experiences

For Haris AI, implementing these principles means creating an interface that:
- Clearly communicates what it's doing and why
- Empowers users to make informed decisions
- Respects user autonomy and preferences
- Builds trust through transparency and reliability
- Supports user learning and growth
- Adapts to user needs over time

This approach transforms Haris from a simple chatbot into a true collaborative agent that enhances human capabilities in Azure cost management.

---

## References

- [Microsoft Design: UX Design for Agents](https://microsoft.design/articles/ux-design-for-agents/)
- [Microsoft Learn: Creating a Dynamic UX for Generative AI](https://learn.microsoft.com/en-us/microsoft-cloud/dev/copilot/isv/ux-guidance)
- [Microsoft Responsible AI Principles](https://www.microsoft.com/en-us/ai/responsible-ai)
- [Fluent UI React Components](https://react.fluentui.dev/)
- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
