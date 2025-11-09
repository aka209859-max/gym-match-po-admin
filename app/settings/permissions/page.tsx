'use client';

// 権限管理画面
// Phase 2: RBAC権限マトリクス表示・管理

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  UserRole,
  ResourceType,
  Permission,
  ROLE_LABELS,
  RESOURCE_LABELS,
  PERMISSION_LABELS,
  ROLE_DESCRIPTIONS,
} from '@/types/rbac';
import { generatePermissionMatrixForUI } from '@/lib/rbac';

export default function PermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const permissionMatrix = generatePermissionMatrixForUI();

  return (
    <AdminLayout>
      <div className="p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">権限管理</h1>
          <p className="mt-2 text-gray-600">
            ロールベースアクセス制御（RBAC）権限マトリクス
          </p>
        </div>

        {/* ロール説明カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {(['owner', 'manager', 'trainer', 'staff'] as UserRole[]).map((role) => (
            <div
              key={role}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                selectedRole === role
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setSelectedRole(role)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-800">
                  {ROLE_LABELS[role]}
                </h3>
                {selectedRole === role && (
                  <span className="text-blue-500">✓</span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </div>
          ))}
        </div>

        {/* 権限マトリクステーブル */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold text-gray-800">
              {ROLE_LABELS[selectedRole]} の権限一覧
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    リソース
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    権限
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permissionMatrix.map((row) => {
                  const permissions = row[selectedRole];
                  const hasAccess = permissions.length > 0;

                  return (
                    <tr
                      key={row.resource}
                      className={hasAccess ? '' : 'bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {RESOURCE_LABELS[row.resource]}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {hasAccess ? (
                          <div className="flex flex-wrap gap-2">
                            {permissions.map((permission) => (
                              <span
                                key={permission}
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  getPermissionBadgeColor(permission)
                                }`}
                              >
                                {PERMISSION_LABELS[permission]}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            アクセス権限なし
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 権限マトリクス比較表 */}
        <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold text-gray-800">
              全ロール権限比較表
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-100">
                    リソース
                  </th>
                  {(['owner', 'manager', 'trainer', 'staff'] as UserRole[]).map(
                    (role) => (
                      <th
                        key={role}
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {ROLE_LABELS[role]}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permissionMatrix.map((row) => (
                  <tr key={row.resource}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                      {RESOURCE_LABELS[row.resource]}
                    </td>
                    {(['owner', 'manager', 'trainer', 'staff'] as UserRole[]).map(
                      (role) => {
                        const permissions = row[role];
                        return (
                          <td
                            key={role}
                            className="px-4 py-3 text-center"
                          >
                            {permissions.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {permissions.map((permission) => (
                                  <span
                                    key={permission}
                                    className="text-xs text-gray-600"
                                  >
                                    {PERMISSION_LABELS[permission]}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      }
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                権限変更について
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    権限マトリクスの変更は慎重に行ってください
                  </li>
                  <li>
                    オーナー権限のみが他のユーザーのロールを変更できます
                  </li>
                  <li>
                    権限変更は即座に反映されます
                  </li>
                  <li>
                    セキュリティ上の理由から、すべての権限変更はログに記録されます
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/**
 * 権限バッジの色を取得
 */
function getPermissionBadgeColor(permission: Permission): string {
  switch (permission) {
    case 'read':
      return 'bg-blue-100 text-blue-800';
    case 'create':
      return 'bg-green-100 text-green-800';
    case 'update':
      return 'bg-yellow-100 text-yellow-800';
    case 'delete':
      return 'bg-red-100 text-red-800';
    case 'export':
      return 'bg-purple-100 text-purple-800';
    case 'manage':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
