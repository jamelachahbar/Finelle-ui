import { useEffect, useState } from "react";
import "./TypingBubble.css";
import HarisChatIcon from '../assets/Harischaticon.png';

const spinnerFrames = [
  "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏",
  "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇"
];

const TypingBubble = ({ message = "Haris is thinking..." }) => {
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
        <span className="jzy-chat-role jzy-tag-agent">
          <img 
            src={HarisChatIcon} 
            alt="Haris" 
            style={{ width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle' }} 
          />
          Haris
        </span>
      </div>
      <div className="jzy-chat-content">
        <div>{message}</div>
        <div className="braille-spinner" aria-label="Haris is typing" role="status">
          {spinnerFrames[frameIndex]}
        </div>
      </div>
    </div>
  );
};

export default TypingBubble;
