export default function CompPage({ params }) {
  return (
    <div style={{ padding: "80px 16px", textAlign: "center", color: "var(--text-dim)" }}>
      <p>Loading {params.comp}...</p>
    </div>
  );
}
