import env from '../config/env';

export const useAgentChat = (prompt: string): EventSource => {
    // In development mode, use relative URLs to work with Vite proxy
    // In production, use the configured backend URL
    const isDevelopment = import.meta.env.DEV;
    const baseUrl = isDevelopment ? '' : env.BACKEND_URL;
    
    const url = `${baseUrl}/ask-stream?prompt=${encodeURIComponent(prompt)}`;
    console.log('🔍 Agent chat using URL:', url);
    
    return new EventSource(url);
  };