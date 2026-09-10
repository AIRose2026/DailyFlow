import { NextResponse } from "next/server";
import { fetchAllFeedback, sendFeedbackToClickUp } from "@/lib/clickup/client";
import { createClient } from "@/lib/supabase/server";

// Any signed-in user of this deployment sees everyone's feedback, not just
// their own — it's shared product feedback about the app, so being logged
// in at all is the only gate; each entry names who sent it.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  try {
    const feedback = await fetchAllFeedback();
    return NextResponse.json({ ok: true, feedback });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body?.message || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "Nachricht fehlt." }, { status: 400 });
  }

  try {
    await sendFeedbackToClickUp({
      message: body.message.trim(),
      page: typeof body.page === "string" ? body.page : "unbekannt",
      userEmail: user.email ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
