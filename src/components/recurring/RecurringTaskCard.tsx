"use client";

import { Check, Clock, Pencil, Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { RoutineTimerOverlay } from "@/components/recurring/RoutineTimerOverlay";
import { useAuth } from "@/lib/auth/AuthProvider";
import { type CompleteGesture, hasCategoriesEnabled } from "@/lib/auth/features";
import type { RecurringTask, RecurringTaskTimeEntry } from "@/lib/supabase/types";
import { weekdaysLabel } from "@/lib/utils/date";
import { formatMinutes } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function RecurringTaskCard({
  task,
  done,
  activeEntry,
  closedSecondsToday,
  completeGesture,
  onToggle,
  onStartTimer,
  onStopTimer,
  onEdit,
}: {
  task: RecurringTask;
  done: boolean;
  activeEntry?: RecurringTaskTimeEntry;
  /** Seconds already tracked today across earlier, already-stopped sessions. */
  closedSecondsToday: number;
  /** "tap": renders its own checkmark button. "swipe": no checkmark here —
   * the caller wraps this card in SwipeToCompleteCard instead, which calls
   * onToggle via the gesture. */
  completeGesture: CompleteGesture;
  onToggle: () => Promise<void> | void;
  onStartTimer: () => Promise<void> | void;
  onStopTimer: () => Promise<void> | void;
  /** Omit on the To-dos view — editing/deleting a routine now lives
   * exclusively on the Routinen tab, so this card is check-off + timer
   * only there (no pencil, title isn't tappable). */
  onEdit?: () => void;
}) {
  const { user } = useAuth();
  const categoriesEnabled = hasCategoriesEnabled(user);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const running = Boolean(activeEntry);

  useEffect(() => {
    if (!activeEntry) return;
    const startedAt = new Date(activeEntry.started_at).getTime();
    function tick() {
      setSessionSeconds(Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeEntry]);

  const schedule = weekdaysLabel(task.weekdays);
  const trackedToday = closedSecondsToday + (running ? sessionSeconds : 0);

  // Tapping the timer button always opens the full-screen view — to start
  // (which also opens it) or to get back to it after minimizing while
  // still running. Pausing/finishing itself only happens from there now,
  // so there's one consistent place that does it instead of a quick inline
  // stop and a separate big one disagreeing on what "stop" means.
  function handleTimerButtonClick() {
    if (!running) onStartTimer();
    setShowTimer(true);
  }

  async function handlePause() {
    await onStopTimer();
    setShowTimer(false);
  }

  async function handleFinish() {
    await onStopTimer();
    await onToggle();
    setShowTimer(false);
  }

  const titleBlock = (
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
        {categoriesEnabled && task.category && <Badge tone="neutral">{task.category}</Badge>}
        {schedule && <Badge tone="neutral">{schedule}</Badge>}
        <Badge tone="accent" className="gap-1">
          <Clock size={11} />
          {closedSecondsToday > 0
            ? `${formatMinutes(closedSecondsToday / 60)} getrackt`
            : formatMinutes(task.estimated_minutes)}
        </Badge>
      </div>
    </div>
  );

  return (
    <>
      <GlassCard
        className={cn(
          "flex items-center gap-3 py-3 transition-all",
          done && "border-accent-400/25 bg-accent-400/[0.05]",
          running && "border-accent-400/40 shadow-glow-sm"
        )}
      >
        {completeGesture === "tap" && (
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
        )}

        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Routine bearbeiten"
            className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          >
            {titleBlock}
            <Pencil size={13} className="shrink-0 text-white/20" />
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-1.5">{titleBlock}</div>
        )}

        <button
          type="button"
          onClick={handleTimerButtonClick}
          aria-label={running ? "Timer anzeigen" : "Timer starten"}
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
              <span className="font-mono tabular-nums">{formatElapsed(trackedToday)}</span>
            </>
          ) : (
            <Play size={15} />
          )}
        </button>
      </GlassCard>

      <RoutineTimerOverlay
        open={showTimer && running}
        title={task.title}
        startedAt={activeEntry?.started_at ?? null}
        baselineSeconds={closedSecondsToday}
        onPause={handlePause}
        onFinish={handleFinish}
        onClose={() => setShowTimer(false)}
      />
    </>
  );
}
