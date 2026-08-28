"use client";

import { format, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { GlassCard } from "@/components/ui/GlassCard";
import type { RecurringTask, RecurringTaskCompletion } from "@/lib/supabase/types";
import { currentWeekDays, weekRangeLabel } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

export function WeekProgress({
  recurringTasks,
  completions,
}: {
  recurringTasks: RecurringTask[];
  completions: RecurringTaskCompletion[];
}) {
  const days = currentWeekDays();
  const total = recurringTasks.length;

  return (
    <GlassCard>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white/80">Wochenübersicht</p>
        <p className="text-xs text-white/40">{weekRangeLabel()}</p>
      </div>
      <div className="flex justify-between gap-1">
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const done = completions.filter((c) => c.completed_date === iso).length;
          const ratio = total > 0 ? Math.min(done / total, 1) : 0;
          const today = isToday(day);

          return (
            <div key={iso} className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] text-white/40">
                {format(day, "EEEEEE", { locale: de })}
              </span>
              <div
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full border transition-all",
                  today
                    ? "border-accent-400/60 shadow-glow-sm"
                    : "border-white/10"
                )}
                style={{
                  background:
                    ratio > 0
                      ? `conic-gradient(#2dfbe0 ${ratio * 360}deg, rgba(255,255,255,0.04) 0deg)`
                      : undefined,
                }}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-base-900 text-[11px] font-semibold text-white/70">
                  {total > 0 ? done : "–"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
