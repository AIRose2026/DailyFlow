"use client";

import { cn } from "@/lib/utils/cn";

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      <FilterChip label="Alle" active={selected === null} onClick={() => onSelect(null)} />
      {categories.map((category) => (
        <FilterChip
          key={category}
          label={category}
          active={selected === category}
          onClick={() => onSelect(category)}
        />
      ))}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all",
        active
          ? "border-accent-400/50 bg-accent-400/15 text-accent-300 shadow-glow-sm"
          : "border-white/10 bg-white/[0.03] text-white/60"
      )}
    >
      {label}
    </button>
  );
}
