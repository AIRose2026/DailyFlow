"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlowButton } from "@/components/ui/GlowButton";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("Anmeldung fehlgeschlagen. Bitte E-Mail und Passwort prüfen.");
      return;
    }

    const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm text-white/60">
          E-Mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-base text-white outline-none transition focus:border-accent-400/60 focus:shadow-glow-sm"
          placeholder="du@beispiel.de"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm text-white/60">
          Passwort
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-base text-white outline-none transition focus:border-accent-400/60 focus:shadow-glow-sm"
          placeholder="••••••••"
        />
      </div>

      {error && <p className="text-sm text-danger-400">{error}</p>}

      <GlowButton type="submit" disabled={loading} className="mt-2 w-full">
        {loading ? "Anmelden…" : "Anmelden"}
      </GlowButton>
    </form>
  );
}
