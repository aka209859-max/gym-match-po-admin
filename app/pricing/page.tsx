'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const monthlyPrice = 19800;
  const annualPrice = 198000; // 10ヶ月分の価格（2ヶ月無料）
  const annualMonthlyPrice = Math.round(annualPrice / 12);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-8 pt-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            シンプルで透明性の高い料金プラン
          </h1>
          <p className="text-xl text-gray-900 mb-8">
            ロックインなし・いつでも解約可能・データは完全にあなたのもの
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <span className={`text-lg ${billingCycle === 'monthly' ? 'font-bold text-blue-600' : 'text-gray-900'}`}>
              月額払い
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-8 w-16 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg ${billingCycle === 'annual' ? 'font-bold text-blue-600' : 'text-gray-900'}`}>
              年額払い
            </span>
            {billingCycle === 'annual' && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                2ヶ月分お得
              </span>
            )}
          </div>
        </div>

        {/* Pricing Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6">
              <h2 className="text-3xl font-bold mb-2">GYM MATCH Manager</h2>
              <p className="text-white">オールインワンジム管理システム</p>
            </div>

            {/* Price */}
            <div className="px-8 py-8 border-b border-gray-200">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-gray-900">
                  ¥{billingCycle === 'monthly' ? monthlyPrice.toLocaleString() : annualMonthlyPrice.toLocaleString()}
                </span>
                <span className="text-xl text-gray-900">/月</span>
              </div>
              {billingCycle === 'annual' && (
                <p className="text-center text-gray-900 mt-2">
                  年額 ¥{annualPrice.toLocaleString()}（一括払い）
                </p>
              )}
              <p className="text-center text-gray-500 mt-2 text-sm">
                ※ 表示価格は税別です
              </p>
            </div>

            {/* Features */}
            <div className="px-8 py-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">すべての機能が使い放題</h3>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: '👥', title: '会員管理', description: '無制限の会員登録' },
                  { icon: '📊', title: 'データ分析', description: '売上・KPI完全可視化' },
                  { icon: '💰', title: '会計連携', description: 'freee/MFCloud統合' },
                  { icon: '📈', title: 'レポート生成', description: 'PDF/Excel自動出力' },
                  { icon: '📤', title: 'データエクスポート', description: '全期間無制限' },
                  { icon: '🏋️', title: 'PT連携', description: 'GYM MATCHアプリ統合' },
                  { icon: '👨‍🏫', title: 'トレーナー管理', description: 'パフォーマンス分析' },
                  { icon: '📅', title: '予約管理', description: 'セッション予約システム' },
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{feature.title}</p>
                      <p className="text-sm text-gray-900">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors">
                14日間無料トライアルを始める
              </button>
              <p className="text-center text-gray-900 text-sm mt-4">
                クレジットカード登録不要・自動課金なし
              </p>
            </div>
          </div>
        </div>

        {/* 透明性保証セクション */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-green-50 rounded-xl border-2 border-green-200 p-8">
            <div className="flex items-start gap-4">
              <div className="text-4xl">✅</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  契約の透明性保証
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="text-green-600">🔓</span>
                      ロックインなし
                    </h4>
                    <p className="text-gray-700 text-sm">
                      いつでも解約可能。違約金・最低契約期間なし。
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="text-green-600">📊</span>
                      データ主権保証
                    </h4>
                    <p className="text-gray-700 text-sm">
                      あなたのデータは100%あなたのもの。解約時も全データエクスポート可能。
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="text-green-600">🆓</span>
                      14日間無料トライアル
                    </h4>
                    <p className="text-gray-700 text-sm">
                      クレジットカード登録不要。自動課金なし。
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="text-green-600">💳</span>
                      明朗会計
                    </h4>
                    <p className="text-gray-700 text-sm">
                      表示価格以外の追加料金なし。会員数・機能による追加課金なし。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            よくある質問
          </h3>
          <div className="space-y-4">
            {[
              {
                q: '最低契約期間はありますか？',
                a: 'いいえ、ありません。いつでも解約可能で、違約金も一切かかりません。',
              },
              {
                q: '会員数による追加料金は発生しますか？',
                a: 'いいえ、発生しません。何名登録しても月額¥19,800（税別）の固定料金です。',
              },
              {
                q: '解約後もデータは取得できますか？',
                a: 'はい、解約後も全期間のデータをエクスポート可能です。データは完全にあなたのものです。',
              },
              {
                q: '無料トライアル終了後はどうなりますか？',
                a: '自動課金はされません。継続希望の場合のみ、お支払い情報を登録いただきます。',
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-gray-700">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white">
            <h3 className="text-3xl font-bold mb-4">
              今すぐ無料で始める
            </h3>
            <p className="text-xl mb-6 text-white">
              クレジットカード不要・14日間完全無料
            </p>
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors">
              無料トライアルを開始
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
