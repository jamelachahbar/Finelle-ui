import { Text, Button } from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { trackEvent, trackPageView, trackTrace } from "../utils/applicationInsights";
import HarisLogo from '../assets/Harislogo.png';

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Track page load
    console.log('🔍 Environment Variable Debug:');
    console.log('VITE_APPINSIGHTS_CONNECTION_STRING present:', !!import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING);
    console.log('Connection string length:', import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING?.length || 0);
    console.log('All available env vars:', Object.keys(import.meta.env));
    
    trackPageView('HomePage', window.location.href);
    trackEvent('HomePage_Loaded', {
      userAgent: navigator.userAgent,
      referrer: document.referrer || 'direct',
      hasConnectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING ? 'true' : 'false',
      connectionStringLength: String(import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING?.length || 0)
    });
    trackTrace('HomePage component mounted successfully');
  }, []);

  const handleChatNavigation = () => {
    trackEvent('Navigation_ToChatWindow', {
      source: 'HomePage'
    });
    navigate("/chat");
  };

  const handleTestTelemetry = () => {
    console.log('🧪 Testing telemetry manually...');
    trackEvent('Test_Button_Clicked', {
      timestamp: new Date().toISOString(),
      testType: 'manual'
    });
    trackTrace('Manual telemetry test triggered by user');
    alert('Telemetry test sent! Check console for details.');
  };

  const navigateToTelemetryTest = () => {
    trackEvent('Navigation_ToTelemetryTest', {
      source: 'HomePage'
    });
    navigate("/telemetry");
  };

  return (
    <div
      style={{
        height: "100vh",
        textAlign: "center",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "24px",
        padding: "0 16px",
      }}
    >
      {/* Haris Logo - Centered above welcome message */}
      <div style={{ marginBottom: "24px" }}>
        <img 
          src={HarisLogo} 
          alt="Haris" 
          style={{ 
            height: "180px", 
            width: "auto", 
            filter: "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15))"
          }} 
        />
      </div>

      <Text
        weight="bold"
        size={800}
        style={{
          background: "linear-gradient(to right, #2563eb, #9333ea)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        I'm Haris, Your FinOps Guardian
      </Text>

      <Text size={400} style={{ color: "#666", maxWidth: "600px" }}>
        Discover insights on Azure costs, FinOps, and beyond — Haris shields your cloud from waste and empowers you to master FinOps.
      </Text>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        <Button
          appearance="primary"
          size="large"
          onClick={handleChatNavigation}
        >
          💬 Chat with Haris
        </Button>
        
        <Button
          appearance="outline"
          size="large"
          onClick={handleTestTelemetry}
        >
          🧪 Test Telemetry
        </Button>

        <Button
          appearance="outline"
          size="large"
          onClick={navigateToTelemetryTest}
        >
          📊 Full Telemetry Test
        </Button>
      </div>
    </div>
  );
}
