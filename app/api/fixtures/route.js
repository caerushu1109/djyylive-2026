import { NextResponse } from "next/server";
import { getFixturesData } from "@/src/lib/worldcup-data";

export async function GET() {
  const payload = await getFixturesData();
  return NextResponse.json(payload, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
