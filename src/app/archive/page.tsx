"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hasCategoriesEnabled } from "@/lib/auth/features";
import { useArchivedTasks } from "@/lib/hooks/useArchivedTasks";
import { useCompletedRoutines } from "@/lib/hooks/useCompletedRoutines";
import { toDate } from "@/lib/utils/date";
import { formatMinutes } from "@/lib/utils/time";

export default function ArchivePage() {
  const { user } = useAuth();
  const categoriesEnabled = hasCategoriesEnabled(user);
  const { tasks, loading: tasksLoading, error: tasksError, deleteTask } = useArchivedTasks();
  const {
    entries: routineEntries,
    loading: routinesLoading,
    error: routinesError,
    uncomplete,
  } = useCompletedRoutines();

  const error = tasksError ?? routinesError;

  return (
    <AppShell header={<PageHeader eyebrow="Mehr" title="Archiv" backHref="/settings" />}>
      <div className="flex flex-col gap-6">
        {error && (
          <p className="rounded-2xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
            {error}
          </p>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-white/70">Aufgaben</h2>
          {tasksLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : tasks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/40">
              Noch keine erledigten Aufgaben.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {tasks.map((task) => (
                <GlassCard key={task.id} className="flex items-start gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-white/50 line-through decoration-accent-400/60">
                      {task.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {categoriesEnabled && task.category && (
                        <Badge tone="neutral">{task.category}</Badge>
                      )}
                      <Badge tone="accent">
                        Erledigt am {format(new Date(task.updated_at), "d. MMM", { locale: de })}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    aria-label="Endgültig löschen"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/25 transition-colors hover:text-danger-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </GlassCard>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-white/70">Routinen</h2>
          {routinesLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : routineEntries.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/40">
              Noch keine erledigten Routinen.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {routineEntries.map((entry) => (
                <GlassCard key={entry.completionId} className="flex items-start gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-white/50 line-through decoration-accent-400/60">
                      {entry.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {categoriesEnabled && entry.category && (
                        <Badge tone="neutral">{entry.category}</Badge>
                      )}
                      {entry.trackedMinutes > 0 && (
                        <Badge tone="neutral">{formatMinutes(entry.trackedMinutes)} getrackt</Badge>
                      )}
                      <Badge tone="accent">
                        Erledigt am {format(toDate(entry.completedDate), "d. MMM", { locale: de })}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => uncomplete(entry.completionId)}
                    aria-label="Als offen markieren"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/25 transition-colors hover:text-danger-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </GlassCard>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
