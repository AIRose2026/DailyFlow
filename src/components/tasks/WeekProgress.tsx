"use client";

import { format, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { Check } from "lucide-react";
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
          <p className="mb-4 text-sm text-white/60">
            <span className="font-semibold text-accent-300">{weekDone}</span> von{" "}
            <span className="font-semibold text-white">{weekTotal}</span> diese Woche erledigt
          </p>
          <div className="flex justify-between gap-1">
            {days.map(({ date, iso, done, total }) => {
              const ratio = total > 0 ? Math.min(done / total, 1) : 0;
              const complete = total > 0 && done >= total;
              const today = isToday(date);

              return (
                <div key={iso} className="flex flex-col items-center gap-2">
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      today ? "text-accent-300" : "text-white/40"
                    )}
                  >
                    {format(date, "EEEEEE", { locale: de })}
                  </span>
                  <div
                    className={cn(
                      "relative flex h-11 w-11 items-center justify-center rounded-full transition-all",
                      today && "animate-pulse-glow"
                    )}
                    style={{
                      background: `conic-gradient(${
                        complete ? "#2dfbe0" : "#4dfbe1"
                      } ${ratio * 360}deg, rgba(255,255,255,0.06) 0deg)`,
                    }}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full bg-base-900",
                        complete && "shadow-inner-glow"
                      )}
                    >
                      {complete ? (
                        <Check
                          size={16}
                          strokeWidth={3}
                          className="text-accent-400 drop-shadow-[0_0_6px_rgba(45,251,224,0.7)]"
                        />
                      ) : (
                        <span className="text-[11px] font-semibold text-white/70">
                          {total > 0 ? `${done}/${total}` : "–"}
                        </span>
                      )}
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
