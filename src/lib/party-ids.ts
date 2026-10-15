// Maps external catalogue party IDs to local parties.id values.
const ALIASES: Record<string, string> = {
  "eh-bildu": "ehbildu",
  "coalicion-canaria": "cc",
  "teruel-existe": "teruel_existe",
  "soria-ya": "soria_ya",
};

export function localPartyId(id: string | null | undefined): string | null {
  if (!id) return null;
  return ALIASES[id] ?? id.replace(/-/g, "_");
}
