import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { user_id, email } = await req.json();
    if (!user_id || !email) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

    // Ensure uniqueness
    const { data: existsEmail } = await supabaseAdmin
      .from("tip-users")
      .select("id")
      .ilike("email", email)
      .limit(1);
    if (existsEmail && existsEmail.length > 0) {
      return NextResponse.json({ error: "email_in_use" }, { status: 409 });
    }

    // Update auth email (keeps session by default)
    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      email,
      email_confirm: true,
    });
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });

    // Update profile email (remove alias if any)
    const { error: upErr } = await supabaseAdmin
      .from("tip-users")
      .update({ email })
      .eq("id", user_id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}


