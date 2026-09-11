"use client";

import { useEffect, useState } from "react";
import { todayISODate } from "@/lib/utils/date";

/**
 * Ticks to a new value whenever the local calendar day changes. Nothing
 * else causes a re-render exactly at midnight — no data changes, no other
 * timer — so any "today"-relative view (Wochenübersicht highlighting the
 * right day, Heute/Überfällig grouping, ...) stays stuck showing the
 * previous day until some unrelated interaction happens to trigger a
 * re-render, unless it depends on this.
 *
 * Checks once a minute rather than scheduling a precise midnight timeout —
 * simpler, and a render within a minute of the actual rollover is plenty.
 */
export function useDayKey(): string {
  const [dayKey, setDayKey] = useState(() => todayISODate());

  useEffect(() => {
    const id = setInterval(() => {
      const next = todayISODate();
      setDayKey((prev) => (prev === next ? prev : next));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return dayKey;
}
