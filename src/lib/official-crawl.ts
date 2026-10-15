// Pure helpers for the daily official-website watcher. They only detect
// candidate links for human review; nothing here publishes data.

export type FoundLink = { url: string; text: string };

const KEYWORDS = /(programa|manifiesto|propuesta|ponencia|compromiso|bases|proyecto de pa[ií]s|elecciones generales|plan de gobierno)/i;
const OLD_YEARS = /(19\d\d|20(0\d|1\d|2[0-5]))/;

const decode = (s: string) =>
  s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();

/** Returns links on an official page that look like 2026 programme documents. */
export function extractCandidateLinks(html: string, baseUrl: string): FoundLink[] {
  const out = new Map<string, FoundLink>();
  const re = /<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    let url: string;
    try { url = new URL(m[1], baseUrl).toString(); } catch { continue; }
    if (!/^https?:\/\//.test(url)) continue;
    const text = decode(m[2]).slice(0, 300);
    const hay = `${text} ${decodeURIComponent(url)}`;
    if (!KEYWORDS.test(hay)) continue;
    const mentions2026 = /2026/.test(hay);
    if (!mentions2026 && OLD_YEARS.test(hay)) continue;
    const isPdf = /\.pdf(\?|$)/i.test(url);
    if (!mentions2026 && !isPdf) continue;
    if (!out.has(url)) out.set(url, { url, text: text || url });
  }
  return [...out.values()].slice(0, 20);
}
