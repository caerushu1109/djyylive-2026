"use client";
import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useElo } from "@/lib/hooks/useElo";
import { useFixtures } from "@/lib/hooks/useFixtures";
import MatchCard from "@/components/shared/MatchCard";
import SectionTitle from "@/components/ui/SectionTitle";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ChevronLeft } from "lucide-react";

export default function TeamPage() {
  const { id } = useParams();
  const teamName = decodeURIComponent(Array.isArray(id) ? id[0] : id);
  const router = useRouter();
  const { data: eloData, loading: eloLoading } = useElo();
  const { data: fixturesData, loading: fixturesLoading } = useFixtures();

  const teamElo = useMemo(() =>
    (eloData?.rankings || []).find((r) =>
      r.originalName === teamName || r.name === teamName || r.code === teamName
    ),
    [eloData, teamName]
  );

  const teamFixtures = useMemo(() =>
    (fixturesData?.fixtures || []).filter((f) =>
      f.home.originalName === teamName || f.away.originalName === teamName ||
      f.home.name === teamName || f.away.name === teamName
    ),
    [fixturesData, teamName]
  );

  const flag = teamElo?.flag || "🏴";
  const displayName = teamElo?.name || teamName;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{
        height: "var(--topbar-h)", background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 16px",
        position: "sticky", top: 0, zIndex: 50, gap: 8,
      }}>
        <button onClick={() => router.back()} style={{ padding: 4, marginLeft: -4 }}>
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>球队</span>
      </div>

      {eloLoading ? <LoadingSpinner /> : (
        <>
          <div style={{
            padding: "24px 16px", display: "flex", alignItems: "center",
            gap: 16, borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 56 }}>{flag}</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{displayName}</h1>
              {teamElo && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--text-dim)" }}>ELO</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--blue)" }}>
                    {teamElo.elo}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    全球第 {teamElo.rank} 名
                  </span>
                </div>
              )}
            </div>
          </div>

          <section>
            <SectionTitle>赛程 & 战绩</SectionTitle>
            {fixturesLoading ? <LoadingSpinner /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px" }}>
                {teamFixtures.length === 0 ? (
                  <p style={{ color: "var(--text-dim)", fontSize: 14 }}>暂无赛程数据</p>
                ) : (
                  teamFixtures.map((f) => <MatchCard key={f.id} fixture={f} />)
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
