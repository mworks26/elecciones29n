CREATE TABLE public.user_data (
  user_id uuid PRIMARY KEY,
  sync_enabled boolean NOT NULL DEFAULT false,
  consented_at timestamptz,
  game jsonb,
  chat jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_data TO authenticated;
GRANT ALL ON public.user_data TO service_role;
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own data select" ON public.user_data FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own data insert" ON public.user_data FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own data update" ON public.user_data FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own data delete" ON public.user_data FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.user_favorites (
  user_id uuid NOT NULL,
  claim_id text NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, claim_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_favorites TO authenticated;
GRANT ALL ON public.user_favorites TO service_role;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own favs select" ON public.user_favorites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own favs insert" ON public.user_favorites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own favs delete" ON public.user_favorites FOR DELETE TO authenticated USING (user_id = auth.uid());