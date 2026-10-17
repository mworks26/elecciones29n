import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, PageIntro, RouteError, SourceLink, Tag } from "@/components/site";
import { claimsQuery, documentsQuery, partiesQuery, sourcesQuery } from "@/lib/data";

const SUMMARY_SOURCE_IDS = ["congreso_votaciones", "tracker_tupapeleta_programas"];
import { DOC_KIND, formatDate } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { parseTally } from "@/lib/vote-tally";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/programas")({
  head: () => ({
    meta: [
      { title: "Biblioteca de programas — Elecciones 2026" },
      { name: "description", content: "Programas y manifiestos con enlace a la fuente oficial, separando 2026 de documentos históricos." },
      { property: "og:title", content: "Biblioteca de programas — Elecciones 2026" },
      { property: "og:description", content: "Cada documento con su fuente, fecha y tipo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(documentsQuery), context.queryClient.ensureQueryData(partiesQuery), context.queryClient.ensureQueryData(sourcesQuery), context.queryClient.ensureQueryData(claimsQuery)]),
  component: Programas,
  errorComponent: RouteError,
});

const FILTERS = [
  { id: "full_2026", label: "Programa íntegro 2026" },
  { id: "partial_2026", label: "Manifiesto/propuestas 2026" },
  { id: "official_statement_2026", label: "Comunicados oficiales 2026" },
  { id: "summaries", label: "Noticias" },
  { id: "historical_2023", label: "Histórico 2023" },
  { id: "missing", label: "No localizado" },
];

function Programas() {
  const { data: docs } = useSuspenseQuery(documentsQuery);
  const { data: parties } = useSuspenseQuery(partiesQuery);
  const { data: sources } = useSuspenseQuery(sourcesQuery);
  const { data: claims } = useSuspenseQuery(claimsQuery);
  const summarySources = sources.filter((s) => SUMMARY_SOURCE_IDS.includes(s.id));
  const votes = claims.filter((c) => c.evidence_type === "congress_vote" || c.evidence_type === "official_statement");
  const summaryParties = [...parties].filter((p) => votes.some((c) => c.party_id === p.id)).sort((a, b) => (a.short_name ?? a.name).localeCompare(b.short_name ?? b.name, "es"));
  const [f, setF] = useState("full_2026");
  const name = (id: string) => parties.find((p) => p.id === id)?.short_name ?? id;
  const missing = parties.filter((p) => p.programme_2026_status === "not_located_as_of_date" || p.programme_2026_status === "historical_2023_only");
  const list = docs.filter((d) => d.kind === f);

  return (
    <>
      <PageIntro eyebrow="Programas" title="Documentos, no titulares.">
        Solo enlazamos documentos publicados por los propios partidos. Un programa de 2023 nunca se presenta como de 2026.
      </PageIntro>
      <div className="mx-auto max-w-6xl px-4">
        <div role="group" aria-label="Filtrar documentos" className="flex flex-wrap gap-2">
          {FILTERS.map((x) => (
            <Button variant="ghost" key={x.id} onClick={() => setF(x.id)} aria-pressed={f === x.id}
              className={cn("rounded-full border px-4 py-1.5 text-sm", f === x.id ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card")}>
              {x.label}
            </Button>
          ))}
        </div>
        {f === "summaries" ? (
          <div className="mt-6">
            <p className="text-muted-foreground">Resumen de las votaciones de los partidos en el Congreso, declaraciones y manifestaciones de los partidos.</p>
            <div className="mt-2"><SourceLink href="https://www.congreso.es/es/notas-de-prensa" meta="Congreso de los Diputados">Notas de prensa oficiales del Congreso</SourceLink></div>
            <VoteCharts votes={votes.filter((c) => c.evidence_type === "congress_vote")} name={name} />
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summaryParties.map((p) => (
                <li key={p.id}><Card className="h-full p-5">
                  <p className="font-serif text-xl font-semibold">{p.short_name ?? p.name}</p>
                  <ul className="mt-3 space-y-3">
                    {votes.filter((c) => c.party_id === p.id).map((c) => (
                      <li key={c.id} className="border-t border-border pt-3">
                        <p className="text-sm font-semibold">{c.title}</p>
                        <p className="mt-1 text-sm"><Tag tone={c.position === "supports" ? "ok" : "none"}>{c.position === "supports" ? "Apoyó" : "Rechazó"}</Tag> {c.claim_text}</p>
                        {c.source_url && <div className="mt-1"><SourceLink href={c.source_url} meta={c.page_or_section ?? undefined}>Fuente: Congreso de los Diputados · votaciones</SourceLink></div>}
                      </li>
                    ))}
                  </ul>
                </Card></li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">Más contexto y declaraciones:</p>
            <ul className="mt-2 space-y-1">{summarySources.map((s) => <li key={s.id}><SourceLink href={s.url} meta={s.publisher ?? undefined}>{s.title}</SourceLink></li>)}</ul>
          </div>
        ) : f === "missing" ? (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {missing.map((p) => (
              <li key={p.id}><Card className="p-5"><p className="font-semibold">{p.short_name}</p><p className="text-sm text-muted-foreground">Programa 2026 sin localizar a fecha {formatDate(p.last_checked)}</p></Card></li>
            ))}
          </ul>
        ) : list.length === 0 ? (
          <p className="mt-6 text-muted-foreground">Todavía no hay documentos de este tipo verificados en fuentes oficiales.</p>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((d) => (
              <li key={d.id}><Card className={cn("h-full p-5", d.kind === "historical_2023" && "border-dashed bg-muted shadow-none")}>
                <p className="font-serif text-xl font-semibold">{name(d.party_id)}</p>
                <div className="mt-2 flex flex-wrap gap-2"><Tag tone={d.kind === "historical_2023" ? "history" : "partial"}>{DOC_KIND[d.kind] ?? d.kind}</Tag><Tag>{d.election}</Tag></div>
                <h2 className="mt-3 font-sans text-base font-semibold">{d.title}</h2>
                <div className="mt-4 border-t border-border pt-3"><SourceLink href={d.url}>Fuente original · consultar documento</SourceLink><p className="mt-2 text-xs text-muted-foreground">Enlace consultado: {formatDate(d.checked_at)}. {d.kind === "historical_2023" ? "Contexto histórico: no es un programa de 2026." : d.kind === "official_statement_2026" ? "Comunicado: no acredita un programa íntegro ni candidatura oficialmente proclamada." : d.kind === "partial_2026" ? "Manifiesto o propuestas parciales: no es un programa íntegro." : "La consulta del documento no implica verificar todas sus propuestas."}</p></div>
              </Card></li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

type Vote = { id: string; party_id: string; title: string; position: string; source_url: string | null; quote_or_paraphrase?: string | null };
/** Party-level vote split per Congress vote, built only from stored claims (no invented seat counts). */
function VoteCharts({ votes, name }: { votes: Vote[]; name: (id: string) => string }) {
  const groups = Object.entries(votes.reduce<Record<string, Vote[]>>((a, v) => ((a[v.title] ??= []).push(v), a), {}));
  if (!groups.length) return null;
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {groups.map(([title, vs]) => {
        const yes = vs.filter((v) => v.position === "supports");
        const no = vs.filter((v) => v.position !== "supports");
        const pct = Math.round((yes.length / vs.length) * 100);
        const tallyText = vs.find((v) => parseTally(v.quote_or_paraphrase))?.quote_or_paraphrase ?? null;
        const t = parseTally(tallyText);
        const total = t ? t.yes + t.no + t.abstain : 0;
        return (
          <Card key={title} className="p-5">
            <p className="font-semibold">{title}</p>
            <div className="mt-3 flex h-6 overflow-hidden rounded-full border border-border" role="img" aria-label={`${yes.length} partidos a favor y ${no.length} en contra`}>
              <div className="bg-primary" style={{ width: `${pct}%` }} />
              <div className="flex-1 bg-accent" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><p className="font-semibold">A favor ({yes.length})</p><p className="text-muted-foreground">{yes.map((v) => name(v.party_id)).join(", ") || "—"}</p></div>
              <div><p className="font-semibold">En contra ({no.length})</p><p className="text-muted-foreground">{no.map((v) => name(v.party_id)).join(", ") || "—"}</p></div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Recuento por partidos, no por escaños.</p>
            {t && total > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-sm font-semibold">Barómetro de votos (diputados)</p>
                <div className="mt-2 flex h-5 overflow-hidden rounded-full border border-border" role="img" aria-label={`${t.yes} sí, ${t.no} no, ${t.abstain} abstenciones`}>
                  <div className="bg-go" style={{ width: `${(t.yes / total) * 100}%` }} />
                  <div className="bg-wait" style={{ width: `${(t.abstain / total) * 100}%` }} />
                  <div className="bg-stop" style={{ width: `${(t.no / total) * 100}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-go" />Sí: <b>{t.yes}</b></span>
                  <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-wait" />Abstención: <b>{t.abstain}</b></span>
                  <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-stop" />No: <b>{t.no}</b></span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{tallyText}</p>
              </div>
            )}
            {vs[0]?.source_url && <div className="mt-1"><SourceLink href={vs[0]!.source_url!}>Fuente: Congreso de los Diputados</SourceLink></div>}
          </Card>
        );
      })}
    </div>
  );
}
