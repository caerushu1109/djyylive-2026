"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * TeamSearchModal — full-screen blur overlay for searching WC2026 teams.
 *
 * Props:
 *   teams   – array of ELO ranking objects: { name, originalName, flag, elo, rank }
 *   onClose – callback to close the modal
 */
export default function TeamSearchModal({ teams = [], onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const router = useRouter();

  // Auto-focus the input when the modal opens
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? teams.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.originalName?.toLowerCase().includes(q) ||
          t.flag?.includes(q)
      )
    : teams;

  function handleSelect(team) {
    onClose();
    router.push(`/team/${encodeURIComponent(team.originalName || team.name)}`);
  }

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Modal panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "var(--surface, #18181b)",
          borderBottom: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          maxHeight: "80dvh",
        }}
      >
        {/* Search input row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
        }}>
          <span style={{ fontSize: 16, opacity: 0.5 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索球队…"
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontSize: 15, color: "var(--text)", caretColor: "var(--blue)",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{
                fontSize: 12, color: "var(--text3)",
                background: "var(--card2)", border: "none",
                borderRadius: 999, padding: "2px 8px", cursor: "pointer",
              }}
            >
              清除
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              fontSize: 13, color: "var(--text2)",
              background: "none", border: "none", cursor: "pointer", padding: "2px 0",
            }}
          >
            取消
          </button>
        </div>

        {/* Results list */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
              未找到相关球队
            </div>
          ) : (
            filtered.map((team) => (
              <button
                key={team.originalName || team.name}
                onClick={() => handleSelect(team)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 16px",
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{team.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {team.name}
                  </div>
                  {team.originalName && team.originalName !== team.name && (
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>
                      {team.originalName}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--blue)" }}>
                    {team.elo}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>
                    #{team.rank}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        {filtered.length > 0 && (
          <div style={{
            padding: "8px 16px",
            fontSize: 10, color: "var(--text3)",
            borderTop: "1px solid var(--border)",
            textAlign: "center",
          }}>
            共 {filtered.length} 支球队 · 点击进入球队页面
          </div>
        )}
      </div>
    </div>
  );
}
