"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageSquarePlus, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GlowButton } from "@/components/ui/GlowButton";

export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleClose() {
    setOpen(false);
    // Reset after the close animation so the sheet doesn't visibly
    // flash back to its empty state while it's still fading out.
    setTimeout(() => {
      setMessage("");
      setError(null);
      setSent(false);
    }, 200);
  }

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), page: pathname }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Senden fehlgeschlagen.");
      }
      setSent(true);
      setTimeout(handleClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Senden fehlgeschlagen.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Feedback geben"
        className="fixed right-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 backdrop-blur-xl transition-transform active:scale-90"
      >
        <MessageSquarePlus size={20} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="glass-card app-sheet-bottom w-full max-w-md rounded-b-none px-6 pb-6 pt-6"
            >
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-bold">Feedback</h2>
                <button
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mb-4 text-sm text-white/40">
                Verbesserungsvorschlag oder Bug — landet direkt in unserem ClickUp-Board.
              </p>

              {sent ? (
                <div className="flex flex-col items-center gap-2 py-6 text-accent-400">
                  <Check size={32} />
                  <p className="text-sm text-white/70">Danke, ist angekommen!</p>
                </div>
              ) : (
                <>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Was können wir besser machen?"
                    rows={4}
                    autoFocus
                    className="mb-3 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] text-white outline-none focus:border-accent-400/60 focus:shadow-glow-sm"
                  />

                  {error && <p className="mb-3 text-sm text-danger-400">{error}</p>}

                  <GlowButton
                    onClick={handleSend}
                    disabled={sending || !message.trim()}
                    className="w-full gap-2"
                  >
                    {sending ? "Wird gesendet…" : "Feedback senden"}
                  </GlowButton>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
