import { useEffect, useState } from "react";
import "./TypingBubble.css";

const spinnerFrames = [
  "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏",
  "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇"
];

const TypingBubble = ({ message = "Finelle is thinking..." }) => {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % spinnerFrames.length);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="jzy-chat-bubble jzy-agent">
      <div className="jzy-chat-meta">
        <span className="jzy-chat-role jzy-tag-agent">🤖 Finelle</span>
      </div>
      <div className="jzy-chat-content">
        <div>{message}</div>
        <div className="braille-spinner" aria-label="Finelle is typing" role="status">
          {spinnerFrames[frameIndex]}
        </div>
      </div>
    </div>
  );
};

export default TypingBubble;
