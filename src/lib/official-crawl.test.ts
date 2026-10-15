import { describe, expect, it } from "vitest";
import { extractCandidateLinks } from "./official-crawl";

const html = `
<a href="/docs/programa-electoral-2026.pdf">Programa electoral</a>
<a href="https://x.es/programa-2023.pdf">Programa 2023</a>
<a href="/manifiesto">Manifiesto 2026</a>
<a href="/contacto">Contacto 2026</a>
<a href="/noticias/propuestas">Nuestras propuestas</a>`;

describe("extractCandidateLinks", () => {
  const links = extractCandidateLinks(html, "https://partido.es/");
  const urls = links.map((l) => l.url);
  it("detects 2026 programme links and resolves relative URLs", () => {
    expect(urls).toContain("https://partido.es/docs/programa-electoral-2026.pdf");
    expect(urls).toContain("https://partido.es/manifiesto");
  });
  it("skips 2023 documents", () => expect(urls).not.toContain("https://x.es/programa-2023.pdf"));
  it("skips links without programme keywords", () => expect(urls).not.toContain("https://partido.es/contacto"));
  it("skips undated non-PDF pages", () => expect(urls).not.toContain("https://partido.es/noticias/propuestas"));
});
