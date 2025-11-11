'use client';

import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalRewards: number;
  conversionRate: number;
}

interface ReferralCode {
  id: string;
  code: string;
  gymId: string;
  gymName: string;
  createdAt: Date;
  clicks: number;
  conversions: number;
  rewardAmount: number;
  rewardType: 'fixed' | 'percentage';
  status: 'active' | 'inactive';
}

interface ReferralActivity {
  id: string;
  referralCode: string;
  referredGymName: string;
  referredDate: Date;
  status: 'pending' | 'approved' | 'paid';
  rewardAmount: number;
}

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 12,
    activeReferrals: 8,
    totalRewards: 240000,
    conversionRate: 15.5,
  });

  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([
    {
      id: '1',
      code: 'GYM-ROYAL01',
      gymId: 'royal-fitness-saga',
      gymName: 'ROYAL FITNESS 佐賀店',
      createdAt: new Date('2024-12-01'),
      clicks: 45,
      conversions: 7,
      rewardAmount: 20000,
      rewardType: 'fixed',
      status: 'active',
    },
    {
      id: '2',
      code: 'GYM-ANYTIME01',
      gymId: 'anytime-shibuya',
      gymName: 'エニタイムフィットネス渋谷店',
      createdAt: new Date('2024-12-05'),
      clicks: 32,
      conversions: 5,
      rewardAmount: 15,
      rewardType: 'percentage',
      status: 'active',
    },
    {
      id: '3',
      code: 'GYM-GOLD01',
      gymId: 'gold-gym-tokyo',
      gymName: 'ゴールドジム東京店',
      createdAt: new Date('2024-11-20'),
      clicks: 28,
      conversions: 3,
      rewardAmount: 20000,
      rewardType: 'fixed',
      status: 'inactive',
    },
  ]);

  const [activities, setActivities] = useState<ReferralActivity[]>([
    {
      id: '1',
      referralCode: 'GYM-ROYAL01',
      referredGymName: 'フィットネス24 新宿店',
      referredDate: new Date('2025-01-08'),
      status: 'pending',
      rewardAmount: 20000,
    },
    {
      id: '2',
      referralCode: 'GYM-ROYAL01',
      referredGymName: 'セントラルスポーツ池袋店',
      referredDate: new Date('2025-01-05'),
      status: 'approved',
      rewardAmount: 20000,
    },
    {
      id: '3',
      referralCode: 'GYM-ANYTIME01',
      referredGymName: 'ティップネス六本木店',
      referredDate: new Date('2025-01-03'),
      status: 'paid',
      rewardAmount: 29700,
    },
  ]);

  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState<ReferralCode | null>(null);
  const [showNewCodeModal, setShowNewCodeModal] = useState(false);
  const [newCodeForm, setNewCodeForm] = useState({
    gymName: '',
    rewardAmount: 20000,
    rewardType: 'fixed' as 'fixed' | 'percentage',
  });

  const generateReferralUrl = (code: string) => {
    return `https://gym-match.jp/signup?ref=${code}`;
  };

  const handleShowQR = (code: ReferralCode) => {
    setSelectedCode(code);
    setShowQRModal(true);
  };

  const handleDownloadQR = () => {
    if (!selectedCode) return;
    
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${selectedCode.code}-qr.png`;
      link.href = url;
      link.click();
    }
  };

  const handleCreateCode = () => {
    const newCode: ReferralCode = {
      id: String(referralCodes.length + 1),
      code: `GYM-${newCodeForm.gymName.substring(0, 6).toUpperCase()}01`,
      gymId: `gym-${Date.now()}`,
      gymName: newCodeForm.gymName,
      createdAt: new Date(),
      clicks: 0,
      conversions: 0,
      rewardAmount: newCodeForm.rewardAmount,
      rewardType: newCodeForm.rewardType,
      status: 'active',
    };

    setReferralCodes([newCode, ...referralCodes]);
    setShowNewCodeModal(false);
    setNewCodeForm({
      gymName: '',
      rewardAmount: 20000,
      rewardType: 'fixed',
    });
  };

  const toggleCodeStatus = (codeId: string) => {
    setReferralCodes(
      referralCodes.map((code) =>
        code.id === codeId
          ? { ...code, status: code.status === 'active' ? 'inactive' : 'active' }
          : code
      )
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('コピーしました！');
  };

  return (
    <div className="p-6 pt-12 bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">紹介プログラム</h1>
        <p className="text-gray-900">
          紹介コードを使って新しいジムを招待し、報酬を獲得しましょう
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">総紹介数</h3>
            <span className="text-blue-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalReferrals}</p>
          <p className="text-sm text-green-600 mt-1">↑ 3件 (先月比)</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">アクティブ紹介</h3>
            <span className="text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeReferrals}</p>
          <p className="text-sm text-gray-900 mt-1">有効な紹介コード</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">総報酬額</h3>
            <span className="text-yellow-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">¥{stats.totalRewards.toLocaleString()}</p>
          <p className="text-sm text-gray-900 mt-1">累計獲得額</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">コンバージョン率</h3>
            <span className="text-purple-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
          <p className="text-sm text-green-600 mt-1">↑ 2.3% (先月比)</p>
        </div>
      </div>

      {/* 新規コード作成ボタン */}
      <div className="mb-6">
        <button
          onClick={() => setShowNewCodeModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          新しい紹介コードを作成
        </button>
      </div>

      {/* 紹介コード一覧 */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">紹介コード一覧</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  コード
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  ジム名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  クリック数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  コンバージョン
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  報酬設定
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  アクション
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {referralCodes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-900">
                        {code.code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(generateReferralUrl(code.code))}
                        className="text-gray-600 hover:text-blue-600"
                        title="URLをコピー"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{code.gymName}</div>
                    <div className="text-sm text-gray-500">
                      作成日: {code.createdAt.toLocaleDateString('ja-JP')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{code.clicks}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{code.conversions}</div>
                    <div className="text-xs text-gray-500">
                      {code.clicks > 0 ? ((code.conversions / code.clicks) * 100).toFixed(1) : 0}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {code.rewardType === 'fixed'
                        ? `¥${code.rewardAmount.toLocaleString()}`
                        : `${code.rewardAmount}%`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {code.rewardType === 'fixed' ? '定額' : '割合'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        code.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {code.status === 'active' ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShowQR(code)}
                        className="text-blue-600 hover:text-blue-900"
                        title="QRコード表示"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
                          <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 100-2H4a1 1 0 100 2h3zM17 13a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM16 17a1 1 0 100-2h-3a1 1 0 100 2h3z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => toggleCodeStatus(code.id)}
                        className={`${
                          code.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                        }`}
                        title={code.status === 'active' ? '無効化' : '有効化'}
                      >
                        {code.status === 'active' ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 紹介アクティビティ */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">最近の紹介アクティビティ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  紹介コード
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  紹介先ジム
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  紹介日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  報酬額
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-900">
                      {activity.referralCode}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{activity.referredGymName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {activity.referredDate.toLocaleDateString('ja-JP')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        activity.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : activity.status === 'approved'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {activity.status === 'paid' ? '支払済' : activity.status === 'approved' ? '承認済' : '保留中'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ¥{activity.rewardAmount.toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QRコードモーダル */}
      {showQRModal && selectedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">QRコード</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="bg-white p-4 inline-block rounded-lg border-2 border-gray-200">
                <QRCodeCanvas
                  id="qr-code-canvas"
                  value={generateReferralUrl(selectedCode.code)}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">紹介URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generateReferralUrl(selectedCode.code)}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-gray-50"
                />
                <button
                  onClick={() => copyToClipboard(generateReferralUrl(selectedCode.code))}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                >
                  コピー
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownloadQR}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                QRコードをダウンロード
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新規コード作成モーダル */}
      {showNewCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">新しい紹介コードを作成</h3>
              <button
                onClick={() => setShowNewCodeModal(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ジム名</label>
                <input
                  type="text"
                  value={newCodeForm.gymName}
                  onChange={(e) => setNewCodeForm({ ...newCodeForm, gymName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="例: ROYAL FITNESS 佐賀店"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">報酬タイプ</label>
                <select
                  value={newCodeForm.rewardType}
                  onChange={(e) => setNewCodeForm({ ...newCodeForm, rewardType: e.target.value as 'fixed' | 'percentage' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                >
                  <option value="fixed">定額</option>
                  <option value="percentage">割合（%）</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {newCodeForm.rewardType === 'fixed' ? '報酬額（円）' : '報酬割合（%）'}
                </label>
                <input
                  type="number"
                  value={newCodeForm.rewardAmount}
                  onChange={(e) => setNewCodeForm({ ...newCodeForm, rewardAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder={newCodeForm.rewardType === 'fixed' ? '20000' : '15'}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateCode}
                disabled={!newCodeForm.gymName}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                作成
              </button>
              <button
                onClick={() => setShowNewCodeModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
