import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, SkipForward } from "lucide-react";
import type { Answer } from "@/lib/affinity";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CHOICES: { a: Answer; label: string; emoji: string; tone: string }[] = [
  { a: "agree", label: "De acuerdo", emoji: "👍", tone: "bg-secondary" },
  { a: "partial", label: "En parte", emoji: "🤏", tone: "bg-highlight" },
  { a: "disagree", label: "En desacuerdo", emoji: "👎", tone: "bg-muted" },
];
/** Explicit opinion choices keep the same answers consumed by the affinity formula. */
export function ProposalChoices({ children, onAnswer }: { children: ReactNode; onAnswer: (a: Answer) => void }) {
  const [selected, setSelected] = useState<Answer | null>(null);
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const choose = (a: Answer) => {
    if (locked.current) return;
    locked.current = true;
    setSelected(a);
    timer.current = setTimeout(() => onAnswer(a), 450);
  };
  return <section aria-label="Propuesta y tu opinión" className="rounded-lg border border-border bg-card p-4 sm:p-6">
    {children}
    <h3 className="mt-6 text-center text-xl font-semibold">¿Qué opinas de esta propuesta?</h3>
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
      {CHOICES.map((choice) => (
        <Button key={choice.a} type="button" variant="outline" onClick={() => choose(choice.a)} disabled={selected !== null}
          aria-pressed={selected === choice.a}
          className={cn("relative h-16 min-w-0 justify-start gap-4 whitespace-normal rounded-lg border-2 px-4 text-base sm:h-28 sm:flex-col sm:justify-center sm:gap-2 sm:px-2 disabled:opacity-100 motion-safe:transition-transform motion-safe:hover:-translate-y-1 hover:bg-secondary hover:text-secondary-foreground", choice.tone,
            selected === choice.a ? "border-primary ring-2 ring-ring" : "border-transparent", selected !== null && selected !== choice.a && "opacity-50 disabled:opacity-50")}>
          <span className="text-3xl" aria-hidden>{choice.emoji}</span>
          <span>{choice.label}</span>
          {selected === choice.a && <Check aria-hidden className="absolute right-2 top-2" />}
        </Button>
      ))}
    </div>
    <div className="mt-3 flex min-h-10 items-center justify-center">
      {selected !== null ? <p role="status" className="text-sm font-medium">{selected === "skip" ? "Sin responder" : "Respuesta elegida"}</p> :
        <Button type="button" variant="ghost" onClick={() => choose("skip")}><SkipForward /> Paso de esta</Button>}
    </div>
  </section>;
}
