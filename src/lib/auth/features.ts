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

/**
 * Whether this user has the categories feature turned on — Feedback:
 * "Kategorien brauche ich nicht. Weg damit. Keep it simple." Per-user
 * (Settings → Kategorien), defaulting to on so existing behavior doesn't
 * change for anyone until they explicitly switch it off. Turning it off
 * only hides category pickers/filters/badges throughout the app — it
 * doesn't delete the user's saved categories, so switching back on later
 * brings everything back exactly as it was.
 */
export function hasCategoriesEnabled(user: User | null): boolean {
  return user?.user_metadata?.categories_enabled !== false;
}

/**
 * Whether this user has the routines feature turned on at all — for
 * someone who only ever uses one-off to-dos and finds the whole concept
 * unnecessary. Per-user (Settings → Routinen), defaulting to on. Off hides
 * the Routinen/Statistik nav items, the Routine option on the add sheet,
 * the planned-time stat, and routines from the To-dos list, Wochenübersicht
 * and Archiv — it doesn't delete any routines or their history, so
 * switching back on brings everything back exactly as it was.
 */
export function hasRoutinesEnabled(user: User | null): boolean {
  return user?.user_metadata?.routines_enabled !== false;
}
