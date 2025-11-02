import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GYM MATCH - PO管理ページ",
  description: "パートナーオーナー専用管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
