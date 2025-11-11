'use client';

import AdminLayout from '@/components/AdminLayout';

export default function TermsPage() {
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            利用規約・契約条件
          </h1>
          <p className="text-lg text-gray-900">
            透明性の高い契約で、安心してご利用いただけます
          </p>
        </div>

        {/* 重要な契約条件 - ハイライト */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-8 mb-12 border-2 border-green-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="text-3xl">✅</span>
            お客様を第一に考えた契約条件
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🔓</span>
                <h3 className="text-xl font-bold text-gray-900">ロックインなし</h3>
              </div>
              <ul className="text-gray-700 space-y-2">
                <li>✅ 最低契約期間なし</li>
                <li>✅ いつでも解約可能</li>
                <li>✅ 違約金一切なし</li>
                <li>✅ 解約手続きは1クリック</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">📊</span>
                <h3 className="text-xl font-bold text-gray-900">データ主権保証</h3>
              </div>
              <ul className="text-gray-700 space-y-2">
                <li>✅ データは100%お客様のもの</li>
                <li>✅ 全期間エクスポート可能</li>
                <li>✅ 解約後もデータ取得保証</li>
                <li>✅ 他社システムへの移行支援</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">💰</span>
                <h3 className="text-xl font-bold text-gray-900">明朗会計</h3>
              </div>
              <ul className="text-gray-700 space-y-2">
                <li>✅ 月額¥19,800固定（税別）</li>
                <li>✅ 会員数による追加料金なし</li>
                <li>✅ 機能制限一切なし</li>
                <li>✅ 隠れた追加費用なし</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🆓</span>
                <h3 className="text-xl font-bold text-gray-900">安心トライアル</h3>
              </div>
              <ul className="text-gray-700 space-y-2">
                <li>✅ 14日間完全無料</li>
                <li>✅ クレジットカード登録不要</li>
                <li>✅ 自動課金なし</li>
                <li>✅ 全機能お試し可能</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 詳細利用規約 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">利用規約</h2>
          
          <div className="space-y-8">
            {/* Section 1 */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                1. サービス内容
              </h3>
              <p className="text-gray-700 leading-relaxed">
                GYM MATCH Manager（以下「本サービス」）は、ジム運営に必要な会員管理、売上分析、会計連携、トレーナー管理、予約システム等の機能を提供するクラウド型管理システムです。
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2. 利用料金
              </h3>
              <div className="bg-blue-50 rounded-lg p-4 mb-3">
                <p className="text-gray-900 font-semibold mb-2">料金体系</p>
                <ul className="text-gray-700 space-y-1">
                  <li>• 月額プラン: ¥19,800（税別）/月</li>
                  <li>• 年額プラン: ¥198,000（税別）/年（2ヶ月分お得）</li>
                  <li>• 14日間無料トライアル期間あり</li>
                </ul>
              </div>
              <p className="text-gray-700 leading-relaxed">
                <strong>重要:</strong> 会員数、トレーナー数、データ量による追加料金は一切発生しません。表示価格のみでご利用いただけます。
              </p>
            </div>

            {/* Section 3 */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3. 契約期間・解約
              </h3>
              <div className="bg-green-50 rounded-lg p-4 mb-3">
                <p className="text-gray-900 font-semibold mb-2">解約の自由</p>
                <ul className="text-gray-700 space-y-1">
                  <li>• <strong>最低契約期間: なし</strong></li>
                  <li>• <strong>解約手数料: 無料</strong></li>
                  <li>• <strong>違約金: 一切なし</strong></li>
                  <li>• 解約申請から即日〜3営業日以内に処理完了</li>
                </ul>
              </div>
            </div>

            {/* Section 4 */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                4. データの取り扱い
              </h3>
              <div className="bg-purple-50 rounded-lg p-4 mb-3">
                <p className="text-gray-900 font-semibold mb-2">データ主権の保証</p>
                <ul className="text-gray-700 space-y-1">
                  <li>• お客様のデータは100%お客様の所有物です</li>
                  <li>• 全期間のデータエクスポートが可能（無制限）</li>
                  <li>• 解約後もデータ取得を30日間保証</li>
                  <li>• CSV、Excel、JSON形式での出力に対応</li>
                  <li>• 他社システムへの移行サポートあり</li>
                </ul>
              </div>
              <p className="text-gray-700 leading-relaxed mt-3">
                当社は、お客様の許可なくデータを第三者に提供・販売することは一切ありません。
              </p>
            </div>

            {/* Section 5 */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                5. サービスレベル保証（SLA）
              </h3>
              <div className="text-gray-700 leading-relaxed space-y-2">
                <p>• 稼働率: 99.5%以上を保証</p>
                <p>• データバックアップ: 毎日自動実行</p>
                <p>• サポート対応: 平日10:00-18:00（メール・チャット）</p>
              </div>
            </div>

            {/* Section 6 */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                6. 無料トライアル
              </h3>
              <div className="text-gray-700 leading-relaxed space-y-2">
                <p>• 期間: 14日間</p>
                <p>• 利用可能機能: 全機能（制限なし）</p>
                <p>• クレジットカード登録: 不要</p>
                <p>• 自動課金: なし（継続希望時のみ登録）</p>
                <p>• トライアル期間終了後: 自動的に終了（課金されません）</p>
              </div>
            </div>

            {/* Section 7 */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                7. 禁止事項
              </h3>
              <div className="text-gray-700 leading-relaxed space-y-2">
                <p>以下の行為を禁止します：</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>本サービスの不正利用</li>
                  <li>アカウント情報の第三者への譲渡</li>
                  <li>システムへの不正アクセス試行</li>
                  <li>他のユーザーへの迷惑行為</li>
                </ul>
              </div>
            </div>

            {/* Section 8 */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                8. 規約の変更
              </h3>
              <p className="text-gray-700 leading-relaxed">
                本規約を変更する場合は、30日前までにメールおよび管理画面上でお知らせします。重要な変更の場合は、お客様の同意を得た上で適用します。
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-blue-50 rounded-xl p-8 text-center border-2 border-blue-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            ご不明な点がございましたら
          </h3>
          <p className="text-gray-700 mb-6">
            契約条件やサービス内容について、ご質問・ご相談はお気軽にお問い合わせください。
          </p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
            お問い合わせ
          </button>
        </div>

        {/* Last Updated */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          最終更新日: 2025年1月10日
        </div>
      </div>
    </AdminLayout>
  );
}
