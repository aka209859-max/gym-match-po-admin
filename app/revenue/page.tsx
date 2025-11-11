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

interface RevenueData {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  averageSessionPrice: number;
  monthlyRevenueGrowth: number;
  monthlyRevenueTrend: { month: string; revenue: number }[];
  sessionTypeRevenue: { personal: number; group: number; trial: number; consultation: number };
  trainerPerformance: { 
    name: string; 
    sessions: number; 
    revenue: number; 
    utilizationRate: number;
    efficiencyScore: number;  // 新規: 効率性スコア (売上/セッション数)
    monthlyGrowth: number;     // 新規: 月次成長率 (%)
    speciality: string;        // 新規: 得意分野
  }[];
  topPerformers: { name: string; revenue: number; badge: string }[];  // 新規: TOP3
}

export default function RevenuePage() {
  const { isAuthenticated, gymId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    if (isAuthenticated && gymId) {
      console.log('✅ Authenticated - Loading revenue data for gymId:', gymId);
      loadRevenueData();
    }
  }, [isAuthenticated, gymId, selectedPeriod]);

  const loadRevenueData = async () => {
    try {
      setIsLoading(true);
      console.log('💰 Loading revenue data...');

      // デモデータ（実際はFirestoreから取得）
      // 過去12ヶ月の売上トレンド
      const monthlyRevenueTrend = [
        { month: '2月', revenue: 2850000 },
        { month: '3月', revenue: 3120000 },
        { month: '4月', revenue: 3450000 },
        { month: '5月', revenue: 3280000 },
        { month: '6月', revenue: 3620000 },
        { month: '7月', revenue: 3890000 },
        { month: '8月', revenue: 4150000 },
        { month: '9月', revenue: 3980000 },
        { month: '10月', revenue: 4250000 },
        { month: '11月', revenue: 4480000 },
        { month: '12月', revenue: 4720000 },
        { month: '1月', revenue: 4950000 },
      ];

      // セッションタイプ別売上
      const sessionTypeRevenue = {
        personal: 3280000,  // パーソナル（高単価）
        group: 1250000,     // グループ
        trial: 280000,      // 体験
        consultation: 140000, // カウンセリング
      };

      // トレーナー別パフォーマンス（拡張版）
      const trainerPerformance = [
        { 
          name: '田中 健太', 
          sessions: 85, 
          revenue: 1530000, 
          utilizationRate: 92,
          efficiencyScore: 18000,  // 1530000 / 85
          monthlyGrowth: 12.5,
          speciality: 'パーソナル'
        },
        { 
          name: '佐藤 美咲', 
          sessions: 78, 
          revenue: 1404000, 
          utilizationRate: 87,
          efficiencyScore: 18000,
          monthlyGrowth: 8.3,
          speciality: 'グループ'
        },
        { 
          name: '鈴木 大輔', 
          sessions: 72, 
          revenue: 1296000, 
          utilizationRate: 82,
          efficiencyScore: 18000,
          monthlyGrowth: -2.1,
          speciality: 'パーソナル'
        },
        { 
          name: '高橋 愛', 
          sessions: 65, 
          revenue: 1170000, 
          utilizationRate: 76,
          efficiencyScore: 18000,
          monthlyGrowth: 5.7,
          speciality: '体験'
        },
        { 
          name: '渡辺 翔太', 
          sessions: 52, 
          revenue: 936000, 
          utilizationRate: 68,
          efficiencyScore: 18000,
          monthlyGrowth: -5.4,
          speciality: 'カウンセリング'
        },
      ];

      // TOP3トレーナー（売上順）
      const topPerformers = [
        { name: '田中 健太', revenue: 1530000, badge: '🥇 売上TOP' },
        { name: '佐藤 美咲', revenue: 1404000, badge: '🥈 成長率1位' },
        { name: '鈴木 大輔', revenue: 1296000, badge: '🥉 稼働率優秀' },
      ];

      const totalRevenue = Object.values(sessionTypeRevenue).reduce((sum, val) => sum + val, 0);
      const todayRevenue = 185000;
      const monthRevenue = monthlyRevenueTrend[monthlyRevenueTrend.length - 1].revenue;
      const lastMonthRevenue = monthlyRevenueTrend[monthlyRevenueTrend.length - 2].revenue;
      const averageSessionPrice = 18500;
      const monthlyRevenueGrowth = ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

      const revenue: RevenueData = {
        totalRevenue,
        todayRevenue,
        monthRevenue,
        averageSessionPrice,
        monthlyRevenueGrowth,
        monthlyRevenueTrend,
        sessionTypeRevenue,
        trainerPerformance,
        topPerformers,
      };

      console.log('✅ Revenue data loaded:', revenue);
      setRevenueData(revenue);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error loading revenue data:', error);
      setIsLoading(false);
    }
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

  if (!revenueData) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">売上データの取得に失敗しました</p>
        </div>
      </AdminLayout>
    );
  }

  // Chart configurations
  const monthlyRevenueChartData = {
    labels: revenueData.monthlyRevenueTrend.map((item) => item.month),
    datasets: [
      {
        label: '月次売上（円）',
        data: revenueData.monthlyRevenueTrend.map((item) => item.revenue),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const sessionTypeRevenueChartData = {
    labels: ['パーソナル', 'グループ', '体験', 'カウンセリング'],
    datasets: [
      {
        data: [
          revenueData.sessionTypeRevenue.personal,
          revenueData.sessionTypeRevenue.group,
          revenueData.sessionTypeRevenue.trial,
          revenueData.sessionTypeRevenue.consultation,
        ],
        backgroundColor: [
          'rgb(59, 130, 246)',   // Blue - Personal
          'rgb(168, 85, 247)',   // Purple - Group
          'rgb(251, 146, 60)',   // Orange - Trial
          'rgb(34, 197, 94)',    // Green - Consultation
        ],
        borderWidth: 0,
      },
    ],
  };

  const trainerPerformanceChartData = {
    labels: revenueData.trainerPerformance.map((t) => t.name),
    datasets: [
      {
        label: '売上（円）',
        data: revenueData.trainerPerformance.map((t) => t.revenue),
        backgroundColor: 'rgb(59, 130, 246)',
        borderRadius: 8,
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
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '¥' + value.toLocaleString();
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ¥${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-8 pt-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💰 売上分析ダッシュボード</h1>
            <p className="text-gray-900 mt-1">収益データのリアルタイム可視化と分析</p>
          </div>
          <div className="flex gap-3">
            {/* Period Filter */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'quarter' | 'year')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">今週</option>
              <option value="month">今月</option>
              <option value="quarter">過去3ヶ月</option>
              <option value="year">過去1年</option>
            </select>
          </div>
        </div>

        {/* Revenue KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium opacity-90">総売上</p>
            <p className="text-3xl font-bold mt-2">¥{revenueData.totalRevenue.toLocaleString()}</p>
            <p className="text-sm opacity-80 mt-2">全期間累計</p>
          </div>

          {/* Today Revenue */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 font-medium">本日の売上</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">¥{revenueData.todayRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">今日の収益</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Month Revenue */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 font-medium">今月の売上</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">¥{revenueData.monthRevenue.toLocaleString()}</p>
                <p className={`text-sm mt-1 ${revenueData.monthlyRevenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueData.monthlyRevenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueData.monthlyRevenueGrowth).toFixed(1)}% 前月比
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Average Session Price */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 font-medium">平均セッション単価</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">¥{revenueData.averageSessionPrice.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">1セッションあたり</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Revenue Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 月次売上トレンド（過去12ヶ月）</h2>
            <div className="h-80">
              <Line data={monthlyRevenueChartData} options={chartOptions} />
            </div>
          </div>

          {/* Session Type Revenue Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🍩 セッションタイプ別売上内訳</h2>
            <div className="h-80 flex items-center justify-center">
              <Doughnut data={sessionTypeRevenueChartData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* 🆕 TOP3 Trainer Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {revenueData.topPerformers.map((trainer, index) => (
            <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">{trainer.badge.split(' ')[0]}</div>
                <div className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-blue-600">
                  {trainer.badge.split(' ')[1]}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{trainer.name}</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-blue-600">¥{trainer.revenue.toLocaleString()}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-900">月次売上</span>
                  <span className="font-semibold text-gray-900">ランキング {index + 1}位</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trainer Performance Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">👥 トレーナー別パフォーマンス</h2>
          <div className="h-96">
            <Bar data={trainerPerformanceChartData} options={chartOptions} />
          </div>
        </div>

        {/* Trainer Performance Table */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">トレーナー詳細レポート</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    トレーナー名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    セッション数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    売上
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    効率性スコア
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    月次成長率
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    得意分野
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    稼働率
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    評価
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenueData.trainerPerformance.map((trainer, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 font-semibold">{trainer.name.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{trainer.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trainer.sessions} 件
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ¥{trainer.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{trainer.efficiencyScore.toLocaleString()} /件
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${
                        trainer.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trainer.monthlyGrowth >= 0 ? '↑' : '↓'} {Math.abs(trainer.monthlyGrowth).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {trainer.speciality}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              trainer.utilizationRate >= 80
                                ? 'bg-green-500'
                                : trainer.utilizationRate >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${trainer.utilizationRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{trainer.utilizationRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          trainer.utilizationRate >= 80
                            ? 'bg-green-100 text-green-800'
                            : trainer.utilizationRate >= 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {trainer.utilizationRate >= 80 ? '優秀' : trainer.utilizationRate >= 60 ? '良好' : '要改善'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
