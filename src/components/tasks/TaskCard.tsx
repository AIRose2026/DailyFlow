import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import type { Task } from "@/lib/supabase/types";
import { formatDueDate, isOverdue } from "@/lib/utils/date";

export function TaskCard({ task }: { task: Task }) {
  const overdue = isOverdue(task.due_date);

  return (
    <GlassCard className="flex items-start gap-3 py-4">
      {task.source === "email" && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-400/10 text-accent-400">
          <Mail size={16} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-white">{task.title}</p>
        {task.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-white/50">{task.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {task.category && <Badge tone="neutral">{task.category}</Badge>}
          {task.due_date && (
            <Badge tone={overdue ? "danger" : "accent"}>{formatDueDate(task.due_date)}</Badge>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
