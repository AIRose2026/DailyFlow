import { cn } from "@/lib/utils/cn";

type Tone = "accent" | "danger" | "warn" | "neutral";

const toneClasses: Record<Tone, string> = {
  accent: "bg-accent-400/15 text-accent-300 ring-1 ring-accent-400/30",
  danger: "bg-danger-500/15 text-danger-400 ring-1 ring-danger-500/30",
  warn: "bg-warn/15 text-warn ring-1 ring-warn/30",
  neutral: "bg-white/[0.06] text-white/70 ring-1 ring-white/10",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
