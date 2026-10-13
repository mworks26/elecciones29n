CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, UNIQUE(user_id, role));
GRANT SELECT ON public.user_roles TO authenticated; GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.topics (id text PRIMARY KEY, label text NOT NULL);
CREATE TABLE public.sources (id text PRIMARY KEY, title text NOT NULL, url text NOT NULL, publisher text, source_type text NOT NULL, reliability text, last_checked date, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.parties (id text PRIMARY KEY, name text NOT NULL, short_name text, official_site text, programme_archive text,
  programme_2026_status text NOT NULL DEFAULT 'not_located_as_of_date', candidate_status text NOT NULL DEFAULT 'pending_official_candidacy',
  candidacy_source_id text REFERENCES public.sources(id), notes text, last_checked date, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.programme_documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), party_id text NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  title text NOT NULL, election text NOT NULL, kind text NOT NULL, url text NOT NULL, source_id text REFERENCES public.sources(id), language text DEFAULT 'es',
  published_at date, checked_at date, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.claims (id text PRIMARY KEY DEFAULT gen_random_uuid()::text, party_id text NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  topic_id text NOT NULL REFERENCES public.topics(id), published_topic text, title text NOT NULL, claim_text text NOT NULL,
  position text NOT NULL DEFAULT 'not_reviewed', evidence_type text NOT NULL, source_id text REFERENCES public.sources(id), source_url text,
  page_or_section text, quote_or_paraphrase text, checked_at date, review_status text NOT NULL DEFAULT 'auto_extracted_unverified', updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.change_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entity text NOT NULL, entity_id text NOT NULL, action text NOT NULL, reason text, changed_by uuid, changes jsonb, created_at timestamptz NOT NULL DEFAULT now());

GRANT SELECT ON public.topics, public.sources, public.parties, public.programme_documents, public.claims, public.change_log TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.topics, public.sources, public.parties, public.programme_documents, public.claims TO authenticated;
GRANT INSERT ON public.change_log TO authenticated;
GRANT ALL ON public.topics, public.sources, public.parties, public.programme_documents, public.claims, public.change_log TO service_role;

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY; ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY; ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme_documents ENABLE ROW LEVEL SECURITY; ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY; ALTER TABLE public.change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON public.topics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read" ON public.sources FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read" ON public.parties FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read" ON public.programme_documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read reviewed" ON public.claims FOR SELECT TO anon, authenticated USING (review_status IN ('verified_by_human','needs_second_review') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "public read" ON public.change_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write" ON public.topics FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin write" ON public.sources FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin write" ON public.parties FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin write" ON public.programme_documents FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin write" ON public.claims FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin log" ON public.change_log FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') AND changed_by = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_first_admin() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin') THEN INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id,'admin'); END IF; RETURN NEW; END $$;
CREATE TRIGGER on_auth_user_created_admin AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_first_admin();

