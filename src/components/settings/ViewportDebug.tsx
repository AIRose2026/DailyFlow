"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";

interface DebugInfo {
  standalone: boolean;
  windowInnerHeight: number;
  documentClientHeight: number;
  visualViewportHeight: number | null;
  screenHeight: number;
  devicePixelRatio: number;
  safeAreaTop: string;
  safeAreaBottom: string;
  navPaddingBottom: string;
  navBoundingBottom: number | null;
  bodyHeight: number;
  userAgent: string;
}

/**
 * Temporary, ourselves-only diagnostic panel to get real measurements
 * from the reporting device instead of guessing further from
 * screenshots. Safe to remove once the safe-area/nav-gap issue is
 * resolved.
 */
export function ViewportDebug() {
  const [info, setInfo] = useState<DebugInfo | null>(null);

  useEffect(() => {
    function measure() {
      const probe = document.createElement("div");
      probe.style.position = "fixed";
      probe.style.bottom = "0";
      probe.style.paddingBottom = "env(safe-area-inset-bottom)";
      probe.style.visibility = "hidden";
      document.body.appendChild(probe);
      const safeAreaBottom = getComputedStyle(probe).paddingBottom;
      probe.style.paddingBottom = "";
      probe.style.paddingTop = "env(safe-area-inset-top)";
      const safeAreaTop = getComputedStyle(probe).paddingTop;
      probe.remove();

      const nav = document.querySelector("nav");
      const navRect = nav?.getBoundingClientRect() ?? null;

      setInfo({
        standalone: window.matchMedia("(display-mode: standalone)").matches,
        windowInnerHeight: window.innerHeight,
        documentClientHeight: document.documentElement.clientHeight,
        visualViewportHeight: window.visualViewport?.height ?? null,
        screenHeight: window.screen?.height ?? 0,
        devicePixelRatio: window.devicePixelRatio,
        safeAreaTop,
        safeAreaBottom,
        navPaddingBottom: nav ? getComputedStyle(nav).paddingBottom : "n/a",
        navBoundingBottom: navRect ? navRect.bottom : null,
        bodyHeight: document.body.getBoundingClientRect().height,
        userAgent: navigator.userAgent,
      });
    }

    measure();
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);

  if (!info) return null;

  const rows: [string, string | number][] = [
    ["standalone (display-mode)", String(info.standalone)],
    ["window.innerHeight", info.windowInnerHeight],
    ["documentElement.clientHeight", info.documentClientHeight],
    ["visualViewport.height", info.visualViewportHeight ?? "n/a"],
    ["screen.height", info.screenHeight],
    ["devicePixelRatio", info.devicePixelRatio],
    ["env(safe-area-inset-top)", info.safeAreaTop],
    ["env(safe-area-inset-bottom)", info.safeAreaBottom],
    ["nav padding-bottom (computed)", info.navPaddingBottom],
    ["nav bottom edge (px from viewport top)", info.navBoundingBottom ?? "n/a"],
    ["body height", info.bodyHeight],
  ];

  return (
    <GlassCard className="flex flex-col gap-2 text-xs">
      <p className="font-semibold text-white/80">Diagnose (temporär)</p>
      <div className="flex flex-col divide-y divide-white/[0.06]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-white/50">{label}</span>
            <span className="font-mono text-accent-300">{value}</span>
          </div>
        ))}
      </div>
      <p className="break-all text-[10px] text-white/30">{info.userAgent}</p>
    </GlassCard>
  );
}
