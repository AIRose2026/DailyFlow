-- Connections: lets two users opt in (mutually) to assigning tasks to each
-- other — e.g. partners or a small household sharing a to-do list. Nothing
-- here grants blanket access to the other person's account; a connection
-- only ever unlocks assigning/seeing the specific tasks created between
-- the two of them (see the tasks policy rewrite below).

create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  -- Denormalized display labels, captured at invite time by the requester
  -- (who knows both their own email and the one they typed in). This is
  -- purely a UI label, never used for access control — actual permissions
  -- are always checked against requester_id/recipient_id, so a "wrong"
  -- label here couldn't grant anything. Avoids needing a whole public
  -- profiles table just to show "connected with X" in Settings.
  requester_email text not null,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint connections_no_self_connection check (requester_id <> recipient_id)
);

-- One row per pair, regardless of who invited whom — least/greatest keeps
-- (A invites B) and (B invites A) from ever coexisting.
create unique index if not exists connections_unique_pair_idx on connections (
  least(requester_id, recipient_id), greatest(requester_id, recipient_id)
);
create index if not exists connections_requester_idx on connections (requester_id);
create index if not exists connections_recipient_idx on connections (recipient_id);

alter table connections enable row level security;

create policy "connections_select_participant" on connections
  for select using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "connections_insert_as_requester" on connections
  for insert with check (auth.uid() = requester_id);

-- Only the recipient can move a request from pending to accepted — the
-- requester can't accept their own invite.
create policy "connections_update_as_recipient" on connections
  for update using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Either side can remove a connection at any point — declining a pending
-- request and disconnecting an accepted one are both just a delete.
create policy "connections_delete_participant" on connections
  for delete using (auth.uid() = requester_id or auth.uid() = recipient_id);

alter publication supabase_realtime add table connections;

-- ---------------------------------------------------------------------------
-- Resolve an email to a DailyFlow user id, for the "invite by email" flow.
-- auth.users isn't exposed through PostgREST at all (by any key), so a
-- SECURITY DEFINER function is the standard way to look someone up by email
-- without needing the service role key on the client. Only ever returns an
-- id — no other profile data — and only the `authenticated` role may call
-- it, never anon.
-- ---------------------------------------------------------------------------
create or replace function public.find_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth
stable
as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
$$;

revoke all on function public.find_user_id_by_email(text) from public;
grant execute on function public.find_user_id_by_email(text) to authenticated;

-- ---------------------------------------------------------------------------
-- tasks: split "whose list this is on" (user_id) from "who created it"
-- (created_by) so a connected user can create a task on someone else's
-- list. created_by defaults to the owner for every pre-existing row.
-- ---------------------------------------------------------------------------
alter table tasks add column if not exists created_by uuid references auth.users (id) on delete set null;
update tasks set created_by = user_id where created_by is null;

drop policy if exists "tasks_select_own" on tasks;
drop policy if exists "tasks_insert_own" on tasks;
drop policy if exists "tasks_update_own" on tasks;
drop policy if exists "tasks_delete_own" on tasks;

-- Both the assignee (user_id) and the assigner (created_by) can see, edit
-- and delete a task — simplest model for two people sharing a list; the
-- assignee doesn't lose any ability they had before (they still fully own
-- their self-created tasks, since user_id = created_by there too).
create policy "tasks_select_own_or_created" on tasks
  for select using (auth.uid() = user_id or auth.uid() = created_by);

create policy "tasks_insert_self_or_connected" on tasks
  for insert with check (
    auth.uid() = created_by
    and (
      auth.uid() = user_id
      or exists (
        select 1 from connections c
        where c.status = 'accepted'
          and (
            (c.requester_id = auth.uid() and c.recipient_id = tasks.user_id)
            or (c.recipient_id = auth.uid() and c.requester_id = tasks.user_id)
          )
      )
    )
  );

create policy "tasks_update_own_or_created" on tasks
  for update using (auth.uid() = user_id or auth.uid() = created_by);

create policy "tasks_delete_own_or_created" on tasks
  for delete using (auth.uid() = user_id or auth.uid() = created_by);
