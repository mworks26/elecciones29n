import mascots from "@/assets/game-mascots.png";
import { cn } from "@/lib/utils";

export function GameMascot({ kind = 0, className }: { kind?: number; className?: string }) {
  return <span className={cn("game-mascot relative", className)} aria-hidden>
    <img src={mascots} alt="" width={1536} height={512} loading="lazy" className={`mascot-${kind % 3}`} />
    <svg viewBox="0 0 40 48" className="mascot-ballot" aria-hidden>
      <g transform="rotate(-12 20 24)">
        <rect x="4" y="4" width="32" height="40" rx="3" fill="white" stroke="currentColor" strokeWidth="2" />
        <text x="20" y="18" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor">VOTO</text>
        <path d="M10 26h20M10 32h16M10 38h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </svg>
  </span>;
}

export function TopicDrawing({ label }: { label: string }) {
  const l = label.toLowerCase();
  const map: [RegExp, string][] = [
    [/pensi/, "👴👵"], [/salud|sanidad/, "🏥"], [/dependen|cuidad/, "🤝"], [/educa/, "📚"], [/ciencia|innova|digital/, "🔬"],
    [/vivienda/, "🏡"], [/clima|medio ambiente/, "🌍"], [/energ/, "⚡"], [/rural|agri|campo/, "🌾"], [/empleo|trabajo/, "💼"],
    [/impuesto|fiscal/, "🧾"], [/econom/, "📊"], [/transporte|movilidad/, "🚆"], [/justicia|derecho/, "⚖️"], [/segur|defensa/, "🛡️"],
    [/migra|asilo/, "🫂"], [/igualdad|género/, "🟰"], [/europa|exterior/, "🇪🇺"], [/territori|autonom/, "🗺️"], [/cultura/, "🎭"], [/democr|corrup|transpar/, "🗳️"],
  ];
  const symbol = map.find(([r]) => r.test(l))?.[1] ?? "💬";
  return <span aria-hidden className="text-2xl leading-none">{symbol}</span>;
}
