import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { resolveApiToken } from "@/lib/tokens/resolveToken";

/**
 * Called by a user's own Judith-equivalent automation (their own Langdock
 * account, or anything else) to file a new flagged-email task, authenticated
 * with a personal token instead of the Supabase service role key — see
 * supabase/README.md.
 */
export async function POST(request: Request) {
  const userId = await resolveApiToken(request);
  if (!userId) {
    return NextResponse.json({ error: "Ungültiger oder fehlender Token." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body?.subject || typeof body.subject !== "string") {
    return NextResponse.json({ error: "subject fehlt." }, { status: 400 });
  }
  if (!body?.sender || typeof body.sender !== "string") {
    return NextResponse.json({ error: "sender fehlt." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title: body.subject,
      category: typeof body.category === "string" ? body.category : null,
      due_date: typeof body.due_date === "string" ? body.due_date : null,
      status: "open",
      source: "email",
    })
    .select("id")
    .single();

  if (taskError || !task) {
    return NextResponse.json(
      { error: taskError?.message ?? "Aufgabe konnte nicht angelegt werden." },
      { status: 500 }
    );
  }

  const { error: emailTaskError } = await supabase.from("email_tasks").insert({
    task_id: task.id,
    email_subject: body.subject,
    email_sender: body.sender,
    email_preview: typeof body.preview === "string" ? body.preview : null,
    outlook_flag_id: typeof body.outlook_flag_id === "string" ? body.outlook_flag_id : null,
  });

  if (emailTaskError) {
    return NextResponse.json({ error: emailTaskError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, task_id: task.id });
}
