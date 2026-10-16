/** Total chips a player can distribute. */
export const BUDGET = 50;
/** Transfer one five-chip note without changing the chip budget. */
export function transferBudgetNote(chips: Record<string, number>, origin: string, target: string): Record<string, number> {
  if (origin === target) return chips;
  const used = Object.values(chips).reduce((a, b) => a + b, 0);
  if (origin === "pool" ? used > BUDGET - 5 : (chips[origin] ?? 0) < 5) return chips;
  const next = { ...chips };
  if (origin !== "pool") next[origin] = (next[origin] ?? 0) - 5;
  if (target !== "pool") next[target] = (next[target] ?? 0) + 5;
  return next;
}