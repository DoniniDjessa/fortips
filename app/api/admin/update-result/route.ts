import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { TPADMIN_ACCESS_CODE } from "@/lib/tpadmin";

export async function POST(req: NextRequest) {
  try {
    const { prediction_id, result, user_id, access_code } = await req.json();

    if (!prediction_id || !result || !["success", "failed", "exact_success"].includes(result)) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const hasValidCode = access_code === TPADMIN_ACCESS_CODE;
    let isAdmin = false;

    if (user_id) {
      const { data: userRow } = await supabaseAdmin
        .from("tip-users")
        .select("role")
        .eq("id", user_id)
        .single();

      isAdmin = !!userRow && userRow.role === "admin";
    }

    if (!hasValidCode && !isAdmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Get prediction to find user_id
    const { data: prediction } = await supabaseAdmin
      .from("tip-predictions")
      .select("user_id, odds, status")
      .eq("id", prediction_id)
      .single();

    if (!prediction) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Update prediction
    const { error: updateErr } = await supabaseAdmin
      .from("tip-predictions")
      .update({
        result,
        status: result === "success" || result === "exact_success" ? "success" : "failed",
      })
      .eq("id", prediction_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Recalculate user stats
    const { data: allPredictions } = await supabaseAdmin
      .from("tip-predictions")
      .select("odds, result, status")
      .eq("user_id", prediction.user_id)
      .in("status", ["success", "failed"]);

    if (!allPredictions) {
      return NextResponse.json({ ok: true });
    }

    const total = allPredictions.length;
    const success = allPredictions.filter((p) => p.result === "success" || p.result === "exact_success").length;
    const exactScore = allPredictions.filter((p) => p.result === "exact_success").length;
    const successRate = total > 0 ? (success / total) * 100 : 0;
    const avgOdds =
      allPredictions.length > 0
        ? allPredictions.reduce((acc, p) => acc + parseFloat(p.odds.toString()), 0) / allPredictions.length
        : 0;

    // Update user stats
    await supabaseAdmin
      .from("tip-users")
      .update({
        total_predictions: total,
        success_predictions: success,
        exact_score_predictions: exactScore,
        success_rate: successRate,
        avg_odds: avgOdds,
      })
      .eq("id", prediction.user_id);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

