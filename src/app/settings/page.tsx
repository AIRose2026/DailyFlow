"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { ViewportDebug } from "@/components/settings/ViewportDebug";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { useAuth } from "@/lib/auth/AuthProvider";

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

        <CategoryManager />

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

        <ViewportDebug />
      </div>
    </AppShell>
  );
}
