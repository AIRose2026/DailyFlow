"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Check } from "lucide-react";

const COMPLETE_THRESHOLD = 96;
const MAX_DRAG = 160;

export function SwipeableTaskCard({
  onComplete,
  children,
}: {
  onComplete: () => void;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const revealOpacity = useTransform(x, [0, COMPLETE_THRESHOLD], [0, 1]);
  const revealScale = useTransform(x, [0, COMPLETE_THRESHOLD], [0.6, 1]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > COMPLETE_THRESHOLD) {
      onComplete();
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <motion.div
        style={{ opacity: revealOpacity }}
        className="absolute inset-0 flex items-center rounded-3xl bg-accent-gradient px-6 shadow-glow"
      >
        <motion.div
          style={{ scale: revealScale }}
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
        dragElastic={0.25}
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
