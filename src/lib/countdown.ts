export function madridDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function daysUntilElection(date: string, now: Date): number {
  return Math.max(0, Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${madridDate(now)}T00:00:00Z`)) / 86400000));
}