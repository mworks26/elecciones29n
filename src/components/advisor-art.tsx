/** Campaign advisor holding a white ballot with both hands. */
export function AdvisorMascot({ className }: { className?: string }) {
  return <svg viewBox="0 0 64 64" className={className} aria-hidden>
    <circle cx="32" cy="18" r="11" fill="#d99470" />
    <path d="M20 17 Q22 5 33 6 Q45 7 44 18 L40 12 L30 11 L24 16Z" fill="#423044" />
    <circle cx="28" cy="18" r="1.4" fill="#302536" /><circle cx="36" cy="18" r="1.4" fill="#302536" />
    <path d="M28 23 Q32 26 36 23" fill="none" stroke="#a14d5c" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M18 62 Q17 34 32 31 Q47 34 46 62Z" fill="#ee9fc9" />
    <g transform="rotate(-6 32 46)">
      <rect x="23" y="36" width="18" height="22" rx="2" fill="#fff" stroke="#2f2540" strokeWidth="1.4" />
      <text x="32" y="44" textAnchor="middle" fontSize="5" fontWeight="700" fill="#2f2540">VOTO</text>
      <path d="M26 48h12M26 52h9" stroke="#2f2540" strokeWidth="1" strokeLinecap="round" />
    </g>
    <circle cx="23" cy="48" r="3" fill="#d99470" /><circle cx="41" cy="47" r="3" fill="#d99470" />
  </svg>;
}
