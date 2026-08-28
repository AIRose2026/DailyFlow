"use client";

import { Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useCategories } from "@/lib/hooks/useCategories";

export function CategoryManager() {
  const { categories, loading, error, addCategory, deleteCategory } = useCategories();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await addCategory(name);
    setSaving(false);
    setName("");
  }

  return (
    <GlassCard className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Tag size={16} className="text-accent-400" />
        <p className="text-sm font-semibold text-white/80">Kategorien</p>
      </div>
      <p className="text-sm text-white/50">
        Hier verwaltete Kategorien stehen beim Anlegen von Aufgaben und Routinen zur
        Auswahl.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Neue Kategorie, z. B. Vertrieb"
          className="h-11 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-[15px] text-white outline-none focus:border-accent-400/60 focus:shadow-glow-sm"
        />
        <button
          type="submit"
          disabled={saving || !name.trim()}
          aria-label="Kategorie hinzufügen"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-gradient text-base-950 shadow-glow transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={18} />
        </button>
      </form>

      {error && <p className="text-sm text-danger-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-white/40">Lade Kategorien…</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-white/40">Noch keine Kategorien angelegt.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/[0.06]">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between py-2.5">
              <span className="text-[15px] text-white">{category.name}</span>
              <button
                onClick={() => deleteCategory(category.id)}
                aria-label={`Kategorie ${category.name} löschen`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/25 transition-colors hover:text-danger-400"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
