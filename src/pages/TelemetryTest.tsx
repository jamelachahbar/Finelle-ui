import { Button, Text, Card, Badge } from "@fluentui/react-components";
import { useState, useEffect } from "react";
import { 
  trackEvent, 
  trackException, 
  trackTrace, 
  trackMetric, 
  trackPageView 
} from "../utils/applicationInsights";
import env from "../config/env";

export default function TelemetryTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // Check if Application Insights is properly configured (now uses runtime config)
    const hasConnectionString = !!env.APPINSIGHTS_CONNECTION_STRING;
    const connectionStringValue = env.APPINSIGHTS_CONNECTION_STRING;
    
    setIsConnected(hasConnectionString);
    
    // Enhanced logging
    console.log('🔍 DETAILED APPLICATION INSIGHTS DEBUG:');
    console.log('Environment Variables Available:', Object.keys(import.meta.env));
    console.log('VITE_APPINSIGHTS_CONNECTION_STRING present:', hasConnectionString);
    console.log('Connection string preview:', connectionStringValue ? connectionStringValue.substring(0, 50) + '...' : 'NOT FOUND');
    console.log('Connection string length:', connectionStringValue?.length || 0);
    
    // Track page view
    trackPageView('TelemetryTest', window.location.href, {
      testMode: 'true',
      hasConnectionString: hasConnectionString ? 'true' : 'false'
    });

    addResult(`Application Insights Connection: ${hasConnectionString ? 'Connected ✅' : 'Not Connected ❌'}`);
    if (hasConnectionString) {
      addResult(`Connection String Length: ${connectionStringValue?.length}`);
      addResult(`Connection String Preview: ${connectionStringValue?.substring(0, 50)}...`);
    } else {
      addResult(`❌ Environment variable VITE_APPINSIGHTS_CONNECTION_STRING not found`);
      addResult(`Available env vars: ${Object.keys(import.meta.env).join(', ')}`);
    }
  }, []);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCustomEvent = () => {
    addResult("Sending custom event...");
    trackEvent('Custom_Test_Event', {
      testType: 'manual',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      randomValue: Math.random().toString()
    });
    addResult("Custom event sent ✅");
  };

  const testException = () => {
    addResult("Sending exception...");
    const testError = new Error("This is a test exception for Application Insights");
    trackException(testError, {
      testType: 'manual',
      errorSource: 'telemetry-test-page'
    });
    addResult("Exception sent ✅");
  };

  const testTrace = () => {
    addResult("Sending trace...");
    trackTrace("This is a test trace message", 1, {
      testType: 'manual',
      logLevel: 'info'
    });
    addResult("Trace sent ✅");
  };

  const testMetric = () => {
    addResult("Sending metric...");
    const randomValue = Math.random() * 100;
    trackMetric('Test_Performance_Metric', randomValue, {
      testType: 'manual',
      metricUnit: 'milliseconds'
    });
    addResult(`Metric sent: ${randomValue.toFixed(2)} ✅`);
  };

  const testUserInteraction = () => {
    addResult("Simulating user interaction...");
    trackEvent('User_Interaction_Test', {
      interactionType: 'button_click',
      elementId: 'user-interaction-test',
      sessionId: Math.random().toString(36).substring(7)
    });
    addResult("User interaction event sent ✅");
  };

  const testNavigationTiming = () => {
    addResult("Sending navigation timing...");
    if (performance && performance.timing) {
      const timing = performance.timing;
      trackMetric('Page_Load_Time', timing.loadEventEnd - timing.navigationStart, {
        testType: 'performance',
        domContentLoaded: String(timing.domContentLoadedEventEnd - timing.navigationStart),
        firstPaint: String(timing.responseStart - timing.navigationStart)
      });
      addResult("Navigation timing sent ✅");
    } else {
      addResult("Navigation timing not available ❌");
    }
  };

  const testDependencyCall = () => {
    addResult("Simulating dependency call...");
    
    // Simulate an API call that would normally be tracked as a dependency
    fetch('https://jsonplaceholder.typicode.com/posts/1')
      .then(response => {
        trackEvent('Dependency_Call_Success', {
          url: 'https://jsonplaceholder.typicode.com/posts/1',
          status: String(response.status),
          duration: '150ms' // This would normally be calculated
        });
        addResult("Dependency call simulation sent ✅");
      })
      .catch(error => {
        trackException(error, {
          dependencyUrl: 'https://jsonplaceholder.typicode.com/posts/1',
          errorType: 'network'
        });
        addResult("Dependency error sent ✅");
      });
  };

  const runAllTests = () => {
    addResult("🚀 Running all telemetry tests...");
    
    setTimeout(() => testCustomEvent(), 100);
    setTimeout(() => testTrace(), 200);
    setTimeout(() => testMetric(), 300);
    setTimeout(() => testUserInteraction(), 400);
    setTimeout(() => testNavigationTiming(), 500);
    setTimeout(() => testDependencyCall(), 600);
    setTimeout(() => testException(), 700);
    
    setTimeout(() => {
      addResult("🎉 All tests completed! Check Application Insights in 5-10 minutes.");
    }, 800);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px", textAlign: "center" }}>
        <Text size={800} weight="bold">
          🧪 Application Insights Telemetry Test
        </Text>
        <div style={{ marginTop: "8px" }}>
          <Badge 
            appearance={isConnected ? "filled" : "outline"} 
            color={isConnected ? "success" : "danger"}
          >
            {isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </div>

      <Card style={{ marginBottom: "24px", padding: "16px" }}>
        <Text size={500} weight="semibold" style={{ marginBottom: "16px" }}>
          Individual Tests
        </Text>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <Button appearance="outline" onClick={testCustomEvent}>
            📊 Custom Event
          </Button>
          <Button appearance="outline" onClick={testTrace}>
            📝 Trace Log
          </Button>
          <Button appearance="outline" onClick={testMetric}>
            📈 Custom Metric
          </Button>
          <Button appearance="outline" onClick={testUserInteraction}>
            👆 User Interaction
          </Button>
          <Button appearance="outline" onClick={testNavigationTiming}>
            ⏱️ Performance
          </Button>
          <Button appearance="outline" onClick={testDependencyCall}>
            🔗 API Call
          </Button>
          <Button appearance="outline" onClick={testException}>
            ⚠️ Test Exception
          </Button>
        </div>
      </Card>

      <Card style={{ marginBottom: "24px", padding: "16px" }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <Button appearance="primary" onClick={runAllTests}>
            🚀 Run All Tests
          </Button>
          <Button appearance="outline" onClick={clearResults}>
            🗑️ Clear Results
          </Button>
        </div>
      </Card>

      <Card style={{ padding: "16px" }}>
        <Text size={500} weight="semibold" style={{ marginBottom: "16px" }}>
          Test Results ({testResults.length})
        </Text>
        <div 
          style={{ 
            backgroundColor: "#f5f5f5", 
            padding: "12px", 
            borderRadius: "4px", 
            fontFamily: "monospace", 
            fontSize: "12px",
            maxHeight: "300px",
            overflowY: "auto"
          }}
        >
          {testResults.length === 0 ? (
            <Text style={{ fontStyle: "italic" }}>No tests run yet...</Text>
          ) : (
            testResults.map((result, index) => (
              <div key={index} style={{ marginBottom: "4px" }}>
                {result}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card style={{ marginTop: "24px", padding: "16px", backgroundColor: "#fff3cd" }}>
        <Text size={400} weight="semibold" style={{ marginBottom: "8px" }}>
          � Environment Debug Info:
        </Text>
        <div style={{ fontFamily: "monospace", fontSize: "12px", backgroundColor: "#f5f5f5", padding: "12px", borderRadius: "4px" }}>
          <div>Available Environment Variables:</div>
          {Object.entries(import.meta.env).map(([key, value]) => (
            <div key={key} style={{ marginLeft: "10px" }}>
              • {key}: {key.includes('CONNECTION') ? 
                (value ? `[${String(value).length} chars] ${String(value).substring(0, 30)}...` : 'undefined') : 
                String(value)
              }
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginTop: "16px", padding: "16px", backgroundColor: "#fff3cd" }}>
        <Text size={400} weight="semibold" style={{ marginBottom: "8px" }}>
          �💡 How to verify telemetry:
        </Text>
        <ul style={{ margin: 0, paddingLeft: "20px" }}>
          <li>Check browser console for debug messages</li>
          <li>Wait 5-10 minutes for data to appear in Application Insights</li>
          <li>Query Log Analytics: <code>AppEvents | order by TimeGenerated desc</code></li>
          <li>Query Log Analytics: <code>AppTraces | order by TimeGenerated desc</code></li>
          <li>Query Log Analytics: <code>AppExceptions | order by TimeGenerated desc</code></li>
        </ul>
      </Card>
    </div>
  );
}