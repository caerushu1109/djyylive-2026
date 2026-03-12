import { NextResponse } from "next/server";
import { getMatchDetail } from "@/src/lib/worldcup-data";

export async function GET(_request, { params }) {
  const detail = await getMatchDetail(params.id);

  if (!detail) {
    return NextResponse.json(
      {
        error: "Match not found",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(detail, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
