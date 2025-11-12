'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface TrainerDeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trainer: Trainer;
}

export default function TrainerDeleteConfirmation({ isOpen, onClose, onSuccess, trainer }: TrainerDeleteConfirmationProps) {
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
      const trainerRef = doc(db, 'trainers', trainer.id);
      await deleteDoc(trainerRef);

      console.log('✅ トレーナー削除成功:', trainer.id);
      onSuccess();
      onClose();
      setConfirmText('');
    } catch (err) {
      console.error('❌ トレーナー削除エラー:', err);
      setError('削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">⚠️ トレーナー削除確認</h2>
          <p className="text-red-100 text-sm mt-1">この操作は取り消せません</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start">
              <span className="text-2xl mr-3">🚨</span>
              <div>
                <h3 className="text-sm font-medium text-red-800">以下のトレーナーを削除しますか？</h3>
                <div className="mt-2 text-sm text-red-700 space-y-1">
                  <p><strong>名前:</strong> {trainer.name}</p>
                  <p><strong>メール:</strong> {trainer.email}</p>
                  <p><strong>電話:</strong> {trainer.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <span className="text-red-800 font-medium">⚠️ {error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              確認のため "<span className="font-bold text-red-600">{requiredText}</span>" と入力してください
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETEと入力"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              disabled={isDeleting}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setConfirmText('');
                setError(null);
                onClose();
              }}
              disabled={isDeleting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== requiredText}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 font-medium"
            >
              {isDeleting ? '削除中...' : '🗑️ 削除する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
