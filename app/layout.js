import "./globals.css";

export const metadata = {
  title: "2026 World Cup · DJYY",
  description: "2026 FIFA 世界杯实时数据、赛程、积分、冠军预测。Mobile-first.",
  manifest: "/manifest.json",
  themeColor: "#070b0f",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DJYY 2026",
  },
  openGraph: {
    title: "2026 World Cup · DJYY",
    description: "实时赛程、Elo 排名与冠军预测",
    url: "https://2026.djyylive.com",
    siteName: "DJYY 2026",
    locale: "zh_CN",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#070b0f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DJYY 2026" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
