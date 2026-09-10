"use client";

import { animate, motion, useMotionValue, type PanInfo } from "framer-motion";
import { format, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { Check } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useWeekOverview } from "@/lib/hooks/useWeekOverview";
import { cn } from "@/lib/utils/cn";

const SWIPE_THRESHOLD = 40;
const SNAP_BACK = { type: "spring", stiffness: 500, damping: 32 } as const;

export function WeekProgress() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const { days, weekLabel } = useWeekOverview(weekOffset);
  const weekTotal = days.reduce((sum, d) => sum + d.total, 0);
  const weekDone = days.reduce((sum, d) => sum + d.done, 0);
  const selectedDay = days.find((d) => d.iso === selectedIso) ?? null;

  const x = useMotionValue(0);

  function goToWeek(next: number) {
    setWeekOffset(next);
    setSelectedIso(null);
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      goToWeek(weekOffset + 1);
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      goToWeek(weekOffset - 1);
    }
    animate(x, 0, SNAP_BACK);
  }

  return (
    <GlassCard>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white/80">Wochenübersicht</p>
        {weekOffset === 0 ? (
          <p className="text-xs text-white/40">{weekLabel}</p>
        ) : (
          <button
            type="button"
            onClick={() => goToWeek(0)}
            className="text-xs text-accent-300 underline underline-offset-2"
          >
            {weekLabel} · Zu heute
          </button>
        )}
      </div>

      <p className="mb-4 text-sm text-white/60">
        {weekTotal > 0 ? (
          <>
            <span className="font-semibold text-accent-300">{weekDone}</span> von{" "}
            <span className="font-semibold text-white">{weekTotal}</span> diese Woche erledigt
          </>
        ) : (
          "Keine Routinen oder fälligen Aufgaben diese Woche."
        )}
      </p>

      <motion.div
        drag="x"
        dragConstraints={{ left: -60, right: 60 }}
        dragElastic={0.4}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="flex justify-between gap-1"
      >
        {days.map(({ date, iso, done, total }) => {
          const ratio = total > 0 ? Math.min(done / total, 1) : 0;
          const complete = total > 0 && done >= total;
          const today = isToday(date);
          const selected = iso === selectedIso;

          return (
            <button
              type="button"
              key={iso}
              onClick={() => setSelectedIso((prev) => (prev === iso ? null : iso))}
              className="flex flex-col items-center gap-2"
            >
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
                  today && "animate-pulse-glow",
                  selected && "ring-2 ring-accent-400 ring-offset-2 ring-offset-base-900"
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
            </button>
          );
        })}
      </motion.div>

      {selectedDay && (
        <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
          <p className="text-xs font-semibold text-white/50">
            {format(selectedDay.date, "EEEE, d. MMMM", { locale: de })}
          </p>
          {selectedDay.dueTasks.length === 0 && selectedDay.recurringForDay.length === 0 ? (
            <p className="text-sm text-white/40">Keine Einträge an diesem Tag.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {selectedDay.dueTasks.map((task) => (
                <DayEntryRow key={task.id} label={task.title} done={task.status === "done"} />
              ))}
              {selectedDay.recurringForDay.map(({ task, done }) => (
                <DayEntryRow key={task.id} label={task.title} done={done} />
              ))}
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

function DayEntryRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {done ? (
        <Check size={14} className="shrink-0 text-accent-400" />
      ) : (
        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20" />
      )}
      <span className={cn("truncate", done ? "text-white/40 line-through" : "text-white/80")}>
        {label}
      </span>
    </div>
  );
}
