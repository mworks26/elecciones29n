import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Card } from "@/components/site";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar o registrarse — Elecciones 2026" },
      { name: "description", content: "Crea una cuenta para guardar tus resultados, propuestas favoritas y conversaciones." },
      { property: "og:title", content: "Entrar o registrarse — Elecciones 2026" },
      { property: "og:description", content: "Guarda tus preferencias en cualquier dispositivo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const field = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm";

function AuthPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const [justSignedIn, setJustSignedIn] = useState(false);
  useEffect(() => { if (session && justSignedIn) navigate({ to: "/cuenta", replace: true }); }, [session, justSignedIn, navigate]);

  if (session && !justSignedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <Card>
          <h1 className="text-3xl font-semibold">Ya tienes una sesión abierta</h1>
          <p className="mt-2 text-sm text-muted-foreground">Has entrado como {session.user.email}. Para crear o usar otra cuenta, cierra antes esta sesión.</p>
          <button onClick={() => supabase.auth.signOut()} className="mt-5 w-full rounded-full bg-primary py-2.5 font-semibold text-primary-foreground">Cerrar sesión</button>
          <button onClick={() => navigate({ to: "/cuenta" })} className="mt-2 w-full rounded-full border border-input bg-card py-2.5 text-sm font-semibold">Ir a mi cuenta</button>
        </Card>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Te hemos enviado un enlace para cambiar la contraseña.");
      } else if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast.success("Revisa tu correo para confirmar la cuenta.");
      } else {
        setJustSignedIn(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setJustSignedIn(false); throw error; }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se ha podido completar.");
    } finally {
      setBusy(false);
    }
  };

  const social = async (provider: "google" | "apple" | "microsoft") => {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) toast.error(result.error.message ?? "No se ha podido iniciar sesión.");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <Card>
        <h1 className="text-3xl font-semibold">{mode === "up" ? "Crear cuenta" : mode === "reset" ? "Recuperar contraseña" : "Entrar"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Con una cuenta puedes guardar tus resultados, propuestas favoritas y conversaciones. Solo se guardan si das tu permiso.</p>
        {mode !== "reset" && (
          <div className="mt-6 grid gap-2">
            {([["google", "Continuar con Google"], ["apple", "Continuar con Apple"], ["microsoft", "Continuar con Microsoft"]] as const).map(([p, l]) => (
              <button key={p} onClick={() => social(p)} className="rounded-full border border-input bg-card py-2.5 text-sm font-semibold hover:bg-secondary">{l}</button>
            ))}
            <p className="my-2 text-center text-xs text-muted-foreground">o con tu correo</p>
          </div>
        )}
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm">Correo<input type="email" required autoComplete="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {mode !== "reset" && (
            <label className="block text-sm">Contraseña<input type="password" required minLength={8} autoComplete={mode === "up" ? "new-password" : "current-password"} className={field} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          )}
          <button disabled={busy} className="w-full rounded-full bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-60">
            {mode === "up" ? "Crear cuenta" : mode === "reset" ? "Enviar enlace" : "Entrar"}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
          <button className="underline" onClick={() => setMode(mode === "up" ? "in" : "up")}>{mode === "up" ? "Ya tengo cuenta" : "Crear una cuenta"}</button>
          {mode !== "reset" ? <button className="underline" onClick={() => setMode("reset")}>He olvidado la contraseña</button> : <button className="underline" onClick={() => setMode("in")}>Volver</button>}
        </div>
      </Card>
    </div>
  );
}
