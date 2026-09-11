"use client";

import { animate, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Check } from "lucide-react";

const ACTION_THRESHOLD = 96;
const MAX_DRAG = 160;
const SNAP_BACK = { type: "spring", stiffness: 500, damping: 32 } as const;

/**
 * Right-swipe-only complete gesture — the mirror of SwipeToDeleteCard. Used
 * for routines on the To-dos view when the user's complete-gesture setting
 * is "swipe": there's no delete gesture here (deleting a routine is the
 * Routinen tab's job), so only the complete side exists.
 */
export function SwipeToCompleteCard({
  onComplete,
  children,
}: {
  onComplete: () => void;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const completeOpacity = useTransform(x, [0, ACTION_THRESHOLD], [0, 1]);
  const completeScale = useTransform(x, [0, ACTION_THRESHOLD], [0.6, 1]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > ACTION_THRESHOLD) {
      onComplete();
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
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: MAX_DRAG }}
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
