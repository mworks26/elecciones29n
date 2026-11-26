<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules (keep terse)
- Political data only from DB (parties, sources, programme_documents, claims, change_log), always with source. Never hardcode positions.
- RLS hides `auto_extracted_unverified`/`rejected` claims; affinity (src/lib/affinity.ts, tested) uses verified claims unless opt-in; missing data is neutral.
- /buscar is a client-side text filter; AI chat retired (/asistente redirects). External Nubion widget loaded in __root.
- Game data: consent-gated localStorage; cookie stores only consent; cloud sync only after opt-in on /cuenta (versioned envelope); revocation wipes.
- Countdown uses Europe/Madrid current date.
- Artwork (cover SVG, game-art, AdvisorMascot) never affects scoring. Drag uses dnd-kit in game-notes; maze-game maps traffic-light goals to affinity answers.
- Admin role: DB trigger for allow-listed confirmed email; admin edits write change_log.
- Bulk claim approval uses sourced pending selections, confirmation and per-claim RLS writes/audit results; it preserves positions and reports partial failures rather than implying all writes succeeded.
- Portability: standard Supabase client, schema in drizzle/migrations, data-only updates as replayable SQL in sql/data.
- Daily job uses managed cron authentication before privileged writes; replace the legacy public-key callback because a public key cannot authorise automatic publication.
- Daily document sync verifies current general-election content and official HTTPS hosts (including redirects), publishes sourced documents with per-row audit, keeps third-party/uncertain discoveries pending, and never changes claims. Pure policy and publication helpers live in automatic-documents.ts for regression tests.
- Translation: Google Translate widget via own selector; Spanish authoritative.
