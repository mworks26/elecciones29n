import { useState, type ReactNode } from "react";
import type { Answer } from "@/lib/affinity";
import { cn } from "@/lib/utils";

const BASKETS: { a: Answer; label: string; emoji: string; tone: string }[] = [
  { a: "agree", label: "De acuerdo", emoji: "👍", tone: "bg-secondary" },
  { a: "partial", label: "En parte", emoji: "🤏", tone: "bg-highlight" },
  { a: "disagree", label: "En desacuerdo", emoji: "👎", tone: "bg-muted" },
];
const X: Record<string, string> = { agree: "-33%", partial: "0%", disagree: "33%", skip: "0%" };

/** Throw the ball into a basket: each throw is a real answer used by the affinity score. */
export function BasketGame({ children, onAnswer }: { children: ReactNode; onAnswer: (a: Answer) => void }) {
  const [shot, setShot] = useState<Answer | null>(null);
  const shoot = (a: Answer) => {
    if (shot) return;
    setShot(a);
    setTimeout(() => { setShot(null); onAnswer(a); }, a === "skip" ? 250 : 650);
  };
  return <div className="rounded-3xl border-2 border-border bg-card p-5">
    {children}
    <div className="relative mt-6 h-16">
      <span aria-hidden className={cn("absolute left-1/2 top-10 text-3xl transition-all duration-500 ease-out", shot && shot !== "skip" ? "-top-2 opacity-0 scale-75" : "")}
        style={{ transform: `translateX(calc(-50% + ${shot ? X[shot] : "0%"} * 3))` }}>🏀</span>
    </div>
    <p className="text-center text-sm text-muted-foreground">Lanza la pelota a una canasta: tu tiro cuenta para tu afinidad.</p>
    <div className="mt-3 grid grid-cols-3 gap-3">
      {BASKETS.map((b) => (
        <button key={b.a} type="button" onClick={() => shoot(b.a)} disabled={!!shot}
          className={cn("flex flex-col items-center gap-1 rounded-b-[2rem] rounded-t-lg border-4 border-t-8 border-primary p-3 text-sm font-semibold transition-transform hover:-translate-y-1", b.tone, shot === b.a && "animate-bounce")}>
          <span className="text-2xl" aria-hidden>{b.emoji}</span>{b.label}
        </button>
      ))}
    </div>
    <button type="button" onClick={() => shoot("skip")} disabled={!!shot} className="mx-auto mt-3 block text-sm underline">Paso de esta</button>
  </div>;
}
