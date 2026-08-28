import { Mail, MessageSquareText } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import type { EmailTaskWithContext } from "@/lib/supabase/types";

export function EmailTaskCard({
  emailTask,
  onOpenPrompt,
}: {
  emailTask: EmailTaskWithContext;
  onOpenPrompt: () => void;
}) {
  return (
    <GlassCard glow className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-400/10 text-accent-400">
          <Mail size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-white">
            {emailTask.email_subject}
          </p>
          <p className="truncate text-sm text-white/50">{emailTask.email_sender}</p>
        </div>
      </div>

      {emailTask.email_preview && (
        <p className="line-clamp-3 rounded-2xl bg-white/[0.03] px-3 py-2.5 text-sm text-white/60">
          {emailTask.email_preview}
        </p>
      )}

      <button
        onClick={onOpenPrompt}
        className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-accent-400/30 bg-accent-400/10 text-sm font-semibold text-accent-300 transition-all active:scale-[0.97]"
      >
        <MessageSquareText size={17} />
        Antwort diktieren
      </button>
    </GlassCard>
  );
}
