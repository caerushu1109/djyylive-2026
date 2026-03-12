import { NextResponse } from "next/server";
import { getPredictionsData } from "@/src/lib/predictions";

export async function GET() {
  const payload = await getPredictionsData();
  return NextResponse.json(payload, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
