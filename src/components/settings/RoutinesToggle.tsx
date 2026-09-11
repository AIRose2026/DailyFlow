"use client";

import { CalendarClock } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Switch } from "@/components/ui/Switch";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hasRoutinesEnabled } from "@/lib/auth/features";
import { createClient } from "@/lib/supabase/client";

export function RoutinesToggle() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(() => hasRoutinesEnabled(user));
  const [saving, setSaving] = useState(false);

  async function handleToggle(next: boolean) {
    setEnabled(next);
    setSaving(true);
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { routines_enabled: next } });
    setSaving(false);
  }

  return (
    <GlassCard className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock size={16} className="text-accent-400" />
          <p className="text-sm font-semibold text-white/80">Routinen</p>
        </div>
        <Switch
          checked={enabled}
          onChange={handleToggle}
          disabled={saving}
          ariaLabel="Routinen aktivieren"
        />
      </div>
      <p className="text-sm text-white/50">
        {enabled
          ? "Aktiv — Routinen erscheinen auf den To-dos, im \"+\"-Menü und in der Navigation."
          : "Deaktiviert — Routinen verschwinden aus Navigation, Anlegen-Menü und To-dos. Deine bestehenden Routinen bleiben erhalten, falls du das später wieder aktivierst."}
      </p>
    </GlassCard>
  );
}
