// MFCloud 仕訳作成APIエンドポイント
// Phase 2: MFCloud連携 - 自動仕訳作成

import { NextRequest, NextResponse } from 'next/server';
import { MFCLOUD_ENDPOINTS } from '@/types/mfcloud';
import type { MFCloudDealRequest, MFCloudApiResponse, MFCloudDeal } from '@/types/mfcloud';

export async function POST(request: NextRequest) {
  try {
    const body: MFCloudDealRequest = await request.json();

    // 必須パラメータ検証
    const validation = validateDealRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'invalid_request',
            message: validation.error,
          },
        } as MFCloudApiResponse<never>,
        { status: 400 }
      );
    }

    // アクセストークン取得
    const accessToken = request.cookies.get('mfcloud_access_token')?.value;
    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'unauthorized',
            message: 'MFCloudへの認証が必要です',
          },
        } as MFCloudApiResponse<never>,
        { status: 401 }
      );
    }

    // MFCloud API呼び出し
    const result = await createDealInMFCloud(body, accessToken);

    if (!result.success) {
      // トークン期限切れの場合はリフレッシュを試みる
      if (result.error?.code === 'token_expired') {
        // TODO: トークンリフレッシュロジック実装
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'token_expired',
              message: 'アクセストークンの有効期限が切れています。再認証してください。',
            },
          } as MFCloudApiResponse<never>,
          { status: 401 }
        );
      }

      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ MFCloud仕訳作成エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'server_error',
          message: 'サーバーエラーが発生しました',
          details: error instanceof Error ? error.message : String(error),
        },
      } as MFCloudApiResponse<never>,
      { status: 500 }
    );
  }
}

/**
 * 仕訳リクエストのバリデーション
 */
function validateDealRequest(body: MFCloudDealRequest): {
  valid: boolean;
  error?: string;
} {
  if (!body.companyId) {
    return { valid: false, error: '会社IDが必要です' };
  }

  if (!body.issueDate) {
    return { valid: false, error: '発行日が必要です' };
  }

  if (!body.dealType || !['income', 'expense'].includes(body.dealType)) {
    return { valid: false, error: '仕訳タイプが無効です' };
  }

  if (!body.amount || body.amount <= 0) {
    return { valid: false, error: '金額は0より大きい値が必要です' };
  }

  if (!body.debitAccountCode) {
    return { valid: false, error: '借方勘定科目コードが必要です' };
  }

  if (!body.creditAccountCode) {
    return { valid: false, error: '貸方勘定科目コードが必要です' };
  }

  if (!body.description) {
    return { valid: false, error: '摘要が必要です' };
  }

  return { valid: true };
}

/**
 * MFCloud APIで仕訳作成
 */
async function createDealInMFCloud(
  dealRequest: MFCloudDealRequest,
  accessToken: string
): Promise<MFCloudApiResponse<MFCloudDeal>> {
  try {
    // 税額計算
    const taxRate = dealRequest.taxRate || 10; // デフォルト10%
    const taxAmount = Math.round(dealRequest.amount * (taxRate / 100));

    // MFCloud API リクエストボディ構築
    const apiBody = {
      company_id: dealRequest.companyId,
      issue_date: dealRequest.issueDate,
      due_date: dealRequest.dueDate || dealRequest.issueDate,
      deal_type: dealRequest.dealType,
      amount: dealRequest.amount,
      tax_amount: taxAmount,
      status: 'settled', // デフォルトで決済済み
      debit_account: {
        code: dealRequest.debitAccountCode,
      },
      credit_account: {
        code: dealRequest.creditAccountCode,
      },
      description: dealRequest.description,
      tags: dealRequest.tags || [],
      // GYM MATCH独自フィールド（メモとして保存）
      memo: JSON.stringify({
        sessionId: dealRequest.sessionId,
      }),
    };

    console.log('📤 MFCloud API リクエスト:', apiBody);

    const response = await fetch(`${MFCLOUD_ENDPOINTS.api.base}${MFCLOUD_ENDPOINTS.api.deals}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ MFCloud API エラー:', responseData);

      // エラーコード判定
      let errorCode = 'api_error';
      if (response.status === 401) {
        errorCode = 'token_expired';
      } else if (response.status === 429) {
        errorCode = 'rate_limit_exceeded';
      }

      return {
        success: false,
        error: {
          code: errorCode,
          message: responseData.error || '仕訳作成に失敗しました',
          details: responseData,
        },
      };
    }

    console.log('✅ MFCloud 仕訳作成成功:', responseData);

    // レスポンスを GYM MATCH 形式に変換
    const deal: MFCloudDeal = {
      id: responseData.id,
      companyId: responseData.company_id,
      issueDate: responseData.issue_date,
      dueDate: responseData.due_date,
      dealType: responseData.deal_type,
      amount: responseData.amount,
      taxAmount: responseData.tax_amount,
      status: responseData.status,
      debitAccount: {
        code: responseData.debit_account.code,
        name: responseData.debit_account.name,
      },
      creditAccount: {
        code: responseData.credit_account.code,
        name: responseData.credit_account.name,
      },
      description: responseData.description,
      tags: responseData.tags,
      sessionId: dealRequest.sessionId,
    };

    return {
      success: true,
      data: deal,
    };
  } catch (error) {
    console.error('❌ MFCloud API 通信エラー:', error);
    return {
      success: false,
      error: {
        code: 'network_error',
        message: 'ネットワークエラーが発生しました',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
