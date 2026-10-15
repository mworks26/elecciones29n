-- Replay after schema migrations. Direct official source consultation, not human claim verification.
BEGIN;
INSERT INTO public.sources(id,title,url,publisher,source_type,reliability,last_checked)
VALUES ('pp_hablemos_claro_2026','PP — Hablemos Claro: Orden, seguridad y prosperidad','https://www.pp.es/wp-content/uploads/2026/10/2026-10-10-HC-ORDEN-SEGURIDAD-Y-PROSPERIDAD.pdf','Partido Popular','official_party_source','primary_for_what_the_party_publishes','2026-10-15')
ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,url=EXCLUDED.url,last_checked=EXCLUDED.last_checked;
INSERT INTO public.programme_documents(id,party_id,title,election,kind,url,source_id,published_at,checked_at)
VALUES ('774b3052-ab7f-4467-bc17-cfbfe608c384','pp','Hablemos Claro: Orden, seguridad y prosperidad — propuestas parciales, no programa íntegro','Generales 2026','partial_2026','https://www.pp.es/wp-content/uploads/2026/10/2026-10-10-HC-ORDEN-SEGURIDAD-Y-PROSPERIDAD.pdf','pp_hablemos_claro_2026','2026-10-11','2026-10-15')
ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,checked_at=EXCLUDED.checked_at;
UPDATE public.parties SET programme_2026_status='published_partial_2026',last_checked='2026-10-15',notes='Se ha consultado el PDF oficial Hablemos Claro, cuya cabecera indica 11 de octubre aunque la URL contiene 10 de octubre. Contiene propuestas parciales; no se ha identificado un programa íntegro en esta consulta. Se conserva el programa de 2023 como contexto histórico.' WHERE id='pp';
UPDATE public.sources SET last_checked='2026-10-15' WHERE id IN ('democracia21_home','upn_acuerdo_programa_2026');
UPDATE public.programme_documents SET checked_at='2026-10-15' WHERE source_id IN ('democracia21_home','upn_acuerdo_programa_2026');
UPDATE public.parties SET last_checked='2026-10-15' WHERE id IN ('democracia21','upn');
INSERT INTO public.change_log(entity,entity_id,action,reason,changes)
SELECT 'programme_documents','pp_hablemos_claro_2026','update','Consulta directa de fuentes oficiales el 15/10/2026: PDF PP con propuestas parciales y cabecera de 11 de octubre, manifiesto Democracia21 y comunicado UPN. No se modifica la revisión de ninguna propuesta ni se confirma una candidatura.','{"added":"partial_2026","checked_sources":["pp_hablemos_claro_2026","democracia21_home","upn_acuerdo_programa_2026"],"human_claim_verification":false}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.change_log WHERE entity_id='pp_hablemos_claro_2026' AND action='update');
COMMIT;