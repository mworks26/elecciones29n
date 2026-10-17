import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, PageIntro, RouteError, SourceLink, Tag } from "@/components/site";
import { documentsQuery, partiesQuery, sourcesQuery } from "@/lib/data";

const SUMMARY_SOURCE_IDS = ["congreso_votaciones", "tracker_tupapeleta_programas"];
import { DOC_KIND, formatDate } from "@/lib/labels";
import { cn } from "@/lib/utils";
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
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(documentsQuery), context.queryClient.ensureQueryData(partiesQuery), context.queryClient.ensureQueryData(sourcesQuery)]),
  component: Programas,
  errorComponent: RouteError,
});

const FILTERS = [
  { id: "full_2026", label: "Programa íntegro 2026" },
  { id: "partial_2026", label: "Manifiesto/propuestas 2026" },
  { id: "official_statement_2026", label: "Comunicados oficiales 2026" },
  { id: "summaries", label: "Resúmenes partidos" },
  { id: "historical_2023", label: "Histórico 2023" },
  { id: "missing", label: "No localizado" },
];

function Programas() {
  const { data: docs } = useSuspenseQuery(documentsQuery);
  const { data: parties } = useSuspenseQuery(partiesQuery);
  const { data: sources } = useSuspenseQuery(sourcesQuery);
  const summarySources = sources.filter((s) => SUMMARY_SOURCE_IDS.includes(s.id));
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
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summarySources.map((s) => (
                <li key={s.id}><Card className="h-full p-5">
                  <Tag tone={s.reliability === "secondary" ? "none" : "ok"}>{s.reliability === "secondary" ? "Fuente secundaria independiente" : "Fuente oficial"}</Tag>
                  <div className="mt-3"><SourceLink href={s.url} meta={s.publisher ?? undefined}>{s.title}</SourceLink></div>
                  <p className="mt-1 text-xs text-muted-foreground">Última comprobación: {formatDate(s.last_checked)}</p>
                </Card></li>
              ))}
            </ul>
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
