import { useState } from "react";
import { askFinelle } from "../api/finelleApi";
import { Textarea, Button } from "@fluentui/react-components";

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  const handleSubmit = async () => {
    const reply = await askFinelle(input);
    setMessages([...messages, `You: ${input}`, `Finelle: ${reply}`]);
    setInput("");
  };

  return (
    <div className="p-8">
      {messages.map((msg, i) => (
        <div key={i} className="mb-2">{msg}</div>
      ))}
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask Finelle something..."
      />
      <Button appearance="primary" onClick={handleSubmit} className="mt-2">
        Send
      </Button>
    </div>
  );
}
