// Facts verified against the BOE convocation (Real Decreto 806/2026).
export const ELECTION = {
  name: "Elecciones generales de España 2026",
  electionDate: "2026-11-29",
  campaignStart: "2026-11-13",
  campaignEnd: "2026-11-27",
  congressSeats: 350,
  source: { title: "Real Decreto 806/2026 (BOE)", url: "https://www.boe.es/eli/es/rd/2026/10/05/806" },
  calendarSource: {
    title: "Calendario electoral — Infoelectoral",
    url: "https://infoelectoral.interior.gob.es/es/proceso-electoral/calendario-electoral/index.html",
  },
  lastChecked: "2026-10-13",
} as const;
