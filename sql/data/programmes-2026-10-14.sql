-- Replay after schema migrations when moving the project to another host.
BEGIN;
INSERT INTO public.sources(id,title,url,publisher,source_type,reliability,last_checked)
VALUES ('upn_acuerdo_programa_2026','UPN y PP: principio de acuerdo y redacción pendiente del programa conjunto','https://www.upn.org/upn-y-pp-alcanzan-un-principio-de-acuerdo-para-concurrir-juntos-a-las-elecciones-generales/','Unión del Pueblo Navarro','official_party_source','primary_for_what_the_party_publishes','2026-10-14')
ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,url=EXCLUDED.url,last_checked=EXCLUDED.last_checked;
INSERT INTO public.programme_documents(id,party_id,title,election,kind,url,source_id,published_at,checked_at)
VALUES ('b01b5d8d-0ef2-4afd-8ea7-1b9877bef311','upn','Principio de acuerdo UPN–PP: programa conjunto pendiente de redacción','Generales 2026','official_statement_2026','https://www.upn.org/upn-y-pp-alcanzan-un-principio-de-acuerdo-para-concurrir-juntos-a-las-elecciones-generales/','upn_acuerdo_programa_2026','2026-10-13','2026-10-14')
ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,checked_at=EXCLUDED.checked_at;
UPDATE public.sources SET last_checked='2026-10-14' WHERE id IN ('pp_programme_2023','democracia21_home');
UPDATE public.programme_documents SET checked_at='2026-10-14' WHERE source_id IN ('pp_programme_2023','democracia21_home');
INSERT INTO public.change_log(entity,entity_id,action,reason,changes)
SELECT 'programme_documents','upn_acuerdo_programa_2026','update','Consulta directa de fuentes oficiales el 14/10/2026. Comunicado UPN separado de programas electorales; se conserva PP 2023 como histórico y Democracia21 como manifiesto parcial. No se han marcado propuestas como verificadas por una persona.', '{"added":"official_statement_2026","source":"https://www.upn.org/upn-y-pp-alcanzan-un-principio-de-acuerdo-para-concurrir-juntos-a-las-elecciones-generales/","checked_sources":["pp_programme_2023","democracia21_home"]}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.change_log WHERE entity_id='upn_acuerdo_programa_2026' AND action='update');
COMMIT;