INSERT INTO public.topics(id,label) VALUES
('vivienda','Vivienda y alquiler'),
('empleo_salarios','Empleo, salarios y jornada'),
('economia_impuestos','Economía, impuestos y gasto público'),
('sanidad','Sanidad y cuidados'),
('educacion','Educación e investigación'),
('pensiones','Pensiones y protección social'),
('clima_energia','Clima, energía y transporte'),
('inmigracion','Inmigración y asilo'),
('justicia_reforma_institucional','Justicia, corrupción e instituciones'),
('igualdad_derechos','Igualdad y derechos civiles'),
('seguridad','Seguridad y defensa'),
('territorio_autogobierno','Modelo territorial y autogobierno'),
('union_europea','Unión Europea y política exterior'),
('agricultura_ruralidad','Agricultura, pesca y reto demográfico'),
('administracion_digital','Administración y digitalización');
INSERT INTO public.sources(id,title,url,publisher,source_type,reliability,last_checked) VALUES
('boe_convocatoria_2026','Real Decreto 806/2026, de 5 de octubre, de disolución de las Cortes y convocatoria de elecciones','https://www.boe.es/eli/es/rd/2026/10/05/806','Boletín Oficial del Estado','official_legal_source','primary','2026-10-13'),
('interior_calendar','Calendario electoral — Infoelectoral','https://infoelectoral.interior.gob.es/es/proceso-electoral/calendario-electoral/index.html','Ministerio del Interior','official_electoral_information','primary','2026-10-13'),
('interior_results','Infoelectoral — resultados electorales y mapa electoral','https://infoelectoral.interior.gob.es/es/elecciones-celebradas/resultados-electorales/','Ministerio del Interior','official_electoral_information','primary','2026-10-13'),
('tracker_aquepartidovoto_2026','Programas electorales 2026 — seguimiento independiente','https://aquepartidovoto.es/programas/','Qué partido voto / Crescere','independent_secondary_tracker','secondary',NULL),
('tracker_generales2026_programmes','Programas electorales de las generales 2026 — seguimiento independiente','https://generales2026.es/programas-electorales/','Generales 2026','independent_secondary_tracker','secondary',NULL),
('democracia21_home','Democracia21 — manifiesto y Tablón de Soluciones','https://democracia21.es/','Democracia21','official_party_source','primary_for_what_the_party_publishes','2026-10-13'),
('pp_programme_2023','Programa electoral PP — generales 2023','https://www.pp.es/storage/2023/07/programa_electoral_pp_23j_feijoo_2023.pdf','Partido Popular','official_party_source','primary_for_what_the_party_publishes','2026-10-13'),
('psoe_programme_2023','Programa electoral PSOE — generales 2023','https://www.psoe.es/media-content/2023/07/PROGRAMA_ELECTORAL-GENERALES-2023.pdf','PSOE','official_party_source','primary_for_what_the_party_publishes','2026-10-13'),
('vox_programme_2023','Programa electoral VOX — generales 2023','https://www.voxespana.es/programa/programa-electoral-Vox','VOX','official_party_source','primary_for_what_the_party_publishes','2026-10-13'),
('sumar_transparency_2023','Transparencia Sumar — referencias a documentación electoral 2023','https://movimientosumar.es/transparencia/','Movimiento Sumar','official_party_source','primary_for_what_the_party_publishes','2026-10-13'),
('erc_programme_2023','Programa electoral ERC — generales 2023','https://static.esquerra.cat/uploads/20230905/e2023-programa.pdf','Esquerra Republicana de Catalunya','official_party_source','primary_for_what_the_party_publishes','2026-10-13'),
('pnv_programme_2023','Programa electoral EAJ-PNV — generales 2023','https://www.eaj-pnv.eus/es/documentos/20945/con-voz-propia-programa-electoral-23-j','EAJ-PNV','official_party_source','primary_for_what_the_party_publishes','2026-10-13'),
('bng_programme_2023','Programa electoral BNG — generales 2023','https://www.bng.gal/media/bnggaliza/files/2023/07/05/23_bng_xerais_programa.pdf','Bloque Nacionalista Galego','official_party_source','primary_for_what_the_party_publishes','2026-10-13'),
('upn_programme_2023','Programa electoral UPN — generales 2023','https://www.upn.org/wp-content/uploads/2023/07/Programa-Generales-23J_V2-1.pdf','Unión del Pueblo Navarro','official_party_source','primary_for_what_the_party_publishes','2026-10-13'),
('fejons_programme_2023','Programa electoral FE de las JONS — generales 2023','https://falange.es/wp-content/uploads/2023/07/Programa-electoral-FE-de-las-JONS.-ELECCIONES-GENERALES-23-JULIO-2023.pdf','Falange Española de las JONS','official_party_source','primary_for_what_the_party_publishes','2026-10-13');
INSERT INTO public.parties(id,name,short_name,official_site,programme_archive,programme_2026_status,candidate_status,notes,last_checked) VALUES
('pp','Partido Popular','PP','https://www.pp.es/',NULL,'not_located_as_of_date','pending_official_candidacy','Entrada de seguimiento; no equivale a candidatura proclamada para 2026.','2026-10-13'),
('psoe','Partido Socialista Obrero Español','PSOE','https://www.psoe.es/','https://www.psoe.es/transparencia/informacion-politica-organizativa/programa/','not_located_as_of_date','pending_official_candidacy','El archivo de programas oficiales contiene documentos de elecciones anteriores. No usar el programa de 2023 como si fuera el de 2026.','2026-10-13'),
('vox','Vox','VOX','https://www.voxespana.es/','https://www.voxespana.es/programa/programa-electoral-Vox','not_located_as_of_date','pending_official_candidacy','La página enlazada corresponde expresamente a las generales de 2023.','2026-10-13'),
('sumar','Movimiento Sumar','Sumar','https://movimientosumar.es/','https://movimientosumar.es/transparencia/','not_located_as_of_date','pending_official_candidacy','No confundir el partido, una alianza o el nombre de una coalición con una candidatura oficial proclamada.','2026-10-13'),
('frente_amplio','Frente Amplio (etiqueta de seguimiento de una posible coalición)','Frente Amplio',NULL,NULL,'not_located_as_of_date','pending_official_candidacy','Figura como formación/coalición monitorizada por una fuente secundaria. No tratarlo como coalición formal ni atribuirle miembros hasta que exista un anuncio oficial verificable y candidatura proclamada.','2026-10-13'),
('podemos','Podemos','Podemos','https://podemos.info/','https://podemos.info/propuestas/','not_located_as_of_date','pending_official_candidacy','La sección de propuestas es fuente primaria para lo publicado allí, pero no debe etiquetarse como programa electoral general 2026 sin un documento que lo confirme.','2026-10-13'),
('erc','Esquerra Republicana de Catalunya','ERC','https://www.esquerra.cat/',NULL,'not_located_as_of_date','pending_official_candidacy','El PDF enlazado está en catalán y es de las generales de 2023.','2026-10-13'),
('junts','Junts per Catalunya','Junts','https://junts.cat/',NULL,'not_located_as_of_date','pending_official_candidacy','Comprobar dominio, documento y fecha antes de añadir fuente concreta al catálogo.','2026-10-13'),
('ehbildu','Euskal Herria Bildu','EH Bildu','https://ehbildu.eus/',NULL,'not_located_as_of_date','pending_official_candidacy','Cualquier documento de elecciones anteriores debe identificarse expresamente como histórico.','2026-10-13'),
('pnv','Euzko Alderdi Jeltzalea-Partido Nacionalista Vasco','EAJ-PNV','https://www.eaj-pnv.eus/','https://www.eaj-pnv.eus/es/documentos/20945/con-voz-propia-programa-electoral-23-j','not_located_as_of_date','pending_official_candidacy','Página oficial de su programa de 2023.','2026-10-13'),
('bng','Bloque Nacionalista Galego','BNG','https://www.bng.gal/','https://www.bng.gal/estaticas/programas-eleitorais.html','not_located_as_of_date','pending_official_candidacy','El archivo del partido lista programas de varios comicios y distingue las elecciones.','2026-10-13'),
('cc','Coalición Canaria','CC','https://coalicioncanaria.org/','https://coalicioncanaria.org/documentos/','not_located_as_of_date','pending_official_candidacy','No usar acuerdos de legislatura ni programas autonómicos como programa de generales 2026.','2026-10-13'),
('upn','Unión del Pueblo Navarro','UPN','https://www.upn.org/','https://www.upn.org/posicion-sobre-temas/','not_located_as_of_date','pending_official_candidacy','No confundir su programa foral/autonómico con el programa para las elecciones generales.','2026-10-13'),
('compromis','Compromís','Compromís','https://compromis.net/',NULL,'not_located_as_of_date','pending_official_candidacy','Pendiente de determinar forma de concurrencia y fuente oficial del programa 2026.','2026-10-13'),
('ara_mes','Ara Més','Ara Més',NULL,NULL,'not_located_as_of_date','pending_official_candidacy','Formación incluida en el seguimiento secundario. Verificar web oficial y candidatura 2026 antes de publicar una ficha definitiva.','2026-10-13'),
('salf','Se Acabó La Fiesta','SALF','https://seacabolafiesta.com/',NULL,'not_located_as_of_date','pending_official_candidacy','La lista de seguimiento de Generales 2026 lo recoge como programa pendiente; confirmar dominio y publicar solo enlaces primarios verificables.','2026-10-13'),
('fe_jons','Falange Española de las JONS','FE de las JONS','https://falange.es/',NULL,'historical_2023_only','pending_official_candidacy','Existe un PDF oficial de 2023. No presentarlo como programa 2026.','2026-10-13'),
('democracia21','Democracia21','D21','https://democracia21.es/','https://democracia21.es/','manifesto_or_platform_2026','pending_official_candidacy','La web oficial publica un manifiesto y un Tablón de Soluciones con tres bloques. No se ha identificado un único documento descargable que confirme un programa electoral completo de las generales de 2026.','2026-10-13');
INSERT INTO public.programme_documents(party_id,title,election,kind,url,source_id,checked_at) VALUES
('pp','Programa Generales 2023','Generales 2023','historical_2023','https://www.pp.es/storage/2023/07/programa_electoral_pp_23j_feijoo_2023.pdf','pp_programme_2023','2026-10-13'),
('psoe','Programa Generales 2023','Generales 2023','historical_2023','https://www.psoe.es/media-content/2023/07/PROGRAMA_ELECTORAL-GENERALES-2023.pdf','psoe_programme_2023','2026-10-13'),
('vox','Programa Generales 2023','Generales 2023','historical_2023','https://www.voxespana.es/programa/programa-electoral-Vox','vox_programme_2023','2026-10-13'),
('sumar','Programa Generales 2023','Generales 2023','historical_2023','https://movimientosumar.es/transparencia/','sumar_transparency_2023','2026-10-13'),
('erc','Programa Generales 2023','Generales 2023','historical_2023','https://static.esquerra.cat/uploads/20230905/e2023-programa.pdf','erc_programme_2023','2026-10-13'),
('pnv','Programa Generales 2023','Generales 2023','historical_2023','https://www.eaj-pnv.eus/es/documentos/20945/con-voz-propia-programa-electoral-23-j','pnv_programme_2023','2026-10-13'),
('bng','Programa Generales 2023','Generales 2023','historical_2023','https://www.bng.gal/media/bnggaliza/files/2023/07/05/23_bng_xerais_programa.pdf','bng_programme_2023','2026-10-13'),
('upn','Programa Generales 2023','Generales 2023','historical_2023','https://www.upn.org/wp-content/uploads/2023/07/Programa-Generales-23J_V2-1.pdf','upn_programme_2023','2026-10-13'),
('fe_jons','Programa Generales 2023','Generales 2023','historical_2023','https://falange.es/wp-content/uploads/2023/07/Programa-electoral-FE-de-las-JONS.-ELECCIONES-GENERALES-23-JULIO-2023.pdf','fejons_programme_2023','2026-10-13'),
('democracia21','Manifiesto y Tablón de Soluciones','Generales 2026','partial_2026','https://democracia21.es/','democracia21_home','2026-10-13');
INSERT INTO public.claims(id,party_id,topic_id,published_topic,title,claim_text,position,evidence_type,source_id,source_url,page_or_section,quote_or_paraphrase,checked_at,review_status) VALUES
('d21-cleanup-advisers','democracia21','justicia_reforma_institucional','regeneracion_democratica','Punto y Final al Tsunami de Asesores','La web presenta una propuesta para reducir o reformar el uso de asesores políticos.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-anti-corruption','democracia21','justicia_reforma_institucional','justicia_corrupcion','Quien Robe a lo Público, No Volverá Nunca a lo Público','La web plantea consecuencias para quienes roben recursos públicos.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-special-courts','democracia21','justicia_reforma_institucional','justicia_corrupcion','Juzgados Especializados en la Lucha Contra la Corrupción','La web propone juzgados especializados contra la corrupción.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-citizen-listening','democracia21','justicia_reforma_institucional','participacion_ciudadana','Escuchar a los Ciudadanos Será Obligatorio','La web propone hacer obligatoria la escucha o participación ciudadana.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-results-promises','democracia21','justicia_reforma_institucional','rendicion_cuentas','Fuera Promesas Electorales y Más Resultados Reales','La web propone evaluar resultados frente a promesas electorales.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-immunity','democracia21','justicia_reforma_institucional','justicia_reforma_institucional','Todos Iguales Ante la Ley: Fin a los Aforamientos','La web propone eliminar los aforamientos.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-administration','democracia21','administracion_digital','administracion_digital','Una Administración a Tu Servicio','La web presenta una propuesta de modernización y mejora del servicio público, con énfasis en trámites más sencillos.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-education','democracia21','educacion','educacion','Educación del Siglo 21 para Desatar Nuestro Talento','La web incluye una propuesta para modernizar la educación.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-smes','democracia21','economia_impuestos','economia_pymes','Revolución PYME','La web incluye propuestas dirigidas a pequeñas y medianas empresas.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-self-employed','democracia21','empleo_salarios','economia_autonomos','Autónomos, Estamos con Vosotros','La web incluye propuestas de apoyo al trabajo autónomo.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-wages','democracia21','empleo_salarios','empleo_salarios','Subir Salarios Hasta Que lo Note Tu Bolsillo','La web plantea mejorar los salarios; los detalles concretos deben extraerse de la propuesta completa.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-public-services','democracia21','administracion_digital','servicios_publicos','Servicios Públicos Eficientes: del Estado de Malestar al Estado de Bienestar','La web propone mejorar la eficiencia de los servicios públicos.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-eu','democracia21','union_europea','union_europea','Construir la Unión Europea del Siglo 21','La web plantea modernizar o fortalecer el proyecto europeo.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-housing','democracia21','vivienda','vivienda','Vivienda, Prioridad Nº1','La web identifica la vivienda como prioridad política; extraer medidas específicas desde el contenido original.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-family','democracia21','pensiones','familia','Todo a Favor para Ti y Tu Familia','La web incluye propuestas de apoyo a las familias.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-health','democracia21','sanidad','sanidad','Salvar la Sanidad Cuidando a Quienes Nos Cuidan','La web incluye una propuesta sobre sanidad y profesionales de cuidados.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-climate','democracia21','clima_energia','clima_energia','Anticipación Climática y Futuro Verde','La web incluye propuestas de adaptación climática y futuro verde.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-immigration','democracia21','inmigracion','inmigracion','Una Política Migratoria Responsable','La web anuncia una propuesta de política migratoria; no inferir medidas no publicadas.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review'),
('d21-security','democracia21','seguridad','seguridad','Seguridad y Apoyo Contra el Crimen Organizado','La web incluye una propuesta de seguridad y lucha contra el crimen organizado.','supports','official_manifesto_or_partial_proposals','democracia21_home','https://democracia21.es/','Tablón de Soluciones','paraphrase','2026-10-13','needs_second_review');