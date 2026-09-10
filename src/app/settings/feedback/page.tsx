"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ExternalLink } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Spinner } from "@/components/ui/Spinner";
import { useFeedbackSubmissions } from "@/lib/hooks/useFeedbackSubmissions";

export default function FeedbackHistoryPage() {
  const { entries, loading, error } = useFeedbackSubmissions();

  return (
    <AppShell header={<PageHeader eyebrow="Mehr" title="Mein Feedback" backHref="/settings" />}>
      <div className="flex flex-col gap-4">
        {error && (
          <p className="rounded-2xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : entries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/40">
            Noch kein Feedback gesendet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <a key={entry.id} href={entry.url} target="_blank" rel="noreferrer">
                <GlassCard className="flex flex-col gap-2 py-4">
                  <p className="text-[15px] text-white/90">{entry.message}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="neutral">{entry.status}</Badge>
                    {entry.page && <Badge tone="neutral">{entry.page}</Badge>}
                    {entry.sentAt && (
                      <Badge tone="accent">
                        {format(new Date(entry.sentAt), "d. MMM, HH:mm", { locale: de })}
                      </Badge>
                    )}
                    <ExternalLink size={14} className="ml-auto shrink-0 text-white/25" />
                  </div>
                </GlassCard>
              </a>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
