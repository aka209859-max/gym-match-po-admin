// Revenue Distribution Calculation Utilities
// Phase 2: 売上分配計算ロジック

import {
  CompensationType,
  CompensationTier,
  TrainerCompensation,
  TrainerDistribution,
  RevenueDistribution,
  DEFAULT_COMPENSATION_TIERS,
} from '@/types/revenue';

/**
 * トレーナー報酬計算（メイン関数）
 */
export function calculateTrainerCompensation(
  grossRevenue: number,
  compensation: TrainerCompensation,
  sessions: { completed: number; canceled: number }
): number {
  switch (compensation.type) {
    case 'fixed':
      return calculateFixedCompensation(
        sessions.completed,
        compensation.fixedAmount || 0
      );

    case 'percentage':
      return calculatePercentageCompensation(
        grossRevenue,
        compensation.percentage || 0
      );

    case 'tiered':
      return calculateTieredCompensation(
        grossRevenue,
        compensation.tiers || DEFAULT_COMPENSATION_TIERS
      );

    default:
      return 0;
  }
}

/**
 * 固定報酬計算
 * セッション数 × 固定単価
 */
function calculateFixedCompensation(
  completedSessions: number,
  fixedAmount: number
): number {
  return completedSessions * fixedAmount;
}

/**
 * パーセンテージ報酬計算
 * 総売上 × パーセンテージ
 */
function calculatePercentageCompensation(
  grossRevenue: number,
  percentage: number
): number {
  return Math.round(grossRevenue * (percentage / 100));
}

/**
 * 段階的報酬計算
 * 売上閾値に応じてパーセンテージが変動
 */
function calculateTieredCompensation(
  grossRevenue: number,
  tiers: CompensationTier[]
): number {
  // 売上閾値の降順でソート
  const sortedTiers = [...tiers].sort(
    (a, b) => b.revenueThreshold - a.revenueThreshold
  );

  // 適用される段階を見つける
  const applicableTier = sortedTiers.find(
    (tier) => grossRevenue >= tier.revenueThreshold
  );

  if (!applicableTier) {
    return 0;
  }

  return Math.round(grossRevenue * (applicableTier.percentage / 100));
}

/**
 * 適用される段階を取得
 */
export function getApplicableTier(
  revenue: number,
  tiers: CompensationTier[]
): CompensationTier | undefined {
  const sortedTiers = [...tiers].sort(
    (a, b) => b.revenueThreshold - a.revenueThreshold
  );

  return sortedTiers.find((tier) => revenue >= tier.revenueThreshold);
}

/**
 * トレーナー別分配計算
 */
export function calculateTrainerDistribution(
  trainerId: string,
  trainerName: string,
  grossRevenue: number,
  sessions: {
    total: number;
    completed: number;
    canceled: number;
  },
  compensation: TrainerCompensation
): TrainerDistribution {
  const compensationAmount = calculateTrainerCompensation(
    grossRevenue,
    compensation,
    sessions
  );

  const compensationPercentage =
    grossRevenue > 0 ? (compensationAmount / grossRevenue) * 100 : 0;

  // 適用された段階を取得
  let appliedTier: CompensationTier | undefined;
  if (compensation.type === 'tiered' && compensation.tiers) {
    appliedTier = getApplicableTier(grossRevenue, compensation.tiers);
  }

  return {
    trainerId,
    trainerName,
    totalSessions: sessions.total,
    completedSessions: sessions.completed,
    canceledSessions: sessions.canceled,
    grossRevenue,
    compensation: compensationAmount,
    compensationPercentage: Math.round(compensationPercentage * 10) / 10,
    calculationDetails: {
      type: compensation.type,
      appliedRate:
        compensation.type === 'percentage'
          ? compensation.percentage
          : appliedTier?.percentage,
      appliedTier,
      bonuses: [],
    },
    paymentStatus: 'pending',
  };
}

/**
 * 期間全体の売上分配計算
 */
