"use client";

import { CalendarClock, LayoutGrid, Mail, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Heute", icon: LayoutGrid },
  { href: "/recurring", label: "Routinen", icon: CalendarClock },
  { href: "/emails", label: "E-Mails", icon: Mail },
  { href: "/settings", label: "Mehr", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Fade lives entirely here, above the (now flat, opaque) nav —
          same idea as the top header's glow, mirrored: fades in from
          nothing, blooms teal, then fades into a solid black cap that
          matches the nav's own color exactly. Anchored to the bottom
          and taller than the nav itself, so the nav (opaque, higher
          z-index) simply covers whatever part of this layer's own
          bottom it overlaps — no need to precisely match heights.

          Deliberately no backdrop-blur here (a real-device test showed
          a backdrop-blur layer this close to the floating add buttons
          visually distorts them into an oversized blob — a WebKit
          rendering issue, not a stacking/z-index one). */}
      <div
        aria-hidden
        className="nav-glow-bleed pointer-events-none fixed inset-x-0 bottom-0 z-20 h-64"
      />
      <nav className="app-bottom-nav nav-glow fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto flex max-w-md items-stretch justify-between gap-1 px-2 pb-1 pt-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors"
              >
                <Icon
                  size={22}
                  strokeWidth={2}
                  className={cn(
                    "transition-colors",
                    active ? "text-accent-400 drop-shadow-[0_0_6px_rgba(45,251,224,0.6)]" : "text-white/40"
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] font-medium transition-colors",
                    active ? "text-accent-300" : "text-white/40"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
