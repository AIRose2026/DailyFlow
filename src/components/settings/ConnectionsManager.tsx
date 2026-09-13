"use client";

import { Check, Link2, Send, Trash2, X } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useConnections } from "@/lib/hooks/useConnections";

/**
 * Settings → "Verbunden mit": invite another DailyFlow user by email,
 * accept/decline incoming requests, and manage existing connections. A
 * connection is what unlocks assigning a task to that person (see the "+"
 * flow) — nothing else about their account becomes visible.
 */
export function ConnectionsManager() {
  const {
    accepted,
    incomingPending,
    outgoingPending,
    loading,
    error,
    inviteByEmail,
    accept,
    decline,
    disconnect,
  } = useConnections();
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    setInviteError(null);
    setInviteSent(false);
    const result = await inviteByEmail(email);
    setInviting(false);
    if (result.ok) {
      setEmail("");
      setInviteSent(true);
    } else {
      setInviteError(result.error);
    }
  }

  return (
    <GlassCard className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Link2 size={16} className="text-accent-400" />
        <p className="text-sm font-semibold text-white/80">Verbunden mit</p>
      </div>
      <p className="text-sm text-white/50">
        Verbinde dich mit jemandem, um Aufgaben direkt auf dessen Liste einzustellen — erst
        nach beidseitiger Bestätigung, und nur Aufgaben, keine Routinen oder sonstigen Daten.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setInviteError(null);
            setInviteSent(false);
          }}
          placeholder="E-Mail-Adresse einladen"
          className="h-11 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-[15px] text-white outline-none focus:border-accent-400/60 focus:shadow-glow-sm"
        />
        <button
          type="submit"
          disabled={inviting || !email.trim()}
          aria-label="Einladen"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-gradient text-base-950 shadow-glow transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
      {inviteError && <p className="text-sm text-danger-400">{inviteError}</p>}
      {inviteSent && <p className="text-sm text-accent-400">Einladung gesendet.</p>}
      {error && <p className="text-sm text-danger-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-white/40">Lade Verbindungen…</p>
      ) : (
        <>
          {incomingPending.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                Eingehende Anfragen
              </p>
              <ul className="flex flex-col divide-y divide-white/[0.06]">
                {incomingPending.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 py-2.5">
                    <span className="min-w-0 truncate text-[15px] text-white">
                      {c.otherEmail}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => accept(c.id)}
                        aria-label={`Anfrage von ${c.otherEmail} annehmen`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-400/15 text-accent-400 transition-colors active:scale-90"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => decline(c.id)}
                        aria-label={`Anfrage von ${c.otherEmail} ablehnen`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-white/25 transition-colors hover:text-danger-400"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {outgoingPending.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                Gesendete Anfragen
              </p>
              <ul className="flex flex-col divide-y divide-white/[0.06]">
                {outgoingPending.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] text-white">{c.otherEmail}</p>
                      <p className="text-xs text-white/40">Wartet auf Bestätigung</p>
                    </div>
                    <button
                      onClick={() => decline(c.id)}
                      aria-label={`Anfrage an ${c.otherEmail} zurückziehen`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/25 transition-colors hover:text-danger-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Verbunden
            </p>
            {accepted.length === 0 ? (
              <p className="text-sm text-white/40">Noch mit niemandem verbunden.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-white/[0.06]">
                {accepted.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 py-2.5">
                    <span className="min-w-0 truncate text-[15px] text-white">
                      {c.otherEmail}
                    </span>
                    <button
                      onClick={() => disconnect(c.id)}
                      aria-label={`Verbindung mit ${c.otherEmail} trennen`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/25 transition-colors hover:text-danger-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </GlassCard>
  );
}
