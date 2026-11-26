import type { Database } from "@/integrations/supabase/types";

export type Candidate = Database["public"]["Tables"]["update_candidates"]["Insert"];
export type DocumentInsert = Database["public"]["Tables"]["programme_documents"]["Insert"];
export type OfficialParty = { id: string; official_site: string | null };

/** Only the registered official host and its subdomains are trusted, never arbitrary archives. */
export function isOfficialUrl(url: string, officialSite: string | null): boolean {
  if (!officialSite) return false;
  try {
    const target = new URL(url);
    const official = new URL(officialSite).hostname.replace(/^www\./, "");
    return target.protocol === "https:" && !target.username && !target.password &&
      (target.hostname === official || target.hostname.endsWith(`.${official}`));
  } catch { return false; }
}

/** Use the actual document, not an aggregator's label or a filename alone. */
export function currentElectionKind(text: string): "full_2026" | "partial_2026" | null {
  const cover = text.slice(0, 16000).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const currentElection = /(?:generales|xerais|congres|kongres|29\s*[-/]?\s*n|29\s+(?:de\s+)?noviembre|29\s+(?:de\s+)?novembre)[\s\S]{0,100}2026|2026[\s\S]{0,100}(?:generales|xerais|congres|kongres|29\s*[-/]?\s*n)/;
  if (!currentElection.test(cover)) return null;
  if (/(municipales|autonomicas|elecciones europeas|eleccions europees)/.test(cover.slice(0, 1200))) return null;
  if (/(?:manifiesto|manifest|bases|propuestas parciales|compromisos)/.test(cover.slice(0, 2000))) return "partial_2026";
  if (/(?:programa electoral|programa de gobierno|programa de govern|hauteskunde programa)/.test(cover)) return "full_2026";
  return null;
}

export async function officialFetch(url: string, site: string | null): Promise<Response | null> {
  let next = url;
  for (let i = 0; i < 4; i++) {
    if (!isOfficialUrl(next, site)) return null;
    const response = await fetch(next, {
      redirect: "manual", signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "Elecciones2026-Monitor/1.0", accept: "text/html,application/pdf" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return null;
      next = new URL(location, next).href;
      continue;
    }
    return response.ok ? response : null;
  }
  return null;
}

export async function verifyOfficialDocument(candidate: Candidate, party: OfficialParty): Promise<DocumentInsert | null> {
  if (candidate.origin !== "web_oficial" || !candidate.document_url || candidate.party_id !== party.id) return null;
  try {
    const response = await officialFetch(candidate.document_url, party.official_site);
    if (!response) return null;
    // Bound downloads before parsing, including chunked responses.
    const reader = response.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 12_000_000) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    let text: string;
    if (new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-") {
      const { extractText } = await import("unpdf");
      const extracted = await extractText(bytes, { mergePages: false });
      text = extracted.text.slice(0, 3).join("\n");
    } else if (response.headers.get("content-type")?.includes("text/html")) {
      text = new TextDecoder().decode(bytes)
        .replace(/<(script|style|nav|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
        .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
    } else { return null; }
    const kind = currentElectionKind(text);
    if (!kind) return null;
    return {
      party_id: party.id, title: candidate.title, election: "Generales 2026", kind,
      url: candidate.document_url, checked_at: new Date().toISOString().slice(0, 10),
    };
  } catch { return null; }
}

type Store = {
  insert: (document: DocumentInsert) => Promise<string>;
  audit: (id: string, document: DocumentInsert) => Promise<void>;
};

/** Per-document outcomes distinguish publication from audit failure; no claims are touched. */
export async function publishOfficialDocuments(
  candidates: Candidate[], parties: OfficialParty[], known: Set<string>, store: Store,
  verify = verifyOfficialDocument,
) {
  const result = { published: 0, audit_failed: 0, failed: 0, pending: [] as Candidate[], documents: [] as DocumentInsert[] };
  for (const candidate of candidates) {
    const party = parties.find((p) => p.id === candidate.party_id);
    const key = `${candidate.party_id}|${candidate.document_url}`;
    if (known.has(key)) continue;
    if (candidate.origin !== "web_oficial" || !party || !candidate.document_url || !isOfficialUrl(candidate.document_url, party.official_site)) {
      result.pending.push(candidate); continue;
    }
    const document = await verify(candidate, party);
    if (!document) { result.pending.push(candidate); continue; }
    try {
      const id = await store.insert(document);
      known.add(key);
      result.published++;
      result.documents.push(document);
      try { await store.audit(id, document); } catch { result.audit_failed++; }
    } catch { result.failed++; result.pending.push(candidate); }
  }
  return result;
}