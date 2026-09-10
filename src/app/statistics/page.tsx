"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoutineStatCard } from "@/components/statistics/RoutineStatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Spinner } from "@/components/ui/Spinner";
import { useRecurringTaskStats } from "@/lib/hooks/useRecurringTaskStats";
import { formatMinutes } from "@/lib/utils/time";

export default function StatisticsPage() {
  const { stats, totalSessions, totalActualMinutesAll, loading, error, clearRoutineStats } =
    useRecurringTaskStats();

  return (
    <AppShell header={<PageHeader eyebrow="Auswertung" title="Statistik" />}>
      <div className="flex flex-col gap-6">
        {error && (
          <p className="rounded-2xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
            {error}
          </p>
        )}

        <GlassCard>
          <p className="text-sm text-white/50">Insgesamt erfasste Zeit</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {formatMinutes(totalActualMinutesAll)}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {totalSessions} {totalSessions === 1 ? "Durchlauf" : "Durchläufe"} getrackt
          </p>
        </GlassCard>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : stats.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/40">
            Noch keine Routinen angelegt.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {stats.map((stat) => (
              <RoutineStatCard
                key={stat.task.id}
                stat={stat}
                onClearStats={() => clearRoutineStats(stat.task.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
