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
import { useRecurringTasks } from "@/lib/hooks/useRecurringTasks";
import { useTasks } from "@/lib/hooks/useTasks";

export default function DashboardPage() {
  const { today, overdue, categories, loading, error, completeTask, createTask } = useTasks();
  const {
    recurringTasks,
    completions,
    totalPlannedMinutesToday,
    completedMinutesToday,
    error: recurringError,
  } = useRecurringTasks();
  const [category, setCategory] = useState<string | null>(null);

  const filteredToday = category ? today.filter((t) => t.category === category) : today;
  const filteredOverdue = category ? overdue.filter((t) => t.category === category) : overdue;

  return (
    <AppShell
      header={
        <PageHeader eyebrow="Guten Tag" title="Heute">
          <TimeStat
            plannedMinutes={totalPlannedMinutesToday}
            completedMinutes={completedMinutesToday}
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

        <WeekProgress recurringTasks={recurringTasks} completions={completions} />

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
