"use client";

import { useState } from "react";

/**
 * TeamLogo — displays team logo image with flag emoji fallback.
 * Uses SportMonks CDN image_path when available.
 *
 * @param {{ logo?: string, flag?: string, size?: number, style?: object }} props
 */
export default function TeamLogo({ logo, flag, size = 24, style = {} }) {
  const [imgError, setImgError] = useState(false);

  if (logo && !imgError) {
    return (
      <img
        src={logo}
        alt=""
        width={size}
        height={size}
        onError={() => setImgError(true)}
        style={{
          objectFit: "contain",
          borderRadius: size > 30 ? 4 : 2,
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  return (
    <span style={{ fontSize: size * 0.85, lineHeight: 1, flexShrink: 0, ...style }}>
      {flag || "\uD83C\uDFF4"}
    </span>
  );
}
