'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Member {
  id: string;
  name: string;
}

export default function ManualPaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: ManualPaymentModalProps) {
  const { gymId } = useAuth();
  
  // Form state
  const [memberId, setMemberId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'session' | 'membership' | 'other'>('session');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'other'>('cash');
  const [description, setDescription] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  const [members, setMembers] = useState<Member[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load members
  useEffect(() => {
    if (isOpen && gymId) {
      loadMembers();
    }
  }, [isOpen, gymId]);

  const loadMembers = async () => {
    try {
      const membersRef = collection(db, 'members');
      const membersQuery = query(
        membersRef,
        where('gymId', '==', gymId),
        where('isActive', '==', true)
      );
      const membersSnapshot = await getDocs(membersQuery);
      
      const membersData: Member[] = [];
      membersSnapshot.forEach((doc) => {
        const data = doc.data();
        membersData.push({
          id: doc.id,
          name: data.name || 'Unknown',
        });
      });
      
      setMembers(membersData);
    } catch (error) {
      console.error('❌ 会員データ取得エラー:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!memberId) {
      setError('会員を選択してください');
      return;
    }
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
      // Create payment record
      const paymentData = {
        gymId: gymId,
        memberId: memberId,
        memberName: memberName,
        amount: Number(amount),
        type: paymentType,
        paymentMethod: paymentMethod,
        status: 'succeeded',
        description: description.trim(),
        paymentDate: new Date(paymentDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'payments'), paymentData);

      console.log('✅ 手動決済記録成功');
      
      // Success callback
      onSuccess();
      onClose();
      
      // Reset form
      setMemberId('');
      setMemberName('');
      setAmount('');
      setPaymentType('session');
      setPaymentMethod('cash');
      setDescription('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      
    } catch (err) {
      console.error('❌ 手動決済記録エラー:', err);
      setError('決済の記録に失敗しました。もう一度お試しください。');
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
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">💵 現金決済記録</h2>
          <p className="text-green-100 text-sm mt-1">現金・銀行振込などの手動決済を記録します</p>
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

          {/* Member Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              会員選択 <span className="text-red-500">*</span>
            </label>
            <select
              value={memberId}
              onChange={(e) => {
                setMemberId(e.target.value);
                const selected = members.find(m => m.id === e.target.value);
                if (selected) {
                  setMemberName(selected.name);
                }
              }}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">会員を選択してください</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Payment Type & Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                決済種類 <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as 'session' | 'membership' | 'other')}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="session">セッション料金</option>
                <option value="membership">会費</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                支払い方法 <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'bank_transfer' | 'other')}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="cash">現金</option>
                <option value="bank_transfer">銀行振込</option>
                <option value="other">その他</option>
              </select>
            </div>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 記録のポイント</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>現金・銀行振込など、オンライン決済以外の記録に使用</li>
              <li>金額は正確に入力してください</li>
              <li>領収書発行が必要な場合は、決済内容に記載</li>
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
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? '記録中...' : '✅ 決済記録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
