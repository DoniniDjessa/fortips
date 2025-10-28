import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { email, pseudo } = await req.json();
    if (!email && !pseudo) {
      return NextResponse.json({ error: "no_input" }, { status: 400 });
    }
    let emailTaken = false;
    let pseudoTaken = false;
    if (email) {
      const { data } = await supabaseAdmin
        .from("tip-users")
        .select("id")
        .ilike("email", email)
        .limit(1);
      emailTaken = !!(data && data.length > 0);
    }
    if (pseudo) {
      const { data } = await supabaseAdmin
        .from("tip-users")
        .select("id")
        .ilike("pseudo", pseudo)
        .limit(1);
      pseudoTaken = !!(data && data.length > 0);
    }
    return NextResponse.json({ emailTaken, pseudoTaken });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}


