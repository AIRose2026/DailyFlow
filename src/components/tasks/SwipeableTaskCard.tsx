"use client";

import { animate, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Check, Trash2 } from "lucide-react";

const ACTION_THRESHOLD = 96;
const MAX_DRAG = 160;
const SNAP_BACK = { type: "spring", stiffness: 500, damping: 32 } as const;

export function SwipeableTaskCard({
  onComplete,
  onDelete,
  children,
}: {
  onComplete: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const completeOpacity = useTransform(x, [0, ACTION_THRESHOLD], [0, 1]);
  const completeScale = useTransform(x, [0, ACTION_THRESHOLD], [0.6, 1]);
  const deleteOpacity = useTransform(x, [-ACTION_THRESHOLD, 0], [1, 0]);
  const deleteScale = useTransform(x, [-ACTION_THRESHOLD, 0], [1, 0.6]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > ACTION_THRESHOLD) {
      onComplete();
    } else if (info.offset.x < -ACTION_THRESHOLD) {
      onDelete();
    } else {
      // Below the threshold: spring back to center instead of leaving the
      // card wherever the finger let go (drag alone doesn't do this).
      animate(x, 0, SNAP_BACK);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <motion.div
        style={{ opacity: completeOpacity }}
        className="absolute inset-0 flex items-center rounded-3xl bg-accent-gradient px-6 shadow-glow"
      >
        <motion.div
          style={{ scale: completeScale }}
          className="flex items-center gap-2 text-base-950"
        >
          <Check size={22} strokeWidth={3} />
          <span className="text-sm font-bold">Erledigt</span>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute inset-0 flex items-center justify-end rounded-3xl bg-danger-500 px-6"
      >
        <motion.div style={{ scale: deleteScale }} className="flex items-center gap-2 text-white">
          <span className="text-sm font-bold">Löschen</span>
          <Trash2 size={22} strokeWidth={3} />
        </motion.div>
      </motion.div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -MAX_DRAG, right: MAX_DRAG }}
        dragElastic={0.2}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ cursor: "grabbing" }}
        className="relative z-10 cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
}
