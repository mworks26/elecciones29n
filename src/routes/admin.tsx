import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, PageIntro } from "@/components/site";
import { claimsQuery, documentsQuery, partiesQuery, sourcesQuery, topicsQuery } from "@/lib/data";
import { CANDIDATE_STATUS, DOC_KIND, EVIDENCE_TYPE, POSITION, PROGRAMME_STATUS, REVIEW_STATUS } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel editorial — Elecciones 2026" },
      { name: "description", content: "Área privada para actualizar partidos, documentos y propuestas verificadas." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Panel editorial — Elecciones 2026" },
      { property: "og:description", content: "Área privada del equipo editorial." },
    ],
  }),
  component: Admin,
});

const field = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";
const today = () => new Date().toISOString().slice(0, 10);

function Admin() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  const { data: isAdmin } = useQuery({
    queryKey: ["is_admin", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session!.user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  if (session === undefined) return null;
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
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    if (error) { toast.error(error.message); return; }
    if (mode === "up") toast.success("Revisa tu correo para confirmar la cuenta.");
  };
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <h1 className="text-3xl font-semibold">Panel editorial</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acceso solo para el equipo que verifica fuentes.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block text-sm">Correo<input type="email" required className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="block text-sm">Contraseña<input type="password" required minLength={8} className={field} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button className="w-full rounded-full bg-primary py-2.5 font-semibold text-primary-foreground">{mode === "in" ? "Entrar" : "Crear cuenta"}</button>
        </form>
        <button className="mt-3 text-sm underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "Crear una cuenta" : "Ya tengo cuenta"}</button>
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
  const parties = useQuery(partiesQuery).data ?? [];
  const topics = useQuery(topicsQuery).data ?? [];
  const sources = useQuery(sourcesQuery).data ?? [];
  const claims = useQuery(claimsQuery).data ?? [];
  const docs = useQuery(documentsQuery).data ?? [];
  const partyOpts = Object.fromEntries(parties.map((p) => [p.id, p.short_name ?? p.name]));
  const topicOpts = Object.fromEntries(topics.map((t) => [t.id, t.label]));
  const sourceOpts = { "": "—", ...Object.fromEntries(sources.map((s) => [s.id, s.title])) };

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
  const nul = (v?: string) => (v && v("trim")() ? v("trim")() : null);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {([["partidos", "Partidos"], ["documentos", "Documentos"], ["propuestas", "Propuestas"], ["fuentes", "Fuentes"]] as const).map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={cn("rounded-full border px-4 py-1.5 text-sm", tab === id ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card")}>{l}</button>
        ))}
      </div>

      {tab === "partidos" && (
        <div className="mt-6 space-y-4">
          {parties.map((p) => (
            <Card key={p.id} className="p-5">
              <form className="grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const v = fd(e);
                const changes = { programme_2026_status: v("programme_2026_status"), candidate_status: v("candidate_status"), candidacy_source_id: nul(v("candidacy_source_id")), notes: nul(v("notes")), last_checked: today() };
                if (v("candidate_status") === "confirmed_official_candidacy" && !changes.candidacy_source_id) { toast.error("Una candidatura confirmada necesita fuente oficial (BOE o boletín)."); return; }
                save("party", p.id, "update", v("reason"), () => supabase.from("parties").update(changes).eq("id", p.id), changes); }}>
                <p className="font-serif text-xl font-semibold md:col-span-2">{p.name}</p>
                <L label="Programa 2026"><Sel name="programme_2026_status" value={p.programme_2026_status} options={Object.fromEntries(Object.entries(PROGRAMME_STATUS).map(([k, v]) => [k, v("label")]))} /></L>
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
                <p className="w-full font-medium">{partyOpts[c.party_id]} · {c.title}</p>
                <div className="min-w-40 flex-1"><L label="Revisión"><Sel name="review_status" value={c.review_status} options={REVIEW_STATUS} /></L></div>
                <div className="min-w-40 flex-1"><L label="Posición"><Sel name="position" value={c.position} options={POSITION} /></L></div>
                <div className="min-w-40 flex-1"><L label="Motivo"><input name="reason" required className={field} /></L></div>
                <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Guardar</button>
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
    </div>
  );
}
