"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AddItemFab } from "@/components/tasks/AddItemFab";
import { CategoryFilter } from "@/components/tasks/CategoryFilter";
import { TaskList } from "@/components/tasks/TaskList";
import { TimeStat } from "@/components/tasks/TimeStat";
import { WeekProgress } from "@/components/tasks/WeekProgress";
import { RecurringTaskCard } from "@/components/recurring/RecurringTaskCard";
import { Spinner } from "@/components/ui/Spinner";
import { SwipeToCompleteCard } from "@/components/ui/SwipeToCompleteCard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getCompleteGesture, hasCategoriesEnabled, hasRoutinesEnabled } from "@/lib/auth/features";
import { useRecurringTasks } from "@/lib/hooks/useRecurringTasks";
import { useTasks } from "@/lib/hooks/useTasks";

export default function DashboardPage() {
  const { user } = useAuth();
  const { today, overdue, categories: taskCategories, loading, error, completeTask, deleteTask, createTask } =
    useTasks();
  const {
    openTodaysRecurringTasks,
    totalPlannedMinutesToday,
    trackedMinutesToday,
    loading: recurringLoading,
    error: recurringError,
    activeTimerFor,
    closedSecondsTodayFor,
    toggleToday,
    startTimer,
    stopTimer,
    createRecurringTask,
  } = useRecurringTasks();
  const [category, setCategory] = useState<string | null>(null);

  const completeGesture = getCompleteGesture(user);
  const categoriesEnabled = hasCategoriesEnabled(user);
  const routinesEnabled = hasRoutinesEnabled(user);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined)?.trim() ||
    user?.email?.split("@")[0] ||
    "";

  const todaysRoutines = routinesEnabled ? openTodaysRecurringTasks : [];

  const categories = Array.from(
    new Set([
      ...taskCategories,
      ...todaysRoutines.map((t) => t.category).filter((c): c is string => Boolean(c)),
    ])
  ).sort();

  const filteredToday = category ? today.filter((t) => t.category === category) : today;
  const filteredOverdue = category ? overdue.filter((t) => t.category === category) : overdue;
  const filteredRoutines = category
    ? todaysRoutines.filter((t) => t.category === category)
    : todaysRoutines;

  return (
    <AppShell
      header={
        <PageHeader eyebrow={displayName ? `Hi ${displayName}` : "Hi"} title="To-dos">
          {routinesEnabled && (
            <TimeStat
              plannedMinutes={totalPlannedMinutesToday}
              trackedMinutes={trackedMinutesToday}
            />
          )}
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

        {categoriesEnabled && (
          <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />
        )}

        {loading || recurringLoading ? (
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
                  completeGesture={completeGesture}
                  onComplete={completeTask}
                  onDelete={deleteTask}
                  emptyLabel="Keine überfälligen Aufgaben."
                />
              </section>
            )}

            <section>
              <h2 className="mb-2 text-sm font-semibold text-white/70">
                Heute · {filteredRoutines.length + filteredToday.length}
              </h2>
              {filteredRoutines.length === 0 && filteredToday.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/40">
                  Für heute ist alles erledigt. 🎉
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredRoutines.length > 0 && (
                    <AnimatePresence initial={false}>
                      {filteredRoutines.map((task) => {
                        const card = (
                          <RecurringTaskCard
                            task={task}
                            done={false}
                            activeEntry={activeTimerFor(task.id)}
                            closedSecondsToday={closedSecondsTodayFor(task.id)}
                            completeGesture={completeGesture}
                            onToggle={() => toggleToday(task.id)}
                            onStartTimer={() => startTimer(task.id)}
                            onStopTimer={() => stopTimer(task.id)}
                          />
                        );
                        return (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                          >
                            {completeGesture === "swipe" ? (
                              <SwipeToCompleteCard onComplete={() => toggleToday(task.id)}>
                                {card}
                              </SwipeToCompleteCard>
                            ) : (
                              card
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}

                  {filteredToday.length > 0 && (
                    <TaskList
                      tasks={filteredToday}
                      completeGesture={completeGesture}
                      onComplete={completeTask}
                      onDelete={deleteTask}
                      emptyLabel=""
                    />
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <AddItemFab onCreateTask={createTask} onCreateRecurringTask={createRecurringTask} />
    </AppShell>
  );
}
