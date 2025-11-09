'use client';

// 売上分配計算画面
// Phase 2: Revenue Distribution機能

import { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  CompensationType,
  TrainerCompensation,
  CompensationTier,
  DEFAULT_COMPENSATION_TIERS,
  COMPENSATION_TYPE_LABELS,
} from '@/types/revenue';
import {
  calculateTrainerDistribution,
  calculateRevenueDistribution,
  simulateCompensation,
  generateTrainerRanking,
} from '@/lib/revenue';

// サンプルデータ
const SAMPLE_TRAINERS = [
  {
    id: 'trainer_001',
    name: '山田太郎',
    revenue: 1200000,
    sessions: { total: 48, completed: 45, canceled: 3 },
    compensation: {
      trainerId: 'trainer_001',
      trainerName: '山田太郎',
      type: 'tiered' as CompensationType,
      tiers: DEFAULT_COMPENSATION_TIERS,
      effectiveFrom: new Date('2024-01-01'),
    },
  },
  {
    id: 'trainer_002',
    name: '佐藤花子',
    revenue: 850000,
    sessions: { total: 34, completed: 32, canceled: 2 },
    compensation: {
      trainerId: 'trainer_002',
      trainerName: '佐藤花子',
      type: 'percentage' as CompensationType,
      percentage: 45,
      effectiveFrom: new Date('2024-01-01'),
    },
  },
  {
    id: 'trainer_003',
    name: '鈴木一郎',
    revenue: 560000,
    sessions: { total: 28, completed: 26, canceled: 2 },
    compensation: {
      trainerId: 'trainer_003',
      trainerName: '鈴木一郎',
      type: 'fixed' as CompensationType,
      fixedAmount: 20000,
      effectiveFrom: new Date('2024-01-01'),
    },
  },
];

export default function RevenueDistributionPage() {
  const [period] = useState({
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  });

  const [expenses] = useState({
    rent: 300000,
    utilities: 80000,
    maintenance: 50000,
    other: 70000,
  });

  // トレーナー別分配計算
  const trainerDistributions = useMemo(() => {
    return SAMPLE_TRAINERS.map((trainer) =>
      calculateTrainerDistribution(
        trainer.id,
        trainer.name,
        trainer.revenue,
        trainer.sessions,
        trainer.compensation
      )
    );
  }, []);

  // 売上分配計算
  const revenueDistribution = useMemo(() => {
    return calculateRevenueDistribution(
      period,
      trainerDistributions,
      expenses
    );
  }, [period, trainerDistributions, expenses]);

  // ランキング生成
  const rankedTrainers = useMemo(() => {
    return generateTrainerRanking(trainerDistributions, 'revenue');
  }, [trainerDistributions]);

  return (
    <AdminLayout>
      <div className="p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">売上分配計算</h1>
          <p className="mt-2 text-gray-600">
            期間: {period.startDate.toLocaleDateString('ja-JP')} 〜{' '}
            {period.endDate.toLocaleDateString('ja-JP')}
          </p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総売上</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ¥{revenueDistribution.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  トレーナー報酬合計
                </p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  ¥
                  {trainerDistributions
                    .reduce((sum, d) => sum + d.compensation, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  ジム収益
                </p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  ¥{revenueDistribution.gymRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ({revenueDistribution.gymPercentage.toFixed(1)}%)
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🏋️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">純利益</p>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    (revenueDistribution.netProfit || 0) >= 0
                      ? 'text-blue-600'
                      : 'text-red-600'
                  }`}
                >
                  ¥{(revenueDistribution.netProfit || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* トレーナー別分配テーブル */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold text-gray-800">
              トレーナー別売上分配
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    順位
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    トレーナー名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    セッション数
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    総売上
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    報酬方式
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    報酬額
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    報酬率
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rankedTrainers.map((trainer, index) => (
                  <tr key={trainer.trainerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {trainer.trainerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {trainer.completedSessions} / {trainer.totalSessions}
                      </div>
                      <div className="text-xs text-gray-500">
                        完了率:{' '}
                        {(
                          (trainer.completedSessions / trainer.totalSessions) *
                          100
                        ).toFixed(0)}
                        %
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        ¥{trainer.grossRevenue.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {COMPENSATION_TYPE_LABELS[
                          trainer.calculationDetails.type
                        ]}
                      </span>
                      {trainer.calculationDetails.appliedRate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {trainer.calculationDetails.appliedRate}%
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-green-600">
                        ¥{trainer.compensation.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {trainer.compensationPercentage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {trainer.paymentStatus === 'pending' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          未払い
                        </span>
                      )}
                      {trainer.paymentStatus === 'processed' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          処理中
                        </span>
                      )}
                      {trainer.paymentStatus === 'paid' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          支払済
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 経費内訳 */}
        {revenueDistribution.expenses && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">経費内訳</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">賃料</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  ¥{revenueDistribution.expenses.rent?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">光熱費</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  ¥{revenueDistribution.expenses.utilities?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">メンテナンス</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  ¥{revenueDistribution.expenses.maintenance?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">その他</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  ¥{revenueDistribution.expenses.other?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-center bg-gray-50 rounded p-2">
                <p className="text-sm text-gray-600 font-medium">合計</p>
                <p className="text-lg font-bold text-red-600 mt-1">
                  ¥{revenueDistribution.expenses.total.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
