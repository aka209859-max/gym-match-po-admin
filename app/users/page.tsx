'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/rbac';
import { UserRole } from '@/types/rbac';

// Firebase imports
import { auth, db, COLLECTIONS } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  deleteUser as deleteAuthUser
} from 'firebase/auth';

// User interface
interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  gymId: string;
  gymName: string;
  createdAt: Date;
  isActive: boolean;
}

export default function UsersPage() {
  const { gymId, gymName, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    role: 'staff' as UserRole,
  });
  
  // Delete confirmation
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  
  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  // Fetch users from Firestore
  useEffect(() => {
    if (gymId) {
      fetchUsers();
    }
  }, [gymId]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const usersRef = collection(db, COLLECTIONS.USERS);
      const usersQuery = query(usersRef, where('gymId', '==', gymId));
      const usersSnapshot = await getDocs(usersQuery);
      
      const usersData: User[] = [];
      usersSnapshot.forEach((userDoc) => {
        const data = userDoc.data();
        usersData.push({
          id: userDoc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          role: data.role || 'staff',
          gymId: data.gymId || '',
          gymName: data.gymName || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          isActive: data.isActive !== false,
        });
      });
      
      // Sort by creation date (newest first)
      usersData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setUsers(usersData);
    } catch (err: any) {
      console.error('❌ Error fetching users:', err);
      setError('ユーザーの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new user
  const handleCreateUser = async () => {
    try {
      setError('');
      
      // Validation
      if (!formData.email || !formData.displayName || !formData.password) {
        setError('すべての項目を入力してください。');
        return;
      }
      
      if (formData.password.length < 6) {
        setError('パスワードは6文字以上で入力してください。');
        return;
      }
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      const newUser = userCredential.user;
      
      // Create Firestore document
      await addDoc(collection(db, COLLECTIONS.USERS), {
        uid: newUser.uid,
        email: formData.email,
        displayName: formData.displayName,
        role: formData.role,
        gymId: gymId,
        gymName: gymName,
        createdAt: serverTimestamp(),
        isActive: true,
      });
      
      // Refresh user list
      await fetchUsers();
      
      // Close modal and reset form
      setIsModalOpen(false);
      resetForm();
      
      alert('ユーザーを作成しました！');
    } catch (err: any) {
      console.error('❌ Error creating user:', err);
      
      let errorMessage = 'ユーザーの作成に失敗しました。';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'このメールアドレスは既に使用されています。';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'メールアドレスの形式が正しくありません。';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'パスワードが弱すぎます。6文字以上で入力してください。';
      }
      
      setError(errorMessage);
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      setError('');
      
      const userRef = doc(db, COLLECTIONS.USERS, selectedUser.id);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        role: formData.role,
      });
      
      // Refresh user list
      await fetchUsers();
      
      // Close modal and reset form
      setIsModalOpen(false);
      setIsEditMode(false);
      setSelectedUser(null);
      resetForm();
      
      alert('ユーザー情報を更新しました！');
    } catch (err: any) {
      console.error('❌ Error updating user:', err);
      setError('ユーザー情報の更新に失敗しました。');
    }
  };

  // Delete user
  const handleDeleteUser = async (user: User) => {
    try {
      setError('');
      
      // Delete Firestore document
      const userRef = doc(db, COLLECTIONS.USERS, user.id);
      await deleteDoc(userRef);
      
      // Note: Firebase Auth user deletion requires re-authentication
      // For now, we just delete the Firestore document
      
      // Refresh user list
      await fetchUsers();
      
      setDeleteConfirmUser(null);
      alert('ユーザーを削除しました。');
    } catch (err: any) {
      console.error('❌ Error deleting user:', err);
      setError('ユーザーの削除に失敗しました。');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      email: '',
      displayName: '',
      password: '',
      role: 'staff',
    });
    setError('');
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setIsEditMode(false);
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (user: User) => {
    setFormData({
      email: user.email,
      displayName: user.displayName,
      password: '',
      role: user.role,
    });
    setIsEditMode(true);
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Role badge color
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'trainer': return 'bg-green-100 text-green-800';
      case 'staff': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Role display name
  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'オーナー';
      case 'manager': return 'マネージャー';
      case 'trainer': return 'トレーナー';
      case 'staff': return 'スタッフ';
      default: return role;
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 pt-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
            <p className="text-gray-900 mt-1">スタッフ・トレーナーの登録と権限管理</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + 新規ユーザー追加
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="名前またはメールアドレスで検索"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ロールフィルター
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="owner">オーナー</option>
                <option value="manager">マネージャー</option>
                <option value="trainer">トレーナー</option>
                <option value="staff">スタッフ</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-900 mt-4">読み込み中...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-900">
              ユーザーが見つかりません。
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ロール
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{u.displayName}</div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(u.role)}`}>
                        {getRoleDisplayName(u.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.createdAt.toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.isActive ? 'アクティブ' : '無効'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(u)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => setDeleteConfirmUser(u)}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* User count */}
        <div className="mt-4 text-sm text-gray-900">
          全{filteredUsers.length}件のユーザー
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isEditMode ? 'ユーザー編集' : '新規ユーザー追加'}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isEditMode}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  表示名 *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="山田太郎"
                />
              </div>

              {!isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    パスワード *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="6文字以上"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ロール *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="staff">スタッフ</option>
                  <option value="trainer">トレーナー</option>
                  <option value="manager">マネージャー</option>
                  <option value="owner">オーナー</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditMode(false);
                  setSelectedUser(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                キャンセル
              </button>
              <button
                onClick={isEditMode ? handleUpdateUser : handleCreateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {isEditMode ? '更新' : '作成'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">ユーザー削除確認</h2>
            <p className="text-gray-700 mb-6">
              <strong>{deleteConfirmUser.displayName}</strong> を削除してもよろしいですか？
              <br />
              <span className="text-sm text-gray-500">この操作は取り消せません。</span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmUser)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
