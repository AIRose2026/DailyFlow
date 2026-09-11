"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { CategorySelect } from "@/components/tasks/CategorySelect";
import { GlowButton } from "@/components/ui/GlowButton";
import { Portal } from "@/components/ui/Portal";
import { WEEKDAY_OPTIONS } from "@/lib/utils/date";
import { formatMinutes } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";

type ItemType = "task" | "routine";

/**
 * The single "+" button for creating either a normal to-do or a routine —
 * replaces the two separate FABs that used to live on /dashboard and
 * /recurring. Opens on "Aufgabe" by default; a segmented toggle at the top
 * of the sheet switches which fields show.
 */
export function AddItemFab({
  onCreateTask,
  onCreateRecurringTask,
}: {
  onCreateTask: (input: {
    title: string;
    category?: string | null;
    due_date?: string | null;
  }) => Promise<void>;
  onCreateRecurringTask: (input: {
    title: string;
    category?: string | null;
    estimated_minutes: number;
    weekdays?: number[];
  }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ItemType>("task");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  // Task-only fields — see project note: reminders default to no date, only
  // explicitly dated tasks show a due date.
  const [showDate, setShowDate] = useState(false);
  const [dueDate, setDueDate] = useState("");

  // Routine-only fields.
  const [minutes, setMinutes] = useState(15);
  const [weekdays, setWeekdays] = useState<number[]>([]);

  function toggleWeekday(value: number) {
    setWeekdays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value].sort()
    );
  }

  function resetForm() {
    setType("task");
    setTitle("");
    setCategory("");
    setShowDate(false);
    setDueDate("");
    setMinutes(15);
    setWeekdays([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    if (type === "task") {
      await onCreateTask({
        title: title.trim(),
        category: category.trim() || null,
        due_date: showDate && dueDate ? dueDate : null,
      });
    } else {
      await onCreateRecurringTask({
        title: title.trim(),
        category: category.trim() || null,
        estimated_minutes: minutes,
        weekdays,
      });
    }

    setSaving(false);
    resetForm();
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Neu anlegen"
        className="app-fab fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent-gradient text-base-950 shadow-glow-lg transition-transform active:scale-90"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <Portal>
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
                className="glass-card w-full max-w-md rounded-b-none app-sheet-bottom px-6 pt-6 pb-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Neu anlegen</h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mb-4 flex gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                  {(["task", "routine"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        "flex-1 rounded-xl py-2 text-sm font-semibold transition-all",
                        type === t
                          ? "bg-accent-400/15 text-accent-300 shadow-glow-sm"
                          : "text-white/50"
                      )}
                    >
                      {t === "task" ? "Aufgabe" : "Routine"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={type === "task" ? "Was steht an?" : "z. B. Posteingang sichten"}
                    className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-base text-white outline-none focus:border-accent-400/60 focus:shadow-glow-sm"
                  />
                  <CategorySelect value={category} onChange={setCategory} />

                  {type === "task" ? (
                    showDate ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label htmlFor="add-item-due-date" className="text-sm text-white/60">
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
                          id="add-item-due-date"
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          autoFocus
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
                        Datum festlegen (optional)
                      </button>
                    )
                  ) : (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm text-white/60">Wiederholt sich</span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setWeekdays([])}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                              weekdays.length === 0
                                ? "border-accent-400/50 bg-accent-400/15 text-accent-300 shadow-glow-sm"
                                : "border-white/10 bg-white/[0.03] text-white/60"
                            )}
                          >
                            Jeden Tag
                          </button>
                          {WEEKDAY_OPTIONS.map((day) => {
                            const active = weekdays.includes(day.value);
                            return (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleWeekday(day.value)}
                                className={cn(
                                  "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-all",
                                  active
                                    ? "border-accent-400/50 bg-accent-400/15 text-accent-300 shadow-glow-sm"
                                    : "border-white/10 bg-white/[0.03] text-white/60"
                                )}
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

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
                    </>
                  )}

                  <GlowButton type="submit" disabled={saving || !title.trim()} className="mt-1">
                    {saving ? "Speichern…" : "Hinzufügen"}
                  </GlowButton>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
