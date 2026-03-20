"use client";
import { useMemo, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getTeamMeta } from "@/src/lib/team-meta";
import { EN_TO_ZH } from "@/lib/polymarket-names";

const STORAGE_KEY = "djyy_odds_snapshot";
const SNAPSHOT_TTL = 6 * 60 * 60 * 1000; // 6 hours

function loadSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw);
    if (Date.now() - snap.ts > SNAPSHOT_TTL) return null;
    return snap.data; // { teamName: probability }
  } catch { return null; }
}

function saveSnapshot(teams) {
  try {
    const data = {};
    for (const t of teams) data[t.name] = t.probability;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch { /* quota exceeded etc */ }
}

export default function OddsTicker({ polyData }) {
  const savedRef = useRef(false);

  const items = useMemo(() => {
    if (!polyData?.teams?.length) return [];
    const prev = loadSnapshot();
    const sorted = [...polyData.teams]
      .filter((t) => t.probability > 0)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 20);

    return sorted.map((t) => {
      const zh = EN_TO_ZH[t.name] || t.name;
      const meta = getTeamMeta(t.name);
      const flag = meta.flag !== "🏳️" ? meta.flag : "";
      const delta = prev ? +(t.probability - (prev[t.name] ?? t.probability)).toFixed(1) : 0;
      return { key: t.name, flag, zh, pct: t.probability, delta };
    });
  }, [polyData]);

  // Save snapshot once (on first load if no valid snapshot exists)
  useEffect(() => {
    if (savedRef.current || !polyData?.teams?.length) return;
    const existing = loadSnapshot();
    if (!existing) saveSnapshot(polyData.teams);
    savedRef.current = true;
  }, [polyData]);

  if (items.length === 0) return null;

  // Double the items for seamless infinite scroll
  const track = [...items, ...items];

  return (
    <div style={{
      position: "relative",
      overflow: "hidden",
      margin: "0 0 10px",
      height: 36,
      maskImage: "linear-gradient(90deg, transparent, #000 24px, #000 calc(100% - 24px), transparent)",
      WebkitMaskImage: "linear-gradient(90deg, transparent, #000 24px, #000 calc(100% - 24px), transparent)",
    }}>
      <div
        className="odds-ticker-track"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          width: "max-content",
          willChange: "transform",
        }}
      >
        {track.map((item, i) => (
          <TickerItem key={`${item.key}-${i}`} item={item} />
        ))}
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .odds-ticker-track {
          animation: ticker-scroll ${items.length * 3}s linear infinite;
        }
        .odds-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

function TickerItem({ item }) {
  const { flag, zh, pct, delta } = item;

  let DeltaIcon = Minus;
  let deltaColor = "var(--text3)";
  let deltaText = "";

  if (delta > 0) {
    DeltaIcon = TrendingUp;
    deltaColor = "#22c55e";
    deltaText = `+${delta}`;
  } else if (delta < 0) {
    DeltaIcon = TrendingDown;
    deltaColor = "#ef4444";
    deltaText = `${delta}`;
  }

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "0 14px",
      height: 36,
      flexShrink: 0,
      borderRight: "1px solid var(--border)",
    }}>
      {flag && <span style={{ fontSize: 13, lineHeight: 1 }}>{flag}</span>}
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text)",
        whiteSpace: "nowrap",
      }}>{zh}</span>
      <span style={{
        fontSize: 12,
        fontWeight: 800,
        color: "var(--blue)",
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
      }}>{pct.toFixed(1)}%</span>
      {delta !== 0 && (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          fontSize: 9,
          fontWeight: 700,
          color: deltaColor,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}>
          <DeltaIcon size={10} strokeWidth={2.5} />
          {deltaText}
        </span>
      )}
    </div>
  );
}
