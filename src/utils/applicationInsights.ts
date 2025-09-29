import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';

// Create React plugin for Application Insights
const reactPlugin = new ReactPlugin();

// Get connection string from environment variable
const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING;

// Debug logging
console.log('🔍 Application Insights Debug:');
console.log('Connection String Available:', !!connectionString);
console.log('Connection String Length:', connectionString?.length || 0);
if (connectionString) {
  console.log('Connection String Preview:', connectionString.substring(0, 50) + '...');
}

// Initialize Application Insights
const appInsights = new ApplicationInsights({
  config: {
    connectionString: connectionString,
    extensions: [reactPlugin],
    extensionConfig: {
      [reactPlugin.identifier]: {
        history: null // Will be set during React Router initialization
      }
    },
    // Configuration options
    enableAutoRouteTracking: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
    enableCorsCorrelation: true,
    enableAjaxErrorStatusText: true,
    enableAjaxPerfTracking: true,
    enableUnhandledPromiseRejectionTracking: true,
    disableFetchTracking: false,
    // Performance optimizations
    samplingPercentage: 100,
    maxBatchSizeInBytes: 10240,
    maxBatchInterval: 15000,
    // Privacy settings
    disableDataLossAnalysis: false,
    cookieCfg: {
      enabled: true,
      domain: window.location.hostname
    }
  }
});

// Initialize the Application Insights SDK
if (connectionString && connectionString.trim() !== '') {
  appInsights.loadAppInsights();
  
  // Track initial page view
  appInsights.trackPageView({
    name: 'Haris UI - Initial Load',
    uri: window.location.href
  });

  console.log('✅ Application Insights initialized successfully');
  console.log('🔗 Connection String Preview:', connectionString.substring(0, 50) + '...');
} else {
  console.warn('⚠️ Application Insights connection string not found. Running in development mode without telemetry.');
  console.log('🔍 Available environment variables:', Object.keys(import.meta.env));
  console.log('💡 Tip: Use .env.finldev for development or deploy to Azure for production telemetry');
}

// Helper functions for custom telemetry
export const trackEvent = (name: string, properties?: Record<string, string>, measurements?: Record<string, number>) => {
  console.log(`🔥 Tracking Event: ${name}`, properties);
  if (appInsights.appInsights && connectionString) {
    appInsights.trackEvent({ name, properties, measurements });
    appInsights.flush(); // Force immediate send
    console.log('✅ Event sent and flushed');
  } else {
    console.log('⚠️ AppInsights not initialized - event logged locally only');
  }
};

export const trackException = (exception: Error, properties?: Record<string, string>) => {
  console.log(`⚠️ Tracking Exception: ${exception.message}`, properties);
  if (appInsights.appInsights && connectionString) {
    appInsights.trackException({ exception, properties });
    appInsights.flush();
    console.log('✅ Exception sent and flushed');
  } else {
    console.log('⚠️ AppInsights not initialized - exception logged locally only');
  }
};

export const trackTrace = (message: string, severityLevel?: number, properties?: Record<string, string>) => {
  console.log(`📋 Tracking Trace: ${message}`, properties);
  if (appInsights.appInsights && connectionString) {
    appInsights.trackTrace({ message, severityLevel, properties });
    appInsights.flush();
    console.log('✅ Trace sent and flushed');
  } else {
    console.log('⚠️ AppInsights not initialized - trace logged locally only');
  }
};

export const trackMetric = (name: string, average: number, properties?: Record<string, string>) => {
  console.log(`📊 Tracking Metric: ${name} = ${average}`, properties);
  if (appInsights.appInsights && connectionString) {
    appInsights.trackMetric({ name, average, properties });
    appInsights.flush();
    console.log('✅ Metric sent and flushed');
  } else {
    console.log('⚠️ AppInsights not initialized - metric logged locally only');
  }
};

export const trackPageView = (name?: string, uri?: string, properties?: Record<string, string>) => {
  console.log(`📄 Tracking Page View: ${name}`, { uri, properties });
  if (appInsights.appInsights && connectionString) {
    appInsights.trackPageView({ name, uri, properties });
    appInsights.flush();
    console.log('✅ Page view sent and flushed');
  } else {
    console.log('⚠️ AppInsights not initialized - page view logged locally only');
  }
};

// Set user context
export const setUserContext = (userId: string, accountId?: string) => {
  console.log(`👤 Setting User Context: ${userId}`, { accountId });
  if (appInsights.appInsights && connectionString) {
    appInsights.setAuthenticatedUserContext(userId, accountId);
    console.log('✅ User context set');
  } else {
    console.log('⚠️ AppInsights not initialized - user context logged locally only');
  }
};

// Clear user context
export const clearUserContext = () => {
  console.log('👤 Clearing User Context');
  if (appInsights.appInsights && connectionString) {
    appInsights.clearAuthenticatedUserContext();
    console.log('✅ User context cleared');
  } else {
    console.log('⚠️ AppInsights not initialized - user context clear logged locally only');
  }
};

// Export the React plugin for use with React Router
export { reactPlugin };

// Export the main Application Insights instance
export default appInsights;