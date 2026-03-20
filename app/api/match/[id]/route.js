import { NextResponse } from "next/server";
import { getMatchDetail } from "@/src/lib/worldcup-data";

export async function GET(request, { params }) {
  try {
    const mode = request.nextUrl.searchParams.get("mode") === "drill" ? "drill" : "live";
    const detail = await getMatchDetail(params.id, { mode });

    if (!detail) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json(detail, {
      headers: { "cache-control": "no-store" },
    });
  } catch (e) {
    console.error("[match detail] error:", e.message);
    return NextResponse.json(
      { error: "Failed to fetch match detail", detail: e.message },
      { status: 500 }
    );
  }
}
