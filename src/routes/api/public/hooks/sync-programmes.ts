import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { localPartyId } from "@/lib/party-ids";
import { extractCandidateLinks } from "@/lib/official-crawl";
import { officialFetch, publishOfficialDocuments, type Candidate } from "@/lib/automatic-documents";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

const programmeSchema = z.object({
  id: z.union([z.string(), z.number()]), title: z.string().max(1000),
  party_id: z.string().optional(), party_name: z.string().optional(), election: z.string().optional(),
  status: z.string().optional(), document_url: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(), official_source: z.boolean().optional(), sha256: z.string().nullable().optional(),
});

export const Route = createFileRoute("/api/public/hooks/sync-programmes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const body = z.object({}).strict().safeParse(await request.json().catch(() => null));
        if (!body.success) return Response.json({ error: "Solicitud no válida" }, { status: 400 });

        // A failed third-party source must not prevent the official-site scan.
        let items: z.infer<typeof programmeSchema>[] = [];
        let aggregatorOk = false;
        try {
          const res = await fetch("https://programasenclaro.com/api/v1/programs", {
            headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000),
          });
          if (res.ok) {
            const parsed = z.object({ data: z.array(z.unknown()).max(2000) }).safeParse(await res.json());
            if (parsed.success) {
              items = parsed.data.data.slice(0, 200).flatMap((item) => {
                const row = programmeSchema.safeParse(item);
                return row.success ? [row.data] : [];
              });
              aggregatorOk = true;
            }
          }
        } catch { /* Continue with first-party sources. */ }

        const rows: Candidate[] = items.map((p) => {
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

        const { data: parties, error: partiesError } = await supabaseAdmin.from("parties").select("id, name, official_site, programme_archive, programme_2026_status");
        if (partiesError || !parties) return Response.json({ error: "No se pudieron consultar los partidos" }, { status: 500 });
        const pages = (parties ?? []).flatMap((p) => [p.programme_archive, p.official_site].filter((u): u is string => !!u && /^https?:\/\//.test(u)).map((url) => ({ p, url })));
        let pagesOk = 0;
        const webRows = (await Promise.all(pages.map(async ({ p, url }) => {
          try {
            const r = await officialFetch(url, p.official_site);
            if (!r || !r.headers.get("content-type")?.includes("text/html")) return [];
            pagesOk++;
            return extractCandidateLinks((await r.text()).slice(0, 1_500_000), url).map((l) => ({
              origin: "web_oficial", external_id: l.url.slice(0, 200), party_id: p.id, party_name: p.name,
              title: l.text.slice(0, 300), election: "Generales 2026", status_label: "Detectado en la web oficial del partido",
              document_url: l.url, official_source: true, sha256: null, fingerprint: l.url,
            }));
          } catch { return []; }
        }))).flat();

        const { data: published, error: readError } = await supabaseAdmin.from("programme_documents").select("party_id,url");
        if (readError) return Response.json({ error: "No se pudo consultar la biblioteca" }, { status: 500 });
        const known = new Set((published ?? []).map((d) => `${d.party_id}|${d.url}`));
        const result = await publishOfficialDocuments([...webRows, ...rows], parties, known, {
          insert: async (document) => {
            const { data, error } = await supabaseAdmin.from("programme_documents").insert(document).select("id").single();
            if (error || !data) throw new Error("Document write failed");
            return data.id;
          },
          audit: async (id, document) => {
            const { error } = await supabaseAdmin.from("change_log").insert({
              entity: "document", entity_id: id, action: "auto_publish_official_document",
              reason: "Publicación automática autorizada por la editora; dominio oficial y contenido comprobados para Generales 2026",
              changes: { ...document, verification: "official_domain_and_document_content" },
            });
            if (error) throw new Error("Document audit failed");
          },
        });
        let followUpFailed = 0;
        for (const document of result.documents) {
          const party = parties.find((p) => p.id === document.party_id);
          const full = document.kind === "full_2026" || party?.programme_2026_status === "published_full_2026";
          const { error: statusError } = await supabaseAdmin.from("parties").update({
            programme_2026_status: full ? "published_full_2026" : "published_partial_2026", last_checked: document.checked_at ?? null,
          }).eq("id", document.party_id);
          const { error: candidateError } = await supabaseAdmin.from("update_candidates").update({ review_status: "reviewed" })
            .eq("party_id", document.party_id).eq("document_url", document.url).eq("review_status", "pending");
          if (statusError || candidateError) followUpFailed++;
          if (party && full) party.programme_2026_status = "published_full_2026";
        }
        const { data, error } = result.pending.length ? await supabaseAdmin
          .from("update_candidates")
          .upsert(result.pending, { onConflict: "origin,external_id,fingerprint", ignoreDuplicates: true })
          .select("id") : { data: [], error: null };
        return Response.json({
          checked: rows.length, aggregator_ok: aggregatorOk, official_pages: pages.length, official_pages_ok: pagesOk,
          official_links: webRows.length, new: data?.length ?? 0, auto_published: result.published,
          publication_failed: result.failed, audit_failed: result.audit_failed, follow_up_failed: followUpFailed,
          pending_save_failed: !!error,
        }, { status: error || result.failed || result.audit_failed || followUpFailed ? 500 : 200 });
      },
    },
  },
});
