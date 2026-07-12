import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "謎解きダンジョン",
  description: "部屋を探索して謎を解くダンジョンイベント"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
