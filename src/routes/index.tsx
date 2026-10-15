import { useEffect, useState } from "react";
import coverPeople from "@/assets/cover-people.svg";
import { Button } from "@/components/ui/button";
import { GameMascot } from "@/components/game-art";
import { daysUntilElection, madridDate } from "@/lib/countdown";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Gamepad2, Search, Scale, ShieldCheck } from "lucide-react";
import { Card, Notice, RouteError, SourceLink } from "@/components/site";
import { ELECTION } from "@/lib/election";
import { formatDate } from "@/lib/labels";
import { partiesQuery, documentsQuery } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elecciones 2026 — Tu voto empieza con una pregunta" },
      { name: "description", content: "Partidos, programas y propuestas de las generales del 29-N con fuentes oficiales, juegos de afinidad y un asistente neutral." },
      { property: "og:title", content: "Elecciones 2026 — Tu voto empieza con una pregunta" },
      { property: "og:description", content: "Explora y compara propuestas con fuentes verificables. Sin inventar nada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(partiesQuery), context.queryClient.ensureQueryData(documentsQuery)]),
  component: Index,
  errorComponent: RouteError,
});

function Index() {
  const { data: parties } = useSuspenseQuery(partiesQuery);
  const { data: docs } = useSuspenseQuery(documentsQuery);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
  const checked = [...parties.map((p) => p.last_checked), ...docs.map((d) => d.checked_at)].filter((d): d is string => !!d).sort().at(-1);
  const full = docs.filter((d) => d.kind === "full_2026").length;
  const confirmed = parties.filter((p) => p.candidate_status === "confirmed_official_candidacy").length;
  const with2026 = parties.filter((p) => p.programme_2026_status.endsWith("2026")).length;
  return (
    <>
      <section className="home-cover mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-14 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Generales · 29 de noviembre de 2026</p>
          <h1 className="mt-3 text-5xl font-semibold leading-[1.05] md:text-7xl">
            Elecciones 2026.<br /><em className="text-accent">Tu criterio primero.</em>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Menos ruido, más fuentes. Explora qué proponen los partidos, compáralo tema a tema y descubre qué te importa a ti. Cada dato enlaza a su origen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/juega" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">
              Descubre tus prioridades <ArrowRight className="size-4" />
            </Link>
            <Link to="/partidos" className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-6 py-3 font-semibold">
              Ver partidos
            </Link>
          </div>
        </div>
        <div className="cover-scene" aria-label="Dos personajes conversan y comparten ideas">
          <img src={coverPeople} alt="Dibujo cartoon de dos personas conversando sobre sus ideas" width={360} height={310} fetchPriority="high" />
          <span className="cover-sticker rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold shadow-soft">¿Qué te importa?</span>
          <span className="cover-voice rounded-full bg-highlight px-4 py-3 font-serif text-lg text-highlight-foreground">Tu voz</span>
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-7">
          <div className="flex items-center gap-4"><GameMascot /><div><p className="text-xs font-semibold uppercase text-accent">El corazón de Elecciones 2026</p><h2 className="mt-1 text-3xl font-semibold">Pequeños juegos. Grandes preguntas.</h2><p className="mt-1 text-muted-foreground">Tus prioridades, tus ideas, tu propia decisión.</p></div></div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-full"><Link to="/juega"><Gamepad2 /> Entrar a los juegos <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full"><Link to="/politico">🗳️ Político/a por un día</Link></Button>
          </div>
        </div>
      </section>
      <section className="mx-auto mt-8 max-w-6xl px-4">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          {/* key remounts after hydration so automatic page translation picks up the real values */}
          <p key={now ? "d" : "p"} className="text-sm text-muted-foreground">Hoy: {now ? formatDate(madridDate(now)) : "…"} · Votación: {formatDate(ELECTION.electionDate)}</p>
          <p key={now ? "n" : "q"} className="font-serif text-3xl font-semibold">Faltan {now ? daysUntilElection(ELECTION.electionDate, now) : "…"} días</p>
          <SourceLink href={ELECTION.source.url}>{ELECTION.source.title}</SourceLink>
        </div>
        <Notice>
          <strong>Comprobaciones documentales hasta {formatDate(checked)}:</strong> {parties.length} formaciones en seguimiento; {with2026} con propuestas o manifiestos 2026 localizados; {full} documentos íntegros 2026 registrados y {confirmed} candidaturas confirmadas. Los documentos históricos y los comunicados se distinguen de los programas. La fecha de consulta no equivale a verificar todas las propuestas.
        </Notice>
      </section>

      <section className="mx-auto mt-12 grid max-w-6xl gap-5 px-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/comparar", icon: Scale, title: "Compara", text: "Tema a tema, solo con posiciones que tienen fuente." },
          { to: "/juega", icon: Gamepad2, title: "Juega", text: "Ordena, reparte y elige cartas para descubrir tu afinidad." },
          { to: "/buscar", icon: Search, title: "Busca", text: "Encuentra propuestas, programas y fuentes oficiales al instante." },
          { to: "/fuentes", icon: ShieldCheck, title: "Verifica", text: "Todas las fuentes, la fórmula y sus límites, a la vista." },
        ].map((f) => (
          <Link key={f.to} to={f.to} className="group rounded-3xl border border-border bg-card p-6 shadow-soft transition-transform hover:-translate-y-1">
            <f.icon className="size-7 text-accent" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold">{f.title}</h2>
            <p className="mt-1 text-muted-foreground">{f.text}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
