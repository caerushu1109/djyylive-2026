import "./globals.css";

export const metadata = {
  title: "2026 World Cup - DJYY",
  description: "Mobile-first 2026 FIFA World Cup data site.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
