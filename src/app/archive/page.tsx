"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Spinner } from "@/components/ui/Spinner";
import { useArchivedTasks } from "@/lib/hooks/useArchivedTasks";

export default function ArchivePage() {
  const { tasks, loading, error, deleteTask } = useArchivedTasks();

  return (
    <AppShell header={<PageHeader eyebrow="Mehr" title="Archiv" backHref="/settings" />}>
      <div className="flex flex-col gap-4">
        {error && (
          <p className="rounded-2xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
            {error}
          </p>
        )}

        {loading ? (
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
                    {task.category && <Badge tone="neutral">{task.category}</Badge>}
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
      </div>
    </AppShell>
  );
}
