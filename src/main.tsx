import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import HomePage from "./pages/HomePage";
import ChatWindow from "./components/ChatWindow";
import TelemetryTest from "./pages/TelemetryTest";

// Initialize Application Insights
import "./utils/applicationInsights";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<HomePage />} />
        <Route path="chat" element={<ChatWindow />} />
        <Route path="telemetry" element={<TelemetryTest />} />
      </Route>
    </Routes>
  </BrowserRouter>
);