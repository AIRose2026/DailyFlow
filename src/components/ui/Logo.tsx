import { cn } from "@/lib/utils/cn";

/** The DailyFlow icon mark: flow bars merging into an open ring. */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoGrad" x1="2" y1="4" x2="62" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8dffec" />
          <stop offset="100%" stopColor="#0aad9c" />
        </linearGradient>
      </defs>
      <rect x="4" y="15" width="24" height="7" rx="3.5" fill="url(#logoGrad)" />
      <rect x="4" y="28.5" width="17" height="7" rx="3.5" fill="url(#logoGrad)" />
      <rect x="4" y="42" width="10" height="7" rx="3.5" fill="url(#logoGrad)" />
      <circle
        cx="38"
        cy="32"
        r="19"
        stroke="url(#logoGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="94 31"
        transform="rotate(198 38 32)"
      />
    </svg>
  );
}

/** Icon mark + "DailyFlow" wordmark, matching the brand's Daily/Flow color split. */
export function Logo({
  size = 40,
  className,
  textClassName,
}: {
  size?: number;
  className?: string;
  textClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={size} className="shrink-0 drop-shadow-[0_0_14px_rgba(45,251,224,0.35)]" />
      <span className={cn("text-2xl font-bold tracking-tight", textClassName)}>
        <span className="text-white">Daily</span>
        <span className="bg-accent-gradient bg-clip-text text-transparent">Flow</span>
      </span>
    </div>
  );
}
