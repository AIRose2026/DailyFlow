"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { CategorySelect } from "@/components/tasks/CategorySelect";
import { GlowButton } from "@/components/ui/GlowButton";
import { todayISODate } from "@/lib/utils/date";

export function AddTaskFab({
  onCreate,
}: {
  onCreate: (input: { title: string; category?: string | null; due_date?: string | null }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState(todayISODate());
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onCreate({
      title: title.trim(),
      category: category.trim() || null,
      due_date: dueDate || null,
    });
    setSaving(false);
    setTitle("");
    setCategory("");
    setDueDate(todayISODate());
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Neue Aufgabe"
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
                <h2 className="text-lg font-bold">Neue Aufgabe</h2>
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
                  placeholder="Was steht an?"
                  className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-base text-white outline-none focus:border-accent-400/60 focus:shadow-glow-sm"
                />
                <CategorySelect value={category} onChange={setCategory} />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="due-date" className="text-sm text-white/60">
                    Fällig am
                  </label>
                  <input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-base text-white outline-none [color-scheme:dark] focus:border-accent-400/60 focus:shadow-glow-sm"
                  />
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
