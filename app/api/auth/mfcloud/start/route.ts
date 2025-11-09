// MFCloud OAuth2.0認証開始エンドポイント
// Phase 2: MFCloud連携

import { NextRequest, NextResponse } from 'next/server';
import { MFCLOUD_ENDPOINTS, MFCLOUD_SCOPES } from '@/types/mfcloud';

export async function GET(request: NextRequest) {
  try {
    // 環境変数チェック
    const clientId = process.env.MFCLOUD_CLIENT_ID;
    const redirectUri = process.env.MFCLOUD_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'missing_config',
            message: 'MFCloud認証情報が設定されていません',
          },
        },
        { status: 500 }
      );
    }

    // CSRF対策用のstateパラメータ生成
    const state = generateRandomState();

    // stateをセッションに保存（本番環境では適切なセッション管理を使用）
    const response = NextResponse.redirect(
      buildAuthorizationUrl(clientId, redirectUri, state)
    );

    // stateをCookieに保存（HTTPOnly、Secure、SameSite設定）
    response.cookies.set('mfcloud_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10分間有効
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('❌ MFCloud OAuth開始エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'auth_start_failed',
          message: '認証開始に失敗しました',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * MFCloud認証URLを構築
 */
function buildAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: MFCLOUD_SCOPES.join(' '),
    state: state,
  });

  return `${MFCLOUD_ENDPOINTS.oauth.authorize}?${params.toString()}`;
}

/**
 * ランダムなstateパラメータを生成（CSRF対策）
 */
function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  );
}
