import { describe, expect, it } from "vitest";
import { transferBudgetNote } from "./game-budget";
describe("100-chip allocation", () => {
  it("assigns five chips", () => { expect(transferBudgetNote({}, "pool", "vivienda")).toEqual({ vivienda: 5 }); });
  it("never exceeds 100 chips", () => { expect(transferBudgetNote({ vivienda: 100 }, "pool", "sanidad")).toEqual({ vivienda: 100 }); });
  it("conserves chips between topics", () => { expect(transferBudgetNote({ vivienda: 100 }, "vivienda", "sanidad")).toEqual({ vivienda: 95, sanidad: 5 }); });
  it("returns chips without negative allocations", () => {
    expect(transferBudgetNote({ vivienda: 5 }, "vivienda", "pool")).toEqual({ vivienda: 0 });
    expect(transferBudgetNote({ vivienda: 0 }, "vivienda", "pool")).toEqual({ vivienda: 0 });
  });
});