import "./globals.css";

export const metadata = {
  title: "DJYY Sports · 2026 FIFA 世界杯数据平台",
  description: "2026 FIFA 世界杯实时比分、积分榜、ELO 夺冠预测。48支球队，104场比赛，蒙特卡洛模拟。",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "DJYY" },
  openGraph: {
    title: "DJYY Sports · 2026 FIFA 世界杯",
    description: "实时比分 · ELO 夺冠预测 · 积分榜 · 淘汰赛树状图",
    url: "https://2026.djyylive.com",
    siteName: "DJYY Sports",
    type: "website",
    images: [
      {
        url: "https://2026.djyylive.com/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "DJYY Sports",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "DJYY Sports · 2026 FIFA 世界杯",
    description: "实时比分 · ELO 夺冠预测 · 积分榜",
    images: ["https://2026.djyylive.com/icons/icon-512.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090a0c",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DJYY" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
          }
        `}} />
      </body>
    </html>
  );
}
