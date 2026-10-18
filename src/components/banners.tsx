import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/site";

type Banner = { id: string; title: string; media_type: string; media_url: string; target_url: string; alt_text: string | null; is_active: boolean; sort_order: number };

const isVideo = (b: Banner) => b.media_type === "video" || /\.(mp4|webm|ogg)(\?|$)/i.test(b.media_url);

function Media({ b, className }: { b: Banner; className: string }) {
  return isVideo(b)
    ? <video src={b.media_url} autoPlay loop muted playsInline aria-label={b.alt_text ?? b.title} className={className} />
    : <img src={b.media_url} alt={b.alt_text ?? b.title} loading="lazy" className={className} />;
}

export function BannerRow() {
  const { data = [] } = useQuery({
    queryKey: ["banners", "public"],
    queryFn: async () => {
      const { data } = await supabase.from("banners").select("*").eq("is_active", true).order("sort_order");
      return (data ?? []) as Banner[];
    },
  });
  if (!data.length) return null;
  return (
    <aside aria-label="Publicidad" className="border-b border-border bg-secondary/80 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-2 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {data.map((b) => (
            <a key={b.id} href={b.target_url} target="_blank" rel="noopener noreferrer sponsored" title={b.title}
              className="block h-10 w-40 shrink-0 overflow-hidden rounded-md border border-border bg-card md:w-48">
              <Media b={b} className="h-full w-full object-contain" />
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}

const field = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";

export function BannerAdmin({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["banners", "admin"],
    queryFn: async () => ((await supabase.from("banners").select("*").order("sort_order")).data ?? []) as Banner[],
  });
  const log = (id: string, action: string, changes: unknown) =>
    supabase.from("change_log").insert({ entity: "banner", entity_id: id, action, reason: "Gestión de banners", changed_by: userId, changes: changes as never });
  const refresh = () => qc.invalidateQueries({ queryKey: ["banners"] });

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const row = {
      title: String(f.get("title")), media_type: String(f.get("media_type")), media_url: String(f.get("media_url")).trim(),
      target_url: String(f.get("target_url")).trim(), alt_text: String(f.get("alt_text") || "") || null, sort_order: Number(f.get("sort_order") || 0),
    };
    if (!/^https?:\/\//.test(row.media_url) || !/^https?:\/\//.test(row.target_url)) { toast.error("Los enlaces deben empezar por http:// o https://"); return; }
    const { data: ins, error } = await supabase.from("banners").insert(row).select("id").single();
    if (error) { toast.error(error.message); return; }
    await log(ins.id, "create", row);
    toast.success("Banner añadido.");
    form.reset(); refresh();
  }
  async function toggle(b: Banner) {
    const { error } = await supabase.from("banners").update({ is_active: !b.is_active }).eq("id", b.id);
    if (error) { toast.error(error.message); return; }
    await log(b.id, b.is_active ? "pause" : "activate", { is_active: !b.is_active }); refresh();
  }
  async function remove(b: Banner) {
    if (!confirm(`¿Eliminar el banner «${b.title}»?`)) return;
    const { error } = await supabase.from("banners").delete().eq("id", b.id);
    if (error) { toast.error(error.message); return; }
    await log(b.id, "delete", b); refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      <Card>
        <h2 className="text-xl font-semibold">Añadir banner</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pega el enlace de la imagen, vídeo (MP4/WebM) o animación (GIF/WebP) y la página del anunciante. Todos los banners activos se muestran a la vez, uno al lado del otro, en una franja fija bajo el menú (caben 5 o más). Formato recomendado: horizontal, proporción 5:1 (p. ej. 400×80 px). El «Orden» decide la posición: 1 = primero a la izquierda.</p>
        {data.some((b) => b.is_active) && (
          <div className="mt-4 rounded-xl border border-border bg-secondary/80 p-2">
            <p className="mb-1 text-xs text-muted-foreground">Vista previa de la franja</p>
            <div className="flex gap-2 overflow-x-auto">{data.filter((b) => b.is_active).map((b) => (
              <div key={b.id} className="h-7 w-40 shrink-0 overflow-hidden rounded-md border border-border bg-card"><Media b={b} className="h-full w-full object-contain" /></div>))}</div>
          </div>
        )}
        <form onSubmit={add} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm"><span className="mb-1 block font-medium">Anunciante / nombre</span><input name="title" required className={field} /></label>
          <label className="text-sm"><span className="mb-1 block font-medium">Tipo</span>
            <select name="media_type" className={field}><option value="image">Imagen</option><option value="video">Vídeo</option><option value="animation">Animación (GIF/WebP)</option></select></label>
          <label className="text-sm"><span className="mb-1 block font-medium">Enlace de la imagen / vídeo / animación</span><input name="media_url" type="url" required placeholder="https://..." className={field} /></label>
          <label className="text-sm"><span className="mb-1 block font-medium">Página del anunciante (al hacer clic)</span><input name="target_url" type="url" required placeholder="https://..." className={field} /></label>
          <label className="text-sm"><span className="mb-1 block font-medium">Descripción para accesibilidad</span><input name="alt_text" className={field} /></label>
          <label className="text-sm"><span className="mb-1 block font-medium">Orden</span><input name="sort_order" type="number" defaultValue={0} className={field} /></label>
          <div><button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Añadir banner</button></div>
        </form>
      </Card>
      {data.map((b) => (
        <Card key={b.id} className="flex flex-wrap items-center gap-4 p-4">
          <div className="h-16 w-48 overflow-hidden rounded-lg bg-secondary"><Media b={b} className="h-full w-full object-contain" /></div>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold">{b.title} {b.is_active ? "· Activo" : "· Pausado"}</p>
            <a href={b.target_url} target="_blank" rel="noopener noreferrer" className="break-all text-muted-foreground underline">{b.target_url}</a>
          </div>
          <button onClick={() => toggle(b)} className="rounded-full border border-input px-4 py-1.5 text-sm">{b.is_active ? "Pausar" : "Activar"}</button>
          <button onClick={() => remove(b)} className="rounded-full border border-destructive px-4 py-1.5 text-sm text-destructive">Eliminar</button>
        </Card>
      ))}
    </div>
  );
}
