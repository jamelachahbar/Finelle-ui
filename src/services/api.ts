import axios from 'axios';
import env from '../config/env';

const isDevelopment = import.meta.env.DEV;
const API_URL = isDevelopment ? '' : (env.BACKEND_URL || 'http://localhost:8000');

console.log('🔗 API Service environment debug:', {
  isDevelopment,
  envBackendUrl: env.BACKEND_URL,
  finalApiUrl: API_URL || '(using relative URLs for proxy)',
});

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // REQUIRED: Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // REQUIRED: CSRF protection
  },
});

// Request interceptor - for future extensions
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or not authenticated
      console.warn('Authentication required');
      // Optionally redirect to login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/api/auth/login', {
      username,
      password,
    });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/api/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  checkSession: async () => {
    const response = await apiClient.get('/api/auth/check');
    return response.data;
  },
};

// Conversation API (example protected endpoint)
export const conversationAPI = {
  askStream: async (prompt: string, sessionId?: string) => {
    const params = new URLSearchParams({ prompt });
    if (sessionId) params.append('sessionId', sessionId);
    
    const url = `${API_URL}/api/ask-stream?${params}`;
    console.log('🔍 askStream URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'X-Requested-With': 'XMLHttpRequest', // CSRF protection
        'Accept': 'text/event-stream',
      },
    });
    
    console.log('🔍 askStream response status:', response.status);
    console.log('🔍 askStream response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ askStream error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    return response.body; // Return ReadableStream for SSE
  },

  askJSON: async (prompt: string, sessionId?: string) => {
    const params = new URLSearchParams({ prompt });
    if (sessionId) params.append('sessionId', sessionId);
    
    const response = await apiClient.get(`/api/ask-json?${params}`);
    return response.data;
  },
};

// Speech API
export const speechAPI = {
  transcribe: async (audioFile: File, modelSize = 'base') => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    
    const response = await apiClient.post(
      `/api/speech/transcribe?model_size=${modelSize}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  synthesize: async (text: string, voice = 'en-US-AriaNeural') => {
    const response = await apiClient.post(
      `/api/speech/synthesize?text=${encodeURIComponent(text)}&voice=${voice}`,
      null,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};

export default apiClient;
