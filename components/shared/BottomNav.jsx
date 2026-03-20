"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, BarChart3, TrendingUp, Landmark } from "lucide-react";

const tabs = [
  { id: "home",     Icon: LayoutDashboard, label: "首页",   path: "" },
  { id: "fixtures", Icon: CalendarDays,    label: "赛程",   path: "/fixtures" },
  { id: "groups",   Icon: BarChart3,       label: "积分",   path: "/groups" },
  { id: "predict",  Icon: TrendingUp,      label: "预测",   path: "/predict" },
  { id: "history",  Icon: Landmark,        label: "历史",   path: "/history" },
];

export default function BottomNav({ comp }) {
  const pathname = usePathname();
  const base = `/${comp}`;

  return (
    <nav style={{
      height: "var(--bottom-nav-h)",
      background: "var(--surface)",
      borderTop: "1px solid var(--border)",
      display: "flex",
      flexShrink: 0,
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {tabs.map(({ id, Icon, label, path }) => {
        const href = base + path;
        const active = path === ""
          ? pathname === base || pathname === base + "/"
          : pathname.startsWith(base + path);
        const color = active ? "var(--blue)" : "var(--text3)";
        return (
          <Link
            key={id}
            href={href}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 3,
              color: color,
              textDecoration: "none",
            }}
          >
            <Icon size={20} strokeWidth={1.8} color={color} />
            <span style={{
              fontSize: 9, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.04em",
              color: color,
            }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
