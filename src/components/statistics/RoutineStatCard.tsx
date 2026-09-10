"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";
import type { RoutineStat } from "@/lib/hooks/useRecurringTaskStats";
import { cn } from "@/lib/utils/cn";
import { formatMinutes, formatSignedMinutes } from "@/lib/utils/time";

export function RoutineStatCard({
  stat,
  onClearStats,
}: {
  stat: RoutineStat;
  onClearStats: () => Promise<void>;
}) {
  const { task, sessionCount, avgActualMinutes, plannedMinutes, diffMinutes } = stat;
  const hasData = sessionCount > 0;
  const over = diffMinutes > 0.5;
  const scale = Math.max(plannedMinutes, avgActualMinutes, 1);

  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function handleClear() {
    setClearing(true);
    await onClearStats();
    setClearing(false);
    setConfirming(false);
  }

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
        <div className="flex shrink-0 items-center gap-1.5">
          {hasData && (
            <Badge tone={over ? "danger" : "accent"}>{formatSignedMinutes(diffMinutes)}</Badge>
          )}
          {hasData && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label="Zeiterfassung löschen"
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/25 transition-colors hover:text-danger-400"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
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

      {confirming && (
        <div className="flex flex-col gap-2 rounded-2xl border border-danger-500/30 bg-danger-500/10 p-3">
          <p className="text-xs text-danger-300">
            Zeiterfassung für &quot;{task.title}&quot; wirklich löschen? Alle {sessionCount}{" "}
            erfassten Durchläufe werden endgültig entfernt.
          </p>
          <div className="flex gap-2">
            <GlowButton
              type="button"
              variant="ghost"
              onClick={() => setConfirming(false)}
              className="h-9 flex-1 px-3 text-sm"
            >
              Abbrechen
            </GlowButton>
            <GlowButton
              type="button"
              variant="danger"
              onClick={handleClear}
              disabled={clearing}
              className="h-9 flex-1 px-3 text-sm"
            >
              {clearing ? "Wird gelöscht…" : "Löschen"}
            </GlowButton>
          </div>
        </div>
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
