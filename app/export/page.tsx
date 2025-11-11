'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { fetchMembers, fetchSessions, Member, Session } from '@/lib/firestore';
import {
  exportMembers,
  exportSessions,
  exportRevenue,
  ExportFormat,
  RevenueData,
} from '@/lib/export';

export default function ExportPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  const gymId = 'gym_001'; // TODO: Get from auth context

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersData, sessionsData] = await Promise.all([
        fetchMembers(gymId),
        fetchSessions(gymId, 1000), // Fetch more for export
      ]);
      setMembers(membersData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportMembers = () => {
    // If no data, use demo data
    const dataToExport = members.length > 0 ? members : getDemoMembers();
    exportMembers(dataToExport, {
      format: exportFormat,
      filename: `会員データ_${getCurrentDateString()}`,
    });
  };

  const handleExportSessions = () => {
    // If no data, use demo data
    const dataToExport = sessions.length > 0 ? sessions : getDemoSessions();
    
    const options: any = {
      format: exportFormat,
      filename: `セッションデータ_${getCurrentDateString()}`,
    };

    // Add date range if specified
    if (dateRange.start && dateRange.end) {
      options.dateRange = {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      };
    }

    exportSessions(dataToExport, options);
  };

  const handleExportRevenue = () => {
    // If no data, use demo data
    const dataToExport = sessions.length > 0 ? sessions : getDemoSessions();
    
    // Calculate monthly revenue from sessions
    const revenueByMonth = calculateMonthlyRevenue(dataToExport);
    exportRevenue(revenueByMonth, {
      format: exportFormat,
      filename: `売上データ_${getCurrentDateString()}`,
    });
  };

  const calculateMonthlyRevenue = (sessions: Session[]): RevenueData[] => {
    const monthlyData: { [key: string]: RevenueData } = {};

    sessions.forEach((session) => {
      if (session.status !== 'completed') return;

      const monthKey = `${session.date.getFullYear()}-${String(
        session.date.getMonth() + 1
      ).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          totalRevenue: 0,
          sessionsCount: 0,
          averagePerSession: 0,
        };
      }

      // Assume 8,000 yen per session (can be made configurable)
      const sessionPrice = 8000;
      monthlyData[monthKey].totalRevenue += sessionPrice;
      monthlyData[monthKey].sessionsCount += 1;
    });

    // Calculate averages
    Object.values(monthlyData).forEach((data) => {
      data.averagePerSession =
        data.sessionsCount > 0
          ? Math.round(data.totalRevenue / data.sessionsCount)
          : 0;
    });

    return Object.values(monthlyData).sort((a, b) =>
      b.month.localeCompare(a.month)
    );
  };

  const getCurrentDateString = (): string => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  };

  // Demo data generators for testing when Firestore is empty
  const getDemoMembers = (): Member[] => {
    return [
      {
        id: 'demo_001',
        name: '山田太郎',
        email: 'yamada@example.com',
        phone: '090-1234-5678',
        contractType: 'プレミアム',
        joinDate: new Date('2024-01-15'),
        lastVisit: new Date('2025-11-01'),
        totalSessions: 24,
        isActive: true,
      },
      {
        id: 'demo_002',
        name: '佐藤花子',
        email: 'sato@example.com',
        phone: '090-8765-4321',
        contractType: 'スタンダード',
        joinDate: new Date('2024-03-20'),
        lastVisit: new Date('2025-10-28'),
        totalSessions: 18,
        isActive: true,
      },
      {
        id: 'demo_003',
        name: '鈴木一郎',
        email: 'suzuki@example.com',
        phone: '080-1111-2222',
        contractType: 'ベーシック',
        joinDate: new Date('2024-06-10'),
        lastVisit: new Date('2025-10-15'),
        totalSessions: 12,
        isActive: true,
      },
    ];
  };

  const getDemoSessions = (): Session[] => {
    return [
      {
        id: 'session_001',
        userId: 'demo_001',
        userName: '山田太郎',
        date: new Date('2025-11-01'),
        duration: 60,
        type: 'パーソナルトレーニング',
        status: 'completed',
      },
      {
        id: 'session_002',
        userId: 'demo_002',
        userName: '佐藤花子',
        date: new Date('2025-10-28'),
        duration: 45,
        type: 'グループレッスン',
        status: 'completed',
      },
      {
        id: 'session_003',
        userId: 'demo_003',
        userName: '鈴木一郎',
        date: new Date('2025-10-25'),
        duration: 60,
        type: 'パーソナルトレーニング',
        status: 'completed',
      },
      {
        id: 'session_004',
        userId: 'demo_001',
        userName: '山田太郎',
        date: new Date('2025-10-22'),
        duration: 60,
        type: 'パーソナルトレーニング',
        status: 'completed',
      },
      {
        id: 'session_005',
        userId: 'demo_002',
        userName: '佐藤花子',
        date: new Date('2025-10-20'),
        duration: 45,
        type: 'グループレッスン',
        status: 'completed',
      },
    ];
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">データを読み込んでいます...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-8 pt-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            データエクスポート
          </h1>
          <p className="text-gray-900 mt-2">
            会員データ、セッションデータ、売上データを無制限にエクスポートできます
          </p>
        </div>

        {/* Format Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">エクスポート形式</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setExportFormat('csv')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                exportFormat === 'csv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📄 CSV
            </button>
            <button
              onClick={() => setExportFormat('excel')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                exportFormat === 'excel'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Excel
            </button>
            <button
              onClick={() => setExportFormat('json')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                exportFormat === 'json'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💾 JSON
            </button>
          </div>
        </div>

        {/* Members Export */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">会員データ</h2>
              <p className="text-sm text-gray-900 mt-1">
                全会員の情報をエクスポート ({members.length > 0 ? `${members.length}名` : 'デモデータ'})
              </p>
            </div>
            <button
              onClick={handleExportMembers}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ⬇️ エクスポート
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-800 font-medium">
              含まれる項目: ID、名前、メールアドレス、電話番号、契約タイプ、入会日、最終来店日、総セッション数、ステータス
            </p>
          </div>
        </div>

        {/* Sessions Export */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">セッションデータ</h2>
              <p className="text-sm text-gray-900 mt-1">
                全セッション履歴をエクスポート ({sessions.length > 0 ? `${sessions.length}件` : 'デモデータ'})
              </p>
            </div>
            <button
              onClick={handleExportSessions}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ⬇️ エクスポート
            </button>
          </div>

          {/* Date Range Filter */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-gray-900 mb-3">
              期間指定 (オプション)
            </p>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-800 font-medium mb-1">
                  開始日
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-800 font-medium mb-1">
                  終了日
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-800 font-medium">
              含まれる項目: ID、会員名、会員ID、日時、時間、タイプ、ステータス
            </p>
          </div>
        </div>

        {/* Revenue Export */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">売上データ</h2>
              <p className="text-sm text-gray-900 mt-1">
                月次売上集計をエクスポート
              </p>
            </div>
            <button
              onClick={handleExportRevenue}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ⬇️ エクスポート
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-800 font-medium">
              含まれる項目: 月、総売上、セッション数、平均単価
            </p>
          </div>
        </div>

        {/* 🏆 データエクスポート機能の強み */}
        <div className="bg-gradient-to-r from-green-50 via-blue-50 to-indigo-50 rounded-xl shadow-lg p-8 border-2 border-blue-300">
          <div className="flex items-start gap-6">
            <div className="text-6xl">📊</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  無制限データエクスポート
                </h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                  GYM MATCH Manager の強み
                </span>
              </div>
              
              <p className="text-gray-700 mb-6 text-lg">
                <strong className="text-blue-600">GYM MATCH Manager</strong>では、全期間のデータを無制限にエクスポート可能です。
              </p>

              {/* メリット一覧 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold text-gray-900">データ主権完全保持</span>
                  </div>
                  <p className="text-sm text-gray-900">あなたのデータは100%あなたのもの</p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-semibold text-gray-900">長期トレンド分析</span>
                  </div>
                  <p className="text-sm text-gray-900">5年前からのデータも分析可能</p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="font-semibold text-gray-900">システム移行容易</span>
                  </div>
                  <p className="text-sm text-gray-900">ロックインなし、自由な移行</p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-semibold text-gray-900">多様なフォーマット</span>
                  </div>
                  <p className="text-sm text-gray-900">CSV、Excel、JSON対応</p>
                </div>
              </div>

              {/* 強調メッセージ */}
              <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-4 text-white">
                <p className="text-center font-bold text-lg">
                  🚀 過去全データの分析で、長期的な経営判断をサポート！
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
