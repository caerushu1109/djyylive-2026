"use client";

import MatchCard from "@/components/shared/MatchCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function TabFixtures({ teamFixtures, fixturesLoading, predictions }) {
  return (
    <div style={{ padding: "12px 16px 20px" }}>
      {fixturesLoading ? <LoadingSpinner /> : teamFixtures.length === 0 ? (
        <p style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: 20 }}>暂无赛程数据</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {teamFixtures.map((f) => <MatchCard key={f.id} fixture={f} predictions={predictions} />)}
        </div>
      )}
    </div>
  );
}
