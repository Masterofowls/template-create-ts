import { sanitizeText } from "@pkg/shared/security";
import { useCallback, useEffect, useState } from "react";
import { type Socket, io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9001";

interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  framework: string;
}

interface ChatMessage {
  id: string;
  text: string;
}

export function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(console.error);

    const s = io(API_URL);
    s.on("connect", () => console.log("[socket] connected"));
    s.on("message", (data: { text: string }) => {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), text: data.text }]);
    });
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const sendMessage = useCallback(() => {
    if (!socket || !input.trim()) return;
    socket.emit("message", { text: sanitizeText(input) });
    setInput("");
  }, [socket, input]);

  return (
    <div className="app">
      <header>
        <h1>{"{{PROJECT_NAME}}"}</h1>
        <p>{"Fullstack TypeScript template — React + {{FRAMEWORK}} + Drizzle"}</p>
      </header>

      <section className="card">
        <h2>API Health</h2>
        {health ? <pre>{JSON.stringify(health, null, 2)}</pre> : <p>Loading...</p>}
      </section>

      <section className="card">
        <h2>Socket.IO Chat</h2>
        <div className="messages">
          {messages.map((msg) => (
            <div key={msg.id} className="message">
              {msg.text}
            </div>
          ))}
        </div>
        <div className="input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            aria-label="Chat message"
          />
          <button type="button" onClick={sendMessage}>
            Send
          </button>
        </div>
      </section>
    </div>
  );
}
