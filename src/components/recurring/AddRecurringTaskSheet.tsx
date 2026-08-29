"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { CategorySelect } from "@/components/tasks/CategorySelect";
import { GlowButton } from "@/components/ui/GlowButton";
import { formatMinutes } from "@/lib/utils/time";

export function AddRecurringTaskFab({
  onCreate,
}: {
  onCreate: (input: {
    title: string;
    category?: string | null;
    estimated_minutes: number;
  }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [minutes, setMinutes] = useState(15);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onCreate({ title: title.trim(), category: category.trim() || null, estimated_minutes: minutes });
    setSaving(false);
    setTitle("");
    setCategory("");
    setMinutes(15);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Neue Routine"
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent-gradient text-base-950 shadow-glow-lg transition-transform active:scale-90"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="glass-card safe-bottom w-full max-w-md rounded-b-none p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Neue Routine</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z. B. Posteingang sichten"
                  className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-base text-white outline-none focus:border-accent-400/60 focus:shadow-glow-sm"
                />
                <CategorySelect value={category} onChange={setCategory} />

                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                  <span className="text-sm text-white/60">Geplante Dauer</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMinutes((m) => Math.max(5, m - 5))}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white active:scale-90"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-20 text-center text-sm font-semibold text-accent-300">
                      {formatMinutes(minutes)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMinutes((m) => Math.min(240, m + 5))}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white active:scale-90"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <GlowButton type="submit" disabled={saving || !title.trim()} className="mt-1">
                  {saving ? "Speichern…" : "Hinzufügen"}
                </GlowButton>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
