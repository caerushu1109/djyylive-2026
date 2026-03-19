import { NextResponse } from "next/server";

// 将队名转成 eloratings.net 的 slug（除去拼音符号、空格换下划线）
const ACCENT_MAP = {
  "à":"a","á":"a","â":"a","ã":"a","ä":"a","å":"a",
  "À":"A","Á":"A","Â":"A","Ã":"A","Ä":"A","Å":"A",
  "ç":"c","Ç":"C",
  "è":"e","é":"e","ê":"e","ë":"e",
  "È":"E","É":"E","Ê":"E","Ë":"E",
  "ì":"i","í":"i","î":"i","ï":"i",
  "Ì":"I","Í":"I","Î":"I","Ï":"I",
  "ò":"o","ó":"o","ô":"o","õ":"o","ö":"o",
  "Ò":"O","Ó":"O","Ô":"O","Õ":"O","Ö":"O",
  "ù":"u","ú":"u","û":"u","ü":"u",
  "Ù":"U","Ú":"U","Û":"U","Ü":"U",
  "ñ":"n","Ñ":"N",
};

function toSlug(name) {
  let s = name || "";
  for (const [from, to] of Object.entries(ACCENT_MAP)) {
    s = s.split(from).join(to);
  }
  return s.replace(/ /g, "_");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const code = searchParams.get("code");

  if (!name || !code) {
    return NextResponse.json({ error: "Missing name or code" }, { status: 400 });
  }

  const slug = toSlug(name);
  const url  = `https://eloratings.net/${slug}.tsv`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "DJYY-2026/1.0 (historical ELO archive)" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `upstream ${res.status}`, slug },
        { status: 502 }
      );
    }

    const text = await res.text();
    const teamCode = code.trim().toUpperCase();

    // TSV columns: year month day homeCode awayCode homeGoals awayGoals tournament
    //              venue ratingChange homeEloAfter awayEloAfter ...
    const byYear = {};
    for (const line of text.split("\n")) {
      const f = line.split("\t");
      if (f.length < 12) continue;
      const year = parseInt(f[0], 10);
      if (!year || year < 2004 || year > 2027) continue;

      let elo = null;
      if (f[3].trim() === teamCode) {
        // home team
        elo = parseFloat(f[10]);
      } else if (f[4].trim() === teamCode) {
        // away team
        elo = parseFloat(f[11]);
      }
      if (elo !== null && !isNaN(elo) && elo > 800) {
        byYear[year] = Math.round(elo); // last match of the year wins
      }
    }

    // Build 2006-2026 time series, carrying forward last known value
    const points = [];
    let last = byYear[2004] || byYear[2005] || null;
    for (let yr = 2006; yr <= 2026; yr++) {
      if (byYear[yr] !== undefined) last = byYear[yr];
      if (last !== null) points.push({ year: yr, elo: last });
    }

    return NextResponse.json(
      { team: name, slug, points },
      { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600" } }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}