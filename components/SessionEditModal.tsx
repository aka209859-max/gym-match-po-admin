'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

interface Session {
  id: string;
  userId: string;
  userName: string;
  date: Date;
  duration: number;
  type: string;
  status: string;
  trainerId?: string;
  trainerName?: string;
}

interface SessionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  session: Session;
}

interface Member {
  id: string;
  name: string;
}

export default function SessionEditModal({
  isOpen,
  onClose,
  onSuccess,
  session,
}: SessionEditModalProps) {
  const { gymId } = useAuth();
  
  // Form state - initialize with session data
  const [memberId, setMemberId] = useState(session.userId);
  const [memberName, setMemberName] = useState(session.userName);
  const [sessionDate, setSessionDate] = useState(
    session.date.toISOString().split('T')[0]
  );
  const [sessionTime, setSessionTime] = useState(
    session.date.toTimeString().substring(0, 5)
  );
  const [duration, setDuration] = useState(session.duration);
  const [sessionType, setSessionType] = useState(session.type);
  const [trainerName, setTrainerName] = useState(session.trainerName || '山田トレーナー');
  
  const [members, setMembers] = useState<Member[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load members
  useEffect(() => {
    if (isOpen && gymId) {
      loadMembers();
    }
  }, [isOpen, gymId]);

  // Update form state when session changes
  useEffect(() => {
    if (session) {
      setMemberId(session.userId);
      setMemberName(session.userName);
      setSessionDate(session.date.toISOString().split('T')[0]);
      setSessionTime(session.date.toTimeString().substring(0, 5));
      setDuration(session.duration);
      setSessionType(session.type);
      setTrainerName(session.trainerName || '山田トレーナー');
    }
  }, [session]);

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
    if (!sessionDate) {
      setError('日付を選択してください');
      return;
    }
    if (!sessionTime) {
      setError('時刻を選択してください');
      return;
    }
    if (duration < 30 || duration > 120) {
      setError('セッション時間は30〜120分の範囲で指定してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Combine date and time
      const sessionDateTime = new Date(`${sessionDate}T${sessionTime}:00`);
      
      // Update session document
      const sessionRef = doc(db, 'sessions', session.id);
      const updateData = {
        userId: memberId,
        userName: memberName,
        date: sessionDateTime,
        duration: duration,
        type: sessionType,
        trainerId: 'trainer_001',
        trainerName: trainerName,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(sessionRef, updateData);

      console.log('✅ セッション情報更新成功:', session.id);
      
      // Success callback
      onSuccess();
      onClose();
      
    } catch (err) {
      console.error('❌ セッション情報更新エラー:', err);
      setError('セッション情報の更新に失敗しました。もう一度お試しください。');
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
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">✏️ セッション編集</h2>
          <p className="text-purple-100 text-sm mt-1">セッション情報を更新します</p>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">会員を選択してください</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日付 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                時刻 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Duration & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                セッション時間（分） <span className="text-red-500">*</span>
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={30}>30分</option>
                <option value={45}>45分</option>
                <option value={60}>60分</option>
                <option value={90}>90分</option>
                <option value={120}>120分</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                セッション種類 <span className="text-red-500">*</span>
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="personal">パーソナル</option>
                <option value="group">グループ</option>
                <option value="trial">体験</option>
                <option value="consultation">カウンセリング</option>
              </select>
            </div>
          </div>

          {/* Trainer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              担当トレーナー <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
              placeholder="例: 山田トレーナー"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? '更新中...' : '✅ 更新する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
