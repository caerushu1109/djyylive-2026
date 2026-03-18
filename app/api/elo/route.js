import { NextResponse } from "next/server";
import eloData from "@/public/data/elo.json";

export async function GET() {
  return NextResponse.json(eloData, {
    headers: { "cache-control": "public, max-age=3600" },
  });
}
