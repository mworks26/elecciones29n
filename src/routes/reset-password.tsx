import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/site";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nueva contraseña — Elecciones 2026" },
      { name: "description", content: "Elige una nueva contraseña para tu cuenta." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Nueva contraseña — Elecciones 2026" },
      { property: "og:description", content: "Cambia la contraseña de tu cuenta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { toast.error(error.message); return; }
    toast.success("Contraseña actualizada.");
    navigate({ to: "/cuenta" });
  };
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <Card>
        <h1 className="text-3xl font-semibold">Nueva contraseña</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block text-sm">Contraseña nueva<input type="password" required minLength={8} autoComplete="new-password" className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button className="w-full rounded-full bg-primary py-2.5 font-semibold text-primary-foreground">Guardar</button>
        </form>
      </Card>
    </div>
  );
}
