"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mic, Send, Square, X } from "lucide-react";
import { useState } from "react";
import { GlowButton } from "@/components/ui/GlowButton";
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition";
import type { EmailTaskWithContext } from "@/lib/supabase/types";
import { cn } from "@/lib/utils/cn";

export function VoicePromptModal({
  emailTask,
  onClose,
  onSend,
}: {
  emailTask: EmailTaskWithContext;
  onClose: () => void;
  onSend: (prompt: string) => Promise<unknown>;
}) {
  const { supported, listening, transcript, setTranscript, start, stop } =
    useSpeechRecognition();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!transcript.trim()) return;
    setSending(true);
    setError(null);
    try {
      await onSend(transcript.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Senden fehlgeschlagen.");
    } finally {
      setSending(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="glass-card w-full max-w-md rounded-b-none px-6 pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold">Antwort an Judith</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 truncate text-sm text-white/40">
          Re: {emailTask.email_subject}
        </p>

        <div className="mb-4 flex flex-col items-center gap-3">
          <AnimatePresence>
            {listening && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="absolute h-24 w-24 rounded-full bg-accent-400/20 blur-xl"
              />
            )}
          </AnimatePresence>
          <button
            type="button"
            disabled={!supported}
            onClick={listening ? stop : start}
            className={cn(
              "relative flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all active:scale-95",
              listening
                ? "animate-pulse-glow border-accent-400 bg-accent-400/20 text-accent-400 shadow-glow"
                : "border-white/15 bg-white/[0.04] text-white/70",
              !supported && "opacity-30"
            )}
          >
            {listening ? <Square size={26} /> : <Mic size={28} />}
          </button>
          <p className="text-xs text-white/40">
            {supported
              ? listening
                ? "Ich höre zu…"
                : "Antippen und sprechen"
              : "Spracheingabe hier nicht verfügbar – bitte Text eingeben"}
          </p>
        </div>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder='z. B. "Antworte höflich und sag, dass der Termin nächste Woche passt."'
          rows={3}
          className="mb-3 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] text-white outline-none focus:border-accent-400/60 focus:shadow-glow-sm"
        />

        {error && <p className="mb-3 text-sm text-danger-400">{error}</p>}

        <GlowButton
          onClick={handleSend}
          disabled={sending || !transcript.trim()}
          className="w-full gap-2"
        >
          <Send size={18} />
          {sending ? "Wird an Judith gesendet…" : "An Judith senden"}
        </GlowButton>
      </motion.div>
    </motion.div>
  );
}
