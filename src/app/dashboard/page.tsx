"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AddTaskFab } from "@/components/tasks/AddTaskSheet";
import { CategoryFilter } from "@/components/tasks/CategoryFilter";
import { TaskList } from "@/components/tasks/TaskList";
import { TimeStat } from "@/components/tasks/TimeStat";
import { WeekProgress } from "@/components/tasks/WeekProgress";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRecurringTasks } from "@/lib/hooks/useRecurringTasks";
import { useTasks } from "@/lib/hooks/useTasks";

export default function DashboardPage() {
  const { user } = useAuth();
  const { today, overdue, categories, loading, error, completeTask, deleteTask, createTask } =
    useTasks();
  const { totalPlannedMinutesToday, trackedMinutesToday, error: recurringError } =
    useRecurringTasks();
  const [category, setCategory] = useState<string | null>(null);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined)?.trim() ||
    user?.email?.split("@")[0] ||
    "";

  const filteredToday = category ? today.filter((t) => t.category === category) : today;
  const filteredOverdue = category ? overdue.filter((t) => t.category === category) : overdue;

  return (
    <AppShell
      header={
        <PageHeader eyebrow={displayName ? `Hi ${displayName}` : "Hi"} title="Heute">
          <TimeStat
            plannedMinutes={totalPlannedMinutesToday}
            trackedMinutes={trackedMinutesToday}
          />
        </PageHeader>
      }
    >
      <div className="flex flex-col gap-6">
        {(error || recurringError) && (
          <p className="rounded-2xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
            {error ?? recurringError}
          </p>
        )}

        <WeekProgress />

        <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <>
            {filteredOverdue.length > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-semibold text-danger-400">
                  Überfällig · {filteredOverdue.length}
                </h2>
                <TaskList
                  tasks={filteredOverdue}
                  onComplete={completeTask}
                  onDelete={deleteTask}
                  emptyLabel="Keine überfälligen Aufgaben."
                />
              </section>
            )}

            <section>
              <h2 className="mb-2 text-sm font-semibold text-white/70">
                Heute · {filteredToday.length}
              </h2>
              <TaskList
                tasks={filteredToday}
                onComplete={completeTask}
                onDelete={deleteTask}
                emptyLabel="Für heute ist alles erledigt. 🎉"
              />
            </section>
          </>
        )}
      </div>

      <AddTaskFab onCreate={createTask} />
    </AppShell>
  );
}
