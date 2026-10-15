import { useQuery } from "@tanstack/react-query";
import { topicsQuery } from "@/lib/data";
import type { GameEntry } from "@/lib/game-history";
import { formatDate } from "@/lib/labels";

export function GameHistoryList({ history }: { history: GameEntry[] }) {
  const { data: topics = [] } = useQuery(topicsQuery);
  if (!history.length) return <p className="mt-3 text-sm text-muted-foreground">Todavía no hay partidas guardadas.</p>;
  return <ol className="mt-4 divide-y divide-border">{history.map((entry) => <li key={entry.id} className="py-4">
    <details><summary className="cursor-pointer font-semibold">Partida · {formatDate(entry.completedAt)} · {new Date(entry.completedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</summary>
      <p className="mt-2 text-sm text-muted-foreground">{Object.keys(entry.state.answers).length} elecciones de cartas · {entry.state.includePending ? "Incluye segunda revisión pendiente" : "Solo propuestas verificadas"}</p>
      <ol className="mt-2 list-inside list-decimal text-sm">{entry.state.order.map((id) => <li key={id}>{topics.find((t) => t.id === id)?.label ?? id}{(entry.state.chips[id] ?? 0) > 0 ? ` · ${entry.state.chips[id]} fichas` : ""}</li>)}</ol>
      {Object.keys(entry.state.answers).length > 0 && <p className="mt-3 text-sm">Cartas: {Object.values(entry.state.answers).map((a) => ({ agree: "De acuerdo", partial: "En parte", disagree: "En desacuerdo", skip: "Paso" })[a]).join(" · ")}</p>}
    </details>
  </li>)}</ol>;
}