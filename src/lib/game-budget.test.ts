import { describe, expect, it } from "vitest";
import { transferBudgetNote } from "./game-budget";
describe("25-chip allocation", () => {
  it("assigns five chips", () => { expect(transferBudgetNote({}, "pool", "vivienda")).toEqual({ vivienda: 5 }); });
  it("never exceeds 25 chips", () => { expect(transferBudgetNote({ vivienda: 25 }, "pool", "sanidad")).toEqual({ vivienda: 25 }); });
  it("conserves chips between topics", () => { expect(transferBudgetNote({ vivienda: 25 }, "vivienda", "sanidad")).toEqual({ vivienda: 20, sanidad: 5 }); });
  it("returns chips without negative allocations", () => {
    expect(transferBudgetNote({ vivienda: 5 }, "vivienda", "pool")).toEqual({ vivienda: 0 });
    expect(transferBudgetNote({ vivienda: 0 }, "vivienda", "pool")).toEqual({ vivienda: 0 });
  });
});
import { budgetLevel } from "./game-budget";
describe("budgetLevel", () => {
  it("5 or fewer chips is Básico", () => { expect(budgetLevel(5)).toBe("basico"); });
  it("10 chips is Medio", () => { expect(budgetLevel(10)).toBe("medio"); });
  it("more than 10 chips is Óptimo", () => { expect(budgetLevel(15)).toBe("optimo"); });
  it("0 chips is empty", () => { expect(budgetLevel(0)).toBe("vacio"); });
});
