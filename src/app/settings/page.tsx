"use client";

import { Archive, Check, ChevronRight, Copy, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { DisplayNameEditor } from "@/components/settings/DisplayNameEditor";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hasEmailIntegration } from "@/lib/auth/features";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
    router.refresh();
  }

  async function handleCopyUserId() {
    if (!user) return;
    await navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        <GlassCard className="flex flex-col gap-2 text-sm text-white/60">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white/80">Nutzer-ID</p>
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
            Wird gebraucht, um für diesen Account eine eigene Judith-Automatisierung
            (E-Mails) in Langdock einzurichten. Der E-Mails-Tab erscheint erst, wenn für
            diesen Account in Supabase (User Metadata) <code>emails_enabled: true</code> gesetzt
            ist.
          </p>
          <button
            type="button"
            onClick={handleCopyUserId}
            className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-left"
          >
            <span className="truncate font-mono text-xs text-white/70">{user?.id ?? "—"}</span>
            {copied ? (
              <Check size={15} className="shrink-0 text-accent-400" />
            ) : (
              <Copy size={15} className="shrink-0 text-white/40" />
            )}
          </button>
        </GlassCard>

        <GlassCard className="flex flex-col gap-1 text-sm text-white/60">
          <p className="font-semibold text-white/80">Über DailyFlow</p>
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
