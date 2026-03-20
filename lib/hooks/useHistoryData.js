"use client";
import { useState, useEffect } from "react";

const cache = {};

export function useHistoryData(file) {
  const [data, setData] = useState(cache[file] || null);
  const [loading, setLoading] = useState(!cache[file]);

  useEffect(() => {
    if (cache[file]) return;
    fetch(`/data/history/${file}.json`)
      .then(r => r.json())
      .then(d => { cache[file] = d; setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [file]);

  return { data, loading };
}
