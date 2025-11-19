import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { TPADMIN_ACCESS_CODE } from "@/lib/tpadmin";

export async function GET(req: NextRequest) {
  try {
    // Verify access code from query params or header
    const accessCode = req.headers.get("x-access-code") || req.nextUrl.searchParams.get("code");

    if (accessCode !== TPADMIN_ACCESS_CODE) {
      return NextResponse.json({ error: "access_denied" }, { status: 403 });
    }

    // Fetch all pending predictions using admin client (bypasses RLS)
    const { data: predictionsData, error: predictionsError } = await supabaseAdmin
      .from("tip-predictions")
      .select("*")
      .eq("status", "pending_validation")
      .order("created_at", { ascending: false });

    if (predictionsError) {
      console.error("Error fetching pending predictions:", predictionsError);
      return NextResponse.json({ error: predictionsError.message }, { status: 500 });
    }

    if (!predictionsData || predictionsData.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch user data separately
    const userIds = [...new Set(predictionsData.map((p: any) => p.user_id).filter(Boolean))];
    
    let usersMap = new Map();
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from("tip-users")
        .select("id, pseudo, email")
        .in("id", userIds);

      if (!usersError && usersData) {
        usersMap = new Map((usersData || []).map((u: any) => [u.id, { pseudo: u.pseudo, email: u.email }]));
      }
    }

    // Combine predictions with user data
    const combinedData = predictionsData.map((p: any) => ({
      ...p,
      tip_users: usersMap.get(p.user_id) || null,
    }));

    return NextResponse.json({ data: combinedData });
  } catch (e: any) {
    console.error("Failed to fetch pending predictions:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

