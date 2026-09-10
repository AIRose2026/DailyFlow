-- Adds weekday scheduling to recurring tasks and a time-tracking table so
-- actual time spent on a routine can be compared against the planned
-- estimate.

-- ---------------------------------------------------------------------------
-- recurring_tasks.weekdays
-- ---------------------------------------------------------------------------
-- ISO weekday numbers (1 = Monday .. 7 = Sunday). An empty array means the
-- routine applies every day (the previous, only behaviour).
alter table recurring_tasks
  add column if not exists weekdays smallint[] not null default '{}'::smallint[];

alter table recurring_tasks
  add constraint recurring_tasks_weekdays_valid
  check (
    weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
  );

-- ---------------------------------------------------------------------------
-- recurring_task_time_entries
-- ---------------------------------------------------------------------------
-- One row per start/stop timing session for a routine. `ended_at` is null
-- while a timer is running (so an in-progress session survives a reload —
-- the client can find it by querying for ended_at is null).
create table if not exists recurring_task_time_entries (
  id uuid primary key default gen_random_uuid(),
  recurring_task_id uuid not null references recurring_tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds int,
  created_at timestamptz not null default now()
);

create index if not exists recurring_task_time_entries_task_id_idx
  on recurring_task_time_entries (recurring_task_id);
create index if not exists recurring_task_time_entries_user_id_idx
  on recurring_task_time_entries (user_id);
create index if not exists recurring_task_time_entries_date_idx
  on recurring_task_time_entries (entry_date);

alter table recurring_task_time_entries enable row level security;

create policy "recurring_task_time_entries_select_own" on recurring_task_time_entries
  for select using (auth.uid() = user_id);
create policy "recurring_task_time_entries_insert_own" on recurring_task_time_entries
  for insert with check (auth.uid() = user_id);
create policy "recurring_task_time_entries_update_own" on recurring_task_time_entries
  for update using (auth.uid() = user_id);
create policy "recurring_task_time_entries_delete_own" on recurring_task_time_entries
  for delete using (auth.uid() = user_id);

alter publication supabase_realtime add table recurring_task_time_entries;
