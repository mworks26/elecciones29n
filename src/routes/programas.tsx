import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, PageIntro, RouteError, SourceLink, Tag } from "@/components/site";
import { documentsQuery, partiesQuery } from "@/lib/data";
import { DOC_KIND, formatDate } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/programas")({
  head: () => ({
    meta: [
      { title: "Biblioteca de programas — Elecciones 2026" },
      { name: "description", content: "Programas y manifiestos con enlace a la fuente oficial, separando 2026 de documentos históricos." },
      { property: "og:title", content: "Biblioteca de programas — Elecciones 2026" },
      { property: "og:description", content: "Cada documento con su fuente, fecha y tipo." },
    ],
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(documentsQuery), context.queryClient.ensureQueryData(partiesQuery)]),
  component: Programas,
  errorComponent: RouteError,
});

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "full_2026", label: "Programa íntegro 2026" },
  { id: "partial_2026", label: "Manifiesto/propuestas 2026" },
  { id: "historical_2023", label: "Histórico 2023" },
  { id: "missing", label: "No localizado" },
];

function Programas() {
  const { data: docs } = useSuspenseQuery(documentsQuery);
  const { data: parties } = useSuspenseQuery(partiesQuery);
  const [f, setF] = useState("all");
  const name = (id: string) => parties.find((p) => p.id === id)?.short_name ?? id;
  const missing = parties.filter((p) => p.programme_2026_status === "not_located_as_of_date" || p.programme_2026_status === "historical_2023_only");
  const list = f === "all" ? docs : docs.filter((d) => d.kind === f);

  return (
    <>
      <PageIntro eyebrow="Programas" title="Documentos, no titulares.">
        Solo enlazamos documentos publicados por los propios partidos. Un programa de 2023 nunca se presenta como de 2026.
      </PageIntro>
      <div className="mx-auto max-w-6xl px-4">
        <div role="group" aria-label="Filtrar documentos" className="flex flex-wrap gap-2">
          {FILTERS.map((x) => (
            <button key={x.id} onClick={() => setF(x.id)} aria-pressed={f === x.id}
              className={cn("rounded-full border px-4 py-1.5 text-sm", f === x.id ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card")}>
              {x.label}
            </button>
          ))}
        </div>
        {f === "missing" ? (
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
                <div className="mt-3"><SourceLink href={d.url} meta={`revisado ${formatDate(d.checked_at)}`}>{d.title}</SourceLink></div>
              </Card></li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
