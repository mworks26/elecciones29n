import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, PageIntro, RouteError, SourceLink, Tag } from "@/components/site";
import { changeLogQuery, sourcesQuery } from "@/lib/data";
import { SOURCE_TYPE, formatDate } from "@/lib/labels";
import { MIN_COVERAGE } from "@/lib/affinity";

export const Route = createFileRoute("/fuentes")({
  head: () => ({
    meta: [
      { title: "Fuentes y metodología — Elecciones 2026" },
      { name: "description", content: "Registro de fuentes, fórmula de afinidad, límites conocidos e historial de cambios." },
      { property: "og:title", content: "Fuentes y metodología — Elecciones 2026" },
      { property: "og:description", content: "Todo dato necesita un origen. Aquí están todos." },
    ],
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(sourcesQuery), context.queryClient.ensureQueryData(changeLogQuery)]),
  component: Fuentes,
  errorComponent: RouteError,
});

function Fuentes() {
  const { data: sources } = useSuspenseQuery(sourcesQuery);
  const { data: log } = useSuspenseQuery(changeLogQuery);
  return (
    <>
      <PageIntro eyebrow="Fuentes" title="Todo dato necesita un origen." />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <h2 className="text-2xl font-semibold">Registro de fuentes</h2>
          <ul className="mt-4 space-y-3">
            {sources.map((s) => (
              <li key={s.id}><Card className="p-5">
                <div className="flex flex-wrap gap-2"><Tag tone={s.reliability === "secondary" ? "none" : "ok"}>{SOURCE_TYPE[s.source_type] ?? s.source_type}</Tag></div>
                <div className="mt-2"><SourceLink href={s.url} meta={s.publisher ?? undefined}>{s.title}</SourceLink></div>
                <p className="mt-1 text-xs text-muted-foreground">Última comprobación: {formatDate(s.last_checked)}</p>
              </Card></li>
            ))}
          </ul>
        </section>
        <section className="space-y-6">
          <Card className="bg-secondary">
            <h2 className="text-2xl font-semibold">Una fórmula visible</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
              <li>Por cada propuesta valorada: de acuerdo = 1, en parte = 0,5, en desacuerdo = 0 (se invierte si el partido se opone).</li>
              <li>Se promedia por tema y se pondera con tus prioridades.</li>
              <li>Cobertura = temas comparables del partido / temas que has valorado.</li>
              <li>Si la cobertura es menor del {MIN_COVERAGE * 100}%, mostramos «datos insuficientes» en lugar de una cifra.</li>
              <li>La falta de información no suma ni resta. Las propuestas pendientes de segunda revisión solo cuentan si tú lo activas.</li>
              <li>Es una orientación informativa, nunca una recomendación de voto.</li>
            </ul>
          </Card>
          <Card>
            <h2 className="text-2xl font-semibold">Reglas editoriales</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>Prevalece la fuente primaria: BOE para candidaturas y calendario; web oficial del partido para su programa.</li>
              <li>La prensa sirve para descubrir, no para atribuir una medida.</li>
              <li>No confundimos programa 2023 y 2026, ni manifiesto con programa íntegro.</li>
              <li>Tus respuestas de los juegos se quedan en tu navegador.</li>
            </ul>
          </Card>
          <Card>
            <h2 className="text-2xl font-semibold">Historial de cambios</h2>
            {log.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Carga inicial del {formatDate("2026-10-13")} desde el paquete de datos verificado. Sin cambios posteriores.</p> : (
              <ul className="mt-3 space-y-2 text-sm">
                {log.map((l) => <li key={l.id}><span className="text-muted-foreground">{new Date(l.created_at).toLocaleString("es-ES")}</span> · {l.action} {l.entity} «{l.entity_id}»{l.reason && ` — ${l.reason}`}</li>)}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </>
  );
}
