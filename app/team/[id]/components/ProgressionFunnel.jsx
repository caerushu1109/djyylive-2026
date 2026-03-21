"use client";

export const STAGES = [
  { key: "pQualify",  label: "\u51fa\u7ebf" },
  { key: "pR16",      label: "16\u5f3a" },
  { key: "pQF",       label: "8\u5f3a" },
  { key: "pSF",       label: "4\u5f3a" },
  { key: "pFinal",    label: "\u51b3\u8d5b" },
  { key: "pChampion", label: "\u593a\u51a0" },
];

export default function ProgressionFunnel({ teamPred }) {
  if (!teamPred) return null;
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 12px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
          \u6a21\u578b\u6392\u540d <span style={{ fontWeight: 800, color: "var(--blue)", fontSize: 14 }}>#{teamPred.rank}</span>
        </span>
        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
          \u593a\u51a0\u6982\u7387 <span style={{ fontWeight: 800, color: "var(--blue)", fontSize: 14 }}>{teamPred.probabilityValue?.toFixed(1)}%</span>
        </span>
      </div>
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        {STAGES.map(({ key, label }) => {
          const val = teamPred[key];
          if (val == null) return null;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", width: 28, textAlign: "right", flexShrink: 0 }}>
                {label}
              </span>
              <div style={{ flex: 1, height: 16, background: "var(--card2)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  width: `${Math.max(val, 1)}%`, height: "100%",
                  background: key === "pChampion"
                    ? "linear-gradient(90deg, var(--blue), #4da6ff)"
                    : "var(--blue)",
                  borderRadius: 4,
                  opacity: key === "pChampion" ? 1 : 0.6 + (val / 100) * 0.4,
                }} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "var(--text)",
                width: 40, textAlign: "right", fontVariantNumeric: "tabular-nums", flexShrink: 0,
              }}>
                {val.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
