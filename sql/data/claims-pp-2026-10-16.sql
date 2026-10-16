-- Propuesta debatible extraída del documento oficial del PP «Hablemos Claro» (11 oct 2026).
INSERT INTO public.claims (id, party_id, topic_id, title, claim_text, position, evidence_type, source_id, source_url, page_or_section, quote_or_paraphrase, checked_at, review_status)
VALUES (
  'pp-2026-million-homes', 'pp', 'vivienda',
  'Construir un millón de viviendas',
  'Impulsar la construcción de un millón de viviendas y dar seguridad jurídica, en lugar de mantener los decretos de vivienda del Gobierno.',
  'supports', 'official_manifesto_or_partial_proposals', 'pp_hablemos_claro_2026',
  'https://www.pp.es/wp-content/uploads/2026/10/2026-10-10-HC-ORDEN-SEGURIDAD-Y-PROSPERIDAD.pdf',
  'Hablemos Claro, 11 oct 2026 · «Su fracaso en vivienda acaba el 29-N»', 'paraphrase', '2026-10-16', 'needs_second_review'
) ON CONFLICT (id) DO NOTHING;
