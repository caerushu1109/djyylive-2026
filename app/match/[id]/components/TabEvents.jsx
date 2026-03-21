"use client";

export default function TabEvents({ data, onPlayerClick }) {
  const { events, fixture } = data;
  if (!events?.length) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
        暂无事件数据
      </div>
    );
  }

  const homeName = fixture.home.originalName;

  return (
    <div style={{ padding: "12px 0" }}>
      {events.map((ev, i) => {
        const isHome = ev.team === homeName;
        return (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", padding: "8px 16px",
            borderBottom: "1px solid var(--border)",
          }}>
            {/* Home side */}
            <div style={{
              flex: 1, textAlign: "right", paddingRight: 12,
              opacity: isHome ? 1 : 0,
              visibility: isHome ? "visible" : "hidden",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>
                <span onClick={() => onPlayerClick?.(ev.title)} style={{ cursor: "pointer" }}>{ev.title}</span>
              </div>
              {ev.assist && (
                <div style={{ fontSize: 10, color: "var(--text3)" }}>助攻: <span onClick={() => onPlayerClick?.(ev.assist)} style={{ cursor: "pointer" }}>{ev.assist}</span></div>
              )}
              {ev.subtitle && (
                <div style={{ fontSize: 10, color: "var(--text3)" }}>{ev.subtitle}</div>
              )}
            </div>

            {/* Center timeline */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              flexShrink: 0, width: 40,
            }}>
              <span style={{ fontSize: 14, lineHeight: 1 }}>{ev.icon}</span>
              <span style={{
                fontSize: 9, color: "var(--text3)", fontWeight: 700,
                fontVariantNumeric: "tabular-nums", marginTop: 2,
              }}>{ev.minuteLabel}</span>
            </div>

            {/* Away side */}
            <div style={{
              flex: 1, textAlign: "left", paddingLeft: 12,
              opacity: !isHome ? 1 : 0,
              visibility: !isHome ? "visible" : "hidden",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>
                <span onClick={() => onPlayerClick?.(ev.title)} style={{ cursor: "pointer" }}>{ev.title}</span>
              </div>
              {ev.assist && (
                <div style={{ fontSize: 10, color: "var(--text3)" }}>助攻: <span onClick={() => onPlayerClick?.(ev.assist)} style={{ cursor: "pointer" }}>{ev.assist}</span></div>
              )}
              {ev.subtitle && (
                <div style={{ fontSize: 10, color: "var(--text3)" }}>{ev.subtitle}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
