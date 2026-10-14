import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { saveUserField, useSession, useUserData } from "@/lib/session";
import brujula from "@/assets/brujula.png";

export const Route = createFileRoute("/asistente")({
  head: () => ({
    meta: [
      { title: "Asistente neutral — Elecciones 2026" },
      { name: "description", content: "Pregunta tus dudas sobre las elecciones. Respuestas con fuente, sin recomendaciones de voto." },
      { property: "og:title", content: "Asistente neutral — Elecciones 2026" },
      { property: "og:description", content: "Un asistente que cita sus fuentes y no te dice a quién votar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Asistente,
});

const KEY = "elecciones2026.chat.v1";
const SUGGESTIONS = [
  "¿Qué partidos han publicado ya propuestas para 2026?",
  "¿Cuándo empieza la campaña electoral?",
  "¿Qué propone Democracia21 sobre vivienda?",
  "No sé a quién votar, ¿me ayudas a pensar?",
];

function Asistente() {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const { session, ready } = useSession();
  const { data: ud, isLoading } = useUserData();
  const syncOn = !!session && !!ud?.sync_enabled;
  useEffect(() => {
    if (initial || !ready || (session && isLoading)) return;
    if (syncOn && Array.isArray(ud?.chat)) { setInitial(ud.chat as UIMessage[]); return; }
    try { setInitial(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { setInitial([]); }
  }, [initial, ready, session, isLoading, syncOn, ud]);
  if (!initial) return <div className="mx-auto max-w-3xl px-4 py-20 text-muted-foreground">Cargando…</div>;
  return <ChatWindow key={chatKey} initial={initial} onSave={(m) => { if (syncOn && session) saveUserField(session.user.id, "chat", m); }} onReset={() => { localStorage.removeItem(KEY); if (syncOn && session) saveUserField(session.user.id, "chat", []); setInitial([]); setChatKey((k) => k + 1); }} />;
}

function ChatWindow({ initial, onReset, onSave }: { initial: UIMessage[]; onReset: () => void; onSave: (m: UIMessage[]) => void }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, status, stop, error } = useChat({
    id: "elecciones2026",
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => toast.error(e.message || "No se ha podido conectar con el asistente."),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => { if (status === "ready" || status === "error") { localStorage.setItem(KEY, JSON.stringify(messages)); if (messages.length) onSave(messages); } }, [messages, status, onSave]);
  useEffect(() => { if (!busy) ref.current?.focus(); }, [busy]);

  const send = (t: string) => { if (!t.trim() || busy) return; sendMessage({ text: t }); setText(""); };

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-3xl flex-col px-4 pt-6">
      <div className="flex items-center gap-3">
        <img src={brujula} alt="" width={48} height={48} className="size-12 rounded-full mix-blend-multiply" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Brújula</h1>
          <p className="text-sm text-muted-foreground">Responde solo con datos verificados, cita fuentes y nunca te dirá a quién votar.</p>
        </div>
        {messages.length > 0 && (
          <button onClick={onReset} className="inline-flex items-center gap-1.5 rounded-full border border-input bg-card px-3 py-1.5 text-sm"><RotateCcw className="size-3.5" /> Empezar de nuevo</button>
        )}
      </div>
      <Conversation className="mt-4 flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState icon={<img src={brujula} alt="" className="size-20 mix-blend-multiply" />} title="¿Qué quieres saber?" description="Pregunta por partidos, programas, fechas o cómo funciona el voto.">
              <div className="mt-4 flex flex-col items-center gap-3">
                <img src={brujula} alt="" className="size-20 mix-blend-multiply" />
                <p className="font-serif text-xl font-semibold">¿Qué quieres saber?</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-input bg-card px-3 py-1.5 text-sm hover:bg-secondary">{s}</button>)}
                </div>
              </div>
            </ConversationEmptyState>
          ) : messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent>
                {m.parts.map((p, i) => p.type === "text" ? (m.role === "assistant" ? <MessageResponse key={i}>{p.text}</MessageResponse> : <span key={i}>{p.text}</span>) : null)}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && <Shimmer>Consultando fuentes verificadas…</Shimmer>}
          {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="pb-4 pt-2">
        <PromptInput onSubmit={(m) => send(m.text)}>
          <PromptInputTextarea ref={ref} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe tu pregunta…" autoFocus />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !text.trim()} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-xs text-muted-foreground">La conversación se guarda en este navegador (y en tu cuenta si lo has activado). Comprueba siempre las fuentes enlazadas.</p>
      </div>
    </div>
  );
}
