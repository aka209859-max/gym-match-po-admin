// MFCloud API Type Definitions
// Phase 2: MFCloud会計ソフト連携

/**
 * MFCloud OAuth2.0認証情報
 */
export interface MFCloudAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
  state?: string;
}

/**
 * MFCloud アクセストークン
 */
export interface MFCloudToken {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  expiresAt: Date;
  scope: string[];
}

/**
 * MFCloud 会社情報
 */
export interface MFCloudCompany {
  id: string;
  name: string;
  taxType: 'inclusive' | 'exclusive';
  fiscalYearEnd: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MFCloud 仕訳タイプ
 */
export type MFCloudDealType =
  | 'income'        // 収入
  | 'expense';      // 支出

/**
 * MFCloud 仕訳ステータス
 */
export type MFCloudDealStatus =
  | 'settled'       // 決済済み
  | 'unsettled';    // 未決済

/**
 * MFCloud 勘定科目
 */
export interface MFCloudAccount {
  code: string;
  name: string;
  category: string;
  subCategory?: string;
}

/**
 * MFCloud 仕訳エントリー
 */
export interface MFCloudDeal {
  id?: string;
  companyId: string;
  issueDate: string;          // YYYY-MM-DD形式
  dueDate?: string;           // YYYY-MM-DD形式
  dealType: MFCloudDealType;
  amount: number;
  taxAmount: number;
  status: MFCloudDealStatus;
  
  // 借方
  debitAccount: {
    code: string;
    name: string;
    subAccountCode?: string;
  };
  
  // 貸方
  creditAccount: {
    code: string;
    name: string;
    subAccountCode?: string;
  };
  
  // 摘要
  description: string;
  
  // タグ
  tags?: string[];
  
  // 関連セッションID（GYM MATCH独自）
  sessionId?: string;
  trainerId?: string;
  memberId?: string;
}

/**
 * MFCloud 仕訳作成リクエスト
 */
export interface MFCloudDealRequest {
  companyId: string;
  issueDate: string;
  dueDate?: string;
  dealType: MFCloudDealType;
  amount: number;
  taxRate?: number;
  debitAccountCode: string;
  creditAccountCode: string;
  description: string;
  tags?: string[];
  sessionId?: string;
}

/**
 * MFCloud API レスポンス
 */
export interface MFCloudApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * MFCloud 認証状態
 */
export interface MFCloudAuthState {
  isAuthenticated: boolean;
  token?: MFCloudToken;
  company?: MFCloudCompany;
  lastSync?: Date;
  error?: string;
}

/**
 * MFCloud 仕訳同期設定
 */
export interface MFCloudSyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: 'realtime' | 'hourly' | 'daily' | 'manual';
  
  // 自動仕訳作成設定
  autoCreateDeals: boolean;
  
  // デフォルト勘定科目マッピング
  defaultAccounts: {
    sessionRevenue: string;      // セッション売上
    trainerCompensation: string; // トレーナー報酬
    gymRevenue: string;          // ジム収益
  };
  
  // タグ設定
  defaultTags: string[];
}

/**
 * MFCloud エンドポイント定義
 */
export const MFCLOUD_ENDPOINTS = {
  oauth: {
    authorize: 'https://invoice.moneyforward.com/oauth/authorize',
    token: 'https://invoice.moneyforward.com/oauth/token',
  },
  api: {
    base: 'https://invoice.moneyforward.com/api/v1',
    companies: '/companies',
    deals: '/deals',
    accounts: '/accounts',
  },
} as const;

/**
 * MFCloud OAuth スコープ定義
 */
export const MFCLOUD_SCOPES = [
  'read',
  'write',
] as const;

/**
 * デフォルト勘定科目マッピング
 */
export const DEFAULT_ACCOUNT_MAPPING: Record<string, MFCloudAccount> = {
  sessionRevenue: {
    code: '400',
    name: '売上高',
    category: '収益',
    subCategory: 'セッション売上',
  },
  trainerCompensation: {
    code: '600',
    name: '外注費',
    category: '費用',
    subCategory: 'トレーナー報酬',
  },
  gymRevenue: {
    code: '400',
    name: '売上高',
    category: '収益',
    subCategory: 'ジム収益',
  },
  cash: {
    code: '101',
    name: '現金',
    category: '資産',
  },
  deposit: {
    code: '102',
    name: '普通預金',
    category: '資産',
  },
};

/**
 * MFCloud エラーコード
 */
export enum MFCloudErrorCode {
  UNAUTHORIZED = 'unauthorized',
  TOKEN_EXPIRED = 'token_expired',
  INVALID_REQUEST = 'invalid_request',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SERVER_ERROR = 'server_error',
}

/**
 * MFCloud エラーメッセージ
 */
export const MFCLOUD_ERROR_MESSAGES: Record<MFCloudErrorCode, string> = {
  [MFCloudErrorCode.UNAUTHORIZED]: '認証に失敗しました。再度ログインしてください。',
  [MFCloudErrorCode.TOKEN_EXPIRED]: 'アクセストークンの有効期限が切れています。',
  [MFCloudErrorCode.INVALID_REQUEST]: 'リクエストが無効です。入力内容を確認してください。',
  [MFCloudErrorCode.RATE_LIMIT_EXCEEDED]: 'APIリクエスト制限に達しました。しばらく待ってから再試行してください。',
  [MFCloudErrorCode.SERVER_ERROR]: 'MFCloudサーバーエラーが発生しました。',
};
