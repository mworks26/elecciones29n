CREATE TABLE public.update_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  external_id text NOT NULL,
  party_id text,
  party_name text,
  title text NOT NULL,
  election text,
  status_label text,
  document_url text,
  official_source boolean NOT NULL DEFAULT false,
  sha256 text,
  fingerprint text NOT NULL,
  review_status text NOT NULL DEFAULT 'pending',
  detected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (origin, external_id, fingerprint)
);
GRANT SELECT, UPDATE ON public.update_candidates TO authenticated;
GRANT ALL ON public.update_candidates TO service_role;
ALTER TABLE public.update_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read candidates" ON public.update_candidates FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update candidates" ON public.update_candidates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;