-- Restores the original owner-only RLS policies on `tasks` (as in
-- 0001_init.sql), undoing the connections-aware rewrite from
-- 0005_connections.sql.
--
-- Context: the connections feature's app code was rolled back (git revert
-- of "Add connecting with another user"), but that revert only touched the
-- code, not this project's database — 0005_connections.sql's RLS rewrite
-- was applied separately and stayed in place. The reverted app no longer
-- sets tasks.created_by on insert, so the connections-aware INSERT policy
-- (which requires auth.uid() = created_by) rejected every new task with
-- "new row violates row-level security policy for table tasks". This
-- migration re-aligns the database with the code that's actually deployed.
--
-- Leaves the `connections` table, `find_user_id_by_email()` function, and
-- `tasks.created_by` column in place — inert and unused by the current
-- code, but harmless, and kept in case the connections feature is revisited
-- later.

drop policy if exists "tasks_select_own_or_created" on tasks;
drop policy if exists "tasks_insert_self_or_connected" on tasks;
drop policy if exists "tasks_update_own_or_created" on tasks;
drop policy if exists "tasks_delete_own_or_created" on tasks;

create policy "tasks_select_own" on tasks
  for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on tasks
  for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on tasks
  for update using (auth.uid() = user_id);
create policy "tasks_delete_own" on tasks
  for delete using (auth.uid() = user_id);
