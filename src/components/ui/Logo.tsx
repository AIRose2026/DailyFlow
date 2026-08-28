import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const ICON_ASPECT = 440 / 340;

/** The DailyFlow icon mark (flow bars merging into the "D"). */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo-icon.png"
      alt=""
      width={Math.round(size * ICON_ASPECT)}
      height={size}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

/** Full brand lockup (icon + "DailyFlow" wordmark) as designed. */
export function Logo({ width = 320, className }: { width?: number; className?: string }) {
  const height = Math.round(width * (836 / 1881));
  return (
    <Image
      src="/logo.png"
      alt="DailyFlow"
      width={width}
      height={height}
      className={cn("h-auto w-full max-w-full", className)}
    />
  );
}
