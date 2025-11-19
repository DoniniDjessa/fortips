import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    // Get all active predictions
    const { data: activePredictions } = await supabaseAdmin
      .from("tip-predictions")
      .select("id, date, time")
      .eq("status", "active");

    if (!activePredictions || activePredictions.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    const now = new Date();
    let updated = 0;

    for (const pred of activePredictions) {
      const matchDateTime = new Date(`${pred.date}T${pred.time}`);
      
      // If match time has passed, update to waiting_result
      if (matchDateTime < now) {
        await supabaseAdmin
          .from("tip-predictions")
          .update({ status: "waiting_result" })
          .eq("id", pred.id)
          .eq("status", "active");
        
        updated++;
      }
    }

    return NextResponse.json({ updated });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

