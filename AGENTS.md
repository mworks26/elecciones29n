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

## Project rules
- Political content lives in the database (parties, sources, programme_documents, claims, change_log); the UI never hardcodes party positions. Why: every claim must stay traceable to a source.
- Claims with review_status `auto_extracted_unverified`/`rejected` are hidden by RLS; affinity scoring uses only `verified_by_human` unless the user opts in. Why: never publish unverified positions.
- Affinity formula lives in src/lib/affinity.ts with tests; missing data never adds or subtracts. Why: neutrality.
- Site search (/buscar) is a plain client-side text filter over database content; the AI chat is retired and /asistente redirects there. Why: no invented information and no AI credit usage.
- Game answers/history use consent-gated localStorage and a cookie containing only saving consent, never political answers; cloud game data uses a backward-compatible versioned current/history envelope and syncs only after explicit opt-in on /cuenta. Revocation wipes saved data. Why: political preferences are sensitive and cookies are transmitted to servers.
- The election countdown uses the current Europe/Madrid calendar date, independently of documentary last-checked dates. Why: daily changes and daylight saving must not miscount days or imply a new source review.
- The original uploaded cover is extracted as a source-controlled SVG and game artwork is shared by visual game components without changing scoring. Why: preserve the provided drawing and keep game behavior independent of illustrations.
- The campaign advisor uses one bundled transparent illustration through AdvisorMascot, independent of simulator logic. Why: consistent artwork must not change political scoring.
- Admin role is granted by a DB trigger only to an allow-listed email once confirmed; admin edits write a change_log row. Why: public signup is open, so first-signup admin would be unsafe.
- Code uses only the standard Supabase client and SQL migrations in drizzle/migrations, so the app can be moved to a self-hosted Supabase by replaying migrations and swapping env keys. Why: user plans external hosting.
- Game drag interactions use dnd-kit in a shared game-notes module, preserving the existing saved order and chip allocation shape. Why: mouse, touch and keyboard interaction must not alter affinity rules or consent.
- Proposal opinion choices use explicit buttons and the existing affinity answer values, with no decorative throwing or card dragging. Why: the choice must be unambiguous and still count toward affinity.
- Data-only editorial updates are replayable SQL in sql/data, applied after schema migrations on export. Why: the managed schema migrator excludes data-only operations while official-source updates must remain portable.
- A daily scheduled job calls /api/public/hooks/sync-programmes, which only records detected programme changes in update_candidates for admin review. Why: the public callback token is not authentication, so it must never publish data.
- Preserve unmanaged HTTP schedule authentication until a compatible migration is supported; report schedule timing separately from successful execution evidence. Why: an active legacy schedule does not establish delivery, and blind auth changes can break it.
- Page translation uses the free Google Translate widget driven by our own selector (googtrans cookie holds only the language); Spanish stays the authoritative original and a notice says so. Why: multilingual voters without AI credit usage or hand-maintained translations of sourced content.
