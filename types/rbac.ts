// RBAC (Role-Based Access Control) Type Definitions
// Phase 2: 権限管理システム

/**
 * ユーザーロール定義
 */
export type UserRole =
  | 'owner'       // オーナー - 全権限
  | 'manager'     // マネージャー - 経営管理権限
  | 'trainer'     // トレーナー - セッション管理権限
  | 'staff';      // スタッフ - 基本権限のみ

/**
 * 権限リソース定義
 */
export type ResourceType =
  | 'members'           // 会員管理
  | 'sessions'          // セッション管理
  | 'revenue'           // 売上分析
  | 'analytics'         // アナリティクス
  | 'export'            // データエクスポート
  | 'accounting'        // 会計連携
  | 'settings'          // 設定管理
  | 'users'             // ユーザー管理
  | 'permissions';      // 権限管理

/**
 * 操作権限定義
 */
export type Permission =
  | 'read'              // 閲覧
  | 'create'            // 作成
  | 'update'            // 更新
  | 'delete'            // 削除
  | 'export'            // エクスポート
  | 'manage';           // 完全管理

/**
 * 権限マトリクス型
 */
export type PermissionMatrix = {
  [role in UserRole]: {
    [resource in ResourceType]: Permission[];
  };
};

/**
 * RBAC権限マトリクス定義
 */
export const PERMISSION_MATRIX: PermissionMatrix = {
  owner: {
    members: ['read', 'create', 'update', 'delete', 'export', 'manage'],
    sessions: ['read', 'create', 'update', 'delete', 'export', 'manage'],
    revenue: ['read', 'export', 'manage'],
    analytics: ['read', 'export', 'manage'],
    export: ['read', 'export', 'manage'],
    accounting: ['read', 'create', 'update', 'delete', 'manage'],
    settings: ['read', 'update', 'manage'],
    users: ['read', 'create', 'update', 'delete', 'manage'],
    permissions: ['read', 'update', 'manage'],
  },
  manager: {
    members: ['read', 'create', 'update', 'export'],
    sessions: ['read', 'create', 'update', 'export'],
    revenue: ['read', 'export'],
    analytics: ['read', 'export'],
    export: ['read', 'export'],
    accounting: ['read', 'create'],
    settings: ['read'],
    users: ['read'],
    permissions: [],
  },
  trainer: {
    members: ['read'],
    sessions: ['read', 'create', 'update'],
    revenue: ['read'],
    analytics: [],
    export: [],
    accounting: [],
    settings: ['read'],
    users: [],
    permissions: [],
  },
  staff: {
    members: ['read'],
    sessions: ['read'],
    revenue: [],
    analytics: [],
    export: [],
    accounting: [],
    settings: ['read'],
    users: [],
    permissions: [],
  },
};

/**
 * ロール日本語ラベル
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'オーナー',
  manager: 'マネージャー',
  trainer: 'トレーナー',
  staff: 'スタッフ',
};

/**
 * リソース日本語ラベル
 */
export const RESOURCE_LABELS: Record<ResourceType, string> = {
  members: '会員管理',
  sessions: 'セッション管理',
  revenue: '売上分析',
  analytics: 'アナリティクス',
  export: 'データエクスポート',
  accounting: '会計連携',
  settings: '設定管理',
  users: 'ユーザー管理',
  permissions: '権限管理',
};

/**
 * 権限日本語ラベル
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  read: '閲覧',
  create: '作成',
  update: '更新',
  delete: '削除',
  export: 'エクスポート',
  manage: '完全管理',
};

/**
 * ロール説明
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  owner: 'ジムオーナー - 全機能へのフルアクセス権限',
  manager: 'マネージャー - 経営管理と日常業務の実行権限',
  trainer: 'トレーナー - セッション管理と会員情報閲覧権限',
  staff: 'スタッフ - 基本的な閲覧権限のみ',
};

/**
 * ユーザー情報型
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: Date;
  lastLogin?: Date;
}

/**
 * 権限チェック結果型
 */
export interface PermissionCheck {
  granted: boolean;
  reason?: string;
}
