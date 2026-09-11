"use client";

import { Hand } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { type CompleteGesture, getCompleteGesture } from "@/lib/auth/features";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

const OPTIONS: { value: CompleteGesture; label: string; description: string }[] = [
  { value: "swipe", label: "Wischen", description: "Nach rechts wischen zum Abhaken." },
  { value: "tap", label: "Checkbox", description: "Auf das Häkchen tippen zum Abhaken." },
];

export function CompleteGestureSelector() {
  const { user } = useAuth();
  const [gesture, setGesture] = useState<CompleteGesture>(() => getCompleteGesture(user));
  const [saving, setSaving] = useState(false);

  async function handleSelect(value: CompleteGesture) {
    if (value === gesture || saving) return;
    setGesture(value);
    setSaving(true);
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { complete_gesture: value } });
    setSaving(false);
  }

  return (
    <GlassCard className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Hand size={16} className="text-accent-400" />
        <p className="text-sm font-semibold text-white/80">Abhaken</p>
      </div>
      <p className="text-sm text-white/50">
        Gilt für Aufgaben und Routinen gleichermaßen. Löschen (Wischen nach links) bleibt davon
        unabhängig immer gleich.
      </p>

      <div className="flex gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              "flex-1 rounded-xl py-2 text-sm font-semibold transition-all",
              gesture === option.value
                ? "bg-accent-400/15 text-accent-300 shadow-glow-sm"
                : "text-white/50"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-white/40">
        {OPTIONS.find((o) => o.value === gesture)?.description}
      </p>
    </GlassCard>
  );
}
