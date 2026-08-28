import { Clock } from "lucide-react";
import { formatMinutes } from "@/lib/utils/time";

export function TimeStat({
  plannedMinutes,
  completedMinutes,
}: {
  plannedMinutes: number;
  completedMinutes: number;
}) {
  const remaining = Math.max(plannedMinutes - completedMinutes, 0);

  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-accent-400/20 bg-accent-400/[0.06] px-4 py-3 shadow-glow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-400/15 text-accent-400">
        <Clock size={20} />
      </div>
      <div>
        <p className="text-[13px] text-white/50">Verplante Zeit heute</p>
        <p className="text-lg font-bold leading-tight text-white">
          {formatMinutes(plannedMinutes)}
          {completedMinutes > 0 && (
            <span className="ml-2 text-sm font-medium text-accent-400">
              · {formatMinutes(remaining)} übrig
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
