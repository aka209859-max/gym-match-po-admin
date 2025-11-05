// freee OAuth2.0 Authentication Start Endpoint
// GYM MATCH Manager - Sprint 1C: freee API Integration

import { NextRequest, NextResponse } from 'next/server';
import { generateFreeeAuthUrl, FreeeConfig } from '@/lib/freee-auth';
import crypto from 'crypto';

/**
 * GET /api/auth/freee/start
 * 
 * freee OAuth2.0認証フローを開始
 * 
 * 処理フロー:
 * 1. CSRF保護用のstateトークン生成
 * 2. 環境変数からfreee API設定を読み込み
 * 3. freee認証URLを生成
 * 4. freeeログインページにリダイレクト
 * 5. ユーザーが承認後、freeeが /api/auth/freee/callback にリダイレクト
 * 
 * @returns Redirect to freee authorization page
 */
export async function GET(request: NextRequest) {
  try {
    // CSRF保護用のstateトークン生成（32バイトのランダム文字列）
    const state = crypto.randomBytes(32).toString('hex');

    // 環境変数からfreee API設定を読み込み
    const config: FreeeConfig = {
      clientId: process.env.FREEE_CLIENT_ID || '',
      clientSecret: process.env.FREEE_CLIENT_SECRET || '',
      redirectUri: process.env.FREEE_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/freee/callback`,
      scope: 'read write', // freee APIで利用可能な権限スコープ
    };

    // 環境変数の検証
    if (!config.clientId || !config.clientSecret) {
      console.error('freee API credentials not configured');
      return NextResponse.redirect(
        new URL('/settings/accounting?error=credentials_not_configured', request.url)
      );
    }

    // freee認証URL生成
    const authUrl = generateFreeeAuthUrl(config, state);

    console.log('🚀 freee OAuth2.0 authentication started');
    console.log('📍 Redirect URI:', config.redirectUri);
    console.log('🔐 State token generated');

    // TODO: 本番環境ではstateトークンをセッションまたはデータベースに保存して
    // コールバック時に検証する必要があります（CSRF攻撃防止）
    // 現在はシンプルな実装として、stateトークンの検証をスキップしています

    // freee認証ページにリダイレクト
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('❌ freee authentication start error:', error);
    
    return NextResponse.redirect(
      new URL(
        `/settings/accounting?error=auth_start_failed&message=${encodeURIComponent(
          error instanceof Error ? error.message : 'Unknown error'
        )}`,
        request.url
      )
    );
  }
}

/**
 * エラーハンドリングのベストプラクティス:
 * 
 * 1. credentials_not_configured: 環境変数が設定されていない
 *    → 開発者に.env.localの設定を促す
 * 
 * 2. auth_start_failed: 認証開始処理でエラー発生
 *    → エラーメッセージをクエリパラメータで渡し、UI側で表示
 * 
 * セキュリティ考慮事項:
 * - stateトークンはCSRF攻撃を防ぐために必須
 * - 本番環境ではstateトークンをセッションストアに保存して検証
 * - 環境変数の漏洩を防ぐため、クライアント側に送信しない
 * - HTTPSを使用してトークンの盗聴を防止
 */
