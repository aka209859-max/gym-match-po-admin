'use client';

import { useState, useEffect } from 'react';
import { Member } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface MemberEditModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MemberEditModal({
  member,
  isOpen,
  onClose,
  onSuccess,
}: MemberEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contractType: 'monthly' as 'monthly' | 'session',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        email: member.email || '',
        phone: member.phone || '',
        contractType: member.contractType as 'monthly' | 'session',
      });
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setIsSaving(true);
    setError(null);

    try {
      // Firestore更新
      const memberRef = doc(db, 'users', member.id);
      await updateDoc(memberRef, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        contractType: formData.contractType,
      });

      console.log('✅ 会員情報更新成功:', member.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ 会員情報更新エラー:', err);
      setError('会員情報の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <>
      {/* モーダル背景 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* モーダルコンテンツ */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">会員情報編集</h2>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition"
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* フォーム */}
            <form onSubmit={handleSubmit} className="p-8">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                {/* 会員名 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    会員名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                {/* メールアドレス */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>

                {/* 電話番号 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>

                {/* 契約タイプ */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    契約タイプ <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="contractType"
                        value="monthly"
                        checked={formData.contractType === 'monthly'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contractType: e.target.value as 'monthly' | 'session',
                          })
                        }
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-900">月額会員</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="contractType"
                        value="session"
                        checked={formData.contractType === 'session'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contractType: e.target.value as 'monthly' | 'session',
                          })
                        }
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-900">セッション会員</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* フッター */}
              <div className="mt-8 flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
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
                      <span>保存中...</span>
                    </>
                  ) : (
                    <span>保存</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
