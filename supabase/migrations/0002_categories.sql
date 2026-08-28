-- Central category management: a per-user list of named categories,
-- managed from Settings, so task creation offers a picker instead of a
-- free-text field. `tasks.category` / `recurring_tasks.category` stay plain
-- text columns (matched by name) to avoid a breaking schema change.

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists categories_user_id_idx on categories (user_id);

alter table categories enable row level security;

create policy "categories_select_own" on categories
  for select using (auth.uid() = user_id);
create policy "categories_insert_own" on categories
  for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on categories
  for update using (auth.uid() = user_id);
create policy "categories_delete_own" on categories
  for delete using (auth.uid() = user_id);

alter publication supabase_realtime add table categories;
