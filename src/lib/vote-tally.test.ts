import { describe, expect, it } from "vitest";
import { parseTally } from "./vote-tally";

describe("parseTally", () => {
  it("reads official totals", () => {
    expect(parseTally("Resultado oficial: 177 sí, 172 no, 0 abstenciones")).toEqual({ yes: 177, no: 172, abstain: 0 });
  });
  it("returns null without data", () => {
    expect(parseTally(null)).toBeNull();
    expect(parseTally("Sin datos")).toBeNull();
  });
});
