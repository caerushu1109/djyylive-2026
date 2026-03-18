"use client";
import { useParams } from "next/navigation";
import { useFixtures } from "@/lib/hooks/useFixtures";
import { useElo } from "@/lib/hooks/useElo";
import MatchCard from "@/components/shared/MatchCard";
import SectionTitle from "@/components/ui/SectionTitle";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const COMP_LABELS = {
  wc2026: "2026 世界杯",
};

function TopBar({ comp, liveCount, source }) {
  return (
    <div style={{
      height: "var(--topbar-h)", background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 16px", position: "sticky", top: 0, zIndex: 50,
    }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{COMP_LABELS[comp] || comp}</div>
        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 1 }}>
          {source === "live" ? (
            <span style={{ color: "var(--green)" }}>● 实时数据</span>
          ) : (
            <span>预览模式</span>
          )}
        </div>
      </div>
      {liveCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(255,61,61,0.15)", border: "1px solid rgba(255,61,61,0.3)",
          borderRadius: 8, padding: "4px 10px",
          color: "var(--live)", fontSize: 13, fontWeight: 600,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--live)", display: "inline-block" }} />
          {liveCount} 场进行中
        </div>
      )}
    </div>
  );
}

function EloRow({ rank, flag, name, elo, width, style }) {
  return (
    <div style={{ padding: "8px 16px", ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{
          width: 20, textAlign: "right", fontSize: 12,
          color: rank <= 3 ? "var(--gold)" : "var(--text-dim)", fontWeight: 600,
        }}>{rank}</span>
        <span style={{ fontSize: 20 }}>{flag}</span>
        <span style={{ flex: 1, fontSize: 14 }}>{name}</span>
        <span style={{
          fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--blue)",
        }}>{elo}</span>
      </div>
      <div style={{ marginLeft: 30, height: 3, background: "var(--border)", borderRadius: 2 }}>
        <div style={{
          height: "100%", width: `${width}%`,
          background: rank === 1 ? "var(--gold)" : "var(--blue)",
          borderRadius: 2, transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

function todayFixtures(fixtures) {
  if (!fixtures) return [];
  const today = new Date().toDateString();
  const result = fixtures.filter((f) => {
    if (!f.startingAt) return false;
    return new Date(f.startingAt).toDateString() === today;
  });
  if (result.length) return result;
  return fixtures.filter((f) => f.status === "NS").slice(0, 8);
}

export default function CompHomePage() {
  const { comp } = useParams();
  const { data: fixturesData, loading: fixturesLoading } = useFixtures({ pollInterval: 30000 });
  const { data: eloData, loading: eloLoading } = useElo();

  const liveFixtures = fixturesData?.fixtures?.filter((f) => f.status === "LIVE") || [];
  const displayFixtures = todayFixtures(fixturesData?.fixtures || []);

  return (
    <div>
      <TopBar
        comp={comp}
        liveCount={fixturesData?.liveCount || 0}
        source={fixturesData?.source}
      />

      <div style={{ paddingBottom: 16 }}>
        {liveFixtures.length > 0 && (
          <section>
            <SectionTitle>🔴 进行中</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px" }}>
              {liveFixtures.map((f) => <MatchCard key={f.id} fixture={f} />)}
            </div>
          </section>
        )}

        <section>
          <SectionTitle action={<a href={`/${comp}/fixtures`} style={{ color: "var(--blue)" }}>全部</a>}>
            今日赛程
          </SectionTitle>
          {fixturesLoading ? (
            <LoadingSpinner />
          ) : displayFixtures.length === 0 ? (
            <p style={{ padding: "0 16px", color: "var(--text-dim)", fontSize: 14 }}>今日暂无比赛</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px" }}>
              {displayFixtures.map((f) => <MatchCard key={f.id} fixture={f} />)}
            </div>
          )}
        </section>

        <section>
          <SectionTitle action={<a href={`/${comp}/predict`} style={{ color: "var(--blue)" }}>夺冠概率</a>}>
            ELO 排名 Top 10
          </SectionTitle>
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 12, margin: "0 16px", overflow: "hidden",
          }}>
            {eloLoading ? <LoadingSpinner /> : (
              (eloData?.rankings || []).slice(0, 10).map((row, i) => (
                <EloRow
                  key={row.code}
                  rank={row.rank}
                  flag={row.flag}
                  name={row.name}
                  elo={row.elo}
                  width={row.width}
                  style={i < 9 ? { borderBottom: "1px solid var(--border)" } : {}}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
