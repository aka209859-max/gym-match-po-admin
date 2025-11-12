'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { fetchKPIData, fetchRecentMembers } from '@/lib/firestore';
import MemberRegistrationModal from '@/components/MemberRegistrationModal';
import SessionBookingModal from '@/components/SessionBookingModal';
import ReportGenerator from '@/components/ReportGenerator';
import EmailSender from '@/components/EmailSender';

interface KPIData {
  totalMembers: number;
  activeMembers: number;
  dormantMembers: number;
  todaySessions: number;
  newMembersThisMonth: number;
  // 新規: 経営KPI
  memberGrowthRate: number;      // 会員成長率 (MoM %)
  sessionUtilizationRate: number; // セッション稼働率 (%)
  averageRevenuePerMember: number; // 会員当たり平均売上 (円)
  churnRate: number;              // 退会率 (%)
  projectedMonthlyRevenue: number; // 今月予測売上 (円)
}

interface Member {
  id: string;
  name: string;
  joinDate: Date;
  isActive: boolean;
}

export default function DashboardPage() {
  const { isAuthenticated, gymId, gymName, user } = useAuth();
  
  // Modal states
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  
  const [kpiData, setKpiData] = useState<KPIData>({
    totalMembers: 0,
    activeMembers: 0,
    dormantMembers: 0,
    todaySessions: 0,
    newMembersThisMonth: 0,
    // 新規: 経営KPI
    memberGrowthRate: 0,
    sessionUtilizationRate: 0,
    averageRevenuePerMember: 0,
    churnRate: 0,
    projectedMonthlyRevenue: 0,
  });
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    // 認証されており、gymIdが取得できている場合のみデータ取得
    if (isAuthenticated && gymId) {
      const loadData = async () => {
        try {
          console.log('📊 ダッシュボードデータ取得開始 - gymId:', gymId);
          setIsLoadingData(true);

          // ✅ 実データ取得（Firestoreから）
          const [kpiResult, membersResult] = await Promise.all([
            fetchKPIData(gymId),
            fetchRecentMembers(gymId),
          ]);

          setKpiData({
            totalMembers: kpiResult.totalMembers,
            activeMembers: kpiResult.activeMembers,
            dormantMembers: kpiResult.dormantMembers,
            todaySessions: kpiResult.todaySessions,
            newMembersThisMonth: kpiResult.newMembersThisMonth,
            // 新規: 経営KPI (デモデータ - 本番はFirestoreから取得)
            memberGrowthRate: kpiResult.memberGrowthRate || 8.5,
            sessionUtilizationRate: kpiResult.sessionUtilizationRate || 78.3,
            averageRevenuePerMember: kpiResult.averageRevenuePerMember || 42500,
            churnRate: kpiResult.churnRate || 3.2,
            projectedMonthlyRevenue: kpiResult.projectedMonthlyRevenue || 4950000,
          });

          setRecentMembers(membersResult);

          console.log('✅ ダッシュボードデータ取得完了', {
            kpi: kpiResult,
            membersCount: membersResult.length,
          });
          setIsLoadingData(false);
        } catch (error) {
          console.error('❌ データ取得エラー:', error);
          setIsLoadingData(false);
        }
      };

      loadData();
    }
  }, [isAuthenticated, gymId]);

  if (isLoadingData) {
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
            <p className="text-gray-900 text-lg">読み込み中...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8 pt-12">
        {/* ページヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-900 mt-2">ジム運営の概要とKPI</p>
        </div>

        {/* ジム情報カード（新規追加） */}
        {gymName && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{gymName}</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    オーナー: {user?.email || 'ユーザー情報なし'}
                  </p>
                  <p className="text-blue-100 text-xs mt-1">
                    ジムID: {gymId || 'ID未設定'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <p className="text-xs text-blue-100">現在のプラン</p>
                  <p className="text-xl font-bold">スタンダード</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPIカード（横並び・5列） */}
        <div className="grid grid-cols-5 gap-6 mb-8">
          {/* 総会員数 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">総会員数</p>
            <p className="text-3xl font-bold text-gray-900">{kpiData.totalMembers}</p>
            <p className="text-xs text-gray-500 mt-2">累計登録会員数</p>
          </div>

          {/* アクティブ会員 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">アクティブ会員</p>
            <p className="text-3xl font-bold text-gray-900">{kpiData.activeMembers}</p>
            <p className="text-xs text-green-600 mt-2">
              {Math.round((kpiData.activeMembers / kpiData.totalMembers) * 100)}% 稼働率
            </p>
          </div>

          {/* 休眠会員 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">休眠会員</p>
            <p className="text-3xl font-bold text-gray-900">{kpiData.dormantMembers}</p>
            <p className="text-xs text-orange-600 mt-2">2週間以上未利用</p>
          </div>

          {/* 本日のセッション */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">本日のセッション</p>
            <p className="text-3xl font-bold text-gray-900">{kpiData.todaySessions}</p>
            <p className="text-xs text-gray-500 mt-2">予定セッション数</p>
          </div>

          {/* 今月の新規会員 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">今月の新規会員</p>
            <p className="text-3xl font-bold text-gray-900">{kpiData.newMembersThisMonth}</p>
            <p className="text-xs text-gray-500 mt-2">今月の新規登録数</p>
          </div>
        </div>

        {/* 📈 経営KPIカード（新規） */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 経営KPIダッシュボード</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* 会員成長率 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-blue-700 mb-1">会員成長率</p>
              <p className="text-3xl font-bold text-blue-900">{kpiData.memberGrowthRate.toFixed(1)}%</p>
              <p className="text-xs text-blue-600 mt-2">前月比 (MoM)</p>
            </div>

            {/* セッション稼働率 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-6 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-green-700 mb-1">セッション稼働率</p>
              <p className="text-3xl font-bold text-green-900">{kpiData.sessionUtilizationRate.toFixed(1)}%</p>
              <p className="text-xs text-green-600 mt-2">実施/予約可能枠</p>
            </div>

            {/* 平均単価 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-purple-700 mb-1">会員当たり平均売上</p>
              <p className="text-3xl font-bold text-purple-900">¥{kpiData.averageRevenuePerMember.toLocaleString()}</p>
              <p className="text-xs text-purple-600 mt-2">1会員あたり/月</p>
            </div>

            {/* 退会率 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm p-6 border border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-orange-700 mb-1">退会率</p>
              <p className="text-3xl font-bold text-orange-900">{kpiData.churnRate.toFixed(1)}%</p>
              <p className="text-xs text-orange-600 mt-2">月次退会率</p>
            </div>

            {/* 今月予測売上 */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-sm p-6 border border-indigo-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-indigo-700 mb-1">今月予測売上</p>
              <p className="text-3xl font-bold text-indigo-900">¥{Math.round(kpiData.projectedMonthlyRevenue / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-indigo-600 mt-2">トレンドベース予測</p>
            </div>
          </div>
        </div>

        {/* 🎯 GYM MATCH Manager の強み（新規追加） */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border-2 border-blue-300">
            <div className="flex items-start gap-4">
              <div className="text-4xl">✨</div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  GYM MATCH Manager の強み
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {/* データエクスポート */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📊</span>
                      <h3 className="font-semibold text-gray-900">無制限エクスポート</h3>
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="text-green-600 font-bold">✅ 全期間データ取得可能</p>
                      <p className="text-gray-900">長期トレンド分析対応</p>
                    </div>
                  </div>

                  {/* トレーナー管理 */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">👥</span>
                      <h3 className="font-semibold text-gray-900">トレーナー管理</h3>
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="text-green-600 font-bold">✅ パフォーマンス分析</p>
                      <p className="text-gray-900">効率性・成長率可視化</p>
                    </div>
                  </div>

                  {/* オールインワン */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🎯</span>
                      <h3 className="font-semibold text-gray-900">オールインワン</h3>
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="text-green-600 font-bold">✅ 会員+売上+会計+PT</p>
                      <p className="text-gray-900">完全統合管理システム</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2カラムレイアウト */}
        <div className="grid grid-cols-2 gap-6">
          {/* 最近の登録会員 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">最近の登録会員</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                すべて表示 →
              </button>
            </div>
            <div className="space-y-4">
              {recentMembers.length > 0 ? (
                recentMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-semibold text-sm">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">
                          登録日: {member.joinDate.toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        member.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {member.isActive ? 'アクティブ' : '休眠'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>会員データが見つかりません</p>
                </div>
              )}
            </div>
          </div>

          {/* クイックアクション */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">クイックアクション</h2>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setIsMemberModalOpen(true)}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
              >
                <svg className="w-8 h-8 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-sm font-semibold text-gray-900">新規会員登録</p>
              </button>
              <button 
                onClick={() => setIsSessionModalOpen(true)}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition text-center"
              >
                <svg className="w-8 h-8 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-semibold text-gray-900">セッション予約</p>
              </button>
              <button 
                onClick={() => setIsReportModalOpen(true)}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-center"
              >
                <svg className="w-8 h-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-semibold text-gray-900">レポート作成</p>
              </button>
              <button 
                onClick={() => setIsEmailModalOpen(true)}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition text-center"
              >
                <svg className="w-8 h-8 text-orange-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-semibold text-gray-900">メール送信</p>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <MemberRegistrationModal 
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSuccess={() => {
          // Refresh members data
          if (gymId) {
            fetchRecentMembers(gymId).then(setRecentMembers);
            fetchKPIData(gymId).then(setKpiData);
          }
        }}
      />
      
      <SessionBookingModal 
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        onSuccess={() => {
          // Refresh KPI data
          if (gymId) {
            fetchKPIData(gymId).then(setKpiData);
          }
        }}
      />
      
      <ReportGenerator 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
      
      <EmailSender 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </AdminLayout>
  );
}
