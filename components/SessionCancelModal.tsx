'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface Session {
  id: string;
  userId: string;
  userName: string;
  date: Date;
  duration: number;
  type: string;
  status: string;
}

interface SessionCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  session: Session;
}

export default function SessionCancelModal({
  isOpen,
  onClose,
  onSuccess,
  session,
}: SessionCancelModalProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setError('キャンセル理由を入力してください');
      return;
    }

    setIsCancelling(true);
    setError(null);

    try {
      // Update session status to cancelled
      const sessionRef = doc(db, 'sessions', session.id);
      await updateDoc(sessionRef, {
        status: 'cancelled',
        cancelReason: cancelReason.trim(),
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ セッションキャンセル成功:', session.id);
      
      // Success callback
      onSuccess();
      onClose();
      
      // Reset form
      setCancelReason('');
      
    } catch (err) {
      console.error('❌ セッションキャンセルエラー:', err);
      setError('セッションのキャンセルに失敗しました。もう一度お試しください。');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleClose = () => {
    if (!isCancelling) {
      setError(null);
      setCancelReason('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">❌ セッションキャンセル</h2>
          <p className="text-red-100 text-sm mt-1">セッションをキャンセルします</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Session Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">キャンセル対象セッション</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>会員名:</strong> {session.userName}</p>
              <p><strong>日時:</strong> {session.date.toLocaleString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}</p>
              <p><strong>種類:</strong> {session.type}</p>
              <p><strong>時間:</strong> {session.duration}分</p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">
                  キャンセルの注意事項
                </h4>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                  <li>キャンセル後は予定から削除されます</li>
                  <li>会員に通知される場合があります</li>
                  <li>キャンセル料が発生する場合があります</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center">
                <span className="text-red-800 font-medium">⚠️ {error}</span>
              </div>
            </div>
          )}

          {/* Cancel Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              キャンセル理由 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="キャンセルの理由を入力してください（例：会員都合、体調不良、施設都合など）"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={isCancelling}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCancelling}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isCancelling || !cancelReason.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isCancelling ? 'キャンセル中...' : '❌ キャンセル実行'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
