# DailyFlow – Supabase Setup

1. Create a Supabase project (Postgres + Auth + Realtime).
2. Apply every file in [`migrations/`](./migrations) in order (`0001_init.sql`,
   `0002_categories.sql`, `0003_routine_scheduling_and_timers.sql`, …), e.g.:

   ```bash
   supabase link --project-ref <project-ref>
   supabase db push
   ```

   or paste the file into the SQL editor in the Supabase dashboard.

3. Create the app user under **Authentication → Users**, e.g. via email/password
   (or send an invite). There's no self-service sign-up in the app on purpose —
   add every user here. Row Level Security is scoped per `user_id` on every
   table, so additional users are fully isolated from each other automatically;
   no schema changes needed to add more people.
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

### Adding Judith for a second (or third, …) user

Judith is currently wired to **one** Outlook mailbox → **one** DailyFlow
`user_id`, both hardcoded into the Langdock routine's config. That `user_id`
is *not* looked up dynamically — it's baked into whatever inserts Judith's
Langdock routine performs. There are two ways to extend this to more people,
depending on how many users you expect:

- **A handful of users (recommended for now):** duplicate the existing
  Langdock routine once per person. Each copy connects to *that* person's own
  Outlook account and inserts with *that* person's `user_id` (copy it from
  Settings → "Nutzer-ID" in the app, or from Authentication → Users in the
  Supabase dashboard). No DailyFlow code changes required — this is purely a
  Langdock/Outlook configuration step, repeated per user.
- **Many users / self-service (bigger project, not built yet):** replace the
  Langdock automation with DailyFlow's own backend — each user connects their
  own Outlook account via Microsoft OAuth in Settings, tokens are stored per
  user, and a scheduled job (e.g. a Vercel Cron job) polls each connected
  mailbox via the Microsoft Graph API directly instead of relying on a
  per-person Langdock routine. This removes the manual per-user Langdock setup
  but is a meaningfully larger build (OAuth flow, token storage/refresh, its
  own flagged-mail polling and draft-reply logic).
