'use client';

import { useState, useEffect } from 'react';

interface KPIData {
  totalMembers: number;
  activeMembers: number;
  dormantMembers: number;
}

export default function DashboardPage() {
  const [kpiData, setKpiData] = useState<KPIData>({
    totalMembers: 0,
    activeMembers: 0,
    dormantMembers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [gymName, setGymName] = useState('リバーフィット久留米店');

  useEffect(() => {
    // TODO: Firebase Firestoreからデータ取得
    // 仮データ設定
    setTimeout(() => {
      setKpiData({
        totalMembers: 5,
        activeMembers: 4,
        dormantMembers: 1,
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleLogout = () => {
    // TODO: Firebase認証ログアウト
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{gymName}</h1>
              <p className="text-sm text-blue-200 mt-1">PO管理者ダッシュボード</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 総会員数 */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総会員数</p>
                <p className="text-3xl font-bold text-gray-900">{kpiData.totalMembers}</p>
              </div>
            </div>
          </div>

          {/* アクティブ会員 */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">アクティブ会員</p>
                <p className="text-3xl font-bold text-gray-900">{kpiData.activeMembers}</p>
              </div>
            </div>
          </div>

          {/* 休眠会員 */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">休眠会員</p>
                <p className="text-3xl font-bold text-gray-900">{kpiData.dormantMembers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 機能ボタン */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 会員管理 */}
          <button className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border border-gray-200 text-left">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-blue-100 rounded-lg p-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">会員管理</h3>
                </div>
                <p className="text-sm text-gray-600">会員リストの表示と管理</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="mt-4 inline-flex items-center text-sm text-blue-600 font-medium">
              Coming Soon
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">準備中</span>
            </div>
          </button>

          {/* セッション管理 */}
          <button className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border border-gray-200 text-left">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-purple-100 rounded-lg p-2">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">セッション管理</h3>
                </div>
                <p className="text-sm text-gray-600">予約とセッション履歴</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="mt-4 inline-flex items-center text-sm text-purple-600 font-medium">
              Coming Soon
              <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">準備中</span>
            </div>
          </button>

          {/* 分析 */}
          <button className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border border-gray-200 text-left">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-indigo-100 rounded-lg p-2">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">分析</h3>
                </div>
                <p className="text-sm text-gray-600">KPIグラフと統計データ</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="mt-4 inline-flex items-center text-sm text-indigo-600 font-medium">
              Coming Soon
              <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">準備中</span>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
