import { describe, expect, it } from "vitest";
import { appendGameHistory, readGameEnvelope, setLocalGameConsent, hasLocalGameConsent, GAME_KEY } from "./game-history";
const state = { order: ["educacion"], chips: { educacion: 100 }, answers: {}, includePending: false };
describe("private game history", () => {
  it("keeps every completed game and its choices independently", () => {
    const first = appendGameHistory([], state, "2026-10-15T10:04:00Z", "first");
    state.order.push("sanidad");
    const next = appendGameHistory(first, state, "2026-10-15T11:00:00Z", "second");
    expect(next).toHaveLength(2);
    expect(next[1]?.state.order).toEqual(["educacion"]);
  });
  it("reads existing saved game shape without losing chip allocations", () => {
    expect(readGameEnvelope(state)?.current.chips).toEqual({ educacion: 100 });
  });
  it("stores consent only in cookies, and erases local answers when revoked", () => {
    setLocalGameConsent(true);
    expect(hasLocalGameConsent()).toBe(true);
    expect(document.cookie).not.toContain("educacion");
    localStorage.setItem(GAME_KEY, JSON.stringify(state));
    setLocalGameConsent(false);
    expect(hasLocalGameConsent()).toBe(false);
    expect(localStorage.getItem(GAME_KEY)).toBeNull();
  });
});