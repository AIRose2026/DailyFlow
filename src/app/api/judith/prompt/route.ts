import { NextResponse } from "next/server";
import { sendPromptToJudith } from "@/lib/judith/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body?.prompt || typeof body.prompt !== "string") {
    return NextResponse.json({ error: "Prompt fehlt." }, { status: 400 });
  }

  try {
    await sendPromptToJudith({
      outlookFlagId: body.outlookFlagId ?? null,
      subject: body.subject ?? "",
      sender: body.sender ?? "",
      preview: body.preview ?? null,
      prompt: body.prompt,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
