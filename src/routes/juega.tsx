import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Minus, Plus, RotateCcw } from "lucide-react";
import { Card, Notice, PageIntro, RouteError, SourceLink, Tag } from "@/components/site";
import { Switch } from "@/components/ui/switch";
import { claimsQuery, partiesQuery, topicsQuery } from "@/lib/data";
import { computeAffinity, type Answer } from "@/lib/affinity";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/juega")({
  head: () => ({
    meta: [
      { title: "Juegos de afinidad — Elecciones 2026" },
      { name: "description", content: "Ordena tus prioridades, reparte fichas y elige cartas de propuestas reales para descubrir tu afinidad." },
      { property: "og:title", content: "Juegos de afinidad — Elecciones 2026" },
      { property: "og:description", content: "Descubre qué te importa. Tus respuestas se quedan en tu dispositivo." },
    ],
  }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(topicsQuery),
    context.queryClient.ensureQueryData(partiesQuery),
    context.queryClient.ensureQueryData(claimsQuery),
  ]),
  component: Juega,
  errorComponent: RouteError,
});

const KEY = "elecciones2026.juegos.v1";
type Saved = { order: string[]; chips: Record<string, number>; answers: Record<string, Answer>; includePending: boolean };
const GAMES = [
  { id: "ordena", n: 1, label: "Ordena tus prioridades" },
  { id: "reparte", n: 2, label: "Reparte 100 fichas" },
  { id: "cartas", n: 3, label: "Elige la carta" },
  { id: "resultado", n: 4, label: "Tu resultado" },
] as const;

