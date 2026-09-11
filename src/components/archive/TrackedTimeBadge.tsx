"use client";

import { Check, Minus, Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import { formatMinutes, formatTrackedDuration } from "@/lib/utils/time";

/**
 * The "X Min getrackt" badge on a completed routine in the Archiv, made
 * editable — for a day where the timer was left running by mistake and the
 * real total needs correcting after the fact.
 */
export function TrackedTimeBadge({
  minutes,
  onSave,
}: {
  minutes: number;
  onSave: (minutes: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(() => Math.round(minutes));
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(Math.round(minutes));
          setEditing(true);
        }}
        aria-label="Getrackte Zeit bearbeiten"
        className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-white/70 ring-1 ring-white/10 transition-all active:scale-95"
      >
        {formatTrackedDuration(Math.round(minutes * 60))} getrackt
        <Pencil size={10} className="text-white/40" />
      </button>
    );
  }

  async function handleSave() {
    setSaving(true);
    await onSave(value);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-accent-400/30 bg-white/[0.03] py-1 pl-1 pr-1.5">
      <button
        type="button"
        onClick={() => setValue((v) => Math.max(0, v - 5))}
        disabled={saving}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white active:scale-90 disabled:opacity-50"
      >
        <Minus size={12} />
      </button>
      <span className="shrink-0 whitespace-nowrap text-center text-xs font-semibold tabular-nums text-accent-300">
        {formatMinutes(value)}
      </span>
      <button
        type="button"
        onClick={() => setValue((v) => v + 5)}
        disabled={saving}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white active:scale-90 disabled:opacity-50"
      >
        <Plus size={12} />
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        aria-label="Speichern"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-400/20 text-accent-300 active:scale-90 disabled:opacity-50"
      >
        <Check size={12} strokeWidth={3} />
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        disabled={saving}
        aria-label="Abbrechen"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/40 active:scale-90 disabled:opacity-50"
      >
        <X size={12} />
      </button>
    </div>
  );
}
