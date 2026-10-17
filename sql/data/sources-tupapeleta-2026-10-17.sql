INSERT INTO public.sources (id, title, url, publisher, source_type, reliability, last_checked) VALUES
 ('tracker_tupapeleta_programas','Resúmenes de programas electorales — TuPapeleta','https://tupapeleta.es/programa-electoral/','TuPapeleta.es','independent_secondary_tracker','secondary','2026-10-17'),
 ('guide_tupapeleta_votantes','Guías para votantes — TuPapeleta','https://tupapeleta.es/guias/','TuPapeleta.es','independent_secondary_tracker','secondary','2026-10-17')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sources (id, title, url, publisher, source_type, reliability, last_checked) VALUES
('congreso_votaciones','Votaciones del Pleno — Congreso de los Diputados','https://www.congreso.es/es/opendata/votaciones','Congreso de los Diputados','official_institution','primary','2026-10-17')
ON CONFLICT (id) DO NOTHING;
