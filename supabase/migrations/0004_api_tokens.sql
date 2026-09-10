-- Personal API tokens: lets each user's own external automation (e.g. their
-- own Judith-equivalent Langdock routine, under their own Langdock account)
-- authenticate against DailyFlow's ingest endpoints without ever handing out
-- the Supabase service role key. Only a salted hash of the token is stored;
-- the plaintext value is shown to the user exactly once, at creation time.

create table if not exists api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Judith',
  token_hash text not null unique,
  -- First few characters of the token, purely so the user can tell tokens
  -- apart in the list without ever seeing the full value again.
  token_prefix text not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists api_tokens_user_id_idx on api_tokens (user_id);

alter table api_tokens enable row level security;

-- Users manage their own tokens' metadata (name, prefix, timestamps) — the
-- app never reads token_hash back into the client; it's only compared
-- against server-side by the ingest endpoints using the service role key,
-- which bypasses RLS entirely.
create policy "api_tokens_select_own" on api_tokens
  for select using (auth.uid() = user_id);
create policy "api_tokens_insert_own" on api_tokens
  for insert with check (auth.uid() = user_id);
create policy "api_tokens_delete_own" on api_tokens
  for delete using (auth.uid() = user_id);

alter publication supabase_realtime add table api_tokens;
