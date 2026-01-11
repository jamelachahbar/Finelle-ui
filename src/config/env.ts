// Runtime environment configuration helper
// This allows environment variables to be set at container runtime, not just build time

interface RuntimeEnv {
  VITE_APPINSIGHTS_CONNECTION_STRING?: string;
  VITE_BACKEND_URL?: string;
}

// Extend Window interface to include our runtime config
declare global {
  interface Window {
    _env_?: RuntimeEnv;
  }
}

// Load runtime config if it exists
const loadRuntimeConfig = async (): Promise<void> => {
  if (window._env_) {
    return; // Already loaded
  }
  
  try {
    // Try to load env-config.js dynamically
    const script = document.createElement('script');
    script.src = '/env-config.js';
    await new Promise((resolve) => {
      script.onload = resolve;
      script.onerror = () => {
        console.warn('⚠️ Could not load runtime config, using build-time environment variables');
        resolve(null); // Don't reject, just use fallback
      };
      document.head.appendChild(script);
    });
  } catch (error) {
    console.warn('⚠️ Runtime config load failed:', error);
  }
};

// Initialize runtime config on module load
loadRuntimeConfig();

/**
 * Get environment variable value
 * Priority: Runtime config (window._env_) > Build-time config (import.meta.env) > Inferred from location
 */
export function getEnv(key: keyof RuntimeEnv): string {
  // First, try runtime config (set by env-config.sh at container startup)
  if (window._env_ && window._env_[key]) {
    return window._env_[key]!;
  }
  
  // Fall back to build-time config (for local development)
  const buildTimeValue = import.meta.env[key] as string;
  if (buildTimeValue) {
    return buildTimeValue;
  }

  // Final fallback for BACKEND_URL: try to infer from current location
  // This handles cases where frontend and backend are on the same origin (proxied)
  if (key === 'VITE_BACKEND_URL') {
    // Check if we're in a container environment (production) with no env set
    // In this case, assume backend is on same origin or use common defaults
    const origin = window.location.origin;
    
    // If running on localhost dev server (Vite default ports), assume backend is on 8000
    if (origin.includes('localhost:5173') || origin.includes('localhost:5174')) {
      console.warn('⚠️ VITE_BACKEND_URL not set, defaulting to http://localhost:8000');
      return 'http://localhost:8000';
    }
    
    // In production, if backend is proxied through same origin, use empty string
    // This makes URLs like /static/charts/... work as relative URLs
    console.warn('⚠️ VITE_BACKEND_URL not set, using same-origin (empty string)');
    return '';
  }

  return '';
}

export default {
  get APPINSIGHTS_CONNECTION_STRING() {
    return getEnv('VITE_APPINSIGHTS_CONNECTION_STRING');
  },
  get BACKEND_URL() {
    return getEnv('VITE_BACKEND_URL');
  },
};
