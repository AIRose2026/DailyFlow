"use client";

import Link from "next/link";
import { useCategories } from "@/lib/hooks/useCategories";

export function CategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { categories, loading } = useCategories();

  if (!loading && categories.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm text-white/40">
        Noch keine Kategorien angelegt.{" "}
        <Link href="/settings" className="text-accent-400 underline underline-offset-2">
          Jetzt in den Einstellungen anlegen
        </Link>
        .
      </p>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-base text-white outline-none focus:border-accent-400/60 focus:shadow-glow-sm"
    >
      <option value="" className="bg-base-900">
        Keine Kategorie
      </option>
      {categories.map((category) => (
        <option key={category.id} value={category.name} className="bg-base-900">
          {category.name}
        </option>
      ))}
    </select>
  );
}
