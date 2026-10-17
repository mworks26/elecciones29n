-- Official Congress vote totals (verified against congreso.es) stored on congress_vote claims.
update public.claims set quote_or_paraphrase = 'Resultado oficial: 177 sí, 172 no, 0 abstenciones (Congreso, nota de prensa 30/05/2024)'
  where evidence_type = 'congress_vote' and title like 'Ley de amnistía%';
update public.claims set quote_or_paraphrase = 'Resultado oficial: 312 sí, 32 no, 0 abstenciones (Diario de Sesiones del Congreso, 18/01/2024)'
  where evidence_type = 'congress_vote' and title like 'Reforma del artículo 49%';
update public.claims set quote_or_paraphrase = 'Resultado oficial de las enmiendas de devolución: 178 sí, 170 no, 0 abstenciones (Congreso, votación 10/09/2025)'
  where evidence_type = 'congress_vote' and title like 'Reducción de la jornada%';
update public.banners set title = 'Banner' where title = 'Banner de prueba';
