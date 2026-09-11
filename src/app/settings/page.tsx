"use client";

import { Archive, ChevronRight, LogOut, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApiTokenManager } from "@/components/settings/ApiTokenManager";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { CompleteGestureSelector } from "@/components/settings/CompleteGestureSelector";
import { DisplayNameEditor } from "@/components/settings/DisplayNameEditor";
import { RoutinesToggle } from "@/components/settings/RoutinesToggle";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hasEmailIntegration } from "@/lib/auth/features";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <AppShell header={<PageHeader eyebrow="Konto" title="Mehr" />}>
      <div className="flex flex-col gap-4">
        <GlassCard>
          <p className="text-sm text-white/50">Angemeldet als</p>
          <p className="mt-1 truncate text-[15px] font-semibold text-white">
            {user?.email ?? "—"}
          </p>
        </GlassCard>

        <DisplayNameEditor />

        <RoutinesToggle />

        <CompleteGestureSelector />

        <CategoryManager />

        <Link href="/archive">
          <GlassCard className="flex items-center gap-3 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-400/10 text-accent-400">
              <Archive size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-white">Archiv</p>
              <p className="text-xs text-white/40">Erledigte Aufgaben ansehen und löschen</p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-white/25" />
          </GlassCard>
        </Link>

        <Link href="/settings/feedback">
          <GlassCard className="flex items-center gap-3 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-400/10 text-accent-400">
              <MessageSquareText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-white">Feedback</p>
              <p className="text-xs text-white/40">Alle Einsendungen aus ClickUp ansehen</p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-white/25" />
          </GlassCard>
        </Link>

        <ApiTokenManager />

        <GlassCard className="flex flex-col gap-1 text-sm text-white/60">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white/80">Über DailyFlow</p>
            <span
              className={
                hasEmailIntegration(user)
                  ? "text-xs font-medium text-accent-400"
                  : "text-xs font-medium text-white/30"
              }
            >
              E-Mails {hasEmailIntegration(user) ? "aktiviert" : "nicht aktiviert"}
            </span>
          </div>
          <p>
            To-dos, wiederkehrende Aufgaben und per Flag markierte Outlook-Mails an einem
            Ort — synchronisiert über Judith (Langdock).
          </p>
        </GlassCard>

        <GlowButton variant="ghost" onClick={handleSignOut} className="gap-2">
          <LogOut size={18} />
          Abmelden
        </GlowButton>
      </div>
    </AppShell>
  );
}
