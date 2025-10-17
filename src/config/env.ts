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
 * Priority: Runtime config (window._env_) > Build-time config (import.meta.env)
 */
export function getEnv(key: keyof RuntimeEnv): string {
  // First, try runtime config (set by env-config.sh at container startup)
  if (window._env_ && window._env_[key]) {
    return window._env_[key]!;
  }
  
  // Fall back to build-time config (for local development)
  return import.meta.env[key] as string || '';
}

export default {
  get APPINSIGHTS_CONNECTION_STRING() {
    return getEnv('VITE_APPINSIGHTS_CONNECTION_STRING');
  },
  get BACKEND_URL() {
    return getEnv('VITE_BACKEND_URL');
  },
};
