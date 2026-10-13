export type Answer = "agree" | "partial" | "disagree" | "skip";

export type AffinityClaim = {
  id: string;
  party_id: string;
  topic_id: string;
  position: string;
  review_status: string;
};

export type PartyAffinity = {
  partyId: string;
  score: number | null; // 0..1, null when nothing comparable
  comparableTopics: number;
  answeredTopics: number;
  coverage: number; // 0..1
  sufficient: boolean;
};

export const MIN_COVERAGE = 0.5;

/** Match value of a user answer against a party position; null = excluded. */
export function matchValue(answer: Answer, position: string): number | null {
  if (answer === "skip") return null;
  const base = answer === "agree" ? 1 : answer === "partial" ? 0.5 : 0;
  if (position === "supports") return base;
  if (position === "opposes") return 1 - base;
  if (position === "mixed_or_conditional") return 0.5;
  return null; // not_specified, conflicting_sources, not_reviewed → never counts
}

export function computeAffinity(
  claims: AffinityClaim[],
  answers: Record<string, Answer>,
  weights: Record<string, number>,
  opts: { includePending?: boolean } = {},
): PartyAffinity[] {
  const allowed = new Set(opts.includePending ? ["verified_by_human", "needs_second_review"] : ["verified_by_human"]);
  const usable = claims.filter((c) => allowed.has(c.review_status));

  const answeredTopics = new Set(
    usable.filter((c) => answers[c.id] && answers[c.id] !== "skip").map((c) => c.topic_id),
  );

  const byParty = new Map<string, Map<string, number[]>>();
  for (const c of usable) {
    const a = answers[c.id];
    if (!a) continue;
    const v = matchValue(a, c.position);
    if (v === null) continue;
    const topics = byParty.get(c.party_id) ?? new Map<string, number[]>();
    topics.set(c.topic_id, [...(topics.get(c.topic_id) ?? []), v]);
    byParty.set(c.party_id, topics);
  }

  const parties = new Set(usable.map((c) => c.party_id));
  return [...parties].map((partyId) => {
    const topics = byParty.get(partyId) ?? new Map<string, number[]>();
    let num = 0;
    let den = 0;
    for (const [topic, vals] of topics) {
      const w = weights[topic] ?? 1;
      if (w <= 0) continue;
      num += w * (vals.reduce((s, x) => s + x, 0) / vals.length);
      den += w;
    }
    const comparable = topics.size;
    const coverage = answeredTopics.size ? comparable / answeredTopics.size : 0;
    return {
      partyId,
      score: den > 0 ? num / den : null,
      comparableTopics: comparable,
      answeredTopics: answeredTopics.size,
      coverage,
      sufficient: den > 0 && coverage >= MIN_COVERAGE,
    };
  });
}
