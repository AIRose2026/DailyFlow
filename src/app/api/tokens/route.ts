import { NextResponse } from "next/server";
import { generateApiToken } from "@/lib/tokens/apiTokens";
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
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : "Judith";

  const { token, hash, prefix } = generateApiToken();

  const { data, error } = await supabase
    .from("api_tokens")
    .insert({ user_id: user.id, name, token_hash: hash, token_prefix: prefix })
    .select("id, name, token_prefix, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The plaintext token is only ever returned here, once.
  return NextResponse.json({ ok: true, token, record: data });
}
