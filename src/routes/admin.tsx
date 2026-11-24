import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { Card, PageIntro } from "@/components/site";
import { changeLogQuery, claimsQuery, documentsQuery, partiesQuery, sourcesQuery, topicsQuery } from "@/lib/data";
import { CANDIDATE_STATUS, DOC_KIND, EVIDENCE_TYPE, POSITION, PROGRAMME_STATUS, REVIEW_STATUS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { BannerAdmin } from "@/components/banners";
import { localPartyId } from "@/lib/party-ids";
import { suggestKind } from "@/lib/official-crawl";
import { approveClaims, canApproveClaim } from "@/lib/claim-approval";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel editorial — Elecciones 2026" },
      { name: "description", content: "Área privada para actualizar partidos, documentos y propuestas verificadas." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Panel editorial — Elecciones 2026" },
      { property: "og:description", content: "Área privada del equipo editorial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

const field = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";
const today = () => new Date().toISOString().slice(0, 10);

function Admin() {
  const { session, ready } = useSession();
  const { data: isAdmin } = useQuery({
    queryKey: ["is_admin", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      if (!session) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  if (!ready) return null;
  if (!session) return <AuthForm />;
  return (
    <>
      <PageIntro eyebrow="Panel editorial" title="Actualiza con trazabilidad." />
      <div className="mx-auto max-w-5xl px-4">
        <p className="text-sm text-muted-foreground">Sesión: {session.user.email} · <button className="underline" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button></p>
        {isAdmin === false ? <Card className="mt-6">Tu cuenta no tiene permisos editoriales.</Card> : isAdmin ? <Editor userId={session.user.id} /> : null}
      </div>
    </>
  );
}

function AuthForm() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <Card>
        <h1 className="text-3xl font-semibold">Panel editorial</h1>
        <p className="mt-2 text-sm text-muted-foreground">Entra con la cuenta del equipo editorial.</p>
        <Link to="/auth" className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground">Entrar</Link>
      </Card>
    </div>
  );
}

function Sel({ value, onChange, options, name }: { value: string; onChange?: (v: string) => void; options: Record<string, string>; name?: string }) {
  return (
    <select name={name} className={field} value={onChange ? value : undefined} defaultValue={onChange ? undefined : value} onChange={onChange ? (e) => onChange(e.target.value) : undefined}>
      {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  );
}
const L = ({ label, children }: { label: string; children: ReactNode }) => <label className="block text-sm"><span className="mb-1 block font-medium">{label}</span>{children}</label>;

function Editor({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState("partidos");
  const [selected, setSelected] = useState<string[]>([]);
  const [approvalIds, setApprovalIds] = useState<string[]>([]);
  const [approving, setApproving] = useState(false);
  const parties = useQuery(partiesQuery).data ?? [];
  const topics = useQuery(topicsQuery).data ?? [];
  const sources = useQuery(sourcesQuery).data ?? [];
  const claims = useQuery(claimsQuery).data ?? [];
  const docs = useQuery(documentsQuery).data ?? [];
  const partyOpts = Object.fromEntries(parties.map((p) => [p.id, p.short_name ?? p.name]));
  const topicOpts = Object.fromEntries(topics.map((t) => [t.id, t.label]));
  const sourceOpts = { "": "—", ...Object.fromEntries(sources.map((s) => [s.id, s.title])) };
  const eligible = claims.filter(canApproveClaim);
  const selectedIds = eligible.filter((c) => selected.includes(c.id)).map((c) => c.id);

  async function confirmApproval() {
    if (approving) return;
    setApproving(true);
    try {
      const changes = { review_status: "verified_by_human", checked_at: today() };
      const result = await approveClaims(claims, approvalIds, async (claim) => {
        const { data, error } = await supabase.from("claims").update(changes).eq("id", claim.id).eq("review_status", claim.review_status).select("id");
        if (error) throw error;
        if (!data?.length) return "skipped";
        const { error: logError } = await supabase.from("change_log").insert({ entity: "claim", entity_id: claim.id, action: "verify", reason: "Aprobación conjunta confirmada por la editora; se conserva la posición registrada", changed_by: userId, changes });
        return logError ? "unlogged" : "approved";
      });
      if (result.approved) toast.success(`${result.approved} propuestas aprobadas y registradas en Historial.`);
      if (result.failed) toast.error(`${result.failed} propuestas no se pudieron aprobar. Puedes volver a intentarlo.`);
      if (result.unlogged) toast.error(`${result.unlogged} propuestas aprobadas, pero no se pudo guardar su historial.`);
      if (result.skipped) toast.info(`${result.skipped} propuestas ya habían cambiado; no se modificaron.`);
      setSelected([]);
      setApprovalIds([]);
      await qc.invalidateQueries();
    } finally { setApproving(false); }
  }

  async function save(entity: string, entityId: string, action: string, reason: string, op: () => PromiseLike<{ error: { message: string } | null }>, changes: unknown) {
    if (!reason.trim()) { toast.error("Indica el motivo del cambio."); return; }
    const { error } = await op();
    if (error) { toast.error(error.message); return; }
    const { error: logErr } = await supabase.from("change_log").insert({ entity, entity_id: entityId, action, reason, changed_by: userId, changes: changes as never });
    if (logErr) toast.error(`Guardado, pero no se registró el historial: ${logErr.message}`);
    else toast.success("Guardado y registrado en el historial.");
    qc.invalidateQueries();
  }
  const fd = (e: FormEvent<HTMLFormElement>) => { const f = new FormData(e.currentTarget); return (k: string) => String(f.get(k) ?? ""); };
  const nul = (v?: string) => (v && v.trim() ? v.trim() : null);

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["update_candidates", "count"],
    queryFn: async () => (await supabase.from("update_candidates").select("id", { count: "exact", head: true }).eq("review_status", "pending")).count ?? 0,
  });

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {([["partidos", "Partidos"], ["documentos", "Documentos"], ["propuestas", "Propuestas"], ["fuentes", "Fuentes"], ["avisos", "Programas por verificar"], ["banners", "Banners"], ["historial", "Historial"]] as const).map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={cn("rounded-full border px-4 py-1.5 text-sm", tab === id ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card")}>{l}{id === "avisos" && pendingCount > 0 ? ` (${pendingCount})` : ""}</button>
        ))}
      </div>

      {tab === "banners" && <BannerAdmin userId={userId} />}
      {tab === "historial" && <ChangeLog />}


      {tab === "partidos" && (
        <div className="mt-6 space-y-4">
          {parties.map((p) => (
            <Card key={p.id} className="p-5">
              <form className="grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const v = fd(e);
                const changes = { programme_2026_status: v("programme_2026_status"), candidate_status: v("candidate_status"), candidacy_source_id: nul(v("candidacy_source_id")), notes: nul(v("notes")), last_checked: today() };
                if (v("candidate_status") === "confirmed_official_candidacy" && !changes.candidacy_source_id) { toast.error("Una candidatura confirmada necesita fuente oficial (BOE o boletín)."); return; }
                save("party", p.id, "update", v("reason"), () => supabase.from("parties").update(changes).eq("id", p.id), changes); }}>
                <p className="font-serif text-xl font-semibold md:col-span-2">{p.name}</p>
                <L label="Programa 2026"><Sel name="programme_2026_status" value={p.programme_2026_status} options={Object.fromEntries(Object.entries(PROGRAMME_STATUS).map(([k, v]) => [k, v.label]))} /></L>
                <L label="Candidatura"><Sel name="candidate_status" value={p.candidate_status} options={CANDIDATE_STATUS} /></L>
                <L label="Fuente de candidatura"><Sel name="candidacy_source_id" value={p.candidacy_source_id ?? ""} options={sourceOpts} /></L>
                <L label="Notas"><input name="notes" defaultValue={p.notes ?? ""} className={field} /></L>
                <L label="Motivo del cambio"><input name="reason" required className={field} /></L>
                <div className="flex items-end"><button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Guardar</button></div>
              </form>
            </Card>
          ))}
        </div>
      )}

      {tab === "documentos" && (
        <Card className="mt-6">
          <h2 className="text-xl font-semibold">Añadir documento</h2>
          <p className="text-sm text-muted-foreground">{docs.length} documentos registrados.</p>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const v = fd(e); const form = e.currentTarget;
            const row = { party_id: v("party_id"), title: v("title"), election: v("election"), kind: v("kind"), url: v("url"), source_id: nul(v("source_id")), language: v("language") || "es", published_at: nul(v("published_at")), checked_at: today() };
            save("document", v("title"), "create", v("reason"), () => supabase.from("programme_documents").insert(row), row).then(() => form.reset()); }}>
            <L label="Partido"><Sel name="party_id" value={parties[0]?.id ?? ""} options={partyOpts} /></L>
            <L label="Tipo"><Sel name="kind" value="full_2026" options={DOC_KIND} /></L>
            <L label="Título"><input name="title" required className={field} /></L>
            <L label="Elección"><input name="election" required defaultValue="Generales 2026" className={field} /></L>
            <L label="URL oficial"><input name="url" type="url" required className={field} /></L>
            <L label="Fuente registrada"><Sel name="source_id" value="" options={sourceOpts} /></L>
            <L label="Idioma"><input name="language" defaultValue="es" className={field} /></L>
            <L label="Fecha de publicación"><input name="published_at" type="date" className={field} /></L>
            <L label="Motivo"><input name="reason" required className={field} /></L>
            <div className="flex items-end"><button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Añadir</button></div>
          </form>
        </Card>
      )}

      {tab === "propuestas" && (
        <div className="mt-6 space-y-4">
          <div className="space-y-3 border-b border-border pb-4" aria-busy={approving}>
            <p className="text-sm"><strong>{eligible.length} pendientes de aprobación</strong> · <span aria-live="polite">{selectedIds.length} seleccionadas</span></p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={approving || !eligible.length} onClick={() => setSelected(eligible.map((c) => c.id))}>Seleccionar todas</Button>
              <Button variant="outline" disabled={approving || !selectedIds.length} onClick={() => setSelected([])}>Deseleccionar todas</Button>
              <Button disabled={approving || !selectedIds.length} onClick={() => setApprovalIds(selectedIds)}>Aprobar seleccionadas ({selectedIds.length})</Button>
              <Button disabled={approving || !eligible.length} onClick={() => setApprovalIds(eligible.map((c) => c.id))}>Aprobar todas las pendientes ({eligible.length})</Button>
            </div>
          </div>
          <AlertDialog open={approvalIds.length > 0} onOpenChange={(open) => { if (!open && !approving) setApprovalIds([]); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Aprobar {approvalIds.length} propuestas?</AlertDialogTitle>
                <AlertDialogDescription>Confirma solo si has comprobado sus fuentes. Se conservará la postura registrada de cada partido y las propuestas pasarán a verificadas, disponibles para los juegos. Cada aprobación quedará en el Historial privado. Este botón no comprueba por sí mismo si la información es correcta.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={approving}>Cancelar</AlertDialogCancel>
                <Button disabled={approving} onClick={() => void confirmApproval()}>{approving ? "Aprobando…" : "Confirmar aprobación"}</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Card>
            <h2 className="text-xl font-semibold">Añadir propuesta con evidencia</h2>
            <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const v = fd(e); const form = e.currentTarget;
              const row = { party_id: v("party_id"), topic_id: v("topic_id"), title: v("title"), claim_text: v("claim_text"), position: v("position"), evidence_type: v("evidence_type"), source_id: nul(v("source_id")), source_url: v("source_url"), page_or_section: v("page_or_section"), quote_or_paraphrase: v("quote_or_paraphrase"), review_status: v("review_status"), checked_at: today() };
              save("claim", v("title"), "create", v("reason"), () => supabase.from("claims").insert(row), row).then(() => form.reset()); }}>
              <L label="Partido"><Sel name="party_id" value={parties[0]?.id ?? ""} options={partyOpts} /></L>
              <L label="Tema"><Sel name="topic_id" value={topics[0]?.id ?? ""} options={topicOpts} /></L>
              <L label="Título de la propuesta"><input name="title" required className={field} /></L>
              <L label="Posición"><Sel name="position" value="supports" options={POSITION} /></L>
              <L label="Resumen neutral"><textarea name="claim_text" required className={field} /></L>
              <L label="Cita literal o paráfrasis"><Sel name="quote_or_paraphrase" value="paraphrase" options={{ paraphrase: "Paráfrasis", quote: "Cita literal" }} /></L>
              <L label="Tipo de evidencia"><Sel name="evidence_type" value="official_programme_2026" options={EVIDENCE_TYPE} /></L>
              <L label="URL de la fuente"><input name="source_url" type="url" required className={field} /></L>
              <L label="Página o sección"><input name="page_or_section" required className={field} /></L>
              <L label="Fuente registrada"><Sel name="source_id" value="" options={sourceOpts} /></L>
              <L label="Revisión"><Sel name="review_status" value="needs_second_review" options={REVIEW_STATUS} /></L>
              <L label="Motivo"><input name="reason" required className={field} /></L>
              <div><button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Añadir</button></div>
            </form>
          </Card>
          {claims.map((c) => (
            <Card key={c.id} className="p-4">
              <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); const v = fd(e);
                const changes = { review_status: v("review_status"), position: v("position"), checked_at: today() };
                save("claim", c.id, "update", v("reason"), () => supabase.from("claims").update(changes).eq("id", c.id), changes); }}>
                <div className="flex w-full items-start gap-3">
                  <input type="checkbox" className="mt-1 size-4 shrink-0 accent-primary" aria-label={`Seleccionar ${partyOpts[c.party_id]} · ${c.title}`} checked={selectedIds.includes(c.id)} disabled={approving || !canApproveClaim(c)} onChange={(e) => setSelected((ids) => e.target.checked ? [...ids, c.id] : ids.filter((id) => id !== c.id))} />
                  <div><p className="font-medium">{partyOpts[c.party_id]} · {c.title}</p><p className="text-xs text-muted-foreground">{REVIEW_STATUS[c.review_status] ?? c.review_status}{!c.source_url && " · Falta fuente: no se puede aprobar en grupo"}</p></div>
                </div>
                <div className="w-full rounded-xl bg-secondary/60 p-3 text-sm">
                  <p>{c.claim_text}</p>
                  <p className="mt-1 text-muted-foreground">Posición registrada: <strong>{POSITION[c.position] ?? c.position}</strong>{c.page_or_section && ` · ${c.page_or_section}`}</p>
                  {c.source_url && <a href={c.source_url} target="_blank" rel="noreferrer" className="mt-1 inline-block underline">Ver fuente oficial</a>}
                </div>
                {canApproveClaim(c) && (
                  <Button type="button" disabled={approving} onClick={() => setApprovalIds([c.id])}>
                    Aprobar propuesta
                  </Button>
                )}
                <details className="w-full">
                <summary className="cursor-pointer text-sm text-muted-foreground">Editar revisión, postura o nota del cambio</summary>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                <div className="min-w-40 flex-1"><L label="Revisión"><Sel name="review_status" value={c.review_status} options={REVIEW_STATUS} /></L></div>
                <div className="min-w-40 flex-1"><L label="Postura del partido"><Sel name="position" value={c.position} options={POSITION} /></L></div>
                <div className="min-w-40 flex-1"><L label="Nota del cambio (Historial privado)"><input name="reason" required className={field} /></L></div>
                <Button disabled={approving}>Guardar</Button>
                </div>
                </details>
              </form>
            </Card>
          ))}
        </div>
      )}

      {tab === "fuentes" && (
        <Card className="mt-6">
          <h2 className="text-xl font-semibold">Registrar fuente</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const v = fd(e); const form = e.currentTarget;
            const row = { id: v("id"), title: v("title"), url: v("url"), publisher: nul(v("publisher")), source_type: v("source_type"), reliability: v("reliability"), last_checked: today() };
            save("source", v("id"), "create", v("reason"), () => supabase.from("sources").insert(row), row).then(() => form.reset()); }}>
            <L label="Identificador (sin espacios)"><input name="id" required pattern="[a-z0-9_]+" className={field} /></L>
            <L label="Título"><input name="title" required className={field} /></L>
            <L label="URL"><input name="url" type="url" required className={field} /></L>
            <L label="Editor"><input name="publisher" className={field} /></L>
            <L label="Tipo"><Sel name="source_type" value="official_party_source" options={{ official_legal_source: "Fuente legal oficial (BOE…)", official_electoral_information: "Información electoral oficial", official_party_source: "Web oficial del partido", independent_secondary_tracker: "Seguimiento secundario" }} /></L>
            <L label="Fiabilidad"><Sel name="reliability" value="primary" options={{ primary: "Primaria", secondary: "Secundaria" }} /></L>
            <L label="Motivo"><input name="reason" required className={field} /></L>
            <div className="flex items-end"><button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Registrar</button></div>
          </form>
        </Card>
      )}

      {tab === "avisos" && <Candidates userId={userId} partyOpts={partyOpts} />}
    </div>
  );
}

