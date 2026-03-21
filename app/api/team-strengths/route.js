import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { resolve } from "path";

let cachedData = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const now = Date.now();

  if (cachedData && now - cacheTime < CACHE_TTL) {
    return NextResponse.json(cachedData);
  }

  try {
    const filePath = resolve(process.cwd(), "public/data/team-strengths.json");
    const raw = readFileSync(filePath, "utf-8");
    cachedData = JSON.parse(raw);
    cacheTime = now;
    return NextResponse.json(cachedData);
  } catch (err) {
    return NextResponse.json(
      { error: "Team strengths data not available", detail: err.message },
      { status: 404 }
    );
  }
}
