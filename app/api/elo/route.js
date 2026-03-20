import { NextResponse } from "next/server";
import eloData from "@/public/data/elo.json";

export async function GET() {
  try {
    return NextResponse.json(eloData, {
      headers: { "cache-control": "public, max-age=3600" },
    });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
