"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SwipeableTaskCard } from "./SwipeableTaskCard";
import { TaskCard } from "./TaskCard";
import type { Task } from "@/lib/supabase/types";

export function TaskList({
  tasks,
  onComplete,
  emptyLabel,
}: {
  tasks: Task[];
  onComplete: (id: string) => void;
  emptyLabel: string;
}) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/40">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <SwipeableTaskCard onComplete={() => onComplete(task.id)}>
              <TaskCard task={task} />
            </SwipeableTaskCard>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
