import { cn } from "@/lib/utils/cn";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function GlassCard({ className, glow, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card p-4",
        glow && "shadow-glow-sm ring-1 ring-accent-400/20",
        className
      )}
      {...props}
    />
  );
}
