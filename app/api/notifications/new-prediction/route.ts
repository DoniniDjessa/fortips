import { NextRequest, NextResponse } from "next/server";
import { sendNewPredictionEmail, PredictionEmailData } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const data: PredictionEmailData = await req.json();

    // Validate required fields
    if (!data.matchName || !data.sport || !data.competition || !data.predictionText) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await sendNewPredictionEmail(data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    console.error("Error in new-prediction notification route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

