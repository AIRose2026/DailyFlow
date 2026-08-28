"use client";

import { format, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { GlassCard } from "@/components/ui/GlassCard";
import { useWeekOverview } from "@/lib/hooks/useWeekOverview";
import { weekRangeLabel } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

export function WeekProgress() {
  const { days, loading } = useWeekOverview();
  const weekTotal = days.reduce((sum, d) => sum + d.total, 0);
  const weekDone = days.reduce((sum, d) => sum + d.done, 0);

  return (
    <GlassCard>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white/80">Wochenübersicht</p>
        <p className="text-xs text-white/40">{weekRangeLabel()}</p>
      </div>

      {!loading && weekTotal === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-white/40">
          Noch keine Routinen oder fälligen Aufgaben diese Woche.
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-white/60">
            <span className="font-semibold text-accent-300">{weekDone}</span> von{" "}
            <span className="font-semibold text-white">{weekTotal}</span> diese Woche erledigt
          </p>
          <div className="flex justify-between gap-1">
            {days.map(({ date, iso, done, total }) => {
              const ratio = total > 0 ? Math.min(done / total, 1) : 0;
              const today = isToday(date);

              return (
                <div key={iso} className="flex flex-col items-center gap-1.5">
                  <span className="text-[11px] text-white/40">
                    {format(date, "EEEEEE", { locale: de })}
                  </span>
                  <div
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-full border transition-all",
                      today ? "border-accent-400/60 shadow-glow-sm" : "border-white/10"
                    )}
                    style={{
                      background:
                        ratio > 0
                          ? `conic-gradient(#2dfbe0 ${ratio * 360}deg, rgba(255,255,255,0.04) 0deg)`
                          : undefined,
                    }}
                  >
                    <div className="flex h-8 w-8 flex-col items-center justify-center rounded-full bg-base-900 leading-none text-white/70">
                      <span className="text-[10px] font-semibold">
                        {total > 0 ? done : "–"}
                      </span>
                      {total > 0 && <span className="text-[8px] text-white/40">/{total}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </GlassCard>
  );
}
