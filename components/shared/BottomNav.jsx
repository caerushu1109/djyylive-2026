"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, BarChart3, TrendingUp, Activity } from "lucide-react";

const tabs = [
  { id: "home",     Icon: LayoutDashboard, label: "首页",   path: "" },
  { id: "fixtures", Icon: CalendarDays,    label: "赛程",   path: "/fixtures" },
  { id: "groups",   Icon: BarChart3,       label: "积分",   path: "/groups" },
  { id: "predict",  Icon: TrendingUp,      label: "预测",   path: "/predict" },
  { id: "markets",  Icon: Activity,        label: "市场",   path: "/markets" },
];

export default function BottomNav({ comp }) {
  const pathname = usePathname();
  const base = `/${comp}`;

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      height: "var(--bottom-nav-h)",
      background: "var(--surface)",
      borderTop: "1px solid var(--border)",
      display: "flex",
      zIndex: 100,
      maxWidth: 480,
      margin: "0 auto",
    }}>
      {tabs.map(({ id, Icon, label, path }) => {
        const href = base + path;
        const active = path === ""
          ? pathname === base || pathname === base + "/"
          : pathname.startsWith(base + path);
        return (
          <Link
            key={id}
            href={href}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 3,
              color: active ? "var(--blue)" : "var(--text-dim)",
              fontSize: 10, fontWeight: active ? 600 : 400,
              transition: "color 0.15s",
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
