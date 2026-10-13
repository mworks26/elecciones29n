import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageIntro, RouteError, Tag } from "@/components/site";
import { partiesQuery } from "@/lib/data";
import { CANDIDATE_STATUS, PROGRAMME_STATUS, formatDate } from "@/lib/labels";

export const Route = createFileRoute("/partidos/")({
  head: () => ({
    meta: [
      { title: "Partidos en seguimiento — Elecciones 2026" },
      { name: "description", content: "Formaciones en seguimiento para las generales 2026, con estado de candidatura y de programa." },
      { property: "og:title", content: "Partidos en seguimiento — Elecciones 2026" },
      { property: "og:description", content: "Estado de candidatura y programa de cada formación, con fecha de comprobación." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(partiesQuery),
  component: Partidos,
  errorComponent: RouteError,
});

function Partidos() {
  const { data } = useSuspenseQuery(partiesQuery);
  return (
    <>
      <PageIntro eyebrow="Partidos" title="Quién está en el radar.">
        Lista provisional de seguimiento, ordenada alfabéticamente. No es la lista oficial de candidaturas: se confirmarán cuando se publiquen las candidaturas proclamadas en el BOE.
      </PageIntro>
      <ul className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((p) => {
          const st = PROGRAMME_STATUS[p.programme_2026_status];
          return (
            <li key={p.id}>
              <Link to="/partidos/$id" params={{ id: p.id }} className="flex h-full flex-col rounded-3xl border border-border bg-card p-5 shadow-soft transition-transform hover:-translate-y-1">
                <span className="font-serif text-2xl font-semibold">{p.short_name}</span>
                <span className="text-sm text-muted-foreground">{p.name}</span>
                <span className="mt-4 flex flex-wrap gap-2">
                  <Tag tone={st?.tone}>{st?.label ?? p.programme_2026_status}</Tag>
                  <Tag>{CANDIDATE_STATUS[p.candidate_status] ?? p.candidate_status}</Tag>
                </span>
                <span className="mt-auto pt-4 text-xs text-muted-foreground">Comprobado el {formatDate(p.last_checked)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
