import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { email, pseudo, password } = await req.json();
    if ((!email && !pseudo) || !password) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }
    const finalEmail: string = email || `${pseudo}@tip.local`;

    // Create user via admin and confirm immediately so client can log in
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: finalEmail,
      password,
      email_confirm: true,
      user_metadata: { pseudo: pseudo || null },
    });
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 });

    const userId = created.user?.id;
    if (userId) {
      const { error: upsertErr } = await supabaseAdmin
        .from("tip-users")
        .upsert({ id: userId, email: email || null, pseudo: pseudo || null, role: "user" }, { onConflict: "id" });
      if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, email: finalEmail, userId });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}