function Candidates({ userId, partyOpts }: { userId: string; partyOpts: Record<string, string> }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["update_candidates"],
    queryFn: async () => (await supabase.from("update_candidates").select("*").eq("review_status", "pending").order("detected_at", { ascending: false })).data ?? [],
  });
  async function mark(id: string, review_status: string) {
    const { error } = await supabase.from("update_candidates").update({ review_status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("change_log").insert({ entity: "update_candidate", entity_id: id, action: review_status, reason: "Revisión de aviso automático", changed_by: userId });
    qc.invalidateQueries({ queryKey: ["update_candidates"] });
  }
  async function publish(c: (typeof data)[number], partyId: string, kind: string, reason: string) {
    if (!partyOpts[partyId]) { toast.error("Elige un partido registrado."); return; }
    if (!reason.trim()) { toast.error("Indica cómo lo has comprobado."); return; }
    const row = { party_id: partyId, title: c.title, election: c.election ?? "Generales 2026", kind, url: c.document_url!, language: "es", checked_at: today() };
    const { error } = await supabase.from("programme_documents").insert(row);
    if (error) { toast.error(error.message); return; }
    await supabase.from("update_candidates").update({ review_status: "reviewed" }).eq("id", c.id);
    if (kind === "full_2026") await supabase.from("parties").update({ programme_2026_status: "published_full_2026", last_checked: today() }).eq("id", partyId);
    await supabase.from("change_log").insert({ entity: "document", entity_id: c.title, action: "verify_candidate", reason, changed_by: userId, changes: row as never });
    toast.success("Programa verificado y publicado.");
    qc.invalidateQueries();
  }
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-muted-foreground">La revisión está programada cada día a las 06:00 UTC (07:00 en Madrid en invierno). Omite documentos ya publicados. Consulta Programas en Claro y, además, la web oficial y la página de programas de cada partido registrado, buscando programas, manifiestos y propuestas de 2026. Puede detectar enlaces que no sean programas: abre el documento, comprueba la fuente y el año, elige el tipo y pulsa «Publicar», o «Descartar». Nada se publica sin tu confirmación.</p>
      {data.length === 0 && <Card>No hay avisos pendientes.</Card>}
      {data.map((c) => (
        <Card key={c.id} className="p-4">
          <p className="font-medium">{c.party_name ?? c.party_id} · {c.title} · {c.election}</p>
          <p className="text-sm text-muted-foreground">Estado: {c.status_label ?? "—"} · Detectado: {new Date(c.detected_at).toLocaleDateString("es-ES")}</p>
          {c.document_url && <a href={c.document_url} target="_blank" rel="noreferrer" className="text-sm underline">Ver documento</a>}
          {c.document_url ? (
            <form className="mt-3 grid gap-2 md:grid-cols-4" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); void publish(c, String(f.get("party_id")), String(f.get("kind")), String(f.get("reason") ?? "")); }}>
              {partyOpts[localPartyId(c.party_id) ?? ""] ? (
                <><input type="hidden" name="party_id" value={localPartyId(c.party_id)!} /><p className="self-center text-sm">Partido: <strong>{partyOpts[localPartyId(c.party_id)!]}</strong></p></>
              ) : (
                <Sel name="party_id" value="" options={{ "": "Elige partido…", ...partyOpts }} />
              )}
              <Sel name="kind" value={c.origin === "web_oficial" ? suggestKind(c.title, c.document_url) : "historical_2023"} options={DOC_KIND} />
              <input name="reason" required defaultValue="Verificado por la editora con fuente oficial" title="Nota para el historial interno (puedes cambiarla)" className={field} />
              <button className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">Publicar</button>
            </form>
          ) : <p className="mt-2 text-sm text-muted-foreground">Sin enlace reconocido: añádelo a mano en «Documentos».</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={() => mark(c.id, "reviewed")} className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">Revisado</button>
            <button onClick={() => mark(c.id, "dismissed")} className="rounded-full border border-input px-4 py-1.5 text-sm">Descartar</button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ChangeLog() {
  const { data = [] } = useQuery(changeLogQuery);
  return (
    <Card className="mt-6">
      <h2 className="text-xl font-semibold">Historial de cambios</h2>
      {data.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Sin cambios registrados.</p> : (
        <ul className="mt-3 space-y-2 text-sm">
          {data.map((l) => <li key={l.id}><span className="text-muted-foreground">{new Date(l.created_at).toLocaleString("es-ES")}</span> · {l.action} {l.entity} «{l.entity_id}»{l.reason && ` — ${l.reason}`}</li>)}
        </ul>
      )}
    </Card>
  );
}
