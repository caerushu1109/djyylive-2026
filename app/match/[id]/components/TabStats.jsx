"use client";

import { StatBar } from "./StatBar";

export default function TabStats({ data }) {
  const { stats, fixture } = data;
  if (fixture.status === "NS") {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
        比赛尚未开始
      </div>
    );
  }

  // Group stats into categories
  const shooting = ["射门", "射正", "射偏", "被封堵", "xG"];
  const passing = ["传球", "传球准确率", "角球"];
  const defending = ["铲球", "拦截", "扑救"];
  const discipline = ["犯规", "越位", "黄牌", "红牌"];

  const groups = [
    { title: "控球", stats: stats.filter((s) => s.label === "控球率") },
    { title: "射门", stats: stats.filter((s) => shooting.includes(s.label)) },
    { title: "传控", stats: stats.filter((s) => passing.includes(s.label)) },
    { title: "防守", stats: stats.filter((s) => defending.includes(s.label)) },
    { title: "纪律", stats: stats.filter((s) => discipline.includes(s.label)) },
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
