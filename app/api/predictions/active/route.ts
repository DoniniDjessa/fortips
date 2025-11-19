import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    // Fetch all active predictions for the feed
    // This bypasses RLS so all users can see all active predictions
    const { data: predictionsData, error: predictionsError } = await supabaseAdmin
      .from("tip-predictions")
      .select("*")
      .eq("status", "active")
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (predictionsError) {
      console.error("Error fetching active predictions:", predictionsError);
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
        .select("id, pseudo, email, role, success_rate, total_predictions, avg_odds, exact_score_predictions")
        .in("id", userIds);

      if (!usersError && usersData) {
        usersMap = new Map((usersData || []).map((u: any) => [
          u.id,
          {
            id: u.id,
            pseudo: u.pseudo,
            email: u.email,
            role: u.role,
            success_rate: u.success_rate,
            total_predictions: u.total_predictions,
            avg_odds: u.avg_odds,
            exact_score_predictions: u.exact_score_predictions,
          },
        ]));
      }
    }

    // Combine predictions with user data
    const combinedData = predictionsData.map((p: any) => ({
      ...p,
      tip_users: usersMap.get(p.user_id) || null,
    }));

    return NextResponse.json({ data: combinedData });
  } catch (e: any) {
    console.error("Server error in active predictions API:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

