"use client";
import { useMemo, useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getTeamMeta } from "@/src/lib/team-meta";
import { EN_TO_ZH } from "@/lib/polymarket-names";

function formatAge(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "1h内";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function OddsTicker({ polyData }) {
  const [baseline, setBaseline] = useState(null);
  const [baselineTs, setBaselineTs] = useState(null);
  const [baselineLoaded, setBaselineLoaded] = useState(false);

  // Load build-time baseline on mount
  useEffect(() => {
    fetch("/data/odds-baseline.json")
      .then(r => {
        if (!r.ok) throw new Error("not ok");
        return r.json();
      })
      .then(data => {
        if (data?.odds) {
          setBaseline(data.odds);
          setBaselineTs(data.ts);
        }
      })
      .catch((e) => {
        console.warn("[OddsTicker] baseline fetch failed:", e.message);
      })
      .finally(() => setBaselineLoaded(true));
  }, []);

  const items = useMemo(() => {
    if (!polyData?.teams?.length) return [];
    const sorted = [...polyData.teams]
      .filter((t) => t.probability > 0)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 20);

    return sorted.map((t) => {
      const zh = EN_TO_ZH[t.name] || t.name;
      const meta = getTeamMeta(t.name);
      const flag = meta.flag !== "\u{1F3F3}\uFE0F" ? meta.flag : "";
      let delta = 0;
      if (baseline) {
        const prev = baseline[t.name];
        if (prev !== undefined) {
          delta = +(t.probability - prev).toFixed(1);
        }
      }
      return { key: t.name, flag, zh, pct: t.probability, delta };
    });
  }, [polyData, baseline]);

  const hasDeltas = items.some(i => i.delta !== 0);
  const ageLabel = formatAge(baselineTs);

  if (items.length === 0) return null;

  // Double the items for seamless infinite scroll
  const track = [...items, ...items];

  return (
    <div style={{ margin: "0 0 10px" }}>
      {/* Label row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 12px", marginBottom: 4,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, color: "var(--text2)",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>夺冠赔率</span>
          <span style={{
            fontSize: 8, color: "var(--text3)", fontWeight: 600,
            background: "var(--card2)", borderRadius: 3, padding: "1px 4px",
          }}>Polymarket</span>
        </div>
        {hasDeltas && ageLabel && (
          <span style={{ fontSize: 9, color: "var(--text3)" }}>
            近{ageLabel}变动
          </span>
        )}
      </div>
      {/* Scrolling ticker */}
      <div style={{
        position: "relative",
        overflow: "hidden",
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
