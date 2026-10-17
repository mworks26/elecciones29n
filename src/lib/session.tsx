import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Ctx = { session: Session | null; ready: boolean };
const SessionCtx = createContext<Ctx>({ session: null, ready: false });

export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [state, setState] = useState<Ctx>({ session: null, ready: false });
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setState({ session: s, ready: true });
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") qc.invalidateQueries({ queryKey: ["me"] });
      if (event === "SIGNED_OUT") toast.success("Has cerrado la sesión correctamente.");
    });
    supabase.auth.getSession().then(({ data: d }) => setState({ session: d.session, ready: true }));
    return () => data.subscription.unsubscribe();
  }, [qc]);
  return <SessionCtx.Provider value={state}>{children}</SessionCtx.Provider>;
}

export const useSession = () => useContext(SessionCtx);

export type UserData = { sync_enabled: boolean; game: unknown; chat: unknown };

/** The signed-in user's synced data row (null when signed out or never saved). */
export function useUserData() {
  const { session } = useSession();
  const uid = session?.user.id;
  return useQuery({
    queryKey: ["me", "user_data", uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return null;
      const { data, error } = await supabase.from("user_data").select("sync_enabled, game, chat").eq("user_id", uid).maybeSingle();
      if (error) throw new Error(error.message);
      return (data as UserData | null) ?? null;
    },
  });
}

export async function saveUserField(userId: string, field: "game" | "chat", value: unknown) {
  const { error } = await supabase.from("user_data").update((field === "game" ? { game: value as never } : { chat: value as never })).eq("user_id", userId).eq("sync_enabled", true);
  if (error) throw new Error(error.message);
}

export function useFavorites() {
  const { session } = useSession();
  const uid = session?.user.id;
  return useQuery({
    queryKey: ["me", "favorites", uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return new Set<string>();
      const { data, error } = await supabase.from("user_favorites").select("claim_id").eq("user_id", uid);
      if (error) throw new Error(error.message);
      return new Set((data ?? []).map((r) => r.claim_id));
    },
  });
}
