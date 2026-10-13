import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites, useSession } from "@/lib/session";

export function FavoriteButton({ claimId }: { claimId: string }) {
  const { session } = useSession();
  const { data: favs } = useFavorites();
  const qc = useQueryClient();
  if (!session) {
    return <Link to="/auth" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"><Bookmark className="size-3.5" /> Entra para guardar</Link>;
  }
  const saved = favs?.has(claimId) ?? false;
  const toggle = async () => {
    const { error } = saved
      ? await supabase.from("user_favorites").delete().eq("user_id", session.user.id).eq("claim_id", claimId)
      : await supabase.from("user_favorites").insert({ user_id: session.user.id, claim_id: claimId });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["me", "favorites"] });
  };
  return (
    <button onClick={toggle} aria-pressed={saved} className="inline-flex items-center gap-1 rounded-full border border-input bg-card px-2.5 py-1 text-xs font-medium hover:bg-secondary">
      {saved ? <BookmarkCheck className="size-3.5 text-accent" /> : <Bookmark className="size-3.5" />}
      {saved ? "Guardada" : "Guardar"}
    </button>
  );
}
