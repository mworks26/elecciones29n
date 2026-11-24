export type ReviewableClaim = { id: string; review_status: string; source_url: string | null };

export function canApproveClaim(claim: ReviewableClaim): boolean {
  if (claim.review_status !== "needs_second_review" && claim.review_status !== "auto_extracted_unverified") return false;
  try {
    const url = new URL(claim.source_url ?? "");
    return url.protocol === "https:" || url.protocol === "http:";
  } catch { return false; }
}

/** Only approve eligible selections; never change the party's recorded position. */
export async function approveClaims(
  claims: ReviewableClaim[], ids: string[],
  write: (claim: ReviewableClaim) => Promise<"approved" | "skipped" | "unlogged">,
) {
  const selected = new Set(ids);
  const result = { approved: 0, skipped: 0, unlogged: 0, failed: 0 };
  for (const claim of claims.filter((c) => selected.has(c.id) && canApproveClaim(c))) {
    try { result[await write(claim)] += 1; } catch { result.failed += 1; }
  }
  return result;
}