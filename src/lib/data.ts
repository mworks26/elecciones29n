import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function run<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const partiesQuery = queryOptions({
  queryKey: ["parties"],
  queryFn: () => run(supabase.from("parties").select("*").order("name")),
});
export const topicsQuery = queryOptions({
  queryKey: ["topics"],
  queryFn: () => run(supabase.from("topics").select("*").order("label")),
});
export const sourcesQuery = queryOptions({
  queryKey: ["sources"],
  queryFn: () => run(supabase.from("sources").select("*").order("title")),
});
export const documentsQuery = queryOptions({
  queryKey: ["documents"],
  queryFn: () => run(supabase.from("programme_documents").select("*").order("election", { ascending: false })),
});
export const claimsQuery = queryOptions({
  queryKey: ["claims"],
  queryFn: () => run(supabase.from("claims").select("*").order("title")),
});
export const changeLogQuery = queryOptions({
  queryKey: ["change_log"],
  queryFn: () => run(supabase.from("change_log").select("*").order("created_at", { ascending: false }).limit(50)),
});
