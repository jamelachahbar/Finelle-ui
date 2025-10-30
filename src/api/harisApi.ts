import axios from "axios";

// Base URL for the backend API - use environment variable or fallback
import env from '../config/env';

// In development mode, use relative URLs to work with Vite proxy
// In production, use the configured backend URL
const isDevelopment = import.meta.env.DEV;
const BASE_URL = isDevelopment ? '' : (env.BACKEND_URL || "http://localhost:8000");

console.log('🔗 API environment debug:', {
  isDevelopment,
  envBackendUrl: env.BACKEND_URL,
  finalBaseUrl: BASE_URL || '(using relative URLs for proxy)',
  windowEnv: window._env_,
  importMetaEnv: {
    DEV: import.meta.env.DEV,
    VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL
  }
});

// Memory-related types
export interface MemoryEntry {
  question: string;
  answer: string;
  timestamp?: string;
  session_id?: string;
  feedback?: 'positive' | 'negative';
  [key: string]: unknown;
}

export interface FeedbackResponse {
  message: string;
  success: boolean;
}

export const askHaris = async (prompt: string) => {
  const url = `${BASE_URL}/ask`;
  const response = await axios.post(url, { prompt });
  return response.data.response;
};

/**
 * Send user feedback (thumbs up/down) for a question-answer pair
 */
export const sendMemoryFeedback = async (
  userQuestion: string,
  sessionId: string,
  isAccurate: boolean
): Promise<{ success: boolean }> => {
  const params = new URLSearchParams({
    user_question: userQuestion,
    session_id: sessionId,
    is_accurate: isAccurate.toString()
  });

  const response = await fetch(
    `${BASE_URL}/api/memory/feedback?${params.toString()}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to send feedback: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Search for similar memories
 */
export const searchMemories = async (
  query: string,
  sessionId: string,
  feedbackOnly: boolean = true
): Promise<MemoryEntry[]> => {
  const params = new URLSearchParams({
    query,
    session_id: sessionId,
    feedback_only: feedbackOnly.toString()
  });

  const response = await fetch(
    `${BASE_URL}/api/memory/search?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Failed to search memories: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Get all memories for a session
 */
export const getAllMemories = async (sessionId: string): Promise<MemoryEntry[]> => {
  const response = await fetch(
    `${BASE_URL}/api/memory/all?session_id=${sessionId}`
  );

  if (!response.ok) {
    throw new Error(`Failed to get memories: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Clear memories for a session
 */
export const clearMemories = async (sessionId: string): Promise<{ success: boolean }> => {
  const response = await fetch(
    `${BASE_URL}/api/memory/clear/${sessionId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to clear memories: ${response.statusText}`);
  }

  return response.json();
};

// Export the base URL for use in other services
export { BASE_URL };
