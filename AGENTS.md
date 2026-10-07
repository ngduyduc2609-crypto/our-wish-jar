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

## Rules
- Identity must come from a real Lovable Cloud auth session (Google or email/password) and members.user_id; never fake sign-in with localStorage — RLS rejects unauthenticated writes.
- Owner columns (proposed_by/added_by/created_by) are filled from the signed-in member on insert only; tables have no user_id column.
- Use shared PostInteractions and PostActionsMenu for all four content types; centralizing touch handling prevents duplicate writes and card-detail event conflicts.
