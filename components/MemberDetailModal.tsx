'use client';

import { useState, useEffect } from 'react';
import { Member, fetchUserSessions, Session } from '@/lib/firestore';

interface MemberDetailModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberDetailModal({
  member,
  isOpen,
  onClose,
}: MemberDetailModalProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'sessions'>('info');

  useEffect(() => {
    if (isOpen && member) {
      // セッション履歴を読み込む
      loadSessions();
    }
  }, [isOpen, member]);

  const loadSessions = async () => {
    if (!member) return;
    
    setIsLoadingSessions(true);
    try {
      const userSessions = await fetchUserSessions(member.id, 20);
      setSessions(userSessions);
      console.log('✅ セッション履歴取得完了:', userSessions.length, '件');
    } catch (error) {
      console.error('❌ セッション履歴取得エラー:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <>
      {/* モーダル背景 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* モーダルコンテンツ */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{member.name}</h2>
                    <p className="text-blue-100 text-sm">
                      {member.email || 'メールアドレス未登録'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition"
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* タブナビゲーション */}
              <div className="flex space-x-4 mt-6 border-b border-white border-opacity-30">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`pb-3 px-4 font-semibold transition ${
                    activeTab === 'info'
                      ? 'border-b-2 border-white text-white'
                      : 'text-blue-200 hover:text-white'
                  }`}
                >
                  基本情報
                </button>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`pb-3 px-4 font-semibold transition ${
                    activeTab === 'sessions'
                      ? 'border-b-2 border-white text-white'
                      : 'text-blue-200 hover:text-white'
                  }`}
                >
                  セッション履歴 ({sessions.length})
                </button>
              </div>
            </div>

            {/* コンテンツエリア */}
            <div className="p-8 overflow-y-auto max-h-[60vh]">
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* ステータスカード */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">
                          契約タイプ
                        </span>
                        <svg
                          className="w-6 h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {member.contractType === 'monthly'
                          ? '月額会員'
                          : member.contractType === 'session'
                          ? 'セッション会員'
                          : member.contractType}
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-700">
                          総セッション数
                        </span>
                        <svg
                          className="w-6 h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {member.totalSessions}回
                      </p>
                    </div>

                    <div
                      className={`${
                        member.isActive
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-orange-50 border-orange-200'
                      } border rounded-xl p-6`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-sm font-medium ${
                            member.isActive ? 'text-emerald-700' : 'text-orange-700'
                          }`}
                        >
                          ステータス
                        </span>
                        <svg
                          className={`w-6 h-6 ${
                            member.isActive ? 'text-emerald-600' : 'text-orange-600'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <p
                        className={`text-2xl font-bold ${
                          member.isActive ? 'text-emerald-900' : 'text-orange-900'
                        }`}
                      >
                        {member.isActive ? 'アクティブ' : '休眠中'}
                      </p>
                    </div>
                  </div>

                  {/* 詳細情報 */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      連絡先情報
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          メールアドレス
                        </label>
                        <p className="text-gray-900 font-medium">
                          {member.email || '未登録'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          電話番号
                        </label>
                        <p className="text-gray-900 font-medium">
                          {member.phone || '未登録'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 利用履歴情報 */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      利用履歴
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          入会日
                        </label>
                        <p className="text-gray-900 font-medium">
                          {member.joinDate.toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1">
                          最終来店日
                        </label>
                        <p className="text-gray-900 font-medium">
                          {member.lastVisit.toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sessions' && (
                <div>
                  {isLoadingSessions ? (
                    <div className="flex items-center justify-center py-12">
                      <svg
                        className="animate-spin h-10 w-10 text-blue-600"
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
                    </div>
                  ) : sessions.length > 0 ? (
                    <div className="space-y-4">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg
                                  className="w-6 h-6 text-blue-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {session.date.toLocaleDateString('ja-JP', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    weekday: 'short',
                                  })}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {session.type} • {session.duration}分
                                </p>
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                session.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : session.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {session.status === 'completed'
                                ? '完了'
                                : session.status === 'cancelled'
                                ? 'キャンセル'
                                : '予定'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <svg
                        className="w-16 h-16 text-gray-400 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-lg font-medium">
                        セッション履歴がありません
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* フッター (アクション) */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                  編集
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">
                  削除
                </button>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
