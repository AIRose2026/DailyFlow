import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import type { RoutineStat } from "@/lib/hooks/useRecurringTaskStats";
import { cn } from "@/lib/utils/cn";
import { formatMinutes, formatSignedMinutes } from "@/lib/utils/time";

export function RoutineStatCard({ stat }: { stat: RoutineStat }) {
  const { task, sessionCount, avgActualMinutes, plannedMinutes, diffMinutes } = stat;
  const hasData = sessionCount > 0;
  const over = diffMinutes > 0.5;
  const scale = Math.max(plannedMinutes, avgActualMinutes, 1);

  return (
    <GlassCard className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-white">{task.title}</p>
          {task.category && (
            <Badge tone="neutral" className="mt-1">
              {task.category}
            </Badge>
          )}
        </div>
        {hasData && (
          <Badge tone={over ? "danger" : "accent"} className="shrink-0">
            {formatSignedMinutes(diffMinutes)}
          </Badge>
        )}
      </div>

      {hasData ? (
        <div className="flex flex-col gap-2">
          <BarRow
            label="Geplant"
            value={formatMinutes(plannedMinutes)}
            ratio={Math.min((plannedMinutes / scale) * 100, 100)}
            tone="neutral"
          />
          <BarRow
            label="Ø tatsächlich"
            value={formatMinutes(avgActualMinutes)}
            ratio={Math.min((avgActualMinutes / scale) * 100, 100)}
            tone={over ? "danger" : "accent"}
          />
          <p className="text-xs text-white/40">
            {sessionCount} {sessionCount === 1 ? "Mal" : "Mal"} erfasst
          </p>
        </div>
      ) : (
        <p className="text-sm text-white/40">
          Geplant: {formatMinutes(plannedMinutes)} · Noch keine Zeiterfassung
        </p>
      )}
    </GlassCard>
  );
}

function BarRow({
  label,
  value,
  ratio,
  tone,
}: {
  label: string;
  value: string;
  ratio: number;
  tone: "neutral" | "accent" | "danger";
}) {
  const barColor =
    tone === "danger" ? "bg-danger-500/70" : tone === "accent" ? "bg-accent-400/70" : "bg-white/20";

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-white/50">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={cn("h-full rounded-full", barColor)} style={{ width: `${ratio}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right text-xs font-medium text-white/70">{value}</span>
    </div>
  );
}
