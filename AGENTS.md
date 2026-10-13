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
- The chat (/api/chat) answers only from database content injected into its system prompt. Why: no invented information.
- Game answers and chat history live in localStorage; they sync to the user's account (user_data) only after explicit opt-in consent on /cuenta, and opting out wipes them. Why: ideology is sensitive data.
- Admin role is granted by a DB trigger only to an allow-listed email once confirmed; admin edits write a change_log row. Why: public signup is open, so first-signup admin would be unsafe.
- Code uses only the standard Supabase client and SQL migrations in drizzle/migrations, so the app can be moved to a self-hosted Supabase by replaying migrations and swapping env keys. Why: user plans external hosting.
