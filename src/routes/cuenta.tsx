import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, Notice, PageIntro, SourceLink } from "@/components/site";
import { FavoriteButton } from "@/components/favorite-button";
import { claimsQuery, partiesQuery } from "@/lib/data";
import { useFavorites, useSession, useUserData } from "@/lib/session";
import { GameHistoryList } from "@/components/game-history-list";
import { readGameEnvelope, localGameEnvelope, hasLocalGameConsent, setLocalGameConsent } from "@/lib/game-history";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cuenta")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mi cuenta — Elecciones 2026" },
      { name: "description", content: "Gestiona tus datos guardados, propuestas favoritas y permisos." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Mi cuenta — Elecciones 2026" },
      { property: "og:description", content: "Tus datos, bajo tu control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Cuenta,
});

function Cuenta() {
  const { session, ready } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: ud, isLoading } = useUserData();
  const { data: favs } = useFavorites();
  const claims = useQuery(claimsQuery).data ?? [];
  const parties = useQuery(partiesQuery).data ?? [];

  if (!ready) return null;
  if (!session) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center"><p>Necesitas entrar para ver tu cuenta.</p><Link to="/auth" className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground">Entrar</Link></div>;
  }
  const uid = session.user.id;
  const enabled = ud?.sync_enabled ?? false;

  const setSync = async (on: boolean) => {
    const { error } = on
      ? await supabase.from("user_data").upsert({ user_id: uid, sync_enabled: true, consented_at: new Date().toISOString(), ...(hasLocalGameConsent() && localGameEnvelope() ? { game: localGameEnvelope() as never } : {}) })
      : await supabase.from("user_data").update({ sync_enabled: false, game: null, chat: null }).eq("user_id", uid);
    if (error) { toast.error(error.message); return; }
    if (!on) setLocalGameConsent(false);
    toast.success(on ? "Guardado en tu cuenta activado." : "Guardado desactivado y datos borrados de tu cuenta.");
    qc.invalidateQueries({ queryKey: ["me"] });
  };
  const deleteAll = async () => {
    const a = await supabase.from("user_favorites").delete().eq("user_id", uid);
    const b = await supabase.from("user_data").delete().eq("user_id", uid);
    const error = a.error ?? b.error;
    if (error) { toast.error(error.message); return; }
    setLocalGameConsent(false);
    toast.success("Todos tus datos guardados se han borrado.");
    qc.invalidateQueries({ queryKey: ["me"] });
  };
  const signOut = async () => {
    await qc.cancelQueries();
    qc.removeQueries({ queryKey: ["me"] });
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const favClaims = claims.filter((c) => favs?.has(c.id));

  return (
    <>
      <PageIntro eyebrow="Mi cuenta" title="Tus datos, bajo tu control.">
        Sesión iniciada como {session.user.email}. <button onClick={signOut} className="underline">Cerrar sesión</button>
      </PageIntro>
      <div className="mx-auto grid max-w-5xl gap-6 px-4 md:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-semibold">Guardar en mi cuenta</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Si lo activas, tus resultados de los juegos y tus conversaciones con el asistente se guardarán en tu cuenta para verlos en cualquier dispositivo. Pueden revelar tus preferencias políticas: solo se usan para mostrártelos a ti y puedes borrarlos cuando quieras.
          </p>
          {isLoading ? null : enabled ? (
            <button onClick={() => setSync(false)} className="mt-4 rounded-full border border-input bg-card px-5 py-2.5 text-sm font-semibold">Desactivar y borrar</button>
          ) : (
            <button onClick={() => setSync(true)} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Doy mi permiso y activo el guardado</button>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Estado: {enabled ? "activado" : "desactivado (todo se queda en este navegador)"}</p>
        </Card>
        <Card>
          <h2 className="text-2xl font-semibold">Borrar todo</h2>
          <p className="mt-2 text-sm text-muted-foreground">Elimina tus favoritas, resultados y conversaciones guardadas en tu cuenta.</p>
          <button onClick={deleteAll} className="mt-4 rounded-full border border-destructive px-5 py-2.5 text-sm font-semibold text-destructive">Borrar mis datos</button>
        </Card>
        <Card className="md:col-span-2">
          <h2 className="text-2xl font-semibold">Mi historial de juegos y elecciones</h2>
          <GameHistoryList history={readGameEnvelope(ud?.game)?.history ?? []} />
          <Button asChild variant="outline" className="mt-4 rounded-full"><Link to="/juega">Volver a los juegos</Link></Button>
        </Card>
        <Card className="md:col-span-2">
          <h2 className="text-2xl font-semibold">Propuestas favoritas</h2>
          {favClaims.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Aún no has guardado ninguna. Usa «Guardar» en el comparador o en la ficha de un partido.</p> : (
            <ul className="mt-4 space-y-3">
              {favClaims.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4">
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-sm text-muted-foreground">{parties.find((p) => p.id === c.party_id)?.short_name}</p>
                    {c.source_url && <SourceLink href={c.source_url}>Fuente</SourceLink>}
                  </div>
                  <FavoriteButton claimId={c.id} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="md:col-span-2"><Notice>Tus respuestas nunca se usan para estadísticas ni se comparten.</Notice></div>
      </div>
    </>
  );
}
