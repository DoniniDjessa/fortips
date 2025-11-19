import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { TPADMIN_ACCESS_CODE } from "@/lib/tpadmin";

export async function POST(req: NextRequest) {
  try {
    const { prediction_id, action, user_id, access_code } = await req.json();

    if (!prediction_id || !action || !["validate", "reject"].includes(action)) {
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

    if (action === "validate") {
      // Update status to active
      const { error } = await supabaseAdmin
        .from("tip-predictions")
        .update({ status: "active" })
        .eq("id", prediction_id)
        .eq("status", "pending_validation");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Reject: delete the prediction
      const { error } = await supabaseAdmin
        .from("tip-predictions")
        .delete()
        .eq("id", prediction_id)
        .eq("status", "pending_validation");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

