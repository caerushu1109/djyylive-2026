"use client";
import { useState, useEffect } from "react";

/**
 * 读取每日自动同步的 WC2026 参赛名单
 * 数据来源: public/data/wc2026-participants.json（由 GitHub Actions 每日更新）
 *
 * 返回:
 *   participants: Array<{ sportmonksId, nameEn, nameZh, flag, status, note }>
 *     status: "confirmed" | "uncertain" | "tbd"
 */
export function useWc2026Participants() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    fetch("/data/wc2026-participants.json")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        setParticipants(json.participants || []);
        setUpdatedAt(json.updatedAt || null);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return { participants, loading, error, updatedAt };
}
