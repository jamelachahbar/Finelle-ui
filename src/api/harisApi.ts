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

export const askHaris = async (prompt: string) => {
  const url = `${BASE_URL}/ask`;
  const response = await axios.post(url, { prompt });
  return response.data.response;
};

// Export the base URL for use in other services
export { BASE_URL };
