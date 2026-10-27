import { createServer } from "node:http";

const lesson = {
  id: "e2e-lesson",
  title: "At the Café",
  level: "beginner",
  exchanges: [
    {
      id: "exchange-1",
      lesson_id: "e2e-lesson",
      order_index: 0,
      speaker: "app",
      english_text: "Good morning! What would you like?",
      portuguese_translation: "Bom dia! O que você gostaria?",
      audio_url: null,
    },
    {
      id: "exchange-2",
      lesson_id: "e2e-lesson",
      order_index: 1,
      speaker: "student",
      english_text: "I'd like a coffee, please.",
      portuguese_translation: "Eu gostaria de um café, por favor.",
      audio_url: null,
    },
  ],
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1:3101");
  response.setHeader("Content-Type", "application/json");

  if (url.pathname === "/health") {
    response.writeHead(200).end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (url.pathname === "/api/lessons") {
    const lessons = [
      {
        id: lesson.id,
        title: lesson.title,
        level: lesson.level,
        created_at: "2026-10-26T12:00:00.000Z",
        exchange_count: lesson.exchanges.length,
      },
    ].filter((item) => !url.searchParams.has("level") || item.level === url.searchParams.get("level"));
    response.writeHead(200).end(JSON.stringify(lessons));
    return;
  }

  if (url.pathname === `/api/lessons/${lesson.id}`) {
    response.writeHead(200).end(JSON.stringify(lesson));
    return;
  }

  if (/^\/api\/content-producer\/session\/[^/]+$/.test(url.pathname) && request.method === "GET") {
    response.writeHead(200).end(JSON.stringify({ session_id: "docs-session", messages: [] }));
    return;
  }

  if (url.pathname === "/api/content-producer/jobs/recent") {
    response.writeHead(200).end(JSON.stringify({ snapshot: null }));
    return;
  }

  if (url.pathname === "/api/settings/ai") {
    response.writeHead(200).end(JSON.stringify({
      provider: "openai",
      openaiConfigured: true,
      localReady: false,
      localServices: [
        { service: "ollama", ready: false },
        { service: "transcription", ready: false },
        { service: "speech", ready: false },
      ],
    }));
    return;
  }

  response.writeHead(404).end(JSON.stringify({ error: "Not found" }));
});

server.listen(3101, "127.0.0.1");

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
