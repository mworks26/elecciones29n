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
- Game answers and chat history stay in localStorage only. Why: no ideology stored on the server.
- First account created becomes admin (DB trigger); admin edits write a change_log row. Why: editorial traceability.
