import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FavoriteButton } from "@/components/favorite-button";
import { Card, Notice, RouteError, SourceLink, Tag } from "@/components/site";
import { claimsQuery, documentsQuery, partiesQuery, topicsQuery } from "@/lib/data";
import { CANDIDATE_STATUS, DOC_KIND, EVIDENCE_TYPE, PROGRAMME_STATUS, REVIEW_STATUS, formatDate } from "@/lib/labels";

export const Route = createFileRoute("/partidos/$id")({
  loader: async ({ context, params }) => {
    const [parties] = await Promise.all([
      context.queryClient.ensureQueryData(partiesQuery),
      context.queryClient.ensureQueryData(documentsQuery),
      context.queryClient.ensureQueryData(claimsQuery),
      context.queryClient.ensureQueryData(topicsQuery),
    ]);
    const party = parties.find((p) => p.id === params.id);
    if (!party) throw notFound();
    return { name: party.name, short: party.short_name };
  },
  head: ({ loaderData, params }) => ({
    meta: [
      { title: loaderData ? `${loaderData.short} — Elecciones 2026` : "Partido — Elecciones 2026" },
      { name: "description", content: loaderData ? `Propuestas y documentos de ${loaderData.name} con fuentes oficiales.` : "Ficha de partido." },
      { property: "og:title", content: loaderData ? `${loaderData.name} — Elecciones 2026` : "Partido" },
      { property: "og:description", content: "Estado del programa, documentos y propuestas con fuente." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `/partidos/${params.id}` },
    ],
  }),
  component: Party,
  errorComponent: RouteError,
  notFoundComponent: () => <div className="px-4 py-20 text-center">Partido no encontrado. <Link to="/partidos" className="underline">Volver</Link></div>,
});

function Party() {
  const { id } = Route.useParams();
  const { data: parties } = useSuspenseQuery(partiesQuery);
  const { data: docs } = useSuspenseQuery(documentsQuery);
  const { data: claims } = useSuspenseQuery(claimsQuery);
  const { data: topics } = useSuspenseQuery(topicsQuery);
  const p = parties.find((x) => x.id === id)!;
  const st = PROGRAMME_STATUS[p.programme_2026_status];
  const myDocs = docs.filter((d) => d.party_id === id);
  const myClaims = claims.filter((c) => c.party_id === id);
  const topicLabel = (t: string) => topics.find((x) => x.id === t)?.label ?? t;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-12">
      <Link to="/partidos" className="text-sm text-muted-foreground hover:underline">← Todos los partidos</Link>
      <h1 className="mt-3 text-5xl font-semibold">{p.short_name}</h1>
      <p className="text-lg text-muted-foreground">{p.name}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Tag tone={st?.tone}>{st?.label}</Tag>
        <Tag>{CANDIDATE_STATUS[p.candidate_status]}</Tag>
        <Tag>Comprobado el {formatDate(p.last_checked)}</Tag>
      </div>
      {p.notes && <div className="mt-6"><Notice>{p.notes}</Notice></div>}
      <div className="mt-6 flex flex-wrap gap-6">
        {p.official_site && <SourceLink href={p.official_site}>Web oficial</SourceLink>}
        {p.programme_archive && <SourceLink href={p.programme_archive}>Archivo de programas</SourceLink>}
      </div>

      <h2 className="mt-12 text-3xl font-semibold">Documentos</h2>
      {myDocs.length === 0 ? (
        <p className="mt-3 text-muted-foreground">No se ha localizado ningún documento programático en fuentes oficiales a {formatDate(p.last_checked)}.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {myDocs.map((d) => (
            <li key={d.id}><Card className={d.kind === "historical_2023" ? "border-dashed bg-muted shadow-none" : ""}>
              <Tag tone={d.kind === "historical_2023" ? "history" : d.kind === "full_2026" ? "ok" : "partial"}>{DOC_KIND[d.kind] ?? d.kind}</Tag>
              <div className="mt-2"><SourceLink href={d.url} meta={`comprobado ${formatDate(d.checked_at)}`}>{d.title}</SourceLink></div>
              {d.kind === "historical_2023" && <p className="mt-2 text-sm text-muted-foreground">Solo como contexto histórico: no son propuestas para 2026.</p>}
            </Card></li>
          ))}
        </ul>
      )}

      <h2 className="mt-12 text-3xl font-semibold">Propuestas 2026 con fuente</h2>
      {myClaims.length === 0 ? (
        <p className="mt-3 text-muted-foreground">No se ha encontrado una posición verificable todavía.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {myClaims.map((c) => (
            <li key={c.id}><Card className="h-full p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">{topicLabel(c.topic_id)}</p>
              <h3 className="mt-1 text-lg font-semibold">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.claim_text}</p>
              <div className="mt-3 flex flex-wrap gap-2"><Tag tone="partial">{EVIDENCE_TYPE[c.evidence_type]}</Tag><Tag>{REVIEW_STATUS[c.review_status]}</Tag></div>
              <div className="mt-2"><FavoriteButton claimId={c.id} /></div>
                          {c.source_url && <div className="mt-3"><SourceLink href={c.source_url} meta={`${c.page_or_section ?? ""} · ${c.quote_or_paraphrase === "paraphrase" ? "paráfrasis" : "cita"} · ${formatDate(c.checked_at)}`}>Fuente</SourceLink></div>}
            </Card></li>
          ))}
        </ul>
      )}
    </div>
  );
}
