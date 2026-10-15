import type { Answer } from "@/lib/affinity";

export const GAME_KEY = "elecciones2026.juegos.v1";
export const HISTORY_KEY = "elecciones2026.historial.v1";
export const CONSENT_COOKIE = "elecciones_game_save";
export type GameState = { order: string[]; chips: Record<string, number>; answers: Record<string, Answer>; includePending: boolean };
export type GameEntry = { id: string; completedAt: string; state: GameState };
export type GameEnvelope = { version: 2; current: GameState; history: GameEntry[] };

export function readGameEnvelope(value: unknown): GameEnvelope | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<GameEnvelope & GameState>;
  const current = v.version === 2 ? v.current : v;
  if (!current || !Array.isArray(current.order) || !current.chips || !current.answers) return null;
  return { version: 2, current: current as GameState, history: Array.isArray(v.history) ? v.history : [] };
}

export function appendGameHistory(history: GameEntry[], state: GameState, completedAt: string, id: string): GameEntry[] {
  return [{ id, completedAt, state: JSON.parse(JSON.stringify(state)) as GameState }, ...history];
}

export function hasLocalGameConsent() {
  return document.cookie.split(";").some((c) => c.trim() === `${CONSENT_COOKIE}=yes`);
}
export function setLocalGameConsent(on: boolean) {
  document.cookie = `${CONSENT_COOKIE}=${on ? "yes" : ""}; Path=/; Max-Age=${on ? 31536000 : 0}; SameSite=Strict${location.protocol === "https:" ? "; Secure" : ""}`;
  if (!on) { localStorage.removeItem(GAME_KEY); localStorage.removeItem(HISTORY_KEY); }
}
export function localGameEnvelope(): GameEnvelope | null {
  try { return readGameEnvelope(JSON.parse(localStorage.getItem(GAME_KEY) ?? "null")); } catch { return null; }
}