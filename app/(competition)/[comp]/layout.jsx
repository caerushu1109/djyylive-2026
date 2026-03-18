import BottomNav from "@/components/shared/BottomNav";

export default function CompetitionLayout({ children, params }) {
  const { comp } = params;
  return (
    <div style={{
      maxWidth: 480,
      minHeight: "100dvh",
      margin: "0 auto",
      background: "var(--bg)",
      paddingBottom: "var(--bottom-nav-h)",
      position: "relative",
    }}>
      {children}
      <BottomNav comp={comp} />
    </div>
  );
}
