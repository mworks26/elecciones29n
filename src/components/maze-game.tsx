import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, SkipForward } from "lucide-react";
import type { Answer } from "@/lib/affinity";
import { Button } from "@/components/ui/button";
import { GameMascot } from "@/components/game-art";
import { cn } from "@/lib/utils";

// G/A/R = goals (De acuerdo / En parte / En desacuerdo), S = start, # = wall.
const MAP = ["G#.A.#R", ".#.#.#.", ".......", ".##.##.", "...S..."];
const GOALS: Record<string, { a: Answer; label: string; tone: string }> = {
  G: { a: "agree", label: "De acuerdo", tone: "bg-go" },
  A: { a: "partial", label: "En parte", tone: "bg-wait" },
  R: { a: "disagree", label: "En contra", tone: "bg-stop" },
};
type P = [number, number];
const ROWS = MAP.length, COLS = MAP[0].length;
const cell = ([x, y]: P) => MAP[y]?.[x];
const open = (p: P) => { const c = cell(p); return c !== undefined && c !== "#"; };
const START: P = [MAP[ROWS - 1].indexOf("S"), ROWS - 1];

function path(from: P, to: P): P[] {
  const key = (p: P) => `${p[0]},${p[1]}`;
  const prev = new Map<string, P | null>([[key(from), null]]);
  const q: P[] = [from];
  while (q.length) {
    const cur = q.shift()!;
    if (cur[0] === to[0] && cur[1] === to[1]) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n: P = [cur[0] + dx, cur[1] + dy];
      if (open(n) && !prev.has(key(n))) { prev.set(key(n), cur); q.push(n); }
    }
  }
  const out: P[] = [];
  for (let c: P | null | undefined = to; c && prev.has(key(c)); c = prev.get(key(c))) out.unshift(c);
  return out.slice(1);
}

/** Maze where the mascot carries the proposal card to a traffic-light goal; answers feed the affinity formula. */
export function MazeGame({ children, onAnswer }: { children: ReactNode; onAnswer: (a: Answer) => void }) {
  const [pos, setPos] = useState<P>(START);
  const [done, setDone] = useState<Answer | null>(null);
  const walking = useRef<ReturnType<typeof setInterval> | null>(null);
  const finished = useRef(false);

  const arrive = useCallback((p: P) => {
    const g = GOALS[cell(p) ?? ""];
    if (!g || finished.current) return;
    finished.current = true;
    setDone(g.a);
    setTimeout(() => onAnswer(g.a), 700);
  }, [onAnswer]);

  const step = useCallback((dx: number, dy: number) => {
    if (finished.current || walking.current) return;
    setPos((p) => { const n: P = [p[0] + dx, p[1] + dy]; if (!open(n)) return p; arrive(n); return n; });
  }, [arrive]);

  const walkTo = (to: P) => {
    if (finished.current || walking.current) return;
    const steps = path(pos, to);
    walking.current = setInterval(() => {
      const n = steps.shift();
      if (!n) { clearInterval(walking.current!); walking.current = null; return; }
      setPos(n);
      if (!steps.length) { clearInterval(walking.current!); walking.current = null; arrive(n); }
    }, 140);
  };

  useEffect(() => () => { if (walking.current) clearInterval(walking.current); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = ({ ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] } as Record<string, [number, number]>)[e.key];
      if (d && (e.target as HTMLElement)?.closest?.("[data-maze]")) { e.preventDefault(); step(...d); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  return <section aria-label="Laberinto de propuestas" className="rounded-lg border border-border bg-card p-4 sm:p-6">
    {children}
    <h3 className="mt-5 text-center text-xl font-semibold">Lleva la tarjeta a la meta que elijas</h3>
    <p className="text-center text-sm text-muted-foreground">Toca una meta y el muñeco va solo, o muévelo con las flechas.</p>
    <div data-maze tabIndex={0} aria-label="Laberinto. Usa las flechas del teclado para mover el muñeco."
      className="mx-auto mt-4 grid w-full max-w-md gap-1 rounded-lg bg-secondary p-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
      {MAP.flatMap((row, y) => [...row].map((c, x) => {
        const here = pos[0] === x && pos[1] === y;
        const g = GOALS[c];
        return <button key={`${x}-${y}`} type="button" disabled={c === "#" || !!done} onClick={() => walkTo([x, y])}
          aria-label={g ? `Meta: ${g.label}` : c === "#" ? "Muro" : "Camino"}
          className={cn("relative flex aspect-square items-center justify-center rounded-md overflow-hidden text-[9px] font-bold leading-tight text-primary disabled:cursor-default sm:text-[11px]",
            c === "#" ? "bg-lilac" : g ? cn(g.tone, "shadow-soft") : "bg-card hover:bg-muted",
            g && done === g.a && "ring-4 ring-primary")}>
          {g && !here && <span className="px-0.5 text-center">{g.label}</span>}
          {here && <span className="absolute inset-0 flex items-center justify-center motion-safe:animate-bounce">
            <GameMascot kind={2} className="size-full scale-90" />
          </span>}
        </button>;
      }))}
    </div>
    <div className="mt-3 flex flex-col items-center gap-1">
      <Button size="icon" variant="outline" aria-label="Arriba" onClick={() => step(0, -1)}><ArrowUp /></Button>
      <div className="flex gap-1">
        <Button size="icon" variant="outline" aria-label="Izquierda" onClick={() => step(-1, 0)}><ArrowLeft /></Button>
        <Button size="icon" variant="outline" aria-label="Abajo" onClick={() => step(0, 1)}><ArrowDown /></Button>
        <Button size="icon" variant="outline" aria-label="Derecha" onClick={() => step(1, 0)}><ArrowRight /></Button>
      </div>
    </div>
    <div className="mt-3 flex min-h-10 items-center justify-center">
      {done ? <p role="status" className="text-sm font-medium">¡Tarjeta entregada!</p> :
        <Button type="button" variant="ghost" onClick={() => { if (!finished.current) { finished.current = true; onAnswer("skip"); } }}><SkipForward /> Paso de esta</Button>}
    </div>
  </section>;
}
