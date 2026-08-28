# DailyFlow – Supabase Setup

1. Create a Supabase project (Postgres + Auth + Realtime).
2. Apply the schema in [`migrations/0001_init.sql`](./migrations/0001_init.sql), e.g.:

   ```bash
   supabase link --project-ref <project-ref>
   supabase db push
   ```

   or paste the file into the SQL editor in the Supabase dashboard.

3. Create the app user (Henrik) under **Authentication → Users**, e.g. via email/password.
4. Copy the project URL and anon key into `.env.local` (see `.env.example` in the repo root).

## Judith / Langdock integration

Judith never runs as the app's authenticated user — it writes as a trusted
backend using the **service role key** (Settings → API), which bypasses Row
Level Security:

- **Judith → DailyFlow** (new email tasks): on its existing schedule, Judith
  reads flagged Outlook mails and inserts one row into `tasks`
  (`source = 'email'`) plus a matching row into `email_tasks`
  (`task_id`, `email_subject`, `email_sender`, `email_preview`,
  `outlook_flag_id`) using the service role key.
- **Judith → DailyFlow** (draft created): once Judith has created the Outlook
  draft and removed the flag, it updates the matching `tasks` row to
  `status = 'done'` (matched via `email_tasks.outlook_flag_id`) and sets
  `email_tasks.responded = true`.
- **DailyFlow → Judith**: handled by the app's `/api/judith/prompt` route
  (see `LANGDOCK_API_KEY` / `LANGDOCK_JUDITH_AGENT_ID` in `.env.example`),
  which forwards the user's dictated prompt + mail context to the Langdock
  agent.

Never expose the service role key to the browser — it belongs only in
Judith's own Langdock configuration, never in DailyFlow's client bundle.
