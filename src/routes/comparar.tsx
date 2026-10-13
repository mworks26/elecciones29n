import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, Notice, PageIntro, RouteError, SourceLink, Tag } from "@/components/site";
import { claimsQuery, partiesQuery, topicsQuery } from "@/lib/data";
import { POSITION, REVIEW_STATUS, formatDate } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/comparar")({
  head: () => ({
    meta: [
      { title: "Comparador por temas — Elecciones 2026" },
      { name: "description", content: "Compara partidos tema a tema, solo con posiciones respaldadas por una fuente." },
      { property: "og:title", content: "Comparador por temas — Elecciones 2026" },
      { property: "og:description", content: "Si no hay evidencia, lo decimos. Nunca rellenamos huecos." },
    ],
  }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(topicsQuery),
    context.queryClient.ensureQueryData(partiesQuery),
    context.queryClient.ensureQueryData(claimsQuery),
  ]),
  component: Comparar,
  errorComponent: RouteError,
});

function Comparar() {
  const { data: topics } = useSuspenseQuery(topicsQuery);
  const { data: parties } = useSuspenseQuery(partiesQuery);
  const { data: claims } = useSuspenseQuery(claimsQuery);
  const [topic, setTopic] = useState(topics[0]?.id ?? "");
  const current = claims.filter((c) => c.topic_id === topic);

  return (
    <>
      <PageIntro eyebrow="Comparar" title="Compara con contexto.">
        Elige un tema. Cada posición muestra fuente, sección y fecha. Que un partido no aparezca no significa que se oponga: significa que no hemos encontrado una posición verificable.
      </PageIntro>
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Temas">
          {topics.map((t) => {
            const n = claims.filter((c) => c.topic_id === t.id).length;
            return (
              <button key={t.id} role="tab" aria-selected={topic === t.id} onClick={() => setTopic(t.id)}
                className={cn("shrink-0 rounded-full border px-4 py-1.5 text-sm", topic === t.id ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card")}>
                {t.label} <span className="opacity-60">({n})</span>
              </button>
            );
          })}
        </div>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {parties.map((p) => {
            const mine = current.filter((c) => c.party_id === p.id);
            return (
              <li key={p.id}>
                <Card className={cn("h-full p-5", !mine.length && "bg-muted shadow-none")}>
                  <p className="font-serif text-xl font-semibold">{p.short_name}</p>
                  {mine.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">No se ha encontrado una posición verificable.</p>
                  ) : (
                    <ul className="mt-2 space-y-3">
                      {mine.map((c) => (
                        <li key={c.id}>
                          <p className="font-medium">{c.title}</p>
                          <p className="text-sm text-muted-foreground">{c.claim_text}</p>
                          <div className="mt-2 flex flex-wrap gap-2"><Tag tone="partial">{POSITION[c.position]}</Tag><Tag>{REVIEW_STATUS[c.review_status]}</Tag></div>
                          {c.source_url && <div className="mt-2"><SourceLink href={c.source_url} meta={`${c.page_or_section ?? ""} · ${formatDate(c.checked_at)}`}>Fuente</SourceLink></div>}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
        <div className="mt-6"><Notice>Orden alfabético. Ningún partido se destaca por color o posición.</Notice></div>
      </div>
    </>
  );
}
