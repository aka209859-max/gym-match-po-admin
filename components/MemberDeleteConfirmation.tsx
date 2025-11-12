'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { Member } from '@/types/member';

interface MemberDeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: Member;
}

export default function MemberDeleteConfirmation({
  isOpen,
  onClose,
  onSuccess,
  member,
}: MemberDeleteConfirmationProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const requiredText = 'DELETE';

  const handleDelete = async () => {
    if (confirmText !== requiredText) {
      setError(`"${requiredText}"と入力してください`);
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      // Delete member document from Firestore
      const memberRef = doc(db, 'members', member.id);
      await deleteDoc(memberRef);

      console.log('✅ 会員削除成功:', member.id);
      
      // Success callback
      onSuccess();
      onClose();
      
      // Reset form
      setConfirmText('');
      
    } catch (err) {
      console.error('❌ 会員削除エラー:', err);
      setError('会員の削除に失敗しました。もう一度お試しください。');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setError(null);
      setConfirmText('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">⚠️ 会員削除確認</h2>
          <p className="text-red-100 text-sm mt-1">この操作は取り消せません</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning Message */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">🚨</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  以下の会員を完全に削除しますか？
                </h3>
                <div className="mt-2 text-sm text-red-700 space-y-1">
                  <p><strong>会員名:</strong> {member.name}</p>
                  <p><strong>メール:</strong> {member.email}</p>
                  <p><strong>電話:</strong> {member.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Consequences */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-900 mb-2">⚡ 削除の影響</h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>会員情報が完全に削除されます</li>
              <li>過去のセッション履歴は保持されます</li>
              <li>決済履歴は保持されます</li>
              <li>この操作は取り消せません</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center">
                <span className="text-red-800 font-medium">⚠️ {error}</span>
              </div>
            </div>
          )}

          {/* Confirmation Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              確認のため "<span className="font-bold text-red-600">{requiredText}</span>" と入力してください
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETEと入力"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={isDeleting}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== requiredText}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isDeleting ? '削除中...' : '🗑️ 削除する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
