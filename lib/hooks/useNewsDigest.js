"use client";
import { useState, useEffect } from "react";

let digestCache = null;

export function useNewsDigest() {
  const [data, setData] = useState(digestCache);
  const [loading, setLoading] = useState(!digestCache);

  useEffect(() => {
    if (digestCache) return;
    fetch("/data/news-digest.json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((d) => {
        if (d) { digestCache = d; setData(d); }
        setLoading(false);
      });
  }, []);

  return { data, loading };
}
