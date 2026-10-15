import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Save, History, ArrowRight } from "lucide-react";
import { GameMascot } from "@/components/game-art";
import { GameHistoryList } from "@/components/game-history-list";
import { GAME_KEY, localGameEnvelope, hasLocalGameConsent, setLocalGameConsent, appendGameHistory, readGameEnvelope, type GameEntry, type GameState } from "@/lib/game-history";
import { PriorityNotes, BudgetNotes, ProposalNote } from "@/components/game-notes";
import { BallGame } from "@/components/ball-game";
import { Button } from "@/components/ui/button";
import { Card, Notice, PageIntro, RouteError, SourceLink, Tag } from "@/components/site";
import { Switch } from "@/components/ui/switch";
import { claimsQuery, partiesQuery, topicsQuery } from "@/lib/data";
import { computeAffinity, type Answer } from "@/lib/affinity";
import { cn } from "@/lib/utils";
import { saveUserField, useSession, useUserData } from "@/lib/session";


export const Route = createFileRoute("/juega")({
  head: () => ({
    meta: [
      { title: "Juegos de afinidad — Elecciones 2026" },
      { name: "description", content: "Ordena tus prioridades, reparte fichas y elige cartas de propuestas reales para descubrir tu afinidad." },
      { property: "og:title", content: "Juegos de afinidad — Elecciones 2026" },
      { property: "og:description", content: "Descubre qué te importa. Tus respuestas se quedan en tu dispositivo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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

const KEY = GAME_KEY;
type Saved = GameState;
const GAMES = [
  { id: "ordena", n: 1, label: "Ordena tus prioridades" },
  { id: "reparte", n: 2, label: "Reparte 100 fichas" },
  { id: "cartas", n: 3, label: "Pelota y cartas" },
  { id: "resultado", n: 4, label: "Tu resultado" },
] as const;

function Juega() {
  const { data: topics } = useSuspenseQuery(topicsQuery);
  const { data: parties } = useSuspenseQuery(partiesQuery);
  const { data: claims } = useSuspenseQuery(claimsQuery);
  const [game, setGame] = useState<(typeof GAMES)[number]["id"]>("ordena");
  const [s, setS] = useState<Saved>({ order: topics.map((t) => t.id), chips: {}, answers: {}, includePending: false });
  const [loaded, setLoaded] = useState(false);
  const [localConsent, setLocalConsent] = useState(false);
  const [history, setHistory] = useState<GameEntry[]>([]);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    try {
      const consent = hasLocalGameConsent();
      setLocalConsent(consent);
      const envelope = consent ? localGameEnvelope() : null;
      if (envelope) {
        const v = envelope.current;
        const known = v.order.filter((id) => topics.some((t) => t.id === id));
        setS({ ...v, order: [...known, ...topics.map((t) => t.id).filter((id) => !known.includes(id))] });
        setHistory(envelope.history);
      }
    } catch { /* ignore corrupt storage */ }
    setLoaded(true);
  }, [topics]);
  const { session } = useSession();
  const { data: ud } = useUserData();
  const syncOn = !!session && !!ud?.sync_enabled;
  const pulled = useRef<string | null>(null);
  useEffect(() => {
    if (!loaded || !syncOn || !session || pulled.current === session.user.id) return;
    pulled.current = session.user.id;
    const envelope = readGameEnvelope(ud?.game);
    if (envelope) {
      const known = envelope.current.order.filter((id) => topics.some((t) => t.id === id));
      setS({ ...envelope.current, order: [...known, ...topics.map((t) => t.id).filter((id) => !known.includes(id))] });
      setHistory((local) => [...new Map([...local, ...envelope.history].map((entry) => [entry.id, entry])).values()].sort((a, b) => b.completedAt.localeCompare(a.completedAt)));
    }
  }, [loaded, syncOn, ud, session, topics]);
  useEffect(() => {
    if (!loaded) return;
    const envelope = { version: 2, current: s, history };
    if (localConsent) {
      try { localStorage.setItem(KEY, JSON.stringify(envelope)); } catch { setSavedMessage("El navegador no permite guardar más partidas. Puedes borrar el historial o guardarlo en tu cuenta."); }
    }
    if (!syncOn || !session) return;
    const t = setTimeout(() => { void saveUserField(session.user.id, "game", envelope).catch(() => setSavedMessage("No se pudo sincronizar la partida. Inténtalo de nuevo.")); }, 1000);
    return () => clearTimeout(t);
  }, [s, history, localConsent, loaded, syncOn, session]);

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

  const answer = (id: string, a: Answer) => setS((p) => ({ ...p, answers: { ...p.answers, [id]: a } }));
  const saveResult = async () => {
    if (!localConsent && !syncOn) { setSavedMessage("Activa el guardado con tu permiso para conservar esta partida."); return; }
    const next = appendGameHistory(history, s, new Date().toISOString(), crypto.randomUUID());
    if (syncOn && session) {
      try { await saveUserField(session.user.id, "game", { version: 2, current: s, history: next }); }
      catch { setSavedMessage("No se pudo guardar en tu cuenta. Inténtalo de nuevo."); return; }
    }
    setHistory(next);
    setSavedMessage(syncOn ? "Partida guardada en tu historial y en tu cuenta." : "Partida guardada en tu historial de este dispositivo.");
  };

  return (
    <>
      <PageIntro eyebrow="Juega" title="Descubre qué te importa.">
        Tus prioridades, unas fichas y tus propias ideas. Sin recomendaciones de voto.
      </PageIntro>
      <div className="mx-auto max-w-6xl px-4 pb-6">
        <Link to="/politico" className="flex items-center justify-between gap-4 rounded-3xl bg-highlight p-5 text-highlight-foreground shadow-soft transition-transform hover:-translate-y-0.5">
          <span><span className="block font-serif text-2xl font-semibold">🗳️ Conviértete en político/a por un día</span><span className="text-sm">Crea tu programa con una asesora y descubre a qué partido se parece.</span></span>
          <ArrowRight aria-hidden />
        </Link>
      </div>
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex flex-wrap gap-2" role="tablist">
          {GAMES.map((g) => (
            <Button variant="ghost" key={g.id} role="tab" aria-selected={game === g.id} onClick={() => { setGame(g.id); setSavedMessage(""); }}
              className={cn("rounded-full border px-4 py-2 text-sm font-medium", game === g.id ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-foreground")}>
              <span className="mr-1.5 opacity-60">{g.n}</span>{g.label}
            </Button>
          ))}
        </div>

        {game === "ordena" && (
          <Card className="mt-6">
            <div className="flex items-center gap-4"><GameMascot /><h2 className="text-2xl font-semibold">¿Qué asuntos tienes más presentes?</h2></div>
            <PriorityNotes order={s.order} label={label} onChange={(order) => setS((p) => ({ ...p, order }))} />
            <Button onClick={() => setGame("reparte")} className="mt-6 rounded-full" size="lg">Siguiente juego</Button>
          </Card>
        )}

        {game === "reparte" && (
          <Card className="mt-6">
            <div className="flex items-center gap-4"><GameMascot kind={1} /><h2 className="text-2xl font-semibold">Tienes 100 fichas. ¿Dónde las pones?</h2></div>
            <p className="mt-1 text-sm text-muted-foreground">Imagina que repartes el esfuerzo del próximo Gobierno. Quedan <strong className="text-foreground">{100 - usedChips}</strong> fichas.</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent transition-all" style={{ width: `${usedChips}%` }} /></div>
            <BudgetNotes order={s.order} chips={s.chips} label={label} onChange={(chips) => setS((p) => ({ ...p, chips }))} />
            <Button onClick={() => setGame("cartas")} className="mt-6 rounded-full" size="lg">Siguiente juego</Button>
          </Card>
        )}

        {game === "cartas" && (
          <div className="mt-6 space-y-4">
            <Card>
              <div className="flex items-center gap-4"><GameMascot kind={2} /><div><h2 className="text-2xl font-semibold">¡Tiro a canasta!</h2><p className="text-sm text-muted-foreground">Lee la propuesta y lanza la pelota a la canasta que elijas. Cada tiro cuenta para tu afinidad.</p></div></div>
            </Card>
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={s.includePending} onCheckedChange={(v) => setS((p) => ({ ...p, includePending: v }))} />
              Incluir propuestas pendientes de segunda revisión
            </label>
            {deck.length === 0 ? (
              <Notice>Aún no hay propuestas 2026 verificadas por revisión humana para jugar. Puedes activar las pendientes de segunda revisión (proceden de webs oficiales, pero falta una segunda comprobación) o volver cuando se publiquen los programas.</Notice>
            ) : nextCard ? (
              <BasketGame key={nextCard.id} onAnswer={(a) => answer(nextCard.id, a)}>
                <p className="text-xs font-semibold uppercase tracking-widest text-accent">{label(nextCard.topic_id)} · carta {Object.keys(s.answers).filter((k) => deck.some((d) => d.id === k)).length + 1} de {deck.length}</p>
                <h2 className="mt-3 text-3xl font-semibold">«{nextCard.title}»</h2>
                <p className="mt-2 text-muted-foreground">{nextCard.claim_text}</p>
                <div className="mt-4 border-t border-border pt-3">{nextCard.source_url ? <SourceLink href={nextCard.source_url}>Fuente original · {nextCard.page_or_section ?? "Documento del partido"}</SourceLink> : <p className="text-sm text-muted-foreground">Fuente directa no disponible</p>}<p className="mt-1 text-xs text-muted-foreground">{nextCard.review_status === "verified_by_human" ? "Revisión humana verificada" : "Pendiente de segunda revisión"}</p></div>
                <p className="mt-2 text-xs text-muted-foreground">Las siglas se muestran al final. La fuente permite comprobar la autoría antes.</p>
              </ProposalNote>
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
                <Button onClick={() => setGame("resultado")} className="mt-6 rounded-full">Ver resultado</Button>
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
            <div className="flex flex-wrap gap-3"><Button onClick={saveResult} className="rounded-full"><Save /> Guardar esta partida</Button><Button variant="outline" onClick={() => { setS({ order: topics.map((t) => t.id), chips: {}, answers: {}, includePending: false }); setGame("ordena"); setSavedMessage(""); }} className="rounded-full"><RotateCcw /> Nueva partida</Button></div>
            <Button variant="outline" onClick={() => { setLocalGameConsent(false); setLocalConsent(false); setHistory([]); setS({ order: topics.map((t) => t.id), chips: {}, answers: {}, includePending: false }); if (syncOn && session) void saveUserField(session.user.id, "game", null).catch(() => setSavedMessage("No se pudo borrar en tu cuenta. Inténtalo de nuevo.")); setGame("ordena"); }}
              className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-5 py-2.5 text-sm font-medium">
              <RotateCcw className="size-4" /> Borrar mis respuestas e historial
            </Button>
          </div>
        )}
        <section className="mt-8 border-t border-border py-6">
          <h2 className="text-2xl font-semibold">Tu partida, bajo tu control</h2>
          <p className="mt-2 text-sm text-muted-foreground">Tus respuestas pueden revelar preferencias políticas. Sin permiso, se mantienen solo mientras esta página está abierta. La cookie guarda únicamente tu permiso; las partidas se conservan en este navegador, no en cookies.</p>
          <label className="mt-4 flex items-center gap-3 text-sm"><Switch checked={localConsent} onCheckedChange={(on) => { setLocalGameConsent(on); setLocalConsent(on); if (!on && !syncOn) setHistory([]); }} /> Doy mi permiso para guardar mis juegos en este dispositivo</label>
          {!session ? <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-highlight p-5"><div><h3 className="text-xl font-semibold">Tu historia empieza aquí</h3><p className="mt-1 text-sm">Una cuenta gratuita, tus juegos y tus elecciones. Tú decides qué guardar.</p></div><Button asChild className="rounded-full"><Link to="/auth">Registrarme gratis <ArrowRight /></Link></Button></div> : !syncOn ? <Button asChild variant="outline" className="mt-5 rounded-full"><Link to="/cuenta">Activar mi historial privado en la cuenta <ArrowRight /></Link></Button> : <p className="mt-4 text-sm text-muted-foreground">Guardado en tu cuenta activado con tu permiso. <Link to="/cuenta" className="underline">Ver mi cuenta</Link></p>}
          <h3 className="mt-7 flex items-center gap-2 text-xl font-semibold"><History className="size-5" /> Mi historial de juegos</h3>
          <GameHistoryList history={history} />
          {savedMessage && <p role="status" className="mt-3 font-medium text-accent">{savedMessage}</p>}
        </section>
      </div>
    </>
  );
}
