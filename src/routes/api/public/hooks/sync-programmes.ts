import { createFileRoute } from "@tanstack/react-router";
import { localPartyId } from "@/lib/party-ids";
import { extractCandidateLinks } from "@/lib/official-crawl";

// Daily watcher: detects new/changed programme documents and stores them as
// pending candidates for human review. It never publishes or edits public data.
type Prog = {
  id: string; party_id?: string; party_name?: string; title: string; election?: string;
  status?: string; document_url?: string; source_url?: string; official_source?: boolean; sha256?: string; last_checked?: string;
};

export const Route = createFileRoute("/api/public/hooks/sync-programmes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const res = await fetch("https://programasenclaro.com/api/v1/programs", { headers: { accept: "application/json" } });
        if (!res.ok) return Response.json({ error: "Fuente no disponible" }, { status: 502 });
        const json = (await res.json()) as { data?: Prog[] };
        const items = (json.data ?? []).slice(0, 200);

        const rows = items.map((p) => {
          const url = p.document_url ?? p.source_url ?? null;
          return {
            origin: "programasenclaro",
            external_id: String(p.id).slice(0, 200),
            party_id: localPartyId(p.party_id),
            party_name: p.party_name ?? null,
            title: String(p.title).slice(0, 300),
            election: p.election ?? null,
            status_label: p.status ?? null,
            document_url: url && /^https?:\/\//.test(url) ? url : null,
            official_source: !!p.official_source,
            sha256: p.sha256 ?? null,
            fingerprint: `${p.sha256 ?? ""}|${url ?? ""}|${p.status ?? ""}`,
          };
        });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Also watch each party's own official website and programme page.
        const { data: parties } = await supabaseAdmin.from("parties").select("id, name, official_site, programme_archive");
        const pages = (parties ?? []).flatMap((p) => [p.programme_archive, p.official_site].filter((u): u is string => !!u && /^https?:\/\//.test(u)).map((url) => ({ p, url })));
        let pagesOk = 0;
        const webRows = (await Promise.all(pages.map(async ({ p, url }) => {
          try {
            const r = await fetch(url, { headers: { "user-agent": "Elecciones2026-Monitor/1.0", accept: "text/html" }, signal: AbortSignal.timeout(8000) });
            if (!r.ok) return [];
            pagesOk++;
            return extractCandidateLinks((await r.text()).slice(0, 1_500_000), url).map((l) => ({
              origin: "web_oficial", external_id: l.url.slice(0, 200), party_id: p.id, party_name: p.name,
              title: l.text.slice(0, 300), election: "Generales 2026", status_label: "Detectado en la web oficial del partido",
              document_url: l.url, official_source: true, sha256: null, fingerprint: l.url,
            }));
          } catch { return []; }
        }))).flat();

        const { data, error } = await supabaseAdmin
          .from("update_candidates")
          .upsert([...rows, ...webRows], { onConflict: "origin,external_id,fingerprint", ignoreDuplicates: true })
          .select("id");
        if (error) { console.error(error); return Response.json({ error: "Error al guardar" }, { status: 500 }); }
        return Response.json({ checked: rows.length, official_pages: pages.length, official_pages_ok: pagesOk, official_links: webRows.length, new: data?.length ?? 0 });
      },
    },
  },
});
