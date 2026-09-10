"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AddRecurringTaskFab } from "@/components/recurring/AddRecurringTaskSheet";
import { RecurringTaskCard } from "@/components/recurring/RecurringTaskCard";
import { TimeStat } from "@/components/tasks/TimeStat";
import { WeekProgress } from "@/components/tasks/WeekProgress";
import { Spinner } from "@/components/ui/Spinner";
import { useRecurringTasks } from "@/lib/hooks/useRecurringTasks";
import { cn } from "@/lib/utils/cn";

export default function RecurringPage() {
  const {
    recurringTasks,
    todaysRecurringTasks,
    completedTodayIds,
    totalPlannedMinutesToday,
    completedMinutesToday,
    loading,
    activeTimerFor,
    toggleToday,
    startTimer,
    stopTimer,
    createRecurringTask,
    deactivateRecurringTask,
  } = useRecurringTasks();

  const [showAll, setShowAll] = useState(false);
  const otherTasksCount = recurringTasks.length - todaysRecurringTasks.length;

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
          <>
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-white/70">
                Heute · {todaysRecurringTasks.length}
              </h2>
              {todaysRecurringTasks.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/40">
                  Heute steht keine Routine an.
                </p>
              ) : (
                <AnimatePresence initial={false}>
                  {todaysRecurringTasks.map((task) => (
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
                        activeEntry={activeTimerFor(task.id)}
                        onToggle={() => toggleToday(task.id)}
                        onStartTimer={() => startTimer(task.id)}
                        onStopTimer={() => stopTimer(task.id)}
                        onDeactivate={() => deactivateRecurringTask(task.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {otherTasksCount > 0 && (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60"
                >
                  <span>Alle Routinen · {recurringTasks.length}</span>
                  <ChevronDown
                    size={16}
                    className={cn("transition-transform", showAll && "rotate-180")}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {showAll && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col gap-3 overflow-hidden"
                    >
                      {recurringTasks.map((task) => (
                        <RecurringTaskCard
                          key={task.id}
                          task={task}
                          done={completedTodayIds.has(task.id)}
                          activeEntry={activeTimerFor(task.id)}
                          onToggle={() => toggleToday(task.id)}
                          onStartTimer={() => startTimer(task.id)}
                          onStopTimer={() => stopTimer(task.id)}
                          onDeactivate={() => deactivateRecurringTask(task.id)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      <AddRecurringTaskFab onCreate={createRecurringTask} />
    </AppShell>
  );
}
