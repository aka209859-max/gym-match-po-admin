// RBAC Utility Functions
// Phase 2: 権限チェック・管理ユーティリティ

import {
  UserRole,
  ResourceType,
  Permission,
  PERMISSION_MATRIX,
  PermissionCheck,
} from '@/types/rbac';

/**
 * 権限チェック関数
 * 指定されたロールが特定のリソースに対する操作権限を持つかチェック
 */
export function hasPermission(
  role: UserRole,
  resource: ResourceType,
  permission: Permission
): boolean {
  const rolePermissions = PERMISSION_MATRIX[role];
  if (!rolePermissions) {
    return false;
  }

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) {
    return false;
  }

  return resourcePermissions.includes(permission);
}

/**
 * 複数権限チェック（AND条件）
 * 指定されたすべての権限を持つかチェック
 */
export function hasAllPermissions(
  role: UserRole,
  resource: ResourceType,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) =>
    hasPermission(role, resource, permission)
  );
}

/**
 * 複数権限チェック（OR条件）
 * 指定されたいずれかの権限を持つかチェック
 */
export function hasAnyPermission(
  role: UserRole,
  resource: ResourceType,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) =>
    hasPermission(role, resource, permission)
  );
}

/**
 * リソース全権限チェック
 * 指定されたリソースに対するすべての権限を持つかチェック
 */
export function hasFullAccess(role: UserRole, resource: ResourceType): boolean {
  return hasPermission(role, resource, 'manage');
}

/**
 * 読み取り専用チェック
 * 閲覧権限のみを持つかチェック（作成・更新・削除権限なし）
 */
export function isReadOnly(role: UserRole, resource: ResourceType): boolean {
  const rolePermissions = PERMISSION_MATRIX[role][resource];
  return (
    rolePermissions.includes('read') &&
    !rolePermissions.includes('create') &&
    !rolePermissions.includes('update') &&
    !rolePermissions.includes('delete')
  );
}

/**
 * 権限チェック結果取得（詳細版）
 * 権限チェックを実行し、理由付きで結果を返す
 */
export function checkPermission(
  role: UserRole,
  resource: ResourceType,
  permission: Permission
): PermissionCheck {
  const granted = hasPermission(role, resource, permission);

  if (granted) {
    return {
      granted: true,
    };
  }

  return {
    granted: false,
    reason: `${role}ロールは${resource}リソースに対する${permission}権限を持っていません`,
  };
}

/**
 * リソースの利用可能な権限リスト取得
 */
export function getResourcePermissions(
  role: UserRole,
  resource: ResourceType
): Permission[] {
  return PERMISSION_MATRIX[role][resource] || [];
}

/**
 * ロールの利用可能なリソースリスト取得
 */
export function getAccessibleResources(role: UserRole): ResourceType[] {
  const resources: ResourceType[] = [];
  const rolePermissions = PERMISSION_MATRIX[role];

  for (const [resource, permissions] of Object.entries(rolePermissions)) {
    if (permissions.length > 0) {
      resources.push(resource as ResourceType);
    }
  }

  return resources;
}

/**
 * 管理者権限チェック
 * オーナーまたはマネージャーかどうか
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'owner' || role === 'manager';
}

/**
 * スーパーユーザーチェック
 * オーナー権限を持つかどうか
 */
export function isSuperUser(role: UserRole): boolean {
  return role === 'owner';
}

/**
 * ロール比較（権限レベル）
 * role1がrole2より上位かどうか
 */
export function isHigherRole(role1: UserRole, role2: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    owner: 4,
    manager: 3,
    trainer: 2,
    staff: 1,
  };

  return roleHierarchy[role1] > roleHierarchy[role2];
}

/**
 * 最小必要権限チェック
 * 指定された操作に必要な最小権限を持つかチェック
 */
export function meetsMinimumRole(
  userRole: UserRole,
  minimumRole: UserRole
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    owner: 4,
    manager: 3,
    trainer: 2,
    staff: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}

/**
 * 権限マトリクス表示用データ生成
 * 権限管理画面で使用
 */
export function generatePermissionMatrixForUI() {
  const matrix: Array<{
    resource: ResourceType;
    owner: Permission[];
    manager: Permission[];
    trainer: Permission[];
    staff: Permission[];
  }> = [];

  const resources = Object.keys(PERMISSION_MATRIX.owner) as ResourceType[];

  for (const resource of resources) {
    matrix.push({
      resource,
      owner: PERMISSION_MATRIX.owner[resource],
      manager: PERMISSION_MATRIX.manager[resource],
      trainer: PERMISSION_MATRIX.trainer[resource],
      staff: PERMISSION_MATRIX.staff[resource],
    });
  }

  return matrix;
}

/**
 * ユーザーロール昇格可否チェック
 * 指定されたロールに昇格可能かどうか
 */
export function canPromoteToRole(
  currentRole: UserRole,
  targetRole: UserRole,
  requesterRole: UserRole
): PermissionCheck {
  // オーナーのみが他のユーザーを昇格可能
  if (requesterRole !== 'owner') {
    return {
      granted: false,
      reason: 'ロール変更はオーナーのみ実行可能です',
    };
  }

  // オーナーから降格はできない
  if (currentRole === 'owner') {
    return {
      granted: false,
      reason: 'オーナーロールからは変更できません',
    };
  }

  // オーナーへの昇格は特別な手続きが必要
  if (targetRole === 'owner') {
    return {
      granted: false,
      reason: 'オーナーへの昇格は特別な手続きが必要です',
    };
  }

  return {
    granted: true,
  };
}
