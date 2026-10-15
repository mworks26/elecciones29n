import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, useState } from "react";
import { ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { ClientOnly } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, Notice, PageIntro, RouteError, SourceLink } from "@/components/site";
import { GameMascot, TopicDrawing } from "@/components/game-art";
import { claimsQuery, partiesQuery, topicsQuery } from "@/lib/data";
import { computeAffinity, type Answer } from "@/lib/affinity";
import { cn } from "@/lib/utils";

const UrnaAnimation = lazy(() => import("@/components/urna-animation"));

export const Route = createFileRoute("/politico")({
  head: () => ({
    meta: [
      { title: "Conviértete en político/a por un día — Elecciones 2026" },
      { name: "description", content: "Crea tu propio programa electoral con un asistente, sin escribir casi nada, y descubre a qué partido real se parece." },
      { property: "og:title", content: "Conviértete en político/a por un día" },
      { property: "og:description", content: "Un juego para toda la familia: monta tu programa y mira con qué partido coincide." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(topicsQuery),
    context.queryClient.ensureQueryData(partiesQuery),
    context.queryClient.ensureQueryData(claimsQuery),
  ]),
  component: Politico,
  errorComponent: RouteError,
});

const SLOGANS = ["¡Juntos llegamos más lejos!", "Ideas claras, futuro mejor", "Primero, las personas", "Pensar en grande, empezar en pequeño", "Tu barrio, tu voz"];
const CHOICES: { a: Answer; label: string; emoji: string }[] = [
  { a: "agree", label: "Lo meto en mi programa", emoji: "✅" },
  { a: "partial", label: "Solo una parte", emoji: "🤏" },
  { a: "disagree", label: "No lo meto", emoji: "❌" },
  { a: "skip", label: "Paso", emoji: "🤷" },
];
const TIPS = [
  "¡Hola! Soy tu asesora de campaña. Elige hasta 3 temas que te importen mucho.",
  "Ahora te enseño propuestas reales, sin decir de quién son. ¿Las metes en tu programa?",
  "¡Casi está! Ponle nombre a tu partido y elige un lema.",
  "¡Tu programa está listo! Mira con qué partidos reales coincide.",
];

function Politico() {
  const { data: topics } = useSuspenseQuery(topicsQuery);
  const { data: parties } = useSuspenseQuery(partiesQuery);
  const { data: claims } = useSuspenseQuery(claimsQuery);
  const [step, setStep] = useState(0);
  const [includePending, setIncludePending] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [idx, setIdx] = useState(0);
  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState(SLOGANS[0]!);

  const usable = useMemo(() => claims.filter((c) => c.review_status === "verified_by_human" || (includePending && c.review_status === "needs_second_review")), [claims, includePending]);
  const verifiedCount = claims.filter((c) => c.review_status === "verified_by_human").length;
  const pendingClaims = claims.filter((c) => c.review_status === "needs_second_review");
  const pendingCount = pendingClaims.length;
  const pendingParties = [...new Set(pendingClaims.map((c) => parties.find((p) => p.id === c.party_id)?.short_name ?? parties.find((p) => p.id === c.party_id)?.name).filter(Boolean))].sort().join(", ");
  const topicsWithClaims = topics.filter((t) => usable.some((c) => c.topic_id === t.id));
  const deck = useMemo(() => {
    const chosen = usable.filter((c) => picked.includes(c.topic_id));
    const rest = usable.filter((c) => !picked.includes(c.topic_id));
    return [...chosen, ...rest].slice(0, 8);
  }, [usable, picked]);
  const card = deck[idx];
  const weights = Object.fromEntries(picked.map((t) => [t, 2]));
  const results = computeAffinity(usable, answers, weights, { includePending })
    .filter((r) => r.sufficient && r.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || (parties.find((p) => p.id === a.partyId)?.name ?? "").localeCompare(parties.find((p) => p.id === b.partyId)?.name ?? ""));
  const included = deck.filter((c) => answers[c.id] === "agree" || answers[c.id] === "partial");
  const topicLabel = (id: string) => topics.find((t) => t.id === id)?.label ?? id;

  const reset = () => { setStep(0); setPicked([]); setAnswers({}); setIdx(0); setName(""); setSlogan(SLOGANS[0]!); };
  const answer = (a: Answer) => {
    if (!card) return;
    setAnswers((s) => ({ ...s, [card.id]: a }));
    if (idx + 1 >= deck.length) setStep(2); else setIdx(idx + 1);
  };

  return (
    <div>
      <PageIntro eyebrow="Nuevo juego" title="Conviértete en político/a por un día">
        Monta tu propio programa electoral con ayuda de una asesora, casi sin escribir. ¡Perfecto para jugar en familia!
      </PageIntro>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <Card className="flex flex-col items-center text-center">
            <ClientOnly fallback={<div className="aspect-square w-full rounded-3xl bg-background" />}>
              <Suspense fallback={<div className="aspect-square w-full" />}><UrnaAnimation className="w-full rounded-3xl bg-background" /></Suspense>
            </ClientOnly>
            <div className="mt-2 flex items-start gap-2 rounded-2xl bg-secondary p-3 text-left text-sm text-secondary-foreground" role="status">
              <GameMascot kind={1} className="size-12 shrink-0" />
              <p>{TIPS[step]}</p>
            </div>
          </Card>
          <ol className="flex gap-2 text-xs" aria-label="Pasos">
            {["Temas", "Propuestas", "Tu partido", "Resultado"].map((l, i) => (
              <li key={l} className={cn("flex-1 rounded-full px-2 py-1 text-center", i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{l}</li>
            ))}
          </ol>
        </aside>

        <section>
          {step === 0 && (
            <Card>
              <h2 className="text-2xl font-semibold">¿Qué temas te importan más?</h2>
              <p className="mt-1 text-muted-foreground">Toca hasta 3 dibujos. Esos temas contarán el doble. Si no eliges ninguno, también puedes jugar.</p>
              {!includePending && verifiedCount === 0 ? (
                <div className="mt-4 rounded-3xl border-2 border-dashed border-accent bg-highlight p-5 text-highlight-foreground">
                  <p className="font-semibold">Aviso antes de jugar</p>
                  <p className="mt-1 text-sm">Todavía no hay propuestas revisadas dos veces por el equipo editorial. Sí hay {pendingCount} propuestas sacadas de documentos oficiales{pendingParties ? ` (${pendingParties})` : ""} que están esperando esa segunda revisión.</p>
                  <p className="mt-1 text-sm">Puedes jugar con ellas: verás la fuente debajo de cada una y el resultado será solo orientativo.</p>
                  <Button className="mt-3 rounded-full" onClick={() => setIncludePending(true)}>Sí, jugar con estas propuestas <ArrowRight /></Button>
                </div>
              ) : includePending && verifiedCount === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Jugando con propuestas pendientes de segunda revisión. <button className="underline" onClick={() => { setIncludePending(false); setPicked([]); }}>Cancelar</button></p>
              ) : (
                <label className="mt-4 flex items-center gap-2 text-sm">
                  <Switch checked={includePending} onCheckedChange={(v) => { setIncludePending(v); setPicked([]); }} />
                  Añadir también propuestas pendientes de segunda revisión
                </label>
              )}
              {topicsWithClaims.length === 0 ? (
                null
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {topicsWithClaims.map((t) => {
                    const on = picked.includes(t.id);
                    return (
                      <button key={t.id} type="button" aria-pressed={on}
                        onClick={() => setPicked((p) => on ? p.filter((x) => x !== t.id) : p.length < 3 ? [...p, t.id] : p)}
                        className={cn("flex flex-col items-center gap-2 rounded-3xl border-2 p-4 text-sm font-medium transition-transform hover:-translate-y-0.5", on ? "border-primary bg-highlight text-highlight-foreground" : "border-border bg-card")}>
                        <TopicDrawing label={t.label} />{t.label}
                      </button>
                    );
                  })}
                </div>
              )}
              <Button className="mt-6 rounded-full" size="lg" disabled={topicsWithClaims.length === 0} onClick={() => { setIdx(0); setStep(1); }}>
                Empezar mi programa <ArrowRight />
              </Button>
            </Card>
          )}

          {step === 1 && card && (
            <Card>
              <p className="text-sm text-muted-foreground">Propuesta {idx + 1} de {deck.length} · {topicLabel(card.topic_id)}</p>
              <p className="mt-1 text-sm">Lee la idea y pulsa un botón: ¿la meterías en tu programa?</p>
              <div className="mt-3 rounded-3xl border-2 border-dashed border-accent bg-highlight p-5 text-highlight-foreground">
                <h2 className="font-serif text-2xl font-semibold">{card.title}</h2>
                <p className="mt-2">{card.claim_text}</p>
              </div>
              {card.source_url && <div className="mt-2"><SourceLink href={card.source_url} meta={card.review_status === "needs_second_review" ? "pendiente de segunda revisión" : undefined}>Fuente oficial (el partido se revela al final)</SourceLink></div>}
              <div className="mt-5 grid grid-cols-2 gap-3">
                {CHOICES.map((c) => (
                  <button key={c.a} type="button" onClick={() => answer(c.a)} className="rounded-2xl border border-input bg-card p-4 text-left font-medium hover:bg-secondary">
                    <span className="mr-2 text-2xl" aria-hidden>{c.emoji}</span>{c.label}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <h2 className="text-2xl font-semibold">¿Cómo se llama tu partido?</h2>
              <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder="Por ejemplo: Partido de las Ideas"
                className="mt-3 w-full rounded-2xl border border-input bg-background px-4 py-3 text-lg" aria-label="Nombre de tu partido" />
              <p className="mt-5 font-medium">Elige un lema</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SLOGANS.map((s) => (
                  <button key={s} type="button" aria-pressed={slogan === s} onClick={() => setSlogan(s)}
                    className={cn("rounded-full border px-3 py-1.5 text-sm", slogan === s ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card")}>{s}</button>
                ))}
              </div>
              <Button className="mt-6 rounded-full" size="lg" disabled={!name.trim()} onClick={() => setStep(3)}><Sparkles /> Presentar mi programa</Button>
            </Card>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <Card className="text-center">
                <p className="text-sm uppercase tracking-widest text-accent">Programa electoral</p>
                <h2 className="mt-1 font-serif text-4xl font-semibold">{name}</h2>
                <p className="mt-1 text-lg italic text-muted-foreground">«{slogan}»</p>
                {included.length ? (
                  <ul className="mx-auto mt-5 max-w-xl space-y-2 text-left">
                    {included.map((c) => <li key={c.id} className="rounded-2xl bg-secondary px-4 py-2 text-secondary-foreground">{answers[c.id] === "partial" ? "🤏" : "✅"} {c.title}</li>)}
                  </ul>
                ) : <p className="mt-4 text-muted-foreground">Tu programa no ha incluido ninguna propuesta todavía.</p>}
              </Card>
              <Card>
                <h3 className="text-xl font-semibold">¿A qué partidos reales se parece?</h3>
                <p className="mt-1 text-sm text-muted-foreground">Solo con las propuestas de este juego. No es una recomendación de voto.</p>
                {results.length === 0 ? (
                  <div className="mt-3"><Notice>Datos insuficientes para comparar. Prueba a responder más propuestas.</Notice></div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {results.map((r) => {
                      const p = parties.find((x) => x.id === r.partyId);
                      const pct = Math.round((r.score ?? 0) * 100);
                      return (
                        <li key={r.partyId}>
                          <div className="flex justify-between text-sm font-medium"><span>{p?.name ?? r.partyId}</span><span>{pct}%</span></div>
                          <div className="mt-1 h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                          <p className="mt-1 text-xs text-muted-foreground">{r.comparableTopics} de {r.answeredTopics} temas comparables</p>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {new Set(usable.map((c) => c.party_id)).size === 1 && <div className="mt-3"><Notice>Por ahora solo un partido tiene propuestas cargadas en el juego, así que siempre aparecerá el mismo. Saldrán más cuando se verifiquen nuevas propuestas.</Notice></div>}
                <div className="mt-4 space-y-1">
                  {deck.filter((c) => answers[c.id] && c.source_url).map((c) => (
                    <div key={c.id}><SourceLink href={c.source_url!} meta={parties.find((p) => p.id === c.party_id)?.name}>{c.title}</SourceLink></div>
                  ))}
                </div>
              </Card>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-full" onClick={reset}><RotateCcw /> Jugar otra vez</Button>
                <Button asChild className="rounded-full"><Link to="/juega">Más juegos <ArrowRight /></Link></Button>
              </div>
              <p className="text-xs text-muted-foreground">El nombre de tu partido y tus respuestas no se guardan en ningún sitio.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
