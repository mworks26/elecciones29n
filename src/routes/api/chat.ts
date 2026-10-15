import { createFileRoute } from "@tanstack/react-router";

// The AI assistant was retired in favour of the conventional /buscar search (no AI credit usage).
export const Route = createFileRoute("/api/chat")({
  server: { handlers: { POST: () => Response.json({ error: "El asistente se ha sustituido por el buscador." }, { status: 410 }) } },
});
