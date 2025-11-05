import { NextRequest, NextResponse } from 'next/server';

/**
 * freee 仕訳作成API
 * Sprint 1C: 会員登録時の自動仕訳作成
 * 
 * POSTリクエストで仕訳を作成します
 * 
 * リクエストボディ例:
 * {
 *   "memberName": "山田太郎",
 *   "amount": 10000,
 *   "date": "2025-01-15",
 *   "description": "月会費 - 2025年1月"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json();
    const { memberName, amount, date, description } = body;

    // バリデーション
    if (!memberName || !amount || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: memberName, amount, date' },
        { status: 400 }
      );
    }

    // 環境変数から認証情報を取得
    const accessToken = process.env.FREEE_TEST_ACCESS_TOKEN;
    const companyId = process.env.FREEE_TEST_COMPANY_ID;

    if (!accessToken || !companyId) {
      console.error('❌ freee API credentials not configured');
      return NextResponse.json(
        { 
          error: 'freee API credentials not configured',
          details: {
            hasAccessToken: !!accessToken,
            hasCompanyId: !!companyId
          }
        },
        { status: 500 }
      );
    }

    console.log('🚀 Creating freee deal...');
    console.log('📋 Request data:', { memberName, amount, date, description });

    // freee API: 仕訳作成
    // ドキュメント: https://developer.freee.co.jp/docs/accounting/reference#/deals/createDeal
    // 
    // 仕訳構造:
    // 借方（Dr.）: 売掛金 / 貸方（Cr.）: 売上高
    // ※現金は口座情報が必要なため、売掛金を使用
    const dealData = {
      company_id: parseInt(companyId),
      issue_date: date,
      type: 'income', // 収入
      details: [
        {
          // 借方（売掛金）- 会員からの未収入金
          account_item_id: 981982122, // 売掛金（開発用テスト事業所の実際のID）
          tax_code: 0, // 対象外
          amount: amount,
          entry_side: 'debit',
          description: `${memberName} 様 - 売掛金`
        },
        {
          // 貸方（売上高）- 会員費収入
          account_item_id: 981982188, // 売上高（開発用テスト事業所の実際のID）
          tax_code: 108, // 課税売上 10%
          amount: amount,
          entry_side: 'credit',
          description: description || `${memberName} - 会員費`
        }
      ]
    };

    // freee APIコール
    const response = await fetch('https://api.freee.co.jp/api/1/deals', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(dealData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ freee API error:', responseData);
      return NextResponse.json(
        { 
          error: 'freee API request failed',
          status: response.status,
          details: responseData
        },
        { status: response.status }
      );
    }

    console.log('✅ Deal created successfully:', responseData);

    return NextResponse.json({
      success: true,
      deal: responseData.deal,
      message: `仕訳を作成しました: ${memberName} - ¥${amount.toLocaleString()}`
    });

  } catch (error) {
    console.error('❌ Deal creation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET: 仕訳一覧取得（開発用）
 */
export async function GET(request: NextRequest) {
  try {
    const accessToken = process.env.FREEE_TEST_ACCESS_TOKEN;
    const companyId = process.env.FREEE_TEST_COMPANY_ID;

    if (!accessToken || !companyId) {
      return NextResponse.json(
        { error: 'freee API credentials not configured' },
        { status: 500 }
      );
    }

    console.log('🔍 Fetching deals from freee...');

    // freee API: 仕訳一覧取得
    const response = await fetch(
      `https://api.freee.co.jp/api/1/deals?company_id=${companyId}&limit=10`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ freee API error:', responseData);
      return NextResponse.json(
        { 
          error: 'freee API request failed',
          status: response.status,
          details: responseData
        },
        { status: response.status }
      );
    }

    console.log('✅ Deals fetched successfully');

    return NextResponse.json({
      success: true,
      deals: responseData.deals || [],
      count: responseData.deals?.length || 0
    });

  } catch (error) {
    console.error('❌ Deals fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
