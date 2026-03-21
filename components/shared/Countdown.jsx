"use client";

import { useState, useEffect } from "react";

const WC_START = new Date("2026-06-11T18:00:00-04:00"); // EDT kickoff
const WC_END   = new Date("2026-07-19T21:00:00-04:00");

function getPhase(now) {
  if (now < WC_START) return "pre";
  if (now <= WC_END)  return "live";
  return "post";
}

function getMatchDay(now) {
  const diff = now - WC_START;
  return Math.floor(diff / 86400000) + 1;
}

export default function Countdown() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const phase = getPhase(now);

  if (phase === "post") return null;

  if (phase === "live") {
    const matchDay = getMatchDay(now);
    return (
      <div style={{
        margin: "0 12px 10px", padding: "10px 14px",
        background: "linear-gradient(135deg, rgba(255,61,61,0.08), rgba(92,158,255,0.08))",
        border: "1px solid rgba(255,61,61,0.2)",
        borderRadius: "var(--radius)", display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "var(--live)", animation: "pulse 1.5s infinite", flexShrink: 0,
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>
            FIFA World Cup 2026
          </div>
          <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 1 }}>
            <span style={{ color: "var(--live)", fontWeight: 700 }}>
              进行中
            </span>
            {" "}· 第 {matchDay} 比赛日
          </div>
        </div>
        <div style={{ fontSize: 16, flexShrink: 0 }}>
          🇺🇸🇲🇽🇨🇦
        </div>
      </div>
    );
  }

  // Pre-tournament countdown
  const diff = WC_START - now;
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  const secs  = Math.floor((diff % 60000) / 1000);

  return (
    <div style={{
      margin: "0 12px 10px", padding: "10px 14px",
      background: "linear-gradient(135deg, rgba(92,158,255,0.06), rgba(245,166,35,0.06))",
      border: "1px solid rgba(92,158,255,0.15)",
      borderRadius: "var(--radius)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 8,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text2)", letterSpacing: "0.02em" }}>
            🏆 FIFA World Cup 2026
          </div>
          <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2 }}>
            🇺🇸🇲🇽🇨🇦 美国 · 墨西哥 · 加拿大
          </div>
        </div>
        <div style={{
          fontSize: 9, fontWeight: 700, color: "var(--blue)",
          background: "rgba(92,158,255,0.1)", borderRadius: 4, padding: "2px 6px",
        }}>
          6月11日开幕
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        {[
          { value: days, label: "天" },
          { value: hours, label: "时" },
          { value: mins, label: "分" },
          { value: secs, label: "秒" },
        ].map((item) => (
          <div key={item.label} style={{
            flex: 1, textAlign: "center",
            background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: "6px 0",
          }}>
            <div style={{
              fontSize: 18, fontWeight: 900, color: "var(--text)",
              fontVariantNumeric: "tabular-nums", fontFamily: "monospace",
            }}>
              {String(item.value).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 8, color: "var(--text3)", marginTop: 1, fontWeight: 600 }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
