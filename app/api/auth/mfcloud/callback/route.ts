// MFCloud OAuth2.0コールバックエンドポイント
// Phase 2: MFCloud連携

import { NextRequest, NextResponse } from 'next/server';
import { MFCLOUD_ENDPOINTS } from '@/types/mfcloud';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // エラーレスポンス処理
    if (error) {
      console.error('❌ MFCloud認証エラー:', error);
      return NextResponse.redirect(
        new URL(
          `/settings/accounting?error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    // 必須パラメータチェック
    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          '/settings/accounting?error=missing_parameters',
          request.url
        )
      );
    }

    // stateパラメータ検証（CSRF対策）
    const storedState = request.cookies.get('mfcloud_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      console.error('❌ State検証失敗');
      return NextResponse.redirect(
        new URL('/settings/accounting?error=invalid_state', request.url)
      );
    }

    // 環境変数チェック
    const clientId = process.env.MFCLOUD_CLIENT_ID;
    const clientSecret = process.env.MFCLOUD_CLIENT_SECRET;
    const redirectUri = process.env.MFCLOUD_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(
        new URL('/settings/accounting?error=missing_config', request.url)
      );
    }

    // アクセストークン取得
    const tokenResponse = await exchangeCodeForToken(
      code,
      clientId,
      clientSecret,
      redirectUri
    );

    if (!tokenResponse.success) {
      console.error('❌ トークン取得失敗:', tokenResponse.error);
      return NextResponse.redirect(
        new URL(
          `/settings/accounting?error=${encodeURIComponent(tokenResponse.error?.message || 'token_exchange_failed')}`,
          request.url
        )
      );
    }

    // トークンを安全に保存（本番環境では暗号化してデータベースに保存）
    const response = NextResponse.redirect(
      new URL('/settings/accounting?success=true', request.url)
    );

    // HTTPOnly Cookieにトークンを保存（開発環境のみ推奨）
    response.cookies.set('mfcloud_access_token', tokenResponse.data!.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenResponse.data!.expiresIn,
      path: '/',
    });

    response.cookies.set('mfcloud_refresh_token', tokenResponse.data!.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30日間
      path: '/',
    });

    // State Cookieを削除
    response.cookies.delete('mfcloud_oauth_state');

    return response;
  } catch (error) {
    console.error('❌ MFCloud コールバック処理エラー:', error);
    return NextResponse.redirect(
      new URL('/settings/accounting?error=callback_failed', request.url)
    );
  }
}

/**
 * 認証コードをアクセストークンに交換
 */
async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    scope: string[];
  };
  error?: {
    code: string;
    message: string;
  };
}> {
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(MFCLOUD_ENDPOINTS.oauth.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          code: errorData.error || 'token_request_failed',
          message: errorData.error_description || 'トークン取得に失敗しました',
        },
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        scope: data.scope ? data.scope.split(' ') : [],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'network_error',
        message: 'ネットワークエラーが発生しました',
      },
    };
  }
}
