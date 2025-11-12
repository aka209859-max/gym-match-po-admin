'use client';

import { useState, useEffect } from 'react';
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

interface PaymentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payment: Payment;
}

export default function PaymentEditModal({
  isOpen,
  onClose,
  onSuccess,
  payment,
}: PaymentEditModalProps) {
  // Form state - initialize with payment data
  const [amount, setAmount] = useState(payment.amount.toString());
  const [paymentType, setPaymentType] = useState<'session' | 'membership' | 'other'>(
    payment.type as 'session' | 'membership' | 'other'
  );
  const [description, setDescription] = useState(payment.description);
  const [paymentDate, setPaymentDate] = useState(
    payment.createdAt.toISOString().split('T')[0]
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form state when payment changes
  useEffect(() => {
    if (payment) {
      setAmount(payment.amount.toString());
      setPaymentType(payment.type as 'session' | 'membership' | 'other');
      setDescription(payment.description);
      setPaymentDate(payment.createdAt.toISOString().split('T')[0]);
    }
  }, [payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!amount || Number(amount) <= 0) {
      setError('有効な金額を入力してください');
      return;
    }
    if (!description.trim()) {
      setError('決済内容を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Update payment document
      const paymentRef = doc(db, 'payments', payment.id);
      const updateData = {
        amount: Number(amount),
        type: paymentType,
        description: description.trim(),
        paymentDate: new Date(paymentDate),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(paymentRef, updateData);

      console.log('✅ 決済情報更新成功:', payment.id);
      
      // Success callback
      onSuccess();
      onClose();
      
    } catch (err) {
      console.error('❌ 決済情報更新エラー:', err);
      setError('決済情報の更新に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">✏️ 決済情報編集</h2>
          <p className="text-blue-100 text-sm mt-1">決済情報を修正します</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center">
                <span className="text-red-800 font-medium">⚠️ {error}</span>
              </div>
            </div>
          )}

          {/* Payment Info (Read-only) */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">決済情報</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>会員名:</strong> {payment.memberName}</p>
              <p><strong>ステータス:</strong> {
                payment.status === 'succeeded' ? '成功' :
                payment.status === 'pending' ? '保留' :
                payment.status === 'failed' ? '失敗' :
                '返金済'
              }</p>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                金額（円） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="例: 10000"
                min="1"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                決済日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              決済種類 <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as 'session' | 'membership' | 'other')}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="session">セッション料金</option>
              <option value="membership">会費</option>
              <option value="other">その他</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              決済内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例: 12月分セッション料金、年会費、入会金など"
              rows={3}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Warning Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ 編集の注意</h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>誤入力の修正にのみ使用してください</li>
              <li>会員名とステータスは変更できません</li>
              <li>返金済みの決済は編集できません</li>
              <li>編集履歴は記録されます</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || payment.status === 'refunded'}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? '更新中...' : '✅ 更新する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
