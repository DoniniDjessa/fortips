import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Fetch all predictions for the specified user (bypasses RLS)
    const { data: predictionsData, error: predictionsError } = await supabaseAdmin
      .from("tip-predictions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (predictionsError) {
      console.error("Error fetching user predictions:", predictionsError);
      return NextResponse.json({ error: predictionsError.message }, { status: 500 });
    }

    return NextResponse.json({ data: predictionsData || [] });
  } catch (e: any) {
    console.error("Server error in user predictions API:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

