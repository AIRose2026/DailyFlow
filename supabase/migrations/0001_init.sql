-- DailyFlow initial schema
-- Tables follow the data model proposed in the project brief, with `user_id`
-- columns added throughout so Row Level Security can scope every row to its
-- owner (the brief's "Vorschlag" schema is followed as closely as possible).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create type task_status as enum ('open', 'done');
create type task_source as enum ('manual', 'email', 'recurring_instance');

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  category text,
  status task_status not null default 'open',
  due_date date,
  source task_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on tasks (user_id);
create index if not exists tasks_status_idx on tasks (status);
create index if not exists tasks_due_date_idx on tasks (due_date);

-- ---------------------------------------------------------------------------
-- recurring_tasks
-- ---------------------------------------------------------------------------
create table if not exists recurring_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text,
  estimated_minutes int not null default 15 check (estimated_minutes >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists recurring_tasks_user_id_idx on recurring_tasks (user_id);

-- ---------------------------------------------------------------------------
-- recurring_task_completions
-- ---------------------------------------------------------------------------
create table if not exists recurring_task_completions (
  id uuid primary key default gen_random_uuid(),
  recurring_task_id uuid not null references recurring_tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  completed_date date not null,
  created_at timestamptz not null default now(),
  unique (recurring_task_id, completed_date)
);

create index if not exists recurring_task_completions_date_idx
  on recurring_task_completions (completed_date);

-- ---------------------------------------------------------------------------
-- email_tasks (populated by the Judith/Langdock integration)
-- ---------------------------------------------------------------------------
create table if not exists email_tasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  email_subject text not null,
  email_sender text not null,
  email_preview text,
  outlook_flag_id text,
  responded boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists email_tasks_task_id_idx on email_tasks (task_id);
create index if not exists email_tasks_outlook_flag_id_idx on email_tasks (outlook_flag_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger for tasks
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table tasks enable row level security;
alter table recurring_tasks enable row level security;
alter table recurring_task_completions enable row level security;
alter table email_tasks enable row level security;

-- tasks: owner-only access
create policy "tasks_select_own" on tasks
  for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on tasks
  for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on tasks
  for update using (auth.uid() = user_id);
create policy "tasks_delete_own" on tasks
  for delete using (auth.uid() = user_id);

-- recurring_tasks: owner-only access
create policy "recurring_tasks_select_own" on recurring_tasks
  for select using (auth.uid() = user_id);
create policy "recurring_tasks_insert_own" on recurring_tasks
  for insert with check (auth.uid() = user_id);
create policy "recurring_tasks_update_own" on recurring_tasks
  for update using (auth.uid() = user_id);
create policy "recurring_tasks_delete_own" on recurring_tasks
  for delete using (auth.uid() = user_id);

-- recurring_task_completions: owner-only access
create policy "recurring_task_completions_select_own" on recurring_task_completions
  for select using (auth.uid() = user_id);
create policy "recurring_task_completions_insert_own" on recurring_task_completions
  for insert with check (auth.uid() = user_id);
create policy "recurring_task_completions_delete_own" on recurring_task_completions
  for delete using (auth.uid() = user_id);

-- email_tasks: no user_id column (per brief's schema) -> scope via the
-- linked task's ownership. Judith writes through the service role key,
-- which bypasses RLS entirely.
create policy "email_tasks_select_own" on email_tasks
  for select using (
    exists (
      select 1 from tasks
      where tasks.id = email_tasks.task_id
      and tasks.user_id = auth.uid()
    )
  );
create policy "email_tasks_update_own" on email_tasks
  for update using (
    exists (
      select 1 from tasks
      where tasks.id = email_tasks.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table recurring_tasks;
alter publication supabase_realtime add table recurring_task_completions;
alter publication supabase_realtime add table email_tasks;
