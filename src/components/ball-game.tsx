import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Brick = { id: string; label: string; x: number; y: number; w: number; h: number; hits: number };

/** Lightweight bounce game: the ball hits topic blocks. It never touches affinity scoring. */
export function BallGame({ topics }: { topics: { id: string; label: string }[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [tally, setTally] = useState<Record<string, number>>({});
  const [last, setLast] = useState("");
  const [lives, setLives] = useState(3);

  useEffect(() => {
    if (!running) return;
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const W = c.width, H = c.height;
    const css = getComputedStyle(document.documentElement);
    const col = (v: string) => css.getPropertyValue(v).trim() || "gray";
    const tones = ["--highlight", "--secondary", "--lilac", "--muted"].map(col);
    const cols = 5, pad = 8, bw = (W - pad * (cols + 1)) / cols, bh = 34;
    const bricks: Brick[] = topics.slice(0, 15).map((t, i) => ({ id: t.id, label: t.label, x: pad + (i % cols) * (bw + pad), y: pad + Math.floor(i / cols) * (bh + pad), w: bw, h: bh, hits: 0 }));
    const ball = { x: W / 2, y: H - 60, vx: 3, vy: -3.6, r: 9 };
    let paddle = W / 2; const pw = 110;
    let livesLeft = 3; let raf = 0;
    const move = (e: PointerEvent) => { const r = c.getBoundingClientRect(); paddle = ((e.clientX - r.left) / r.width) * W; };
    const key = (e: KeyboardEvent) => { if (e.key === "ArrowLeft") paddle -= 30; if (e.key === "ArrowRight") paddle += 30; };
    c.addEventListener("pointermove", move); window.addEventListener("keydown", key);
    const tick = () => {
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.x < ball.r || ball.x > W - ball.r) ball.vx *= -1;
      if (ball.y < ball.r) ball.vy *= -1;
      const py = H - 24;
      if (ball.y > py - ball.r && ball.y < py && Math.abs(ball.x - paddle) < pw / 2 && ball.vy > 0) { ball.vy *= -1; ball.vx = (ball.x - paddle) / 12; }
      if (ball.y > H + 20) { livesLeft -= 1; setLives(livesLeft); if (livesLeft <= 0) { setRunning(false); return; } Object.assign(ball, { x: W / 2, y: H - 60, vx: 3, vy: -3.6 }); }
      for (const b of bricks) {
        if (ball.x > b.x && ball.x < b.x + b.w && ball.y - ball.r < b.y + b.h && ball.y + ball.r > b.y) {
          ball.vy *= -1; b.hits += 1; setLast(b.label); setTally((t) => ({ ...t, [b.id]: (t[b.id] ?? 0) + 1 })); break;
        }
      }
      ctx.clearRect(0, 0, W, H);
      bricks.forEach((b, i) => {
        ctx.fillStyle = tones[i % tones.length]!; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 10); ctx.fill();
        ctx.fillStyle = col("--foreground"); ctx.font = "600 12px Figtree, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(b.label.length > 16 ? b.label.slice(0, 15) + "…" : b.label, b.x + b.w / 2, b.y + b.h / 2);
      });
      ctx.fillStyle = col("--primary"); ctx.beginPath(); ctx.roundRect(paddle - pw / 2, py, pw, 12, 6); ctx.fill();
      ctx.fillStyle = col("--accent"); ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); c.removeEventListener("pointermove", move); window.removeEventListener("keydown", key); };
  }, [running, topics]);

  const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const name = (id: string) => topics.find((t) => t.id === id)?.label ?? id;
  return <div>
    <canvas ref={canvas} width={640} height={400} aria-label="Juego de la pelota: mueve la raqueta con el ratón, el dedo o las flechas" className="w-full touch-none rounded-2xl border border-border bg-background" />
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
      <Button onClick={() => { setTally({}); setLast(""); setLives(3); setRunning(true); }} className="rounded-full">{running ? "Reiniciar" : "¡Jugar!"}</Button>
      <span>Vidas: {"🎾".repeat(Math.max(lives, 0))}</span>
      {last && <span aria-live="polite">¡Has dado a <strong>{last}</strong>!</span>}
    </div>
    {!running && top.length > 0 && <p className="mt-3 text-sm">Los temas que más has golpeado: {top.map(([id, n]) => `${name(id)} (${n})`).join(", ")}. Es solo un juego: no cuenta para tu afinidad.</p>}
  </div>;
}
