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

Henrik's original Judith routine writes directly to the database with the
service role key, as described above — that keeps working completely
unchanged, no action needed for it.

That approach doesn't extend safely to someone else's **own, separate**
Langdock account, though: handing out the service role key to a third party's
Langdock config would give that account (and anyone who ever compromises it)
unrestricted read/write access to *every* user's data, not just their own.
So for anyone beyond Henrik, use the **personal API token** flow instead —
built for exactly this:

1. That person logs into DailyFlow, goes to Settings → **"API-Token für
   Judith"**, and generates a token (shown once — they copy it immediately).
2. Their own Judith-equivalent Langdock routine (under their own Langdock
   account, connected to their own Outlook mailbox) calls DailyFlow's ingest
   endpoints instead of touching Supabase directly:

   - **New flagged mail →** `POST https://<your-deployment>/api/ingest/email-task`
     ```
     Authorization: Bearer <their token>
     Content-Type: application/json

     { "subject": "...", "sender": "...", "preview": "...", "outlook_flag_id": "..." }
     ```
     `subject` and `sender` are required; the rest are optional. Response:
     `{ "ok": true, "task_id": "..." }`.
   - **Draft created / flag removed →** `POST .../api/ingest/email-task/complete`
     ```
     Authorization: Bearer <their token>
     Content-Type: application/json

     { "outlook_flag_id": "..." }
     ```
     Marks the matching task done. Each endpoint resolves the token to that
     person's `user_id` server-side (via `SUPABASE_SERVICE_ROLE_KEY`, which
     never leaves this deployment) and only ever reads/writes their own rows
     — the token can't touch anyone else's data even if it's ever
     misconfigured or leaked to the wrong place.

3. The "E-Mails" tab itself is still hidden by default for every account
   (otherwise a new user would see an always-empty inbox with nothing behind
   it). Once their routine is wired up and sending real data, enable the tab
   for them: Authentication → Users → (the user) → User Metadata, add
   `"emails_enabled": true`. See `src/lib/auth/features.ts`.

A revoked/deleted token (Settings → trash icon next to it) immediately stops
working — nothing more to clean up on the Langdock side beyond removing it
from that routine's config.

**Not yet covered by this:** replying via voice ("An Judith senden" in the
app) still always calls Henrik's Langdock agent (`LANGDOCK_API_KEY` /
`LANGDOCK_JUDITH_AGENT_ID` are a single global pair, not per-user). A second
person's own Judith can therefore *receive* flagged mail into DailyFlow, but
the app's own reply-via-voice button won't reach *their* agent yet — that
would need per-user Langdock credentials too, not built yet.

### Even more users / self-service (bigger project, not built yet)

Replace the Langdock automation entirely with DailyFlow's own backend — each
user connects their own Outlook account via Microsoft OAuth in Settings,
tokens are stored per user, and a scheduled job (e.g. a Vercel Cron job)
polls each connected mailbox via the Microsoft Graph API directly instead of
relying on a per-person Langdock routine at all. Removes the manual
per-user Langdock setup but is a meaningfully larger build (OAuth flow,
token storage/refresh, its own flagged-mail polling and draft-reply logic).
