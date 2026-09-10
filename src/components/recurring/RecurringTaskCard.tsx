"use client";

import { Check, Clock, Play, Square, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import type { RecurringTask, RecurringTaskTimeEntry } from "@/lib/supabase/types";
import { WEEKDAY_OPTIONS } from "@/lib/utils/date";
import { formatMinutes } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";

function weekdaysLabel(weekdays: number[]): string | null {
  if (weekdays.length === 0) return null;
  return weekdays
    .map((d) => WEEKDAY_OPTIONS.find((o) => o.value === d)?.label ?? "")
    .join(", ");
}

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function RecurringTaskCard({
  task,
  done,
  activeEntry,
  onToggle,
  onStartTimer,
  onStopTimer,
  onDeactivate,
}: {
  task: RecurringTask;
  done: boolean;
  activeEntry?: RecurringTaskTimeEntry;
  onToggle: () => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
  onDeactivate: () => void;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const running = Boolean(activeEntry);

  useEffect(() => {
    if (!activeEntry) return;
    const startedAt = new Date(activeEntry.started_at).getTime();
    function tick() {
      setElapsedSeconds(Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeEntry]);

  const schedule = weekdaysLabel(task.weekdays);

  return (
    <GlassCard
      className={cn(
        "flex items-center gap-3 py-3 transition-all",
        done && "border-accent-400/25 bg-accent-400/[0.05]",
        running && "border-accent-400/40 shadow-glow-sm"
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
          {schedule && <Badge tone="neutral">{schedule}</Badge>}
          <Badge tone="accent" className="gap-1">
            <Clock size={11} /> {formatMinutes(task.estimated_minutes)}
          </Badge>
        </div>
      </div>

      <button
        type="button"
        onClick={running ? onStopTimer : onStartTimer}
        aria-label={running ? "Timer stoppen" : "Timer starten"}
        className={cn(
          "flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all active:scale-90",
          running
            ? "bg-accent-400/20 text-accent-300 shadow-glow-sm"
            : "bg-white/[0.06] text-white/60"
        )}
      >
        {running ? (
          <>
            <Square size={13} />
            <span className="font-mono tabular-nums">{formatElapsed(elapsedSeconds)}</span>
          </>
        ) : (
          <Play size={15} />
        )}
      </button>

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
