import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { resolveApiToken } from "@/lib/tokens/resolveToken";

/**
 * General-purpose to-do creation for a personal Langdock automation (or
 * anything else) — no email/Outlook context required, unlike
 * /api/ingest/email-task. Same personal-token auth as the other
 * /api/ingest/* routes.
 */
export async function POST(request: Request) {
  const userId = await resolveApiToken(request);
  if (!userId) {
    return NextResponse.json({ error: "Ungültiger oder fehlender Token." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.title || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "title fehlt." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title: body.title.trim(),
      description: typeof body.description === "string" ? body.description : null,
      category: typeof body.category === "string" ? body.category : null,
      due_date: typeof body.due_date === "string" ? body.due_date : null,
      status: "open",
      source: "manual",
    })
    .select("id")
    .single();

  if (error || !task) {
    return NextResponse.json(
      { error: error?.message ?? "Aufgabe konnte nicht angelegt werden." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, task_id: task.id });
}
