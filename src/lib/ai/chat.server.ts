import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader } from "./run-id.server";

const MODEL = "openai/gpt-6-astra";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function buildKnowledge() {
  const sb = publicClient();
  const [parties, docs, claims, sources, topics] = await Promise.all([
    sb.from("parties").select("*").order("name"),
    sb.from("programme_documents").select("*"),
    sb.from("claims").select("*"),
    sb.from("sources").select("*"),
    sb.from("topics").select("*"),
  ]);
  const err = parties.error ?? docs.error ?? claims.error ?? sources.error ?? topics.error;
  if (err) throw new Error(err.message);
  return JSON.stringify({
    eleccion: {
      fecha: "2026-11-29", campaña: "2026-11-13 a 2026-11-27", escaños_congreso: 350,
      fuente: "https://www.boe.es/eli/es/rd/2026/10/05/806",
    },
    temas: topics.data,
    partidos: parties.data,
    documentos: docs.data,
    propuestas: claims.data,
    fuentes: sources.data,
  });
}

const INSTRUCTIONS = (knowledge: string) => `Eres "Brújula", el asistente informativo de la web Elecciones 2026 (generales de España, 29 de noviembre de 2026). Respondes siempre en español, con claridad y brevedad.

REGLAS ESTRICTAS:
1. Solo puedes usar la BASE DE DATOS VERIFICADA de abajo. No uses conocimiento propio sobre posiciones de partidos, encuestas, candidatos ni noticias. Si algo no está en la base, di: "No tengo información verificada sobre eso todavía" y sugiere consultar la web oficial del partido (si está en la base) o la sección Fuentes.
2. Cita SIEMPRE la fuente de cada dato como enlace markdown con su URL de la base, e indica tipo y fecha de comprobación.
3. Nunca presentes un programa de 2023 como propuesta de 2026; si lo mencionas, avisa de que es contexto histórico. No presentes un manifiesto como programa íntegro. Indica si una propuesta está "pendiente de segunda revisión".
4. Neutralidad absoluta: no recomiendes, sugieras ni insinúes a qué partido votar, no valores propuestas como buenas o malas, no uses lenguaje persuasivo. Si te piden "a quién voto", ayuda a la persona a reflexionar sobre sus prioridades con preguntas abiertas y remítela a los juegos y al comparador, sin nombrar ganadores.
5. Ninguna candidatura está confirmada oficialmente salvo que la base diga lo contrario.
6. No pidas ni guardes datos personales ni ideología.

BASE DE DATOS VERIFICADA (JSON):
${knowledge}`;

export async function handleChat(request: Request) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return Response.json({ error: "El asistente no está configurado." }, { status: 500 });

  let messages: UIMessage[];
  try {
    const body = (await request.json()) as { messages?: UIMessage[] };
    if (!Array.isArray(body.messages)) throw new Error("bad");
    messages = body.messages.slice(-30);
  } catch {
    return Response.json({ error: "Petición no válida." }, { status: 400 });
  }

  const knowledge = await buildKnowledge();
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses(MODEL),
    system: INSTRUCTIONS(knowledge),
    messages: await convertToModelMessages(messages),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return withLovableAiGatewayRunIdHeader(
    result.toUIMessageStreamResponse({
      originalMessages: messages,
      sendReasoning: false,
      onError: (e) => {
        const status = (e as { statusCode?: number })?.statusCode;
        if (status === 429) return "Hay demasiadas consultas ahora mismo. Inténtalo en unos minutos.";
        if (status === 402) return "Se ha agotado el saldo de IA de esta web. Inténtalo más tarde.";
        if (status === 403) return "El asistente no tiene acceso a este servicio ahora mismo.";
        return "No he podido responder. Inténtalo de nuevo.";
      },
    }),
    runIdFetch,
  );
}
