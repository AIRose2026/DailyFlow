import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { resolveApiToken } from "@/lib/tokens/resolveToken";

/**
 * General-purpose routine creation for a personal Langdock automation. Same
 * personal-token auth as the other /api/ingest/* routes.
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

  const weekdays = Array.isArray(body.weekdays)
    ? body.weekdays.filter((d: unknown): d is number => typeof d === "number" && d >= 1 && d <= 7)
    : [];

  const estimatedMinutes =
    typeof body.estimated_minutes === "number" && body.estimated_minutes >= 0
      ? body.estimated_minutes
      : 15;

  const supabase = createServiceClient();

  const { data: recurringTask, error } = await supabase
    .from("recurring_tasks")
    .insert({
      user_id: userId,
      title: body.title.trim(),
      category: typeof body.category === "string" ? body.category : null,
      estimated_minutes: estimatedMinutes,
      weekdays,
      active: true,
    })
    .select("id")
    .single();

  if (error || !recurringTask) {
    return NextResponse.json(
      { error: error?.message ?? "Routine konnte nicht angelegt werden." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, recurring_task_id: recurringTask.id });
}
