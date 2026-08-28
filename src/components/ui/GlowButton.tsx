"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "ghost" | "danger";

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent-gradient text-base-950 shadow-glow hover:shadow-glow-lg active:scale-[0.97]",
  ghost:
    "border border-white/10 bg-white/[0.04] text-white hover:border-accent-400/40 hover:shadow-glow-sm active:scale-[0.97]",
  danger:
    "border border-danger-500/30 bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 active:scale-[0.97]",
};

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex h-12 min-h-[44px] items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-semibold transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-40",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
GlowButton.displayName = "GlowButton";
