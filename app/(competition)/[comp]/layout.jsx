"use client";
import { useParams } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

export default function CompetitionLayout({ children }) {
  const params = useParams();
  const comp = params?.comp || "wc2026";

  return (
    <div style={{
      maxWidth: 480,
      height: "100dvh",
      margin: "0 auto",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      <div style={{
        flex: 1,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}>
        {children}
      </div>
      <BottomNav comp={comp} />
    </div>
  );
}
