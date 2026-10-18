import { createFileRoute } from "@tanstack/react-router";

const recentRequests = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

export const Route = createFileRoute("/api/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as { name?: unknown; email?: unknown; message?: unknown; website?: unknown };
          if (typeof body.website === "string" && body.website.trim()) return Response.json({ ok: true });
          const name = typeof body.name === "string" ? body.name.trim() : "";
          const email = typeof body.email === "string" ? body.email.trim() : "";
          const message = typeof body.message === "string" ? body.message.trim() : "";
          if (name.length < 2 || name.length > 100) return Response.json({ error: "Introduce un nombre válido." }, { status: 400 });
          if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Introduce un email válido." }, { status: 400 });
          if (message.length < 10 || message.length > 5000) return Response.json({ error: "El mensaje debe tener entre 10 y 5000 caracteres." }, { status: 400 });

          const apiKey = process.env.RESEND_API_KEY;
          const from = process.env.RESEND_FROM_EMAIL;
          if (!apiKey || !from) return Response.json({ error: "El envío de correo aún no está configurado. Inténtalo más adelante." }, { status: 503 });

          const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
          const now = Date.now();
          const recent = (recentRequests.get(forwarded) ?? []).filter(time => now - time < WINDOW_MS);
          if (recent.length >= MAX_REQUESTS) return Response.json({ error: "Has enviado demasiados mensajes. Espera unos minutos e inténtalo de nuevo." }, { status: 429 });
          recent.push(now);
          recentRequests.set(forwarded, recent);

          const sent = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from,
              to: ["merceworks@gmail.com"],
              reply_to: email,
              subject: `Contacto web: ${name.replace(/[\r\n]/g, " ")}`,
              text: `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`,
            }),
          });
          if (!sent.ok) {
            console.error("Contact email provider error", sent.status);
            return Response.json({ error: "No se ha podido enviar el mensaje ahora mismo. Inténtalo más tarde." }, { status: 502 });
          }
          return Response.json({ ok: true });
        } catch {
          return Response.json({ error: "No se ha podido procesar la solicitud." }, { status: 400 });
        }
      },
    },
  },
});
