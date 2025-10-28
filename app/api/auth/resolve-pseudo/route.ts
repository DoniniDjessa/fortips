import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { pseudo } = await req.json();
    if (!pseudo || typeof pseudo !== "string") {
      return NextResponse.json({ error: "invalid_pseudo" }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from("tip-users")
      .select("email")
      .eq("pseudo", pseudo)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.email) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ email: data.email });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}


