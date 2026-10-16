import { describe, expect, it } from "vitest";
import { transferBudgetNote } from "./game-budget";
describe("50-chip allocation", () => {
  it("assigns five chips", () => { expect(transferBudgetNote({}, "pool", "vivienda")).toEqual({ vivienda: 5 }); });
  it("never exceeds 50 chips", () => { expect(transferBudgetNote({ vivienda: 50 }, "pool", "sanidad")).toEqual({ vivienda: 50 }); });
  it("conserves chips between topics", () => { expect(transferBudgetNote({ vivienda: 50 }, "vivienda", "sanidad")).toEqual({ vivienda: 45, sanidad: 5 }); });
  it("returns chips without negative allocations", () => {
    expect(transferBudgetNote({ vivienda: 5 }, "vivienda", "pool")).toEqual({ vivienda: 0 });
    expect(transferBudgetNote({ vivienda: 0 }, "vivienda", "pool")).toEqual({ vivienda: 0 });
  });
});