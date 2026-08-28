"use client";

import { CalendarClock, LayoutGrid, Mail, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRecurringTasks } from "@/lib/hooks/useRecurringTasks";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Heute", icon: LayoutGrid },
  { href: "/recurring", label: "Routinen", icon: CalendarClock },
  { href: "/emails", label: "E-Mails", icon: Mail },
  { href: "/settings", label: "Mehr", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { recurringTasks, completedTodayIds } = useRecurringTasks();

  const openRecurringToday = recurringTasks.filter((t) => !completedTodayIds.has(t.id)).length;
  const badgeCounts: Partial<Record<(typeof NAV_ITEMS)[number]["href"], number>> = {
    "/recurring": openRecurringToday,
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 safe-bottom">
      <div className="mx-auto flex max-w-md items-stretch justify-between gap-1 border-t border-white/[0.06] bg-base-950/80 px-2 pb-1 pt-2 backdrop-blur-xl">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          const badge = badgeCounts[href];

          return (
            <Link
              key={href}
              href={href}
              className="relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1 transition-colors"
            >
              {active && (
                <span className="absolute inset-1 -z-10 rounded-xl bg-accent-400/10 shadow-inner-glow" />
              )}
              <span className="relative">
                <Icon
                  size={22}
                  strokeWidth={2}
                  className={cn(
                    "transition-colors",
                    active
                      ? "text-accent-400 drop-shadow-[0_0_6px_rgba(45,251,224,0.6)]"
                      : "text-white/40"
                  )}
                />
                {!!badge && badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_6px_rgba(255,84,112,0.6)]">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
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
  );
}
