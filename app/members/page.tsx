'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  contractType: 'monthly' | 'session';
  lastSessionDate: string;
  totalSessions: number;
  isActive: boolean;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'dormant'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // TODO: Firebase Firestoreからデータ取得
    // 仮データ設定
    setTimeout(() => {
      setMembers([
        {
          id: '1',
          name: '田中 太郎',
          email: 'tanaka@example.jp',
          phone: '090-1234-5678',
          joinDate: '2024-05-15',
          contractType: 'monthly',
          lastSessionDate: '2024-11-01',
          totalSessions: 45,
          isActive: true,
        },
        {
          id: '2',
          name: '佐藤 花子',
          email: 'sato@example.jp',
          phone: '090-2345-6789',
          joinDate: '2024-08-01',
          contractType: 'monthly',
          lastSessionDate: '2024-11-02',
          totalSessions: 28,
          isActive: true,
        },
        {
          id: '3',
          name: '鈴木 一郎',
          email: 'suzuki@example.jp',
          phone: '090-3456-7890',
          joinDate: '2023-11-10',
          contractType: 'monthly',
          lastSessionDate: '2024-10-10',
          totalSessions: 120,
          isActive: false,
        },
        {
          id: '4',
          name: '高橋 美咲',
          email: 'takahashi@example.jp',
          phone: '090-4567-8901',
          joinDate: '2024-09-05',
          contractType: 'session',
          lastSessionDate: '2024-10-30',
          totalSessions: 15,
          isActive: true,
        },
        {
          id: '5',
          name: '渡辺 健太',
          email: 'watanabe@example.jp',
          phone: '090-5678-9012',
          joinDate: '2024-10-01',
          contractType: 'monthly',
          lastSessionDate: '2024-11-02',
          totalSessions: 12,
          isActive: true,
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredMembers = members.filter((member) => {
    // ステータスフィルター
    if (filterStatus === 'active' && !member.isActive) return false;
    if (filterStatus === 'dormant' && member.isActive) return false;

    // 検索クエリ
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.phone.includes(query)
      );
    }

    return true;
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
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
            <p className="text-gray-600 text-lg">読み込み中...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* ページヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">会員管理</h1>
            <p className="text-gray-600 mt-2">
              全{members.length}人の会員 | アクティブ: {members.filter((m) => m.isActive).length}人 |
              休眠: {members.filter((m) => !m.isActive).length}人
            </p>
          </div>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>新規会員登録</span>
          </button>
        </div>

        {/* フィルター＆検索バー */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            {/* ステータスフィルター */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                アクティブ
              </button>
              <button
                onClick={() => setFilterStatus('dormant')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === 'dormant'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                休眠
              </button>
            </div>

            {/* 検索バー */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="名前、メールアドレス、電話番号で検索..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* DataTable */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    会員名
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    連絡先
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    契約タイプ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    登録日
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    最終利用日
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    セッション数
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <svg
                        className="w-16 h-16 text-gray-300 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <p className="text-gray-500 text-lg font-medium">該当する会員が見つかりません</p>
                      <p className="text-gray-400 text-sm mt-2">検索条件を変更してください</p>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-semibold text-sm">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{member.email}</p>
                        <p className="text-sm text-gray-500">{member.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            member.contractType === 'monthly'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {member.contractType === 'monthly' ? '月額会員' : 'セッション会員'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{member.joinDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{member.lastSessionDate}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{member.totalSessions}回</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            member.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {member.isActive ? 'アクティブ' : '休眠'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                          詳細 →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
