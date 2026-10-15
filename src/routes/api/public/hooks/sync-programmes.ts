import { createFileRoute } from "@tanstack/react-router";
import { localPartyId } from "@/lib/party-ids";

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
        const { data, error } = await supabaseAdmin
          .from("update_candidates")
          .upsert(rows, { onConflict: "origin,external_id,fingerprint", ignoreDuplicates: true })
          .select("id");
        if (error) { console.error(error); return Response.json({ error: "Error al guardar" }, { status: 500 }); }
        return Response.json({ checked: rows.length, new: data?.length ?? 0 });
      },
    },
  },
});
