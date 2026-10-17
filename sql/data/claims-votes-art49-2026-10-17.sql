-- Reforma del artículo 49 de la Constitución, Pleno del Congreso 18/01/2024 (312 a favor, 32 en contra).
INSERT INTO claims (id, party_id, topic_id, title, claim_text, position, evidence_type, source_id, source_url, page_or_section, checked_at, review_status)
SELECT 'vote_art49_' || p, p, 'igualdad_derechos',
  'Reforma del artículo 49 de la Constitución (personas con discapacidad, 18/01/2024)',
  CASE WHEN p = 'vox' THEN 'Votó en contra de la reforma que sustituye «disminuidos» por «personas con discapacidad» (312 votos a favor, 32 en contra).'
       ELSE 'Votó a favor de la reforma que sustituye «disminuidos» por «personas con discapacidad» (312 votos a favor, 32 en contra).' END,
  CASE WHEN p = 'vox' THEN 'opposes' ELSE 'supports' END,
  'congress_vote', 'congreso_votaciones', 'https://www.congreso.es/es/votaciones', 'Pleno 18/01/2024', DATE '2026-10-17', 'needs_second_review'
FROM unnest(ARRAY['psoe','pp','vox','sumar','erc','junts','ehbildu','pnv','podemos','bng','cc','upn']) AS p
ON CONFLICT (id) DO NOTHING;
