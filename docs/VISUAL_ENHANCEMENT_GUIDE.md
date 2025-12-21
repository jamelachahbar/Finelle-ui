# Visual Enhancement Guide for Coding Agent

## Purpose

This document provides specific, actionable visual enhancement patterns for implementing improved agent working states. All examples are ready to be translated into code by a coding agent.

---

## 1. Enhanced Typing Bubble Component

### Current Implementation
File: `src/components/TypingBubble.tsx`

### Enhanced Version with Dynamic States

```tsx
// src/components/EnhancedTypingBubble.tsx
import React from 'react';
import './EnhancedTypingBubble.css';

export type AgentActivityType = 
  | 'thinking'
  | 'fetching_data'
  | 'analyzing'
  | 'generating_chart'
  | 'formatting';

interface EnhancedTypingBubbleProps {
  activity: AgentActivityType;
  message?: string;
  progress?: number; // 0-100
  metadata?: {
    apiEndpoint?: string;
    recordCount?: number;
    estimatedTime?: number;
  };
}

const ACTIVITY_CONFIG = {
  thinking: {
    icon: '🤔',
    defaultMessage: 'Haris is thinking...',
    color: '#0078D4'
  },
  fetching_data: {
    icon: '📊',
    defaultMessage: 'Retrieving data from Azure...',
    color: '#8764B8'
  },
  analyzing: {
    icon: '🔍',
    defaultMessage: 'Analyzing your data...',
    color: '#0078D4'
  },
  generating_chart: {
    icon: '📈',
    defaultMessage: 'Creating visualization...',
    color: '#107C10'
  },
  formatting: {
    icon: '✨',
    defaultMessage: 'Formatting response...',
    color: '#0078D4'
  }
};

export const EnhancedTypingBubble: React.FC<EnhancedTypingBubbleProps> = ({
  activity,
  message,
  progress,
  metadata
}) => {
  const config = ACTIVITY_CONFIG[activity];
  const displayMessage = message || config.defaultMessage;

  return (
    <div className="enhanced-typing-bubble">
      <div className="bubble-avatar">
        <span className="avatar-icon" style={{ color: config.color }}>
          {config.icon}
        </span>
        <div className="pulse-ring" style={{ borderColor: config.color }} />
      </div>
      
      <div className="bubble-content">
        <div className="status-message" style={{ color: config.color }}>
          {displayMessage}
        </div>
        
        {progress !== undefined && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: config.color 
                }}
              />
            </div>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
        )}
        
        {metadata && (
          <div className="metadata-details">
            {metadata.recordCount && (
              <span className="metadata-item">
                📊 {metadata.recordCount.toLocaleString()} records
              </span>
            )}
            {metadata.estimatedTime && (
              <span className="metadata-item">
                ⏱️ ~{metadata.estimatedTime}s remaining
              </span>
            )}
          </div>
        )}
        
        <div className="typing-dots">
          <span className="dot" style={{ backgroundColor: config.color }} />
          <span className="dot" style={{ backgroundColor: config.color }} />
          <span className="dot" style={{ backgroundColor: config.color }} />
        </div>
      </div>
    </div>
  );
};
```

### CSS for Enhanced Typing Bubble

```css
/* src/components/EnhancedTypingBubble.css */
.enhanced-typing-bubble {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin: 12px 0;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bubble-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 24px;
  z-index: 2;
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid;
  border-radius: 50%;
  animation: pulseRing 2s ease-out infinite;
}

@keyframes pulseRing {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.bubble-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-message {
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #f3f2f1;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 2px;
}

.progress-text {
  font-size: 12px;
  color: #605e5c;
  font-weight: 500;
  min-width: 40px;
  text-align: right;
}

.metadata-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #605e5c;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-dots {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 16px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: dotBounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes dotBounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}
```

---

## 2. Multi-Stage Progress Indicator

### Component for Step-by-Step Progress

