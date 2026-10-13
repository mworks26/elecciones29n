import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Inicio" },
  { to: "/partidos", label: "Partidos" },
  { to: "/programas", label: "Programas" },
  { to: "/comparar", label: "Comparar" },
  { to: "/juega", label: "Juega" },
  { to: "/asistente", label: "Asistente" },
  { to: "/fuentes", label: "Fuentes" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link to="/" className="font-serif text-xl font-semibold">
          Elecciones <span className="text-accent">2026</span>
        </Link>
        <nav aria-label="Principal" className="flex flex-wrap gap-1 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4 py-8 text-sm text-muted-foreground">
        <p>Herramienta informativa e independiente. No es una recomendación de voto.</p>
        <Link to="/admin" className="underline-offset-4 hover:underline">Panel editorial</Link>
      </div>
    </footer>
  );
}

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-8 pt-12">
      <p className="text-sm font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
      <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">{title}</h1>
      {children && <div className="mt-4 max-w-2xl text-lg text-muted-foreground">{children}</div>}
    </section>
  );
}

const TONES = {
  ok: "bg-highlight text-highlight-foreground",
  partial: "bg-secondary text-secondary-foreground",
  history: "bg-muted text-muted-foreground border border-dashed border-input",
  none: "bg-card text-muted-foreground border border-border",
} as const;

export function Tag({ tone = "none", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", TONES[tone])}>{children}</span>;
}

export function SourceLink({ href, children, meta }: { href: string; children: ReactNode; meta?: string | undefined }) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className="group inline-flex items-start gap-1.5 text-sm font-medium text-foreground underline decoration-accent decoration-2 underline-offset-4">
      <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>
        {children}
        {meta && <span className="ml-1 font-normal text-muted-foreground no-underline">· {meta}</span>}
      </span>
    </a>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-3xl border border-border bg-card p-6 shadow-soft", className)}>{children}</div>;
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div role="note" className="rounded-2xl border border-accent/40 bg-secondary px-4 py-3 text-sm text-secondary-foreground">
      {children}
    </div>
  );
}

export function RouteError({ error }: { error: unknown }) {
  return (
    <div role="alert" className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">No hemos podido cargar los datos</h1>
      <p className="mt-2 text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
    </div>
  );
}
