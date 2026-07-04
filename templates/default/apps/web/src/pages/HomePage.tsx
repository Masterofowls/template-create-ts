import { sanitizeText } from "@pkg/shared/security";
import { useCallback, useEffect, useState } from "react";
import { type Socket, io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9001";
const PROJECT_NAME = "{{PROJECT_NAME}}";

interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  framework: string;
  database?: { status: string; dialect: string };
}

interface ChatMessage {
  id: string;
  text: string;
  from?: string;
}

const WELCOME_CHAT: ChatMessage = {
  id: "welcome",
  text: "Hello, template user! Send a message below to try realtime chat.",
  from: "system",
};

export function HomePage() {
  const [hello, setHello] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_CHAT]);
  const [input, setInput] = useState("");

  useEffect(() => {
    fetch("/api/hello")
      .then((r) => r.json())
      .then((data: { message: string }) => setHello(data.message))
      .catch(() => setHello(`Hello from ${PROJECT_NAME}!`));

    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(console.error);

    const s = io(API_URL);
    s.on("connect", () => console.log("[socket] connected"));
    s.on("message", (data: { text: string; from?: string }) => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), text: data.text, from: data.from },
      ]);
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

  const apiLabel = health
    ? health.status === "ok"
      ? "API online"
      : `API ${health.status}`
    : "Connecting to API…";

  return (
    <div className="app">
      <header>
        <h1>{PROJECT_NAME}</h1>
        <p>Fullstack TypeScript template — React + Fastify + Drizzle</p>
      </header>

      <section className="card welcome" aria-label="Welcome">
        <p className="welcome-hello">Hello, template user!</p>
        <p className="welcome-lead">
          {hello ??
            "Your app is running. Edit apps/web/src/pages/HomePage.tsx to customize this page."}
        </p>
        <ul className="welcome-links">
          <li>
            Web: <a href="/">localhost:9000</a>
          </li>
          <li>
            API: <a href="/health">localhost:9001</a>
          </li>
          <li>
            Docs: <a href="/docs">OpenAPI /docs</a>
          </li>
        </ul>
      </section>

      <section className="card">
        <h2>API Health</h2>
        <p className={`status-pill status-${health?.status ?? "loading"}`}>{apiLabel}</p>
        {health ? (
          <details className="health-details">
            <summary>Raw health JSON</summary>
            <pre>{JSON.stringify(health, null, 2)}</pre>
          </details>
        ) : null}
      </section>

      <section className="card">
        <h2>Socket.IO Chat</h2>
        <div className="messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={msg.from === "system" ? "message message-system" : "message"}
            >
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
