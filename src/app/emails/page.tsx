"use client";

import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmailTaskCard } from "@/components/emails/EmailTaskCard";
import { VoicePromptModal } from "@/components/emails/VoicePromptModal";
import { Spinner } from "@/components/ui/Spinner";
import { useEmailTasks } from "@/lib/hooks/useEmailTasks";
import type { EmailTaskWithContext } from "@/lib/supabase/types";

export default function EmailsPage() {
  const { emailTasks, loading, sendPromptToJudith } = useEmailTasks();
  const [active, setActive] = useState<EmailTaskWithContext | null>(null);

  return (
    <AppShell
      header={
        <PageHeader eyebrow="Outlook · via Judith" title="E-Mail-Aufgaben">
          <p className="mt-2 text-sm text-white/50">
            Geflaggte Mails, die Judith für dich vorbereitet hat.
          </p>
        </PageHeader>
      }
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : emailTasks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/40">
          Keine offenen E-Mail-Aufgaben. Judith meldet sich, sobald neue geflaggte Mails
          da sind.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {emailTasks.map((emailTask) => (
            <EmailTaskCard
              key={emailTask.id}
              emailTask={emailTask}
              onOpenPrompt={() => setActive(emailTask)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {active && (
          <VoicePromptModal
            emailTask={active}
            onClose={() => setActive(null)}
            onSend={(prompt) => sendPromptToJudith(active, prompt)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
