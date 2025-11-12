'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface SessionBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Member {
  id: string;
  name: string;
  email: string;
}

export default function SessionBookingModal({
  isOpen,
  onClose,
  onSuccess,
}: SessionBookingModalProps) {
  const { gymId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [error, setError] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  
  // Form states
  const [memberId, setMemberId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [sessionType, setSessionType] = useState<'personal' | 'group' | 'trial' | 'consultation'>('personal');
  const [trainerName, setTrainerName] = useState('トレーナーA');

  // Load members when modal opens
  useEffect(() => {
    if (isOpen && gymId) {
      loadMembers();
    }
  }, [isOpen, gymId]);

  const loadMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const membersRef = collection(db, 'members');
      const q = query(membersRef, where('gymId', '==', gymId), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      
      const membersList: Member[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        membersList.push({
          id: doc.id,
          name: data.name,
          email: data.email,
        });
      });
      
      setMembers(membersList);
      console.log(`✅ Loaded ${membersList.length} members`);
    } catch (error) {
      console.error('❌ Error loading members:', error);
      setError('会員リストの読み込みに失敗しました。');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setMemberId(selectedId);
    
    const selectedMember = members.find(m => m.id === selectedId);
    if (selectedMember) {
      setMemberName(selectedMember.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation
    if (!memberId || !date || !time) {
      setError('すべての必須項目を入力してください。');
      setIsLoading(false);
      return;
    }

    try {
      // Create session datetime
      const sessionDateTime = new Date(`${date}T${time}:00`);
      
      // Create session document in Firestore
      const sessionData = {
        gymId: gymId,
        userId: memberId,
        userName: memberName,
        date: sessionDateTime,
        duration: duration,
        type: sessionType,
        status: 'scheduled',
        trainerId: 'trainer_001',
        trainerName: trainerName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'sessions'), sessionData);

      console.log('✅ Session created successfully');

      // Reset form
      setMemberId('');
      setMemberName('');
      setDate('');
      setTime('');
      setDuration(60);
      setSessionType('personal');
      setTrainerName('トレーナーA');

      // Close modal and trigger refresh
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ Error creating session:', error);
      setError('セッション予約に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setMemberId('');
      setMemberName('');
      setDate('');
      setTime('');
      setDuration(60);
      setSessionType('personal');
      setTrainerName('トレーナーA');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              セッション予約
            </h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-white hover:text-gray-200 transition disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {isLoadingMembers ? (
            <div className="mb-4 p-4 text-center text-gray-500">
              <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              会員リスト読み込み中...
            </div>
          ) : members.length === 0 ? (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              ⚠️ 登録済みの会員がいません。先に会員を登録してください。
            </div>
          ) : (
            <>
              {/* Member Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  会員 <span className="text-red-500">*</span>
                </label>
                <select
                  value={memberId}
                  onChange={handleMemberChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  disabled={isLoading}
                  required
                >
                  <option value="">会員を選択してください</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  日付 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  disabled={isLoading}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Time */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  時間 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Duration */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  所要時間 <span className="text-red-500">*</span>
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  disabled={isLoading}
                  required
                >
                  <option value={30}>30分</option>
                  <option value={45}>45分</option>
                  <option value={60}>60分</option>
                  <option value={90}>90分</option>
                  <option value={120}>120分</option>
                </select>
              </div>

              {/* Session Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  セッションタイプ <span className="text-red-500">*</span>
                </label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  disabled={isLoading}
                  required
                >
                  <option value="personal">パーソナル</option>
                  <option value="group">グループ</option>
                  <option value="trial">体験</option>
                  <option value="consultation">カウンセリング</option>
                </select>
              </div>

              {/* Trainer */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  トレーナー <span className="text-red-500">*</span>
                </label>
                <select
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  disabled={isLoading}
                  required
                >
                  <option value="トレーナーA">トレーナーA</option>
                  <option value="トレーナーB">トレーナーB</option>
                  <option value="トレーナーC">トレーナーC</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      予約中...
                    </>
                  ) : (
                    '予約'
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
