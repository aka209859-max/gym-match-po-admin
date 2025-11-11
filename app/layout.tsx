import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";

// フォント最適化: Google Fonts (Inter) を使用
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // フォント読み込み中もテキスト表示
  preload: true,
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "GYM MATCH - Manager",
  description: "ジムオーナー専用管理システム",
  // メタタグ最適化
  keywords: "ジム管理,フィットネス,会員管理,予約システム,トレーナー管理",
  authors: [{ name: "NexaJP" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#1e40af",
  // OGP設定
  openGraph: {
    title: "GYM MATCH Manager",
    description: "ジムオーナー専用管理システム",
    type: "website",
    locale: "ja_JP",
  },
  // PWA対応の準備
  manifest: "/manifest.json",
  // Apple Touch Icon
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
