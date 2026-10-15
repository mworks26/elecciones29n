import advisor from "@/assets/campaign-advisor.png";

/** Shared illustration; purely visual, independent of game answers and scoring. */
export function AdvisorMascot({ className }: { className?: string }) {
  return <img src={advisor} width={1024} height={1024} loading="lazy"
    alt="Asesora de campaña sosteniendo una papeleta blanca de voto con ambas manos"
    className={className} />;
}
