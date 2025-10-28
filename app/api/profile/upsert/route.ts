import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { user_id, email, pseudo } = await req.json();
    if (!user_id || (!email && !pseudo)) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }
    // Upsert into tip-users table (expects columns: id, email, pseudo)
    const normalizedEmail = email ?? null;
    const { error } = await supabaseAdmin
      .from("tip-users")
      .upsert({ id: user_id, email: normalizedEmail, pseudo, role: "user" }, { onConflict: "id" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}