function Juega() {
  const { data: topics } = useSuspenseQuery(topicsQuery);
  const { data: parties } = useSuspenseQuery(partiesQuery);
  const { data: claims } = useSuspenseQuery(claimsQuery);
  const [game, setGame] = useState<(typeof GAMES)[number]["id"]>("ordena");
  const [s, setS] = useState<Saved>({ order: topics.map((t) => t.id), chips: {}, answers: {}, includePending: false });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw) as Saved;
        const known = v.order.filter((id) => topics.some((t) => t.id === id));
        setS({ ...v, order: [...known, ...topics.map((t) => t.id).filter((id) => !known.includes(id))] });
      }
    } catch { /* ignore corrupt storage */ }
    setLoaded(true);
  }, [topics]);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(s)); }, [s, loaded]);

  const label = (id: string) => topics.find((t) => t.id === id)?.label ?? id;
  const usedChips = Object.values(s.chips).reduce((a, b) => a + b, 0);

  // Weights: chips if distributed, otherwise rank order.
  const weights = useMemo(() => {
    if (usedChips > 0) return s.chips;
    const n = s.order.length;
    return Object.fromEntries(s.order.map((id, i) => [id, n - i]));
  }, [s.chips, s.order, usedChips]);

  const playable = claims.filter((c) => s.includePending || c.review_status === "verified_by_human");
  const deck = useMemo(() => [...playable].sort((a, b) => (a.id < b.id ? -1 : 1)), [playable]);
  const nextCard = deck.find((c) => !s.answers[c.id]);
  const results = computeAffinity(claims, s.answers, weights, { includePending: s.includePending });

  const move = (i: number, d: number) => setS((p) => {
    const o = [...p.order]; const j = i + d; if (j < 0 || j >= o.length) return p;
    const tmp = o[i]!; o[i] = o[j]!; o[j] = tmp; return { ...p, order: o };
  });
  const chip = (id: string, d: number) => setS((p) => {
    const cur = p.chips[id] ?? 0; const next = Math.max(0, cur + d);
    if (d > 0 && usedChips + d > 100) return p;
    return { ...p, chips: { ...p.chips, [id]: next } };
  });
  const answer = (id: string, a: Answer) => setS((p) => ({ ...p, answers: { ...p.answers, [id]: a } }));

  return (
    <>
      <PageIntro eyebrow="Juega" title="Descubre qué te importa.">
        Tres juegos cortos. Tus respuestas se guardan solo en este dispositivo y puedes borrarlas cuando quieras.
      </PageIntro>
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex flex-wrap gap-2" role="tablist">
          {GAMES.map((g) => (
            <button key={g.id} role="tab" aria-selected={game === g.id} onClick={() => setGame(g.id)}
              className={cn("rounded-full border px-4 py-2 text-sm font-medium", game === g.id ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card")}>
              <span className="mr-1.5 opacity-60">{g.n}</span>{g.label}
            </button>
          ))}
        </div>

        {game === "ordena" && (
          <Card className="mt-6">
            <h2 className="text-2xl font-semibold">¿Qué asuntos tienes más presentes?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sube y baja los temas hasta que el primero sea el que más te importa.</p>
            <ol className="mt-4 space-y-2">
              {s.order.map((id, i) => (
                <li key={id} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-2.5">
                  <span className="w-6 font-serif text-lg font-semibold text-accent">{i + 1}</span>
                  <span className="flex-1">{label(id)}</span>
                  <button aria-label={`Subir ${label(id)}`} onClick={() => move(i, -1)} disabled={i === 0} className="rounded-full p-1.5 hover:bg-secondary disabled:opacity-30"><ArrowUp className="size-4" /></button>
                  <button aria-label={`Bajar ${label(id)}`} onClick={() => move(i, 1)} disabled={i === s.order.length - 1} className="rounded-full p-1.5 hover:bg-secondary disabled:opacity-30"><ArrowDown className="size-4" /></button>
                </li>
              ))}
            </ol>
            <button onClick={() => setGame("reparte")} className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Siguiente juego</button>
          </Card>
        )}

        {game === "reparte" && (
          <Card className="mt-6">
            <h2 className="text-2xl font-semibold">Tienes 100 fichas. ¿Dónde las pones?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Imagina que repartes el esfuerzo del próximo Gobierno. Quedan <strong className="text-foreground">{100 - usedChips}</strong> fichas.</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent transition-all" style={{ width: `${usedChips}%` }} /></div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {s.order.map((id) => (
                <li key={id} className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2">
                  <span className="flex-1 text-sm">{label(id)}</span>
                  <button aria-label={`Quitar 5 fichas de ${label(id)}`} onClick={() => chip(id, -5)} className="rounded-full p-1.5 hover:bg-secondary"><Minus className="size-4" /></button>
                  <span className="w-8 text-center font-semibold tabular-nums">{s.chips[id] ?? 0}</span>
                  <button aria-label={`Añadir 5 fichas a ${label(id)}`} onClick={() => chip(id, 5)} disabled={usedChips >= 100} className="rounded-full p-1.5 hover:bg-secondary disabled:opacity-30"><Plus className="size-4" /></button>
                </li>
              ))}
            </ul>
            <button onClick={() => setGame("cartas")} className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Siguiente juego</button>
          </Card>
        )}

        {game === "cartas" && (
          <div className="mt-6 space-y-4">
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={s.includePending} onCheckedChange={(v) => setS((p) => ({ ...p, includePending: v }))} />
              Incluir propuestas pendientes de segunda revisión
            </label>
            {deck.length === 0 ? (
              <Notice>Aún no hay propuestas 2026 verificadas por revisión humana para jugar. Puedes activar las pendientes de segunda revisión (proceden de webs oficiales, pero falta una segunda comprobación) o volver cuando se publiquen los programas.</Notice>
            ) : nextCard ? (
              <Card className="relative overflow-hidden border-2 border-lilac bg-secondary p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-accent">{label(nextCard.topic_id)} · carta {Object.keys(s.answers).filter((k) => deck.some((d) => d.id === k)).length + 1} de {deck.length}</p>
                <h2 className="mt-3 text-3xl font-semibold">«{nextCard.title}»</h2>
                <p className="mt-2 text-muted-foreground">{nextCard.claim_text}</p>
                <p className="mt-2 text-xs text-muted-foreground">El partido se revela al final para que valores la idea, no las siglas.</p>
                <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {([["agree", "De acuerdo"], ["partial", "En parte"], ["disagree", "En desacuerdo"], ["skip", "Paso"]] as const).map(([a, l]) => (
                    <button key={a} onClick={() => answer(nextCard.id, a)} className={cn("rounded-2xl px-4 py-3 font-semibold", a === "skip" ? "border border-input bg-card" : "bg-primary text-primary-foreground")}>{l}</button>
                  ))}
                </div>
              </Card>
            ) : (
              <Card>
                <h2 className="text-2xl font-semibold">¡Has jugado todas las cartas!</h2>
                <ul className="mt-4 space-y-2 text-sm">
                  {deck.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">«{c.title}»</span> → <Tag tone="partial">{parties.find((p) => p.id === c.party_id)?.short_name}</Tag>
                      <span className="text-muted-foreground">tu respuesta: {({ agree: "de acuerdo", partial: "en parte", disagree: "en desacuerdo", skip: "paso" } as const)[s.answers[c.id] ?? "skip"]}</span>
                      {c.source_url && <SourceLink href={c.source_url}>fuente</SourceLink>}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setGame("resultado")} className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Ver resultado</button>
              </Card>
            )}
          </div>
        )}

        {game === "resultado" && (
          <div className="mt-6 space-y-4">
            <Notice>Esto es una orientación informativa basada solo en propuestas con fuente. No es una recomendación de voto. Los partidos sin propuestas documentadas no aparecen: su ausencia no les suma ni les resta.</Notice>
            <Card>
              <h2 className="text-2xl font-semibold">Así se ordenan tus prioridades</h2>
              <ol className="mt-3 flex flex-wrap gap-2">
                {Object.entries(weights).sort((a, b) => b[1] - a[1]).filter(([, w]) => w > 0).slice(0, 5).map(([id], i) => <li key={id}><Tag tone={i === 0 ? "ok" : "partial"}>{i + 1}. {label(id)}</Tag></li>)}
              </ol>
            </Card>
            <Card>
              <h2 className="text-2xl font-semibold">Afinidad con propuestas documentadas</h2>
              {results.length === 0 ? <p className="mt-2 text-muted-foreground">Juega a «Elige la carta» para calcularla.</p> : (
                <ul className="mt-4 space-y-4">
                  {results.sort((a, b) => (b.sufficient ? b.score ?? 0 : -1) - (a.sufficient ? a.score ?? 0 : -1)).map((r) => (
                    <li key={r.partyId}>
                      <div className="flex justify-between gap-4"><span className="font-semibold">{parties.find((p) => p.id === r.partyId)?.name}</span>
                        <span className="tabular-nums">{r.sufficient && r.score !== null ? `${Math.round(r.score * 100)}%` : "Datos insuficientes"}</span></div>
                      {r.sufficient && r.score !== null && <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-lilac" style={{ width: `${r.score * 100}%` }} /></div>}
                      <p className="mt-1 text-xs text-muted-foreground">Cobertura: {r.comparableTopics} de {r.answeredTopics} temas valorados ({Math.round(r.coverage * 100)}%){s.includePending && " · incluye propuestas pendientes de segunda revisión"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <button onClick={() => { localStorage.removeItem(KEY); setS({ order: topics.map((t) => t.id), chips: {}, answers: {}, includePending: false }); setGame("ordena"); }}
              className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-5 py-2.5 text-sm font-medium">
              <RotateCcw className="size-4" /> Borrar mis respuestas
            </button>
          </div>
        )}
      </div>
    </>
  );
}
