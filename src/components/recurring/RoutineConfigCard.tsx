"use client";

import { Clock, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hasCategoriesEnabled } from "@/lib/auth/features";
import type { RecurringTask } from "@/lib/supabase/types";
import { weekdaysLabel } from "@/lib/utils/date";
import { formatMinutes } from "@/lib/utils/time";

/**
 * The Routinen tab's list item — configuration only (title, category,
 * schedule, planned duration), tap to edit. No checkmark, no timer: those
 * belong to the daily To-dos view now, not here.
 */
export function RoutineConfigCard({ task, onEdit }: { task: RecurringTask; onEdit: () => void }) {
  const { user } = useAuth();
  const categoriesEnabled = hasCategoriesEnabled(user);
  const schedule = weekdaysLabel(task.weekdays);

  return (
    <GlassCard className="flex items-center gap-3 py-3">
      <button
        type="button"
        onClick={onEdit}
        aria-label="Routine bearbeiten"
        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-white">{task.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {categoriesEnabled && task.category && <Badge tone="neutral">{task.category}</Badge>}
            <Badge tone="neutral">{schedule ?? "Jeden Tag"}</Badge>
            <Badge tone="accent" className="gap-1">
              <Clock size={11} />
              {formatMinutes(task.estimated_minutes)}
            </Badge>
          </div>
        </div>
        <Pencil size={13} className="shrink-0 text-white/20" />
      </button>
    </GlassCard>
  );
}
