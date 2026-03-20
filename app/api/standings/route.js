import { NextResponse } from "next/server";
import { getFixturesData } from "@/src/lib/worldcup-data";

export async function GET(request) {
  try {
    const mode = request.nextUrl.searchParams.get("mode") === "drill" ? "drill" : "live";
    const payload = await getFixturesData({ mode });
    return NextResponse.json({ standings: payload.standings }, {
      headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
