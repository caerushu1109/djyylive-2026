import { NextResponse } from "next/server";
import { getFixturesData } from "@/src/lib/worldcup-data";

export async function GET(request) {
  const mode = request.nextUrl.searchParams.get("mode") === "drill" ? "drill" : "live";
  const payload = await getFixturesData({ mode });
  return NextResponse.json(payload, {
    headers: {
      "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
