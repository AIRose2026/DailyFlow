import { LogoMark } from "@/components/ui/Logo";
import { cn } from "@/lib/utils/cn";

export function PageHeader({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "safe-top bg-radial-fade px-4 pb-5 pt-6",
        className
      )}
    >
      <div className="mx-auto max-w-md">
        <div className="mb-1 flex items-center gap-2">
          <LogoMark size={18} />
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-wider text-accent-400/80">
              {eyebrow}
            </p>
          )}
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-white">{title}</h1>
        {children}
      </div>
    </header>
  );
}
