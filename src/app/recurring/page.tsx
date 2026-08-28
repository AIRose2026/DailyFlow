"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AddRecurringTaskFab } from "@/components/recurring/AddRecurringTaskSheet";
import { RecurringTaskCard } from "@/components/recurring/RecurringTaskCard";
import { TimeStat } from "@/components/tasks/TimeStat";
import { WeekProgress } from "@/components/tasks/WeekProgress";
import { Spinner } from "@/components/ui/Spinner";
import { useRecurringTasks } from "@/lib/hooks/useRecurringTasks";

export default function RecurringPage() {
  const {
    recurringTasks,
    completedTodayIds,
    totalPlannedMinutesToday,
    completedMinutesToday,
    loading,
    toggleToday,
    createRecurringTask,
    deactivateRecurringTask,
  } = useRecurringTasks();

  return (
    <AppShell
      header={
        <PageHeader eyebrow="Routinen" title="Wiederkehrende Aufgaben">
          <TimeStat
            plannedMinutes={totalPlannedMinutesToday}
            completedMinutes={completedMinutesToday}
          />
        </PageHeader>
      }
    >
      <div className="flex flex-col gap-6">
        <WeekProgress />

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : recurringTasks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/40">
            Noch keine Routinen angelegt. Tippe auf + um eine hinzuzufügen.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {recurringTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <RecurringTaskCard
                    task={task}
                    done={completedTodayIds.has(task.id)}
                    onToggle={() => toggleToday(task.id)}
                    onDeactivate={() => deactivateRecurringTask(task.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AddRecurringTaskFab onCreate={createRecurringTask} />
    </AppShell>
  );
}
