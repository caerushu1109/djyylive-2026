import { NextResponse } from "next/server";
import { getMatchDetail } from "@/src/lib/worldcup-data";

export async function GET(request, { params }) {
  try {
    const mode = request.nextUrl.searchParams.get("mode") === "drill" ? "drill" : "live";
    const detail = await getMatchDetail(params.id, { mode });

    if (!detail) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Smart caching based on match status:
    // - FT (finished): cache for 1 hour (data won't change)
    // - NS (not started): cache for 30s (odds may update)
    // - LIVE: no cache (needs real-time updates)
    const status = detail.fixture?.status;
    let cacheControl = "no-store";
    if (status === "FT") {
      cacheControl = "public, s-maxage=3600, stale-while-revalidate=86400";
    } else if (status === "NS") {
      cacheControl = "public, s-maxage=30, stale-while-revalidate=60";
    }

    return NextResponse.json(detail, {
      headers: { "cache-control": cacheControl },
    });
  } catch (e) {
    console.error("[match detail] error:", e.message);
    return NextResponse.json(
      { error: "Failed to fetch match detail", detail: e.message },
      { status: 500 }
    );
  }
}
