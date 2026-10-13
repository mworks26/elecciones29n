import { describe, expect, it } from "vitest";
import { computeAffinity, matchValue, type AffinityClaim } from "./affinity";

const c = (id: string, party: string, topic: string, position = "supports", review = "verified_by_human"): AffinityClaim => ({
  id, party_id: party, topic_id: topic, position, review_status: review,
});

describe("affinity", () => {
  it("agree=1, partial=0.5, disagree=0 for a supported proposal", () => {
    expect(matchValue("agree", "supports")).toBe(1);
    expect(matchValue("partial", "supports")).toBe(0.5);
    expect(matchValue("disagree", "supports")).toBe(0);
  });

  it("not specified positions are excluded, never scored", () => {
    expect(matchValue("agree", "not_specified")).toBeNull();
  });

  it("missing data neither adds nor subtracts: a party with no evidence on a topic keeps its score", () => {
    const claims = [c("a1", "A", "vivienda"), c("b1", "B", "vivienda"), c("a2", "A", "sanidad")];
    const r = computeAffinity(claims, { a1: "agree", b1: "agree", a2: "agree" }, {});
    const b = r.find((x) => x.partyId === "B")!;
    expect(b.score).toBe(1);
    expect(b.coverage).toBe(0.5);
  });

  it("coverage below 50% is flagged as insufficient data", () => {
    const claims = [c("a1", "A", "vivienda"), c("b1", "B", "sanidad"), c("b2", "B", "educacion")];
    const r = computeAffinity(claims, { a1: "agree", b1: "agree", b2: "agree" }, {});
    expect(r.find((x) => x.partyId === "A")!.sufficient).toBe(false);
    expect(r.find((x) => x.partyId === "B")!.sufficient).toBe(true);
  });

  it("claims pending second review are excluded unless explicitly included", () => {
    const claims = [c("a1", "A", "vivienda", "supports", "needs_second_review")];
    expect(computeAffinity(claims, { a1: "agree" }, {})).toHaveLength(0);
    expect(computeAffinity(claims, { a1: "agree" }, {}, { includePending: true })[0]?.score).toBe(1);
  });
});
