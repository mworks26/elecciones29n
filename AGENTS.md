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
- Portability: standard Supabase client, schema in drizzle/migrations, data-only updates as replayable SQL in sql/data.
- Daily job -> /api/public/hooks/sync-programmes (aggregator + party official sites) only inserts update_candidates; never publishes. Keep legacy schedule auth.
- Translation: Google Translate widget via own selector; Spanish authoritative.
