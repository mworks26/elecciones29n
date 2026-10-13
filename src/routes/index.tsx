import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Gamepad2, MessageCircleQuestion, Scale, ShieldCheck } from "lucide-react";
import { Card, Notice, RouteError, SourceLink } from "@/components/site";
import { ELECTION } from "@/lib/election";
import { formatDate } from "@/lib/labels";
import { partiesQuery } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elecciones 2026 — Tu voto empieza con una pregunta" },
      { name: "description", content: "Partidos, programas y propuestas de las generales del 29-N con fuentes oficiales, juegos de afinidad y un asistente neutral." },
      { property: "og:title", content: "Elecciones 2026 — Tu voto empieza con una pregunta" },
      { property: "og:description", content: "Explora y compara propuestas con fuentes verificables. Sin inventar nada." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(partiesQuery),
  component: Index,
  errorComponent: RouteError,
});

function daysUntil(date: string) {
  return Math.max(0, Math.ceil((new Date(date + "T00:00:00").getTime() - Date.now()) / 86400000));
}

function Index() {
  const { data: parties } = useSuspenseQuery(partiesQuery);
  const with2026 = parties.filter((p) => p.programme_2026_status.endsWith("2026")).length;
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-14 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Generales · 29 de noviembre de 2026</p>
          <h1 className="mt-3 text-5xl font-semibold leading-[1.05] md:text-7xl">
            Tu voto empieza con una <em className="text-accent">pregunta</em>.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Menos ruido, más fuentes. Explora qué proponen los partidos, compáralo tema a tema y descubre qué te importa a ti. Cada dato enlaza a su origen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/juega" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">
              Empezar a jugar <ArrowRight className="size-4" />
            </Link>
            <Link to="/partidos" className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-6 py-3 font-semibold">
              Ver partidos
            </Link>
          </div>
        </div>
        <Card className="bg-secondary">
          <p className="text-sm text-muted-foreground">Faltan</p>
          <p className="font-serif text-7xl font-semibold">{daysUntil(ELECTION.electionDate)}<span className="ml-2 text-2xl">días</span></p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt>Campaña</dt><dd className="font-medium">{formatDate(ELECTION.campaignStart)} – {formatDate(ELECTION.campaignEnd)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Votación</dt><dd className="font-medium">{formatDate(ELECTION.electionDate)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Escaños Congreso</dt><dd className="font-medium">{ELECTION.congressSeats}</dd></div>
          </dl>
          <div className="mt-4"><SourceLink href={ELECTION.source.url} meta={`consultado ${formatDate(ELECTION.lastChecked)}`}>{ELECTION.source.title}</SourceLink></div>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <Notice>
          <strong>Estado a {formatDate(ELECTION.lastChecked)}:</strong> de {parties.length} formaciones en seguimiento, {with2026} tiene propuestas 2026 localizadas y ninguna tiene aún un programa íntegro 2026 verificado. Ninguna candidatura está confirmada oficialmente todavía. Iremos añadiendo los programas cuando se publiquen en fuentes oficiales.
        </Notice>
      </section>

      <section className="mx-auto mt-12 grid max-w-6xl gap-5 px-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/comparar", icon: Scale, title: "Compara", text: "Tema a tema, solo con posiciones que tienen fuente." },
          { to: "/juega", icon: Gamepad2, title: "Juega", text: "Ordena, reparte y elige cartas para descubrir tu afinidad." },
          { to: "/asistente", icon: MessageCircleQuestion, title: "Pregunta", text: "Un asistente neutral que cita sus fuentes y no te dice a quién votar." },
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
