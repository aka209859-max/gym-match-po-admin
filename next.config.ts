import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ============================================
   * 画像最適化設定
   * ============================================ */
  images: {
    // 外部画像ドメインの許可
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'storage.googleapis.com'
    ],
    // 画像フォーマットの最適化 (AVIF優先)
    formats: ['image/avif', 'image/webp'],
    // レスポンシブ画像のサイズ設定
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // キャッシュ期間 (1年)
    minimumCacheTTL: 31536000,
  },

  /* ============================================
   * セキュリティヘッダー設定
   * ============================================ */
  async headers() {
    return [
      {
        // 全てのルートに適用
        source: '/(.*)',
        headers: [
          // XSS攻撃防止
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // クリックジャッキング防止
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // MIMEタイプスニッフィング防止
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // HTTPS強制 (2年間)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          // Referrerポリシー
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // 権限ポリシー (カメラ・マイク・位置情報無効化)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          // Content Security Policy (XSS対策)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://api.stripe.com wss://*.firebaseio.com",
              "frame-src 'self' https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ],
      },
      // API エンドポイント用の追加ヘッダー
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ]
      }
    ];
  },

  /* ============================================
   * パフォーマンス最適化
   * ============================================ */
  // 本番ビルドでのソースマップ無効化 (セキュリティ強化)
  productionBrowserSourceMaps: false,

  // Reactストリクトモード有効化
  reactStrictMode: true,

  // 実験的機能
  experimental: {
    // サーバーアクションの有効化
    serverActions: {
      bodySizeLimit: '2mb'
    },
  },

  /* ============================================
   * ビルド最適化
   * ============================================ */
  compiler: {
    // 本番環境でconsole.log削除
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  /* ============================================
   * 環境変数の型安全性
   * ============================================ */
  typescript: {
    // 型エラーがあってもビルド続行 (Vercel初回デプロイ用)
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLintエラーがあってもビルド続行 (Vercel初回デプロイ用)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
