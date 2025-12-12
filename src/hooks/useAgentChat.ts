import env from '../config/env';

export const useAgentChat = (prompt: string): EventSource => {
    // Use relative URLs in both dev and production
    // In production, nginx proxies /api/* to the backend (supports internal ingress)
    // In development, Vite dev server proxies to backend
    const isDevelopment = import.meta.env.DEV;
    const baseUrl = '/api';
    
    const url = `${baseUrl}/ask-stream?prompt=${encodeURIComponent(prompt)}`;
    console.log('🔍 Agent chat using URL:', url, '(strategy:', isDevelopment ? 'Vite proxy' : 'nginx proxy', ')');
    
    return new EventSource(url);
  };