"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useFixtures } from "@/lib/hooks/useFixtures";
import GroupTable from "@/components/wc/GroupTable";
import KnockoutBracket from "@/components/wc/KnockoutBracket";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const SUB_TABS = ["积分榜", "淘汰赛"];

// ── 2026 WC 完整晋级规则 ────────────────────────────────────────────
const RULES_SECTIONS = [
  {
    title: "赛制概览",
    body: "48支球队分成12个小组（A至L组），每组4队进行单循环赛制。每场胜利得3分、平局得1分、负赛得0分。",
  },
  {
    title: "晋级名额",
    body: "每组前2名直接晋级淘汰赛（共24队）。12组的第3名中，成绩最佳的8支球队也可晋级。32支球队进入32强淘汰赛。",
  },
  {
    title: "小组内排名规则（同积分时依序比较）",
    body: [
      "① 积分",
      "② 净胜球（本组所有比赛）",
      "③ 进球数（本组所有比赛）",
      "④ 相关队伍之间的直接交锋积分",
      "⑤ 相关队伍之间的直接交锋净胜球",
      "⑥ 相关队伍之间的直接交锋进球数",
      "⑦ 纪律分（黄牌 -1分 · 红牌 -3分 · 黄+红 -3分）",
      "⑧ FIFA世界排名",
    ].join("\n"),
  },
  {
    title: "最佳3名选取规则",
    body: "12组的3名均参与排名竞争，依以下顺序评定，最终取最佳8支晋级：① 积分 → ② 净胜球 → ③ 进球数 → ④ 纪律分 → ⑤ FIFA排名。",
  },
  {
    title: "淘汰赛阶段",
    body: "32强赛（16场）→ 16强赛（8场）→ 八强赛/四分之一决赛（4场）→ 四强赛/半决赛（2场）→ 季军赛（1场）+ 决赛（1场）。所有淘汰赛90分钟平局则进行30分钟加时赛，仍平则互射点球决定胜负。",
  },
  {
    title: "加时赛与点球大战",
    body: "淘汰赛阶段若90分钟战平，加赛30分钟（上、下半场各15分钟）。加时后仍平则点球大战，每队各罚5轮，仍相同则突然死亡法继续。",
  },
];

function RulesPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ margin: "16px 0 4px" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", background: "var(--card)", border: "1px solid var(--border2)",
          borderRadius: open ? "var(--radius-sm) var(--radius-sm) 0 0" : "var(--radius-sm)",
          padding: "10px 14px", display: "flex", alignItems: "center",
          justifyContent: "space-between", cursor: "pointer", color: "var(--text2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13 }}>📋</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}>晋级与淘汰规则说明</span>
        </div>
        <span style={{
          fontSize: 12, color: "var(--text3)",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s", display: "inline-block",
        }}>&#9662;</span>
      </button>
      {open && (
        <div style={{
          background: "var(--card)", border: "1px solid var(--border2)",
          borderTop: "none", borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
          padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 14,
        }}>
          {RULES_SECTIONS.map((s) => (
            <div key={s.title}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: "var(--blue)",
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5,
              }}>
                {s.title}
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                {s.body}
              </div>
            </div>
          ))}
          <div style={{ fontSize: 9, color: "var(--text3)", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
            规则依据：2026 FIFA 世界杯官方竞赛规程（2024年修订版）
          </div>
        </div>
      )}
    </div>
  );
}

const PAGE_LABELS = ["AB", "CD", "EF", "GH", "IJ", "KL"];

export default function GroupsPage() {
  const { comp } = useParams();
  const [subTab, setSubTab] = useState("积分榜");
  const [currentPage, setCurrentPage] = useState(0);

  const { data, loading } = useFixtures();
  const standings = data?.standings || [];

  const pageGroups = standings.slice(currentPage * 2, currentPage * 2 + 2);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* TopBar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px 8px", flexShrink: 0,
      }}>
        <Link href={`/${comp}`} style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.04em" }}>
          DJ<span style={{ color: "var(--blue)" }}>YY</span>
        </Link>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "var(--card)", border: "1px solid var(--border2)",
          borderRadius: 999, padding: "3px 10px 3px 6px",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)" }}>2026 WC</span>
          <span style={{ fontSize: 8, color: "var(--text3)" }}>&#9662;</span>
        </div>
        <div style={{
          width: 32, height: 32, background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}>🔍</div>
      </div>

      {/* Sub tabs */}
      <div style={{
        display: "flex", padding: "0 12px", gap: 4, flexShrink: 0,
        background: "var(--bg)", borderBottom: "1px solid var(--border)",
      }}>
        {SUB_TABS.map((t) => (
          <button
            key={t} onClick={() => setSubTab(t)}
            style={{
              flex: 1, textAlign: "center", padding: "9px 0",
              fontSize: 10, fontWeight: 700,
              color: subTab === t ? "var(--blue)" : "var(--text3)",
              borderBottom: subTab === t ? "2px solid var(--blue)" : "2px solid transparent",
              textTransform: "uppercase", letterSpacing: "0.05em",
              background: "none", border: "none", cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Page navigation — only for 积分榜 */}
      {subTab === "积分榜" && (
        <div style={{
          display: "flex", padding: "0 12px", gap: 4, flexShrink: 0,
          background: "var(--bg)", borderBottom: "1px solid var(--border)",
        }}>
          {PAGE_LABELS.map((label, idx) => (
            <button
              key={label}
              onClick={() => setCurrentPage(idx)}
              style={{
                flex: 1, textAlign: "center", padding: "7px 0",
                fontSize: 11, fontWeight: 800,
                color: currentPage === idx ? "var(--blue)" : "var(--text3)",
                borderBottom: currentPage === idx ? "2px solid var(--blue)" : "2px solid transparent",
                background: "none", border: "none", cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div style={{ overflowY: "auto", flex: 1 }}>
        {loading ? (
          <LoadingSpinner />
        ) : subTab === "积分榜" ? (
          <div style={{ display: "flex", flexDirection: "column", padding: "12px 12px 0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pageGroups.map((group) => (
                <GroupTable key={group.group} group={group} />
              ))}
            </div>
            <RulesPanel />
            <div style={{ height: 16 }} />
          </div>
        ) : (
          <KnockoutBracket fixtures={data?.fixtures || []} />
        )}
      </div>
    </div>
  );
}