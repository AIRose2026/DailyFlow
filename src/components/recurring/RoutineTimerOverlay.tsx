"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Pause, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Portal } from "@/components/ui/Portal";
import { splitTrackedDuration } from "@/lib/utils/time";

/**
 * The full-screen "running" view a routine's timer opens into — a big live
 * counter plus two big actions, for glancing at from across the room
 * instead of squinting at the small inline badge. Pause books the current
 * session (same as the old inline stop) without completing the routine;
 * Fertig books it AND marks the routine done in one tap.
 */
export function RoutineTimerOverlay({
  open,
  title,
  /** started_at of the currently running session, for live ticking here. */
  startedAt,
  /** Already-booked seconds from earlier sessions today. */
  baselineSeconds,
  onPause,
  onFinish,
  onClose,
}: {
  open: boolean;
  title: string;
  startedAt: string | null;
  baselineSeconds: number;
  onPause: () => Promise<void>;
  onFinish: () => Promise<void>;
  onClose: () => void;
}) {
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [pausing, setPausing] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!open || !startedAt) return;
    const startedMs = new Date(startedAt).getTime();
    function tick() {
      setSessionSeconds(Math.max(0, Math.round((Date.now() - startedMs) / 1000)));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open, startedAt]);

  async function handlePause() {
    setPausing(true);
    await onPause();
    setPausing(false);
  }

  async function handleFinish() {
    setFinishing(true);
    await onFinish();
    setFinishing(false);
  }

  const busy = pausing || finishing;
  const { value, unit } = splitTrackedDuration(baselineSeconds + sessionSeconds);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-10 bg-base-950 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Minimieren"
              className="app-fab absolute right-5 top-[calc(env(safe-area-inset-top)+0.75rem)] flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] text-white/60 transition-all active:scale-90"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center gap-3 text-center">
              <p className="animate-pulse-glow text-sm font-semibold uppercase tracking-wide text-accent-300">
                Läuft
              </p>
              <p className="max-w-xs truncate text-xl font-semibold text-white">{title}</p>
            </div>

            <p className="flex items-baseline gap-2 font-mono text-white drop-shadow-[0_0_24px_rgba(45,251,224,0.35)]">
              <span className="text-7xl font-bold tabular-nums">{value}</span>
              <span className="text-2xl font-semibold text-white/60">{unit}</span>
            </p>

            <div className="flex w-full max-w-sm flex-col gap-3">
              <button
                type="button"
                onClick={handleFinish}
                disabled={busy}
                className="flex h-16 items-center justify-center gap-2 rounded-3xl bg-accent-gradient text-lg font-bold text-base-950 shadow-glow-lg transition-all active:scale-[0.97] disabled:opacity-50"
              >
                <Check size={22} strokeWidth={3} />
                {finishing ? "Wird gespeichert…" : "Fertig"}
              </button>
              <button
                type="button"
                onClick={handlePause}
                disabled={busy}
                className="flex h-14 items-center justify-center gap-2 rounded-3xl border border-white/15 bg-white/[0.04] text-base font-semibold text-white/80 transition-all active:scale-[0.97] disabled:opacity-50"
              >
                <Pause size={20} />
                {pausing ? "Wird pausiert…" : "Pause"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
