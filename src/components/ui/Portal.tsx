"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children directly into document.body, outside the app's normal
 * component tree. Needed for our bottom sheets/modals: they're opened from
 * components nested inside .app-scroll, which sets
 * -webkit-overflow-scrolling: touch for momentum scrolling — a known iOS
 * Safari quirk traps position:fixed descendants of such a container,
 * rendering them clipped to (and behind sibling fixed elements of) that
 * container instead of the real viewport, which is exactly why the sheet's
 * submit button was appearing behind the bottom nav. Escaping via a portal
 * sidesteps the bug entirely.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
