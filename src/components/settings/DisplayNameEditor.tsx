"use client";

import { Check, User } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";

export function DisplayNameEditor() {
  const { user } = useAuth();
  const [name, setName] = useState(() => (user?.user_metadata?.display_name as string) ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      data: { display_name: name.trim() },
    });

    setSaving(false);
    if (updateError) {
      setError("Konnte nicht gespeichert werden.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <GlassCard className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <User size={16} className="text-accent-400" />
        <p className="text-sm font-semibold text-white/80">Anzeigename</p>
      </div>
      <p className="text-sm text-white/50">
        Wird als Begrüßung auf der Heute-Seite verwendet, z. B. &quot;Hi {name || "…"}&quot;.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dein Name"
          className="h-11 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-[15px] text-white outline-none focus:border-accent-400/60 focus:shadow-glow-sm"
        />
        <button
          type="submit"
          disabled={saving}
          aria-label="Anzeigename speichern"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-gradient text-base-950 shadow-glow transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check size={18} />
        </button>
      </form>

      {error && <p className="text-sm text-danger-400">{error}</p>}
      {saved && <p className="text-sm text-accent-400">Gespeichert.</p>}
    </GlassCard>
  );
}
