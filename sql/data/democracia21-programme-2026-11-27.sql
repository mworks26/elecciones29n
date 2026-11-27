INSERT INTO programme_documents (id, party_id, title, election, kind, url, language, checked_at)
VALUES ('5b0c1d8e-2a6f-5d3e-9c41-d21a29112026', 'democracia21', 'La España que merecemos · Programa Electoral Elecciones Generales · 29N', 'Generales 2026', 'full_2026', 'https://mi.democracia21.es/docs/programa/programa-democracia21.pdf', 'es', '2026-11-27')
ON CONFLICT (id) DO NOTHING;
UPDATE parties SET programme_2026_status = 'published_full_2026', last_checked = '2026-11-27',
  notes = 'Programa electoral oficial de 108 páginas para las Generales del 29N publicado en mi.democracia21.es.'
WHERE id = 'democracia21';
