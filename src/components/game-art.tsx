import mascots from "@/assets/game-mascots.png";
import { cn } from "@/lib/utils";

export function GameMascot({ kind = 0, className }: { kind?: number; className?: string }) {
  return <span className={cn("game-mascot", className)} aria-hidden><img src={mascots} alt="" width={1536} height={512} loading="lazy" className={`mascot-${kind % 3}`} /></span>;
}

export function TopicDrawing({ label }: { label: string }) {
  const l = label.toLowerCase();
  const symbol = /salud|sanidad|dependencia/.test(l) ? "🏥" : /educa|ciencia|digital/.test(l) ? "📚" : /vivienda/.test(l) ? "🏡" : /clima|energ|rural|agri|medio/.test(l) ? "🌳" : /empleo|econom|pens|impuesto/.test(l) ? "🐷" : /transporte/.test(l) ? "🚲" : "💬";
  return <span aria-hidden className="text-4xl leading-none">{symbol}</span>;
}