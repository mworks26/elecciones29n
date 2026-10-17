/** Parses an official tally stored in claim text, e.g. "177 sí, 172 no, 0 abstenciones". Returns null if absent (never invents). */
export function parseTally(text: string | null | undefined): { yes: number; no: number; abstain: number } | null {
  if (!text) return null;
  const yes = /(\d+)\s*s[ií]\b/i.exec(text);
  const no = /(\d+)\s*no\b/i.exec(text);
  if (!yes || !no) return null;
  const ab = /(\d+)\s*abstenci/i.exec(text);
  return { yes: Number(yes[1]), no: Number(no[1]), abstain: ab ? Number(ab[1]) : 0 };
}
