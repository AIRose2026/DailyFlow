"use client";

import { Check, Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import type { RecurringTask } from "@/lib/supabase/types";
import { formatMinutes } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";

export function RecurringTaskCard({
  task,
  done,
  onToggle,
  onDeactivate,
}: {
  task: RecurringTask;
  done: boolean;
  onToggle: () => void;
  onDeactivate: () => void;
}) {
  return (
    <GlassCard
      className={cn(
        "flex items-center gap-3 py-3 transition-all",
        done && "border-accent-400/25 bg-accent-400/[0.05]"
      )}
    >
      <button
        onClick={onToggle}
        aria-label={done ? "Als offen markieren" : "Als erledigt markieren"}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-90",
          done
            ? "border-accent-400 bg-accent-400/20 text-accent-400 shadow-glow-sm"
            : "border-white/15 text-transparent"
        )}
      >
        <Check size={20} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[15px] font-semibold",
            done ? "text-white/50 line-through decoration-accent-400/60" : "text-white"
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {task.category && <Badge tone="neutral">{task.category}</Badge>}
          <Badge tone="accent" className="gap-1">
            <Clock size={11} /> {formatMinutes(task.estimated_minutes)}
          </Badge>
        </div>
      </div>

      <button
        onClick={onDeactivate}
        aria-label="Routine entfernen"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/25 transition-colors hover:text-danger-400"
      >
        <Trash2 size={16} />
      </button>
    </GlassCard>
  );
}
