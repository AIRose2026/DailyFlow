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

### Adding a Langdock automation for a second (or third, …) user

Henrik's original Judith routine writes directly to the database with the
service role key, as described above — that keeps working completely
unchanged, no action needed for it.

That approach doesn't extend safely to someone else's **own, separate**
Langdock account, though: handing out the service role key to a third party's
Langdock config would give that account (and anyone who ever compromises it)
unrestricted read/write access to *every* user's data, not just their own.
So for anyone beyond Henrik, use the **personal API token** flow instead —
built for exactly this. Every endpoint below is authenticated the same way:

```
Authorization: Bearer <their token>
Content-Type: application/json
```

That person generates their token once, in Settings → **"API-Token für
Langdock"** (shown once — they copy it immediately; Settings → trash icon
revokes it later). Each endpoint resolves the token to that person's
`user_id` server-side (via `SUPABASE_SERVICE_ROLE_KEY`, which never leaves
this deployment) and only ever reads/writes their own rows — the token can't
touch anyone else's data even if it's ever misconfigured or leaked to the
wrong place. Scope is per-user, not per-endpoint: one token authorizes all
the routes below for that person.

**Just having a Langdock automation create to-dos or routines** (no
Outlook/flagged-mail involved — this is the common case for anyone who isn't
running a full Judith-style mail workflow):

- `POST /api/ingest/task`
  ```json
  { "title": "...", "description": "...", "category": "...", "due_date": "2026-09-15" }
  ```
  Only `title` is required. → `{ "ok": true, "task_id": "..." }`
- `POST /api/ingest/recurring-task`
  ```json
  { "title": "...", "category": "...", "estimated_minutes": 15, "weekdays": [1, 3, 5] }
  ```
  Only `title` is required (`estimated_minutes` defaults to 15,
  `weekdays` defaults to every day — same 1=Monday..7=Sunday scheme as the
  app's own weekday picker). → `{ "ok": true, "recurring_task_id": "..." }`

**A full Judith-style flagged-email workflow** (their own Langdock account
connected to their own Outlook mailbox):

- **New flagged mail →** `POST /api/ingest/email-task`
  ```json
  { "subject": "...", "sender": "...", "preview": "...", "outlook_flag_id": "..." }
  ```
  `subject` and `sender` are required; the rest are optional. →
  `{ "ok": true, "task_id": "..." }`
- **Draft created / flag removed →** `POST /api/ingest/email-task/complete`
  ```json
  { "outlook_flag_id": "..." }
  ```
  Marks the matching task done.

  The "E-Mails" tab itself is still hidden by default for every account
  (otherwise a new user would see an always-empty inbox with nothing behind
  it). Once their routine is wired up and sending real data, enable the tab
  for them: Authentication → Users → (the user) → User Metadata, add
  `"emails_enabled": true`. See `src/lib/auth/features.ts`.

**Prefer letting an agent decide instead of hardcoding a REST call?** DailyFlow
also exposes an MCP server at `POST/GET/DELETE /api/mcp`, built with
[`mcp-handler`](https://www.npmjs.com/package/mcp-handler) on MCP SDK v2 (the
2026-07-28 spec, Streamable HTTP transport). It's the same personal API token
as above (`Authorization: Bearer <their token>`) and the same underlying
reads/writes — just offered as MCP tools an agent can pick and fill in itself,
rather than a fixed automation hardcoding which fields go where. Connect it in
Langdock as a custom MCP server: URL `https://<your-deployment>/api/mcp`,
Bearer auth with the token from Settings → "API-Token für Langdock". It
exposes four tools:

- `create_task` — `title` (required), `description`, `category`, `due_date`
  (`YYYY-MM-DD`). Same semantics as `/api/ingest/task`.
- `create_recurring_task` — `title` (required), `category`,
  `estimated_minutes` (default 15), `weekdays` (1=Monday..7=Sunday, omit/empty
  = every day). Same semantics as `/api/ingest/recurring-task`.
- `create_email_task` — `subject`, `sender` (required), `preview`,
  `outlook_flag_id`. Same semantics as `/api/ingest/email-task`, for a full
  Judith-style flagged-mail workflow.
- `complete_email_task` — `outlook_flag_id` (required). Same semantics as
  `/api/ingest/email-task/complete`.

Both the REST routes and the MCP tools share the same token, the same
`api_tokens` table and the same server-side writes — pick whichever protocol
the automation on the other end speaks. `/api/ingest/*` stays for fixed,
pre-wired automations (like Henrik's); `/api/mcp` is for an agent that should
decide for itself when to call which tool.

**Not yet covered by any of this:** replying via voice ("An Judith senden" in
the app) still always calls Henrik's Langdock agent (`LANGDOCK_API_KEY` /
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
