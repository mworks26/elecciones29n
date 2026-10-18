import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, Send, RotateCcw } from "lucide-react";
import { PageIntro, Card } from "@/components/site";

export const Route = createFileRoute("/contacto")({
  head: () => ({ meta: [
    { title: "Contacto — Elecciones 2026" },
    { name: "description", content: "Contacta con el equipo de Tu voto empieza aquí." },
  ] }),
  component: ContactoPage,
});

function ContactoPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");

  function cancel() {
    setName(""); setEmail(""); setMessage(""); setWebsite("");
    setStatus("idle"); setError("");
    void navigate({ to: "/buscar" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (name.trim().length < 2 || message.trim().length < 10) {
      setError("Revisa los campos: el nombre debe tener al menos 2 caracteres y el mensaje, 10.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Introduce un email válido.");
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim(), website }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se ha podido enviar el mensaje.");
      setStatus("success");
      setName(""); setEmail(""); setMessage(""); setWebsite("");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Ha ocurrido un error. Inténtalo de nuevo.");
    }
  }

  return (
    <div>
      <PageIntro eyebrow="Contacto" title="¿Hablamos?">
        ¿Has encontrado un error, quieres sugerir una mejora o tienes alguna pregunta? Escríbenos.
      </PageIntro>
      <div className="mx-auto max-w-3xl px-4">
        <Card className="border-violet-200">
          {status === "success" ? (
            <div role="status" className="py-5 text-center">
              <Mail className="mx-auto size-10 text-violet-600" aria-hidden />
              <h2 className="mt-4 text-2xl font-semibold">¡Mensaje enviado!</h2>
              <p className="mt-2 text-muted-foreground">Gracias por escribirnos. Hemos recibido tu mensaje.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => setStatus("idle")} className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Enviar otro mensaje</button>
                <Link to="/buscar" className="rounded-full border border-input px-5 py-2.5 font-semibold">Volver al buscador</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="contact-name" className="mb-1.5 block text-sm font-semibold">Nombre</label>
                <input id="contact-name" name="name" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3" placeholder="Tu nombre" />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-1.5 block text-sm font-semibold">Email</label>
                <input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3" placeholder="tu@email.com" />
              </div>
              <div>
                <label htmlFor="contact-message" className="mb-1.5 block text-sm font-semibold">Mensaje</label>
                <textarea id="contact-message" name="message" required minLength={10} maxLength={5000} rows={6} value={message} onChange={e => setMessage(e.target.value)} className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3" placeholder="¿En qué podemos ayudarte?" />
                <p className="mt-1 text-right text-xs text-muted-foreground">{message.length}/5000</p>
              </div>
              <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
                <label htmlFor="contact-website">No rellenes este campo</label>
                <input id="contact-website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} />
              </div>
              {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" disabled={status === "sending"} className="inline-flex items-center gap-2 rounded-full bg-violet-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-violet-800 disabled:opacity-60">
                  <Send className="size-4" aria-hidden />{status === "sending" ? "Enviando…" : "Enviar"}
                </button>
                <button type="button" onClick={cancel} disabled={status === "sending"} className="inline-flex items-center gap-2 rounded-full border border-input px-6 py-3 font-semibold hover:bg-secondary disabled:opacity-60">
                  <RotateCcw className="size-4" aria-hidden />Cancelar
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Usaremos tu email únicamente para responder a tu consulta.</p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
