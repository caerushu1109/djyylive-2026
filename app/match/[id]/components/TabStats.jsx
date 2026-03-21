"use client";

import { StatBar } from "./StatBar";

export default function TabStats({ data }) {
  const { stats, fixture } = data;
  if (fixture.status === "NS") {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
        \u6bd4\u8d5b\u5c1a\u672a\u5f00\u59cb
      </div>
    );
  }

  // Group stats into categories
  const shooting = ["\u5c04\u95e8", "\u5c04\u6b63", "\u5c04\u504f", "\u88ab\u5c01\u5835", "xG"];
  const passing = ["\u4f20\u7403", "\u4f20\u7403\u51c6\u786e\u7387", "\u89d2\u7403"];
  const defending = ["\u94f2\u7403", "\u62e6\u622a", "\u6251\u6551"];
  const discipline = ["\u72af\u89c4", "\u8d8a\u4f4d", "\u9ec4\u724c", "\u7ea2\u724c"];

  const groups = [
    { title: "\u63a7\u7403", stats: stats.filter((s) => s.label === "\u63a7\u7403\u7387") },
    { title: "\u5c04\u95e8", stats: stats.filter((s) => shooting.includes(s.label)) },
    { title: "\u4f20\u63a7", stats: stats.filter((s) => passing.includes(s.label)) },
    { title: "\u9632\u5b88", stats: stats.filter((s) => defending.includes(s.label)) },
    { title: "\u7eaa\u5f8b", stats: stats.filter((s) => discipline.includes(s.label)) },
  ].filter((g) => g.stats.length > 0);

  return (
    <div style={{ padding: "6px 0" }}>
      {/* Team labels */}
      <div style={{
        display: "flex", justifyContent: "space-between", padding: "8px 16px 4px",
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--blue)" }}>
          {fixture.home.flag} {fixture.home.name}
        </span>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--red)" }}>
          {fixture.away.name} {fixture.away.flag}
        </span>
      </div>
      {groups.map((g) => (
        <div key={g.title}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: "var(--text3)",
            textTransform: "uppercase", letterSpacing: "0.08em",
            padding: "10px 16px 2px",
          }}>
            {g.title}
          </div>
          {g.stats.map((s) => (
            <StatBar key={s.label} {...s} highlight />
          ))}
        </div>
      ))}
    </div>
  );
}
