// Revenue Distribution Type Definitions
// Phase 2: 売上分配計算システム

/**
 * 報酬計算方式
 */
export type CompensationType =
  | 'fixed'           // 固定報酬
  | 'percentage'      // パーセンテージ報酬
  | 'tiered';         // 段階的報酬（売上に応じて変動）

/**
 * トレーナー報酬設定
 */
export interface TrainerCompensation {
  trainerId: string;
  trainerName: string;
  type: CompensationType;
  
  // 固定報酬の場合
  fixedAmount?: number;
  
  // パーセンテージ報酬の場合
  percentage?: number;
  
  // 段階的報酬の場合
  tiers?: CompensationTier[];
  
  // 最低保証額
  minimumGuarantee?: number;
  
  // 有効期間
  effectiveFrom: Date;
  effectiveTo?: Date;
}

/**
 * 段階的報酬設定
 */
export interface CompensationTier {
  revenueThreshold: number;   // 売上閾値
  percentage: number;          // 適用パーセンテージ
}

/**
 * 売上分配計算結果
 */
export interface RevenueDistribution {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalRevenue: number;
  
  // トレーナー別分配
  trainerDistributions: TrainerDistribution[];
  
  // ジム取り分
  gymRevenue: number;
  gymPercentage: number;
  
  // 経費
  expenses?: {
    rent?: number;
    utilities?: number;
    maintenance?: number;
    other?: number;
    total: number;
  };
  
  // 純利益
  netProfit?: number;
}

/**
 * トレーナー別分配
 */
export interface TrainerDistribution {
  trainerId: string;
  trainerName: string;
  
  // セッション情報
  totalSessions: number;
  completedSessions: number;
  canceledSessions: number;
  
  // 売上情報
  grossRevenue: number;        // 総売上
  compensation: number;        // トレーナー報酬
  compensationPercentage: number;  // 報酬率
  
  // 計算詳細
  calculationDetails: {
    type: CompensationType;
    appliedRate?: number;
    appliedTier?: CompensationTier;
    bonuses?: CompensationBonus[];
  };
  
  // ステータス
  paymentStatus: 'pending' | 'processed' | 'paid';
  paymentDate?: Date;
}

/**
 * ボーナス情報
 */
export interface CompensationBonus {
  type: 'performance' | 'referral' | 'retention' | 'other';
  amount: number;
  reason: string;
}

/**
 * 売上レポート設定
 */
export interface RevenueReportConfig {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate?: Date;
  endDate?: Date;
  includeExpenses: boolean;
  includeTrainerBreakdown: boolean;
  format: 'summary' | 'detailed';
}

/**
 * 売上サマリー
 */
export interface RevenueSummary {
  period: string;
  totalRevenue: number;
  totalCompensation: number;
  gymRevenue: number;
  averageSessionRevenue: number;
  totalSessions: number;
  topTrainer: {
    id: string;
    name: string;
    revenue: number;
  };
  
  // 前期比較
  comparison?: {
    revenueChange: number;
    revenueChangePercentage: number;
    sessionChange: number;
    sessionChangePercentage: number;
  };
}

/**
 * トレーナーパフォーマンス指標
 */
export interface TrainerPerformance {
  trainerId: string;
  trainerName: string;
  
  // セッション指標
  totalSessions: number;
  completionRate: number;        // 完了率
  cancellationRate: number;      // キャンセル率
  averageSessionDuration: number; // 平均セッション時間（分）
  
  // 売上指標
  totalRevenue: number;
  averageSessionRevenue: number;
  revenuePerHour: number;
  
  // 会員指標
  uniqueMembers: number;         // 担当会員数
  memberRetentionRate: number;   // 会員継続率
  memberSatisfactionScore?: number; // 満足度スコア
  
  // ランキング
  revenueRank: number;
  sessionRank: number;
  
  // トレンド
  trend: 'up' | 'down' | 'stable';
}

/**
 * デフォルト報酬設定
 */
export const DEFAULT_COMPENSATION_TIERS: CompensationTier[] = [
  { revenueThreshold: 0, percentage: 40 },       // 0円〜: 40%
  { revenueThreshold: 500000, percentage: 45 },  // 50万円〜: 45%
  { revenueThreshold: 1000000, percentage: 50 }, // 100万円〜: 50%
  { revenueThreshold: 2000000, percentage: 55 }, // 200万円〜: 55%
];

/**
 * 報酬計算方式ラベル
 */
export const COMPENSATION_TYPE_LABELS: Record<CompensationType, string> = {
  fixed: '固定報酬',
  percentage: 'パーセンテージ報酬',
  tiered: '段階的報酬',
};

/**
 * 報酬計算方式説明
 */
export const COMPENSATION_TYPE_DESCRIPTIONS: Record<CompensationType, string> = {
  fixed: 'セッション数に関わらず固定額を支払う',
  percentage: '売上の一定パーセンテージを支払う',
  tiered: '売上に応じて報酬率が変動する（インセンティブ制）',
};
