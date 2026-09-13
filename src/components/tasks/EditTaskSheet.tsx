"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CategorySelect } from "@/components/tasks/CategorySelect";
import { GlowButton } from "@/components/ui/GlowButton";
import { Portal } from "@/components/ui/Portal";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hasCategoriesEnabled } from "@/lib/auth/features";
import type { Task } from "@/lib/supabase/types";

export function EditTaskSheet({
  task,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (
    id: string,
    input: {
      title: string;
      description?: string | null;
      category?: string | null;
      due_date?: string | null;
    }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { user } = useAuth();
  const categoriesEnabled = hasCategoriesEnabled(user);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [showDate, setShowDate] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Re-seed the form whenever a (new) task is opened for editing.
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setCategory(task.category ?? "");
    setShowDate(Boolean(task.due_date));
    setDueDate(task.due_date ?? "");
  }, [task]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !title.trim()) return;
    setSaving(true);
    await onSave(task.id, {
      title: title.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      due_date: showDate && dueDate ? dueDate : null,
    });
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!task) return;
    setDeleting(true);
    await onDelete(task.id);
    setDeleting(false);
    onClose();
  }

  return (
    <Portal>
      <AnimatePresence>
        {task && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="glass-card w-full max-w-md rounded-b-none app-sheet-bottom px-6 pt-6 pb-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Aufgabe bearbeiten</h2>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Was steht an?"
                  className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-base text-white outline-none focus:border-accent-400/60 focus:shadow-glow-sm"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notiz (optional)"
                  rows={3}
                  className="resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-base text-white outline-none focus:border-accent-400/60 focus:shadow-glow-sm"
                />
                {categoriesEnabled && <CategorySelect value={category} onChange={setCategory} />}

                {showDate ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="edit-task-due-date" className="text-sm text-white/60">
                        Fällig am
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDate(false);
                          setDueDate("");
                        }}
                        className="text-xs text-white/40 underline underline-offset-2"
                      >
                        Entfernen
                      </button>
                    </div>
                    <input
                      id="edit-task-due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-base text-white outline-none [color-scheme:dark] focus:border-accent-400/60 focus:shadow-glow-sm"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDate(true)}
                    className="flex items-center gap-2 self-start rounded-2xl border border-dashed border-white/15 px-4 py-2.5 text-sm text-white/50 transition-colors active:scale-[0.97]"
                  >
                    <CalendarPlus size={16} />
                    Datum festlegen
                  </button>
                )}

                <GlowButton type="submit" disabled={saving || !title.trim()} className="mt-1">
                  {saving ? "Speichern…" : "Speichern"}
                </GlowButton>
                <GlowButton
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="gap-2"
                >
                  <Trash2 size={16} />
                  {deleting ? "Wird gelöscht…" : "Aufgabe löschen"}
                </GlowButton>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
