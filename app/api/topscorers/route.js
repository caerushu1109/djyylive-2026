import { NextResponse } from "next/server";
import { getTopScorers } from "@/src/lib/worldcup-data";

export async function GET(request) {
  const mode = request.nextUrl.searchParams.get("mode") === "drill" ? "drill" : "live";
  const data = await getTopScorers({ mode });
  return NextResponse.json(data, {
    headers: { "cache-control": "public, max-age=300, s-maxage=300" },
  });
}
