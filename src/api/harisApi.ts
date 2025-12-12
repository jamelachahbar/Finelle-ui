import axios from "axios";

// Base URL for the backend API - use environment variable or fallback
import env from '../config/env';

// IMPORTANT: In production, we use relative URLs (/api/) which nginx proxies to the backend
// This enables the backend to use internal ingress (not publicly accessible)
// while the frontend uses external ingress (publicly accessible)
//
// How it works:
// 1. Browser calls: https://frontend.region.azurecontainerapps.io/api/ask
// 2. nginx (in frontend container) proxies to: http://backend-app/ask
// 3. Backend with internal ingress is only reachable within Container Apps environment
// 4. No CORS issues since browser only talks to frontend origin
//
// In development mode, use relative URLs to work with Vite proxy
const isDevelopment = import.meta.env.DEV;
const BASE_URL = isDevelopment ? '' : '/api';

console.log('🔗 API environment debug:', {
  isDevelopment,
  envBackendUrl: env.BACKEND_URL,
  finalBaseUrl: BASE_URL,
  strategy: isDevelopment ? 'Vite dev proxy' : 'nginx reverse proxy',
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
