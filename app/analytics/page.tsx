'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  totalMembers: number;
  totalSessions: number;
  averageSessionsPerMember: number;
  monthlyTrend: { month: string; sessions: number }[];
  contractDistribution: { monthly: number; session: number };
  sessionTypeDistribution: { personal: number; group: number };
  sessionStatusDistribution: { upcoming: number; completed: number; cancelled: number };
  recentGrowth: { newMembers: number; newSessions: number };
}

export default function AnalyticsPage() {
  const { isAuthenticated, gymId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    // 認証されており、gymIdが取得できている場合のみデータ取得
    if (isAuthenticated && gymId) {
      console.log('✅ Authenticated - Loading analytics data for gymId:', gymId);
      loadAnalyticsData(gymId);
    }
  }, [isAuthenticated, gymId, selectedPeriod]);

  const loadAnalyticsData = async (gymId: string) => {
    try {
      setIsLoading(true);
      console.log('📊 Loading analytics data for gym:', gymId);

      // Fetch members
      const membersQuery = query(collection(db, 'users'), where('gymId', '==', gymId));
      const membersSnapshot = await getDocs(membersQuery);
      const members = membersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch sessions
      const sessionsQuery = query(collection(db, 'sessions'), where('gymId', '==', gymId));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`📊 Fetched ${members.length} members and ${sessions.length} sessions`);

      // Calculate period filter date
      const now = new Date();
      const periodDays = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 0;
      const periodStartDate = periodDays > 0 ? new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000) : new Date(0);

      // Filter sessions by period
      const filteredSessions = sessions.filter((session: any) => {
        if (selectedPeriod === 'all') return true;
        const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date);
        return sessionDate >= periodStartDate;
      });

      // Calculate KPIs
      const totalMembers = members.length;
      const totalSessions = filteredSessions.length;
      const averageSessionsPerMember = totalMembers > 0 ? parseFloat((totalSessions / totalMembers).toFixed(1)) : 0;

      // Contract distribution
      const contractDistribution = members.reduce(
        (acc: any, member: any) => {
          if (member.contractType === 'monthly') acc.monthly++;
          else acc.session++;
          return acc;
        },
        { monthly: 0, session: 0 }
      );

      // Session type distribution
      const sessionTypeDistribution = filteredSessions.reduce(
        (acc: any, session: any) => {
          if (session.type === 'personal') acc.personal++;
          else acc.group++;
          return acc;
        },
        { personal: 0, group: 0 }
      );

      // Session status distribution
      const sessionStatusDistribution = filteredSessions.reduce(
        (acc: any, session: any) => {
          if (session.status === 'upcoming') acc.upcoming++;
          else if (session.status === 'completed') acc.completed++;
          else if (session.status === 'cancelled') acc.cancelled++;
          return acc;
        },
        { upcoming: 0, completed: 0, cancelled: 0 }
      );

      // Monthly trend (last 6 months)
      const monthlyTrend = calculateMonthlyTrend(filteredSessions);

      // Recent growth (last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const newMembers = members.filter((member: any) => {
        const createdAt = member.createdAt?.toDate ? member.createdAt.toDate() : new Date(member.createdAt);
        return createdAt >= thirtyDaysAgo;
      }).length;

      const newSessions = sessions.filter((session: any) => {
        const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date);
        return sessionDate >= thirtyDaysAgo;
      }).length;

      const analytics: AnalyticsData = {
        totalMembers,
        totalSessions,
        averageSessionsPerMember,
        monthlyTrend,
        contractDistribution,
        sessionTypeDistribution,
        sessionStatusDistribution,
        recentGrowth: { newMembers, newSessions },
      };

      console.log('✅ Analytics data calculated:', analytics);
      setAnalyticsData(analytics);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error loading analytics data:', error);
      setIsLoading(false);
    }
  };

  const calculateMonthlyTrend = (sessions: any[]) => {
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const now = new Date();
    const last6Months: { month: string; sessions: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[targetDate.getMonth()];
      const sessionCount = sessions.filter((session: any) => {
        const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date);
        return (
          sessionDate.getFullYear() === targetDate.getFullYear() &&
          sessionDate.getMonth() === targetDate.getMonth()
        );
      }).length;

      last6Months.push({ month: monthName, sessions: sessionCount });
    }

    return last6Months;
  };

  // CSV Export Function
  const handleExportCSV = () => {
    if (!analyticsData) return;

    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('✅ CSV exported successfully');
  };

  const generateCSV = (): string => {
    if (!analyticsData) return '';

    const lines: string[] = [];
    
    // UTF-8 BOM for Excel compatibility
    lines.push('\ufeff');
    
    // Header
    lines.push('GYM MATCH 分析レポート');
    lines.push(`生成日時,${new Date().toLocaleString('ja-JP')}`);
    lines.push(`期間,${selectedPeriod === '7d' ? '過去7日間' : selectedPeriod === '30d' ? '過去30日間' : selectedPeriod === '90d' ? '過去90日間' : '全期間'}`);
    lines.push('');

    // KPIs
    lines.push('KPI,値');
    lines.push(`総会員数,${analyticsData.totalMembers}`);
    lines.push(`総セッション数,${analyticsData.totalSessions}`);
    lines.push(`会員あたり平均セッション数,${analyticsData.averageSessionsPerMember}`);
    lines.push(`新規会員数（30日）,${analyticsData.recentGrowth.newMembers}`);
    lines.push(`新規セッション数（30日）,${analyticsData.recentGrowth.newSessions}`);
    lines.push('');

    // Contract distribution
    lines.push('契約タイプ,会員数');
    lines.push(`月額会員,${analyticsData.contractDistribution.monthly}`);
    lines.push(`都度払い会員,${analyticsData.contractDistribution.session}`);
    lines.push('');

    // Session type distribution
    lines.push('セッションタイプ,件数');
    lines.push(`パーソナル,${analyticsData.sessionTypeDistribution.personal}`);
    lines.push(`グループ,${analyticsData.sessionTypeDistribution.group}`);
    lines.push('');

    // Monthly trend
    lines.push('月次トレンド');
    lines.push('月,セッション数');
    analyticsData.monthlyTrend.forEach((item) => {
      lines.push(`${item.month},${item.sessions}`);
    });

    return lines.join('\n');
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!analyticsData) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">分析データの取得に失敗しました</p>
        </div>
      </AdminLayout>
    );
  }

  // Chart configurations
  const monthlyTrendChartData = {
    labels: analyticsData.monthlyTrend.map((item) => item.month),
    datasets: [
      {
        label: 'セッション数',
        data: analyticsData.monthlyTrend.map((item) => item.sessions),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const contractDistributionChartData = {
    labels: ['月額会員', '都度払い会員'],
    datasets: [
      {
        data: [analyticsData.contractDistribution.monthly, analyticsData.contractDistribution.session],
        backgroundColor: ['rgb(34, 197, 94)', 'rgb(251, 146, 60)'],
        borderWidth: 0,
      },
    ],
  };

  const sessionTypeChartData = {
    labels: ['パーソナル', 'グループ'],
    datasets: [
      {
        data: [analyticsData.sessionTypeDistribution.personal, analyticsData.sessionTypeDistribution.group],
        backgroundColor: ['rgb(59, 130, 246)', 'rgb(168, 85, 247)'],
        borderWidth: 0,
      },
    ],
  };

  const sessionStatusChartData = {
    labels: ['予定', '完了', 'キャンセル'],
    datasets: [
      {
        label: 'セッション数',
        data: [
          analyticsData.sessionStatusDistribution.upcoming,
          analyticsData.sessionStatusDistribution.completed,
          analyticsData.sessionStatusDistribution.cancelled,
        ],
        backgroundColor: ['rgb(59, 130, 246)', 'rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-8 pt-12">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">分析・レポート</h1>
              <p className="text-gray-900 mt-1">ジム運営データの可視化と分析</p>
            </div>
            <div className="flex gap-3">
              {/* Period Filter */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d' | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">過去7日間</option>
                <option value="30d">過去30日間</option>
                <option value="90d">過去90日間</option>
                <option value="all">全期間</option>
              </select>

              {/* CSV Export Button */}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                CSV エクスポート
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Members */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900 font-medium">総会員数</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsData.totalMembers}</p>
                  {analyticsData.recentGrowth.newMembers > 0 && (
                    <p className="text-sm text-green-600 mt-1">+{analyticsData.recentGrowth.newMembers} 新規（30日）</p>
                  )}
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Sessions */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900 font-medium">総セッション数</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsData.totalSessions}</p>
                  {analyticsData.recentGrowth.newSessions > 0 && (
                    <p className="text-sm text-green-600 mt-1">+{analyticsData.recentGrowth.newSessions} 新規（30日）</p>
                  )}
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Average Sessions Per Member */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900 font-medium">会員あたり平均</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsData.averageSessionsPerMember}</p>
                  <p className="text-sm text-gray-500 mt-1">セッション / 会員</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900 font-medium">完了率</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {analyticsData.totalSessions > 0
                      ? Math.round(
                          (analyticsData.sessionStatusDistribution.completed / analyticsData.totalSessions) * 100
                        )
                      : 0}
                    %
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {analyticsData.sessionStatusDistribution.completed} / {analyticsData.totalSessions} セッション
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">月次トレンド（過去6ヶ月）</h2>
              <div className="h-72">
                <Line data={monthlyTrendChartData} options={chartOptions} />
              </div>
            </div>

            {/* Session Status Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">セッションステータス</h2>
              <div className="h-72">
                <Bar data={sessionStatusChartData} options={chartOptions} />
              </div>
            </div>

            {/* Contract Distribution Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">契約タイプ分布</h2>
              <div className="h-72 flex items-center justify-center">
                <Doughnut data={contractDistributionChartData} options={chartOptions} />
              </div>
            </div>

            {/* Session Type Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">セッションタイプ分布</h2>
              <div className="h-72 flex items-center justify-center">
                <Doughnut data={sessionTypeChartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Data Tables Section */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contract Distribution Table */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">契約タイプ詳細</h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">契約タイプ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">会員数</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">割合</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">月額会員</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{analyticsData.contractDistribution.monthly}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {analyticsData.totalMembers > 0
                        ? Math.round((analyticsData.contractDistribution.monthly / analyticsData.totalMembers) * 100)
                        : 0}
                      %
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">都度払い会員</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{analyticsData.contractDistribution.session}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {analyticsData.totalMembers > 0
                        ? Math.round((analyticsData.contractDistribution.session / analyticsData.totalMembers) * 100)
                        : 0}
                      %
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Session Type Table */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">セッションタイプ詳細</h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">タイプ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">件数</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">割合</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">パーソナル</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{analyticsData.sessionTypeDistribution.personal}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {analyticsData.totalSessions > 0
                        ? Math.round((analyticsData.sessionTypeDistribution.personal / analyticsData.totalSessions) * 100)
                        : 0}
                      %
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">グループ</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{analyticsData.sessionTypeDistribution.group}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {analyticsData.totalSessions > 0
                        ? Math.round((analyticsData.sessionTypeDistribution.group / analyticsData.totalSessions) * 100)
                        : 0}
                      %
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminLayout>
  );
}
