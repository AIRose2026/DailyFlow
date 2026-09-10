import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { resolveApiToken } from "@/lib/tokens/resolveToken";

/**
 * Called once a user's own Judith-equivalent automation has created the
 * Outlook draft reply and removed the flag: marks the matching task done.
 * Scoped to the token's own user_id even though this runs with the service
 * role client, so one token can never touch another user's tasks.
 */
export async function POST(request: Request) {
  const userId = await resolveApiToken(request);
  if (!userId) {
    return NextResponse.json({ error: "Ungültiger oder fehlender Token." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.outlook_flag_id || typeof body.outlook_flag_id !== "string") {
    return NextResponse.json({ error: "outlook_flag_id fehlt." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: emailTask } = await supabase
    .from("email_tasks")
    .select("id, task_id")
    .eq("outlook_flag_id", body.outlook_flag_id)
    .maybeSingle();

  if (!emailTask) {
    return NextResponse.json({ error: "E-Mail-Aufgabe nicht gefunden." }, { status: 404 });
  }

  const { data: updatedTask } = await supabase
    .from("tasks")
    .update({ status: "done", updated_at: new Date().toISOString() })
    .eq("id", emailTask.task_id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (!updatedTask) {
    return NextResponse.json({ error: "Nicht gefunden oder kein Zugriff." }, { status: 404 });
  }

  await supabase.from("email_tasks").update({ responded: true }).eq("id", emailTask.id);

  return NextResponse.json({ ok: true });
}
