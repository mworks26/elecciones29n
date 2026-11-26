import { describe, expect, it, vi } from "vitest";
import { currentElectionKind, isOfficialUrl, officialFetch, publishOfficialDocuments, type Candidate } from "./automatic-documents";

const party = { id: "example", official_site: "https://www.example.es" };
const candidate: Candidate = { origin: "web_oficial", external_id: "one", fingerprint: "one", party_id: party.id, title: "Programa electoral", document_url: "https://example.es/programa.pdf" };
const document = { party_id: party.id, title: candidate.title, election: "Generales 2026", kind: "full_2026", url: candidate.document_url ?? "" };

describe("automatic official documents", () => {
  it("trusts only the registered official HTTPS domain, not lookalikes or external archives", () => {
    expect(isOfficialUrl("https://docs.example.es/programa.pdf", party.official_site)).toBe(true);
    expect(isOfficialUrl("https://example.es.evil.test/programa.pdf", party.official_site)).toBe(false);
    expect(isOfficialUrl("http://example.es/p.pdf", party.official_site)).toBe(false);
  });
  it("requires current general-election evidence in content and distinguishes manifestos", () => {
    expect(currentElectionKind("Programa electoral Elecciones generales 29 de noviembre 2026")).toBe("full_2026");
    expect(currentElectionKind("Manifiesto: bases del programa electoral Generales 2026")).toBe("partial_2026");
    expect(currentElectionKind("Programa electoral Elecciones generales 2023")).toBeNull();
    expect(currentElectionKind("Programa electoral elecciones municipales 2026")).toBeNull();
    expect(currentElectionKind("Programa electoral 2026")).toBeNull();
  });
  it("publishes official documents once and audits each publication", async () => {
    const insert = vi.fn().mockResolvedValue("document-id");
    const audit = vi.fn().mockResolvedValue(undefined);
    const result = await publishOfficialDocuments([candidate, candidate], [party], new Set(), { insert, audit }, async () => document);
    expect(result.published).toBe(1);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(audit).toHaveBeenCalledWith("document-id", document);
  });
  it("keeps third-party and ambiguous documents pending without publishing", async () => {
    const insert = vi.fn();
    const thirdParty = { ...candidate, origin: "programasenclaro", official_source: true };
    const result = await publishOfficialDocuments([thirdParty, candidate], [party], new Set(), { insert, audit: vi.fn() }, async () => null);
    expect(result.pending).toEqual([thirdParty, candidate]);
    expect(insert).not.toHaveBeenCalled();
  });
  it("reports partial publication and audit failures separately", async () => {
    const second = { ...candidate, document_url: "https://example.es/second.pdf" };
    const insert = vi.fn().mockResolvedValueOnce("id").mockRejectedValueOnce(new Error("write failed"));
    const result = await publishOfficialDocuments([candidate, second], [party], new Set(), { insert, audit: vi.fn().mockRejectedValue(new Error("audit failed")) }, async (c) => ({ ...document, url: c.document_url ?? "" }));
    expect(result.published).toBe(1);
    expect(result.audit_failed).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.pending).toEqual([second]);
  });
  it("does not follow an official-site redirect to an external domain", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://outside.test/p.pdf" } }));
    vi.stubGlobal("fetch", fetcher);
    try {
      expect(await officialFetch("https://example.es/p.pdf", party.official_site)).toBeNull();
      expect(fetcher).toHaveBeenCalledTimes(1);
    } finally { vi.unstubAllGlobals(); }
  });
});