import { NextResponse } from "next/server";
import { getPredictionsData } from "@/src/lib/predictions";

export async function GET() {
  try {
    const payload = await getPredictionsData();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
