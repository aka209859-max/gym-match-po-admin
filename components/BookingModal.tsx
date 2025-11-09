'use client';

import { useState, useEffect } from 'react';
import { createBooking, getAvailableTimeSlots, type BookingCreateInput, type TimeSlot, type SessionType } from '@/lib/booking';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  gymId: string;
  memberId: string;
  memberName: string;
  onSuccess: () => void;
}

interface Trainer {
  id: string;
  name: string;
}

export default function BookingModal({ isOpen, onClose, gymId, memberId, memberName, onSuccess }: BookingModalProps) {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [sessionType, setSessionType] = useState<SessionType>('personal');
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState(18000);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && gymId) {
      loadTrainers();
    }
  }, [isOpen, gymId]);

  useEffect(() => {
    if (selectedTrainer && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedTrainer, selectedDate]);

  const loadTrainers = async () => {
    try {
      const q = query(collection(db, COLLECTIONS.USERS), where('gymId', '==', gymId), where('role', '==', 'trainer'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().displayName || 'Trainer' }));
      setTrainers(list);
      if (list.length > 0) setSelectedTrainer(list[0].id);
    } catch (error) {
      console.error('Error loading trainers:', error);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedTrainer || !selectedDate) return;
    try {
      const date = new Date(selectedDate);
      const slots = await getAvailableTimeSlots(gymId, selectedTrainer, date, duration);
      setAvailableSlots(slots.filter(s => s.available));
    } catch (error) {
      console.error('Error loading slots:', error);
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedSlot || !selectedTrainer) {
      alert('トレーナーと時間枠を選択してください');
      return;
    }

    setLoading(true);
    try {
      const trainerName = trainers.find(t => t.id === selectedTrainer)?.name || 'Unknown';
      const input: BookingCreateInput = {
        gymId,
        memberId,
        memberName,
        trainerId: selectedTrainer,
        trainerName,
        sessionType,
        startTime: selectedSlot.startTime,
        duration,
        price,
        notes,
      };

      await createBooking(input);
      alert('✅ 予約が作成されました');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert('エラー: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">予約作成</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">会員名</label>
              <input type="text" value={memberName} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">トレーナー</label>
                <select value={selectedTrainer} onChange={e => setSelectedTrainer(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">セッションタイプ</label>
                <select value={sessionType} onChange={e => setSessionType(e.target.value as SessionType)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="personal">パーソナル</option>
                  <option value="group">グループ</option>
                  <option value="trial">体験</option>
                  <option value="consultation">カウンセリング</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">日付</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">時間 (分)</label>
                <input type="number" value={duration} onChange={e => { setDuration(Number(e.target.value)); loadAvailableSlots(); }} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">料金 (円)</label>
                <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">空き時間枠</label>
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                {availableSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm ${
                      selectedSlot === slot ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {slot.startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </button>
                ))}
              </div>
              {availableSlots.length === 0 && <p className="text-sm text-gray-500 mt-2">空き枠がありません</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">備考</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="追加情報..."></textarea>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              キャンセル
            </button>
            <button onClick={handleCreateBooking} disabled={loading || !selectedSlot} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300">
              {loading ? '作成中...' : '予約作成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
