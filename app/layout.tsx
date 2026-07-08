import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "謎解き宝探し",
  description: "部屋探索と解答のためのMVPアプリ"
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
