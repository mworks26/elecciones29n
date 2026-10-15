import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, PageIntro, RouteError, SourceLink, Tag } from "@/components/site";
import { claimsQuery, documentsQuery, partiesQuery, sourcesQuery, topicsQuery } from "@/lib/data";

export const Route = createFileRoute("/buscar")({
  head: () => ({
    meta: [
      { title: "Buscador — Elecciones 2026" },
      { name: "description", content: "Busca partidos, propuestas, programas y fuentes oficiales de las generales del 29 de noviembre de 2026." },
      { property: "og:title", content: "Buscador — Elecciones 2026" },
      { property: "og:description", content: "Encuentra propuestas y programas con su fuente oficial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([partiesQuery, claimsQuery, documentsQuery, sourcesQuery, topicsQuery].map((q) => context.queryClient.ensureQueryData(q as never))),
  component: BuscarPage,
  errorComponent: RouteError,
});

const norm = (s: string | null | undefined) => (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function BuscarPage() {
  const { data: parties } = useSuspenseQuery(partiesQuery);
  const { data: claims } = useSuspenseQuery(claimsQuery);
  const { data: docs } = useSuspenseQuery(documentsQuery);
  const { data: sources } = useSuspenseQuery(sourcesQuery);
  const { data: topics } = useSuspenseQuery(topicsQuery);
  const [q, setQ] = useState("");
  const partyName = (id: string) => parties.find((p) => p.id === id)?.name ?? id;
  const topicName = (id: string) => topics.find((t) => t.id === id)?.label ?? id;

  const r = useMemo(() => {
    const words = norm(q).split(/\s+/).filter((w) => w.length > 1);
    if (!words.length) return null;
    const hit = (...f: (string | null | undefined)[]) => { const t = norm(f.join(" ")); return words.every((w) => t.includes(w)); };
    return {
      parties: parties.filter((p) => hit(p.name, p.short_name, p.notes)),
      claims: claims.filter((c) => hit(c.title, c.claim_text, c.quote_or_paraphrase, partyName(c.party_id), topicName(c.topic_id))),
      docs: docs.filter((d) => hit(d.title, d.election, partyName(d.party_id))),
      sources: sources.filter((s) => hit(s.title, s.publisher)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, parties, claims, docs, sources, topics]);
  const total = r ? r.parties.length + r.claims.length + r.docs.length + r.sources.length : 0;

  return (
    <div>
      <PageIntro eyebrow="Buscador" title="Busca en partidos, propuestas y programas">
        Resultados directos de la base de datos verificada, cada uno con su fuente oficial.
      </PageIntro>
      <div className="mx-auto max-w-6xl px-4">
        <label className="relative block">
          <span className="sr-only">Buscar</span>
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej.: vivienda, pensiones, PSOE…" className="w-full rounded-full border border-input bg-card py-3 pl-12 pr-4 text-lg shadow-soft" />
        </label>
        {r && <p className="mt-3 text-sm text-muted-foreground">{total} resultado{total === 1 ? "" : "s"}</p>}
        {r && total === 0 && <Card className="mt-4">No se ha encontrado información verificable con esas palabras.</Card>}
        {r && (
          <div className="mt-6 space-y-8">
            {r.parties.length > 0 && <Section title="Partidos">{r.parties.map((p) => (
              <Card key={p.id} className="p-4"><Link to="/partidos/$id" params={{ id: p.id }} className="font-semibold underline-offset-4 hover:underline">{p.name}</Link>
                {p.official_site && <div className="mt-2"><SourceLink href={p.official_site}>Web oficial</SourceLink></div>}</Card>))}</Section>}
            {r.claims.length > 0 && <Section title="Propuestas">{r.claims.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex flex-wrap gap-2"><Tag>{partyName(c.party_id)}</Tag><Tag>{topicName(c.topic_id)}</Tag>{c.review_status === "needs_second_review" && <Tag tone="partial">Pendiente de segunda revisión</Tag>}</div>
                <p className="mt-2 font-semibold">{c.title}</p><p className="mt-1 text-sm text-muted-foreground">{c.claim_text}</p>
                {c.source_url && <div className="mt-2"><SourceLink href={c.source_url} meta={c.page_or_section ?? undefined}>Fuente</SourceLink></div>}
              </Card>))}</Section>}
            {r.docs.length > 0 && <Section title="Programas y documentos">{r.docs.map((d) => (
              <Card key={d.id} className="p-4"><p className="font-semibold">{d.title}</p><p className="text-sm text-muted-foreground">{partyName(d.party_id)} · {d.election}</p>
                <div className="mt-2"><SourceLink href={d.url}>Documento oficial</SourceLink></div></Card>))}</Section>}
            {r.sources.length > 0 && <Section title="Fuentes">{r.sources.map((s) => (
              <Card key={s.id} className="p-4"><SourceLink href={s.url} meta={s.publisher ?? undefined}>{s.title}</SourceLink></Card>))}</Section>}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-3 text-2xl font-semibold">{title}</h2><div className="grid gap-3 md:grid-cols-2">{children}</div></section>;
}
