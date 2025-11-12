'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface Payment {
  id: string;
  memberName: string;
  amount: number;
  type: string;
  description: string;
  createdAt: Date;
  status: string;
}

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payment: Payment;
}

export default function RefundModal({
  isOpen,
  onClose,
  onSuccess,
  payment,
}: RefundModalProps) {
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      setError('返金理由を入力してください');
      return;
    }

    setIsRefunding(true);
    setError(null);

    try {
      // Update payment status to refunded
      const paymentRef = doc(db, 'payments', payment.id);
      await updateDoc(paymentRef, {
        status: 'refunded',
        refundReason: refundReason.trim(),
        refundedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ 返金処理成功:', payment.id);
      
      // Success callback
      onSuccess();
      onClose();
      
      // Reset form
      setRefundReason('');
      
    } catch (err) {
      console.error('❌ 返金処理エラー:', err);
      setError('返金処理に失敗しました。もう一度お試しください。');
    } finally {
      setIsRefunding(false);
    }
  };

  const handleClose = () => {
    if (!isRefunding) {
      setError(null);
      setRefundReason('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">🔄 返金処理</h2>
          <p className="text-orange-100 text-sm mt-1">決済の返金を行います</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Payment Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">返金対象決済</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>会員名:</strong> {payment.memberName}</p>
              <p><strong>金額:</strong> ¥{payment.amount.toLocaleString()}</p>
              <p><strong>決済日:</strong> {payment.createdAt.toLocaleDateString('ja-JP')}</p>
              <p><strong>内容:</strong> {payment.description}</p>
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
                  返金の注意事項
                </h4>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                  <li>返金処理は取り消せません</li>
                  <li>実際の返金手続きは別途必要です</li>
                  <li>会員への通知が推奨されます</li>
                  <li>システム上の記録のみ更新されます</li>
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

          {/* Refund Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              返金理由 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="返金の理由を入力してください（例：サービス不備、会員都合、二重請求など）"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={isRefunding}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">📝 返金後の対応</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>会員への連絡と説明</li>
              <li>実際の返金手続き（現金・振込）</li>
              <li>返金証明書の発行（必要に応じて）</li>
              <li>会計記録の調整</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={isRefunding}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleRefund}
              disabled={isRefunding || !refundReason.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isRefunding ? '処理中...' : '🔄 返金実行'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
