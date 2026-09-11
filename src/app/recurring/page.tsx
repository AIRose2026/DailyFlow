"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EditRecurringTaskSheet } from "@/components/recurring/EditRecurringTaskSheet";
import { RoutineConfigCard } from "@/components/recurring/RoutineConfigCard";
import { Spinner } from "@/components/ui/Spinner";
import { SwipeToDeleteCard } from "@/components/ui/SwipeToDeleteCard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hasRoutinesEnabled } from "@/lib/auth/features";
import { useRecurringTasks } from "@/lib/hooks/useRecurringTasks";
import type { RecurringTask } from "@/lib/supabase/types";

export default function RecurringPage() {
  const { user } = useAuth();
  const { recurringTasks, loading, updateRecurringTask, deactivateRecurringTask } =
    useRecurringTasks();
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null);

  if (!hasRoutinesEnabled(user)) {
    return (
      <AppShell header={<PageHeader eyebrow="Verwaltung" title="Routinen" backHref="/settings" />}>
        <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/40">
          Routinen sind für diesen Account deaktiviert (Einstellungen → &quot;Routinen&quot;).
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell header={<PageHeader eyebrow="Verwaltung" title="Routinen" />}>
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : recurringTasks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/40">
            Noch keine Routinen angelegt. Über den &quot;+&quot;-Button auf den To-dos anlegen.
          </p>
        ) : (
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
                <SwipeToDeleteCard onDelete={() => deactivateRecurringTask(task.id)}>
                  <RoutineConfigCard task={task} onEdit={() => setEditingTask(task)} />
                </SwipeToDeleteCard>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <EditRecurringTaskSheet
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={updateRecurringTask}
        onDelete={deactivateRecurringTask}
      />
    </AppShell>
  );
}
