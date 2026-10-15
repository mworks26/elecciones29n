-- Replay after schema migrations. Adds parties present in the programme catalogue and maps external IDs to local ones.
BEGIN;
INSERT INTO public.parties(id,name,short_name,official_site,programme_2026_status,candidate_status,notes,last_checked) VALUES
('psc','Partit dels Socialistes de Catalunya','PSC','https://www.socialistes.cat/','not_located_as_of_date','pending_official_candidacy','Concurre federado con el PSOE; documentos anteriores se identifican como históricos.','2026-10-16'),
('pacma','Partido Animalista con el Medio Ambiente','PACMA','https://pacma.es/','not_located_as_of_date','pending_official_candidacy','Documentos de elecciones anteriores se identifican como históricos.','2026-10-16'),
('teruel_existe','Teruel Existe','Teruel Existe','https://www.teruelexiste.info/','not_located_as_of_date','pending_official_candidacy','Documentos de elecciones anteriores se identifican como históricos.','2026-10-16'),
('soria_ya','Soria ¡Ya!','Soria ¡Ya!','https://soriaya.org/','not_located_as_of_date','pending_official_candidacy','Documentos de elecciones anteriores se identifican como históricos.','2026-10-16')
ON CONFLICT(id) DO NOTHING;
UPDATE public.update_candidates SET party_id = CASE party_id
  WHEN 'eh-bildu' THEN 'ehbildu' WHEN 'coalicion-canaria' THEN 'cc'
  WHEN 'teruel-existe' THEN 'teruel_existe' WHEN 'soria-ya' THEN 'soria_ya' ELSE party_id END
WHERE party_id IN ('eh-bildu','coalicion-canaria','teruel-existe','soria-ya');
COMMIT;
