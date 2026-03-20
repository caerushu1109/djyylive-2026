import { NextResponse } from "next/server";

function buildSportMonksUrl(pathname, params = {}) {
  const baseUrl = (
    process.env.SPORTMONKS_BASE_URL ||
    "https://api.sportmonks.com/v3/football"
  ).replace(/\/$/, "");
  const url = new URL(`${baseUrl}/${pathname.replace(/^\//, "")}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  url.searchParams.set("api_token", process.env.SPORTMONKS_API_TOKEN || "");
  return url.toString();
}

function extractCurrentStats(statistics) {
  const stats = {
    goals: 0,
    assists: 0,
    appearances: 0,
    minutes: 0,
    yellowCards: 0,
    redCards: 0,
  };

  if (!Array.isArray(statistics)) return stats;

  for (const season of statistics) {
    const details = season?.details;
    if (!Array.isArray(details)) continue;

    for (const detail of details) {
      const typeId = detail?.type?.id;
      const value = detail?.value;

      if (value === undefined || value === null) continue;

      switch (typeId) {
        case 52: // Goals
          stats.goals += Number(value) || 0;
          break;
        case 79: // Assists
          stats.assists += Number(value) || 0;
          break;
        case 43: // Appearances
          stats.appearances += Number(value) || 0;
          break;
        case 47: // Minutes played
          stats.minutes += Number(value) || 0;
          break;
        case 56: // Yellow cards
          stats.yellowCards += Number(value) || 0;
          break;
        case 57: // Red cards
          stats.redCards += Number(value) || 0;
          break;
      }
    }
  }

  return stats;
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
    }

    // Historical-only player — return empty live data
    if (String(id).startsWith("P-")) {
      return NextResponse.json(
        {
          id,
          photo: null,
          height: null,
          weight: null,
          nationality: null,
          club: null,
          currentStats: {
            goals: 0,
            assists: 0,
            appearances: 0,
            minutes: 0,
            yellowCards: 0,
            redCards: 0,
          },
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
          },
        }
      );
    }

    const url = buildSportMonksUrl(`players/${id}`, {
      include: "team;position;nationality;statistics.details.type",
    });

    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: `SportMonks API error: ${res.status}` },
        { status: res.status }
      );
    }

    const json = await res.json();
    const player = json?.data;

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const currentStats = extractCurrentStats(player.statistics);

    const payload = {
      id: String(player.id),
      photo: player.image_path || null,
      height: player.height ? `${player.height} cm` : null,
      weight: player.weight ? `${player.weight} kg` : null,
      nationality: player.nationality?.name || null,
      club: player.team?.name || null,
      currentStats,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("[player API] Error fetching player:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
