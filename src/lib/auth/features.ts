import type { User } from "@supabase/supabase-js";

/**
 * The Judith/Outlook email-task integration is wired to one hardcoded
 * mailbox + user_id per Langdock routine (see supabase/README.md) — it
 * isn't something a newly created account has by default. Gate the
 * "E-Mails" tab behind an explicit per-user flag instead of showing an
 * always-empty inbox to everyone.
 *
 * Enable it for a user via Supabase → Authentication → Users → (user) →
 * User Metadata, adding `"emails_enabled": true`, once their own Judith
 * routine is set up.
 */
export function hasEmailIntegration(user: User | null): boolean {
  return user?.user_metadata?.emails_enabled === true;
}

export type CompleteGesture = "swipe" | "tap";

/**
 * How this user completes tasks/routines: the original swipe gesture
 * (default), or an explicit tap-to-check button — Feedback: "Routinen und
 * to dos gleichermaßen zum abhaken nicht wischen". Per-user, not global, so
 * everyone picks what works for them. Deleting a task stays swipe-to-delete
 * either way — that part is deliberately not configurable.
 */
export function getCompleteGesture(user: User | null): CompleteGesture {
  return user?.user_metadata?.complete_gesture === "tap" ? "tap" : "swipe";
}
