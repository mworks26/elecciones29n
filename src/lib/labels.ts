export const PROGRAMME_STATUS: Record<string, { label: string; tone: "ok" | "partial" | "history" | "none" }> = {
  published_full_2026: { label: "Programa oficial 2026", tone: "ok" },
  published_partial_2026: { label: "Manifiesto/propuestas parciales 2026", tone: "partial" },
  manifesto_or_platform_2026: { label: "Manifiesto/propuestas parciales 2026", tone: "partial" },
  historical_2023_only: { label: "Solo documento histórico", tone: "history" },
  not_located_as_of_date: { label: "Programa 2026 sin localizar", tone: "none" },
};

export const CANDIDATE_STATUS: Record<string, string> = {
  confirmed_official_candidacy: "Candidatura confirmada",
  pending_official_candidacy: "Pendiente de verificación",
  not_located: "No localizada",
};

export const DOC_KIND: Record<string, string> = {
  full_2026: "Programa oficial 2026",
  partial_2026: "Manifiesto/propuestas parciales 2026",
  historical_2023: "Documento histórico 2023",
};

export const REVIEW_STATUS: Record<string, string> = {
  verified_by_human: "Verificado",
  needs_second_review: "Pendiente de segunda revisión",
  auto_extracted_unverified: "Sin verificar (no publicado)",
  rejected: "Rechazado",
};

export const EVIDENCE_TYPE: Record<string, string> = {
  official_programme_2026: "Programa oficial 2026",
  official_manifesto_or_partial_proposals: "Manifiesto o propuestas parciales",
  official_vote_or_parliamentary_record: "Votación o registro parlamentario",
  official_party_statement: "Declaración oficial del partido",
  historical_programme: "Programa histórico",
  secondary_reporting: "Fuente secundaria",
};

export const POSITION: Record<string, string> = {
  supports: "A favor / lo propone",
  opposes: "En contra",
  mixed_or_conditional: "Matizada o condicionada",
  not_specified: "No especificado",
  conflicting_sources: "Fuentes contradictorias",
  not_reviewed: "Sin revisar",
};

export const SOURCE_TYPE: Record<string, string> = {
  official_legal_source: "Fuente legal oficial",
  official_electoral_information: "Información electoral oficial",
  independent_secondary_tracker: "Seguimiento independiente (secundaria)",
  official_party_source: "Web oficial del partido",
};

export const formatDate = (d: string | null | undefined) =>
  d ? new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "—";