```tsx
// src/components/ProgressStages.tsx
import React from 'react';
import './ProgressStages.css';

export interface Stage {
  id: string;
  label: string;
  icon: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  duration?: number; // milliseconds
}

interface ProgressStagesProps {
  stages: Stage[];
  currentStageIndex: number;
}

export const ProgressStages: React.FC<ProgressStagesProps> = ({
  stages,
  currentStageIndex
}) => {
  return (
    <div className="progress-stages">
      <div className="stages-container">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <div className={`stage stage--${stage.status}`}>
              <div className="stage-icon-wrapper">
                <div className="stage-icon">
                  {stage.status === 'complete' ? '✓' : stage.icon}
                </div>
                {stage.status === 'active' && (
                  <div className="stage-spinner" />
                )}
              </div>
              <div className="stage-label">{stage.label}</div>
              {stage.duration && stage.status === 'complete' && (
                <div className="stage-duration">
                  {(stage.duration / 1000).toFixed(1)}s
                </div>
              )}
            </div>
            
            {index < stages.length - 1 && (
              <div className={`stage-connector ${
                index < currentStageIndex ? 'stage-connector--complete' : ''
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
```

### CSS for Progress Stages

```css
/* src/components/ProgressStages.css */
.progress-stages {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.stages-container {
  display: flex;
  align-items: center;
  gap: 0;
  overflow-x: auto;
  padding: 8px 0;
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 100px;
  position: relative;
}

.stage-icon-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stage-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: #f3f2f1;
  color: #605e5c;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  z-index: 2;
}

.stage--pending .stage-icon {
  background: #f3f2f1;
  color: #8a8886;
}

.stage--active .stage-icon {
  background: #e8f0ff;
  color: #0078D4;
  border-color: #0078D4;
  animation: stagePulse 2s ease-in-out infinite;
}

.stage--complete .stage-icon {
  background: #107C10;
  color: white;
  transform: scale(1);
}

.stage--error .stage-icon {
  background: #fde7e9;
  color: #d13438;
  border-color: #d13438;
}

@keyframes stagePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.stage-spinner {
  position: absolute;
  width: 48px;
  height: 48px;
  border: 3px solid #e8f0ff;
  border-top-color: #0078D4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.stage-label {
  font-size: 12px;
  font-weight: 500;
  color: #323130;
  text-align: center;
  max-width: 100px;
  word-wrap: break-word;
}

.stage--pending .stage-label {
  color: #8a8886;
}

.stage--active .stage-label {
  color: #0078D4;
  font-weight: 600;
}

.stage-duration {
  font-size: 11px;
  color: #8a8886;
  font-style: italic;
}

.stage-connector {
  flex: 1;
  min-width: 40px;
  height: 2px;
  background: #edebe9;
  margin: 0 8px;
  position: relative;
  top: -20px;
}

.stage-connector--complete {
  background: #107C10;
}
```

---

## 3. Task Breakdown Tree Component

### Collapsible Task Tree

```tsx
// src/components/TaskTree.tsx
import React, { useState } from 'react';
import { 
  ChevronRight20Regular, 
  ChevronDown20Regular 
} from '@fluentui/react-icons';
import './TaskTree.css';

export interface Task {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  children?: Task[];
  metadata?: {
    recordsProcessed?: number;
    dataSize?: string;
    apiEndpoint?: string;
  };
}

interface TaskTreeProps {
  task: Task;
  level?: number;
}

const TaskNode: React.FC<TaskTreeProps> = ({ task, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = task.children && task.children.length > 0;

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in_progress':
        return '🔄';
      case 'failed':
        return '⚠️';
      default:
        return '⏳';
    }
  };

  const getDuration = () => {
    if (task.startTime && task.endTime) {
      const duration = task.endTime.getTime() - task.startTime.getTime();
      return `${(duration / 1000).toFixed(2)}s`;
    }
    return null;
  };

  return (
    <div className="task-node" style={{ marginLeft: `${level * 24}px` }}>
      <div className={`task-row task-row--${task.status}`}>
        {hasChildren && (
          <button 
            className="task-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
          </button>
        )}
        
        <span className="task-icon">{getStatusIcon(task.status)}</span>
        
        <span className="task-name">{task.name}</span>
        
        {task.status === 'in_progress' && (
          <span className="task-spinner" />
        )}
        
        {getDuration() && (
          <span className="task-duration">{getDuration()}</span>
        )}
      </div>

      {task.metadata && (
        <div className="task-metadata">
          {task.metadata.recordsProcessed && (
            <span className="metadata-badge">
              📊 {task.metadata.recordsProcessed.toLocaleString()} records
            </span>
          )}
          {task.metadata.dataSize && (
            <span className="metadata-badge">
              💾 {task.metadata.dataSize}
            </span>
          )}
          {task.metadata.apiEndpoint && (
            <span className="metadata-badge api-endpoint">
              🔗 {task.metadata.apiEndpoint}
            </span>
          )}
        </div>
      )}

      {isExpanded && hasChildren && (
        <div className="task-children">
          {task.children!.map(child => (
            <TaskNode key={child.id} task={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const TaskTree: React.FC<{ rootTask: Task }> = ({ rootTask }) => {
  return (
    <div className="task-tree">
      <div className="task-tree-header">
        <span className="tree-icon">🎯</span>
        <span className="tree-title">Task Breakdown</span>
      </div>
      <TaskNode task={rootTask} />
    </div>
  );
};
```

### CSS for Task Tree

```css
/* src/components/TaskTree.css */
.task-tree {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.task-tree-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #edebe9;
}

.tree-icon {
  font-size: 20px;
}

.tree-title {
  font-size: 16px;
  font-weight: 600;
  color: #323130;
}

.task-node {
  margin: 4px 0;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.task-row:hover {
  background-color: #f3f2f1;
}

.task-row--in_progress {
  background-color: #e8f0ff;
}

.task-row--completed {
  opacity: 0.8;
}

.task-row--failed {
  background-color: #fde7e9;
}

.task-expand-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #605e5c;
  display: flex;
  align-items: center;
}

.task-expand-btn:hover {
  color: #0078D4;
}

.task-icon {
  font-size: 16px;
  min-width: 20px;
  text-align: center;
}

.task-name {
  flex: 1;
  font-size: 14px;
  color: #323130;
}

.task-row--completed .task-name {
  color: #107C10;
}

.task-row--failed .task-name {
  color: #d13438;
}

.task-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e8f0ff;
  border-top-color: #0078D4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.task-duration {
  font-size: 12px;
  color: #8a8886;
  font-weight: 500;
  padding: 2px 8px;
  background: #f3f2f1;
  border-radius: 12px;
}

.task-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0 4px 32px;
}

.metadata-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: #f3f2f1;
  border-radius: 12px;
  color: #605e5c;
}

.metadata-badge.api-endpoint {
  font-family: 'Consolas', 'Monaco', monospace;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-children {
  margin-top: 4px;
}
```

---

## 4. Skeleton Loaders for Content Types

### Text Content Skeleton

```tsx
// src/components/skeletons/TextSkeleton.tsx
import React from 'react';
import './Skeleton.css';

export const TextSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="skeleton-text">
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton-line"
          style={{ 
            width: i === lines - 1 ? '70%' : '100%' 
          }}
        />
      ))}
    </div>
  );
};
```

### Chart Skeleton

```tsx
// src/components/skeletons/ChartSkeleton.tsx
import React from 'react';
import './Skeleton.css';

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="skeleton-chart">
      <div className="skeleton-chart-header">
        <div className="skeleton-line" style={{ width: '40%' }} />
      </div>
      <div className="skeleton-chart-bars">
        {[80, 60, 90, 45, 70].map((height, i) => (
          <div 
            key={i}
            className="skeleton-bar"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="skeleton-chart-legend">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-legend-item">
            <div className="skeleton-legend-color" />
            <div className="skeleton-line" style={{ width: '60px' }} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Table Skeleton

```tsx
// src/components/skeletons/TableSkeleton.tsx
import React from 'react';
import './Skeleton.css';

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => {
  return (
    <div className="skeleton-table">
      {/* Header */}
      <div className="skeleton-table-row skeleton-table-header">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton-table-cell">
            <div className="skeleton-line" style={{ width: '80%' }} />
          </div>
        ))}
      </div>
      
      {/* Body */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div key={colIndex} className="skeleton-table-cell">
              <div 
                className="skeleton-line" 
                style={{ width: `${60 + Math.random() * 30}%` }} 
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
```

### Skeleton CSS

```css
/* src/components/skeletons/Skeleton.css */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton-line {
  height: 12px;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
  border-radius: 4px;
  margin: 8px 0;
}

.skeleton-text {
  padding: 16px;
}

.skeleton-chart {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin: 12px 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.skeleton-chart-header {
  margin-bottom: 20px;
}

.skeleton-chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 200px;
  gap: 12px;
  margin-bottom: 20px;
}

.skeleton-bar {
  flex: 1;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
  border-radius: 4px 4px 0 0;
  min-height: 40px;
}

.skeleton-chart-legend {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.skeleton-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.skeleton-legend-color {
  width: 16px;
  height: 16px;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
  border-radius: 2px;
}

.skeleton-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  margin: 12px 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.skeleton-table-row {
  display: flex;
  border-bottom: 1px solid #edebe9;
}

.skeleton-table-header {
  background: #f3f2f1;
}

.skeleton-table-cell {
  flex: 1;
  padding: 12px 16px;
}
```

---

## 5. Integration with ChatWindow

### How to integrate these components

```tsx
// Example integration in src/components/ChatWindow.tsx

import { EnhancedTypingBubble, AgentActivityType } from './EnhancedTypingBubble';
import { ProgressStages, Stage } from './ProgressStages';
import { TaskTree, Task } from './TaskTree';
import { TextSkeleton, ChartSkeleton, TableSkeleton } from './skeletons';

// In your component state
const [agentActivity, setAgentActivity] = useState<AgentActivityType>('thinking');
const [progressStages, setProgressStages] = useState<Stage[]>([]);
const [currentTaskTree, setCurrentTaskTree] = useState<Task | null>(null);
const [pendingContentType, setPendingContentType] = useState<'text' | 'chart' | 'table' | null>(null);

// In your EventSource message handler
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // Handle status updates
  if (data.type === 'status') {
    setAgentActivity(data.activity);
    setTypingMessage(data.message);
  }
  
  // Handle stage updates
  if (data.type === 'stage_update') {
    setProgressStages(data.stages);
  }
  
  // Handle task tree updates
  if (data.type === 'task_update') {
    setCurrentTaskTree(data.taskTree);
  }
  
  // Handle content type hints
  if (data.type === 'content_hint') {
    setPendingContentType(data.contentType);
  }
  
  // ... rest of your message handling
};

// In your render
{isTyping && (
  <>
    <EnhancedTypingBubble 
      activity={agentActivity}
      message={typingMessage}
      progress={activityProgress}
      metadata={activityMetadata}
    />
    
    {progressStages.length > 0 && (
      <ProgressStages 
        stages={progressStages}
        currentStageIndex={currentStageIndex}
      />
    )}
    
    {currentTaskTree && (
      <TaskTree rootTask={currentTaskTree} />
    )}
    
    {pendingContentType === 'chart' && <ChartSkeleton />}
    {pendingContentType === 'table' && <TableSkeleton />}
    {pendingContentType === 'text' && <TextSkeleton lines={5} />}
  </>
)}
```

---

## 6. Stop Generation Button

### Implementation

```tsx
// Add to ChatWindow.tsx

const [canStopGeneration, setCanStopGeneration] = useState(false);
const eventSourceRef = useRef<EventSource | null>(null);

const stopGeneration = () => {
  if (eventSourceRef.current) {
    eventSourceRef.current.close();
    eventSourceRef.current = null;
    setIsTyping(false);
    setCanStopGeneration(false);
    
    // Optionally notify the backend
    fetch(`${baseUrl}/api/cancel-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionIdRef.current })
    }).catch(console.error);
    
    // Add a system message
    setMessages(prev => [...prev, {
      role: 'system',
      agent: 'System',
      content: '⏹️ Generation stopped by user'
    }]);
  }
};

// In handleSend, save the eventSource reference
eventSourceRef.current = eventSource;
setCanStopGeneration(true);

// Add button to UI
{canStopGeneration && (
  <Button
    appearance="outline"
    icon={<Stop24Regular />}
    onClick={stopGeneration}
    style={{
      position: 'absolute',
      bottom: '100px',
      right: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}
  >
    Stop generating
  </Button>
)}
```

---

## Summary

This guide provides coding-ready components that implement the visual enhancements described in the main UI improvement document. Each component:

1. Is self-contained with TypeScript types
2. Includes complete CSS with animations
3. Follows Microsoft Fluent UI design patterns
4. Can be integrated into the existing ChatWindow component
5. Supports dark/light themes (with CSS variables)

**Next Steps for Coding Agent:**

1. Create the new component files
2. Update ChatWindow.tsx to integrate components
3. Enhance backend to send appropriate status events
4. Test with real-world scenarios
5. Iterate based on user feedback
