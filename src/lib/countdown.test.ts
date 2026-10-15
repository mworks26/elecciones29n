import { expect, it } from "vitest";
import { daysUntilElection } from "./countdown";
it("shows 45 days from 15 October to 29 November 2026", () => {
  expect(daysUntilElection("2026-11-29", new Date("2026-10-15T10:04:00Z"))).toBe(45);
});
it("updates on the Madrid calendar day despite the clock change", () => {
  expect(daysUntilElection("2026-11-29", new Date("2026-10-15T22:01:00Z"))).toBe(44);
});