export function calculateRevenueDistribution(
  period: { startDate: Date; endDate: Date },
  trainerDistributions: TrainerDistribution[],
  expenses?: {
    rent?: number;
    utilities?: number;
    maintenance?: number;
    other?: number;
  }
): RevenueDistribution {
  // 総売上計算
  const totalRevenue = trainerDistributions.reduce(
    (sum, dist) => sum + dist.grossRevenue,
    0
  );

  // トレーナー報酬合計
  const totalCompensation = trainerDistributions.reduce(
    (sum, dist) => sum + dist.compensation,
    0
  );

  // ジム取り分
  const gymRevenue = totalRevenue - totalCompensation;
  const gymPercentage =
    totalRevenue > 0 ? (gymRevenue / totalRevenue) * 100 : 0;

  // 経費合計
  let totalExpenses = 0;
  if (expenses) {
    totalExpenses =
      (expenses.rent || 0) +
      (expenses.utilities || 0) +
      (expenses.maintenance || 0) +
      (expenses.other || 0);
  }

  // 純利益
  const netProfit = gymRevenue - totalExpenses;

  return {
    period,
    totalRevenue,
    trainerDistributions,
    gymRevenue,
    gymPercentage: Math.round(gymPercentage * 10) / 10,
    expenses: expenses
      ? {
          ...expenses,
          total: totalExpenses,
        }
      : undefined,
    netProfit,
  };
}

/**
 * 報酬率のシミュレーション
 * 売上額に応じた報酬をシミュレート
 */
export function simulateCompensation(
  revenueRange: { min: number; max: number; step: number },
  compensation: TrainerCompensation
): Array<{ revenue: number; compensation: number; percentage: number }> {
  const results: Array<{
    revenue: number;
    compensation: number;
    percentage: number;
  }> = [];

  for (
    let revenue = revenueRange.min;
    revenue <= revenueRange.max;
    revenue += revenueRange.step
  ) {
    const comp = calculateTrainerCompensation(revenue, compensation, {
      completed: 1,
      canceled: 0,
    });
    const percentage = (comp / revenue) * 100;

    results.push({
      revenue,
      compensation: comp,
      percentage: Math.round(percentage * 10) / 10,
    });
  }

  return results;
}

/**
 * 最低保証額チェック
 */
export function applyMinimumGuarantee(
  calculatedCompensation: number,
  minimumGuarantee?: number
): number {
  if (!minimumGuarantee) {
    return calculatedCompensation;
  }

  return Math.max(calculatedCompensation, minimumGuarantee);
}

/**
 * 報酬比較分析
 * 異なる報酬設定での比較
 */
export function compareCompensationPlans(
  grossRevenue: number,
  plans: Array<{ name: string; compensation: TrainerCompensation }>
): Array<{
  name: string;
  compensation: number;
  percentage: number;
  difference: number;
}> {
  const results = plans.map((plan) => {
    const comp = calculateTrainerCompensation(grossRevenue, plan.compensation, {
      completed: 1,
      canceled: 0,
    });
    const percentage = (comp / grossRevenue) * 100;

    return {
      name: plan.name,
      compensation: comp,
      percentage: Math.round(percentage * 10) / 10,
      difference: 0,
    };
  });

  // 基準プラン（最初のプラン）との差分を計算
  if (results.length > 0) {
    const baseCompensation = results[0].compensation;
    results.forEach((result) => {
      result.difference = result.compensation - baseCompensation;
    });
  }

  return results;
}

/**
 * 月次売上目標達成率計算
 */
export function calculateTargetAchievement(
  actualRevenue: number,
  targetRevenue: number
): {
  achievementRate: number;
  difference: number;
  status: 'exceeded' | 'achieved' | 'below';
} {
  const achievementRate = (actualRevenue / targetRevenue) * 100;
  const difference = actualRevenue - targetRevenue;

  let status: 'exceeded' | 'achieved' | 'below';
  if (achievementRate >= 100) {
    status = 'exceeded';
  } else if (achievementRate >= 80) {
    status = 'achieved';
  } else {
    status = 'below';
  }

  return {
    achievementRate: Math.round(achievementRate * 10) / 10,
    difference,
    status,
  };
}

/**
 * トレーナーランキング生成
 */
export function generateTrainerRanking(
  distributions: TrainerDistribution[],
  sortBy: 'revenue' | 'sessions' | 'compensation' = 'revenue'
): TrainerDistribution[] {
  const sorted = [...distributions].sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
        return b.grossRevenue - a.grossRevenue;
      case 'sessions':
        return b.completedSessions - a.completedSessions;
      case 'compensation':
        return b.compensation - a.compensation;
      default:
        return 0;
    }
  });

  return sorted;
}
