"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import { AlertTriangle, Check, Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useApiTokens } from "@/lib/hooks/useApiTokens";

export function ApiTokenManager() {
  const { tokens, loading, error, createToken, deleteToken } = useApiTokens();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const token = await createToken(name.trim() || "Judith");
    setCreating(false);
    if (token) {
      setFreshToken(token);
      setName("");
    }
  }

  async function handleCopy() {
    if (!freshToken) return;
    await navigator.clipboard.writeText(freshToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="glass-card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <KeyRound size={16} className="text-accent-400" />
        <p className="text-sm font-semibold text-white/80">API-Token für Langdock</p>
      </div>
      <p className="text-sm text-white/50">
        Für eine eigene Automatisierung in deinem Langdock-Account — z. B. um Aufgaben
        oder Routinen anlegen zu lassen, oder eine eigene Judith für geflaggte
        E-Mails — ohne dafür den Supabase-Master-Schlüssel zu teilen. Der Token gilt
        nur für deinen eigenen Account.
      </p>

      {freshToken && (
        <div className="flex flex-col gap-2 rounded-2xl border border-accent-400/30 bg-accent-400/10 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-accent-300">
            <AlertTriangle size={13} />
            Wird nur jetzt einmal angezeigt — danach nicht mehr abrufbar.
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-base-950/60 px-3 py-2 text-left"
          >
            <span className="truncate font-mono text-xs text-white">{freshToken}</span>
            {copied ? (
              <Check size={15} className="shrink-0 text-accent-400" />
            ) : (
              <Copy size={15} className="shrink-0 text-white/50" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setFreshToken(null)}
            className="self-start text-xs text-white/40 underline underline-offset-2"
          >
            Ausblenden
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name, z. B. Judith (Marco)"
          className="h-11 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-[15px] text-white outline-none focus:border-accent-400/60 focus:shadow-glow-sm"
        />
        <button
          type="submit"
          disabled={creating}
          aria-label="Token erstellen"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-gradient text-base-950 shadow-glow transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={18} />
        </button>
      </form>

      {error && <p className="text-sm text-danger-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-white/40">Lade Tokens…</p>
      ) : tokens.length === 0 ? (
        <p className="text-sm text-white/40">Noch keine Tokens erstellt.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/[0.06]">
          {tokens.map((token) => (
            <li key={token.id} className="flex items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[15px] text-white">{token.name}</p>
                <p className="truncate font-mono text-xs text-white/40">
                  {token.token_prefix}… ·{" "}
                  {token.last_used_at
                    ? `zuletzt genutzt ${format(new Date(token.last_used_at), "d. MMM", { locale: de })}`
                    : "noch nie genutzt"}
                </p>
              </div>
              <button
                onClick={() => deleteToken(token.id)}
                aria-label={`Token ${token.name} widerrufen`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/25 transition-colors hover:text-danger-400"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
