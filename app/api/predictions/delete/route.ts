import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(req: NextRequest) {
  try {
    const { prediction_id, user_id } = await req.json();

    if (!prediction_id || !user_id) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    // Get the prediction to verify ownership and status
    const { data: prediction, error: fetchError } = await supabaseAdmin
      .from("tip-predictions")
      .select("id, user_id, status, created_at")
      .eq("id", prediction_id)
      .single();

    if (fetchError || !prediction) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Verify ownership
    if (prediction.user_id !== user_id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Only allow deletion of predictions older than 2 days
    const createdDate = new Date(prediction.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 2) {
      return NextResponse.json({ error: "too_recent" }, { status: 400 });
    }

    // Only allow deletion if prediction hasn't been finalized (won't affect stats)
    // Don't delete if status is success or failed (these affect stats)
    if (prediction.status === "success" || prediction.status === "failed" || prediction.status === "exact_success") {
      return NextResponse.json({ error: "cannot_delete_finalized" }, { status: 400 });
    }

    // Delete the prediction
    const { error: deleteError } = await supabaseAdmin
      .from("tip-predictions")
      .delete()
      .eq("id", prediction_id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Note: We don't recalculate stats here because:
    // 1. Only non-finalized predictions can be deleted (active, pending_validation, waiting_result)
    // 2. These predictions don't contribute to stats anyway
    // 3. Stats are only calculated from success/failed/exact_success predictions

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Server error in delete prediction API:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

