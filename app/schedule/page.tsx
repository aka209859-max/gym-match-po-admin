'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  getGymBookings,
  getAvailableTimeSlots,
  createBooking,
  cancelBooking,
  type Booking,
  type TimeSlot,
  type BookingCreateInput,
} from '@/lib/booking';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';

interface Trainer {
  id: string;
  name: string;
}

export default function SchedulePage() {
  const router = useRouter();
  const { isAuthenticated, gymId, gymName } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (gymId) {
      loadTrainers();
    }
  }, [isAuthenticated, gymId]);

  useEffect(() => {
    if (selectedTrainer && gymId) {
      loadSchedule();
    }
  }, [selectedTrainer, selectedDate, gymId]);

  const loadTrainers = async () => {
    if (!gymId) return;
    try {
      const q = query(collection(db, COLLECTIONS.USERS), where('gymId', '==', gymId), where('role', '==', 'trainer'));
      const snapshot = await getDocs(q);
      const trainerList = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().displayName || 'Trainer' }));
      setTrainers(trainerList);
      if (trainerList.length > 0) setSelectedTrainer(trainerList[0].id);
    } catch (error) {
      console.error('Error loading trainers:', error);
    }
  };

  const loadSchedule = async () => {
    if (!gymId || !selectedTrainer) return;
    setLoading(true);
    try {
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayBookings = await getGymBookings(gymId, {
        trainerId: selectedTrainer,
        startDate: dayStart,
        endDate: dayEnd,
      });
      setBookings(dayBookings);

      const slots = await getAvailableTimeSlots(gymId, selectedTrainer, selectedDate);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.available) {
      setSelectedSlot(slot);
      setShowBookingModal(true);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('この予約をキャンセルしますか？')) return;
    try {
      await cancelBooking(bookingId);
      loadSchedule();
    } catch (error) {
      alert('キャンセルエラー: ' + error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isAuthenticated) return null;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">📅 スケジュール管理</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">日付選択</h2>
            <Calendar onChange={(value) => setSelectedDate(value as Date)} value={selectedDate} locale="ja-JP" />
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">トレーナー</label>
              <select
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Time Slots */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {selectedDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <button onClick={loadSchedule} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300">
                {loading ? '読込中...' : '更新'}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">読込中...</div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {availableSlots.map((slot, idx) => {
                  const booking = bookings.find(b => 
                    b.startTime.getTime() === slot.startTime.getTime() && b.status === 'scheduled'
                  );
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => !booking && handleSlotClick(slot)}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        booking
                          ? 'bg-red-50 border-red-200'
                          : slot.available
                          ? 'bg-green-50 border-green-200 hover:bg-green-100'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                          {booking && (
                            <div className="text-sm text-gray-600 mt-1">
                              {booking.memberName} | {booking.sessionType}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCancelBooking(booking.id); }}
                                className="ml-2 text-red-600 hover:text-red-700"
                              >
                                キャンセル
                              </button>
                            </div>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          booking ? 'bg-red-100 text-red-700' : slot.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {booking ? '予約済' : slot.available ? '空き' : '不可'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Booking Modal */}
        {showBookingModal && selectedSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">クイック予約</h3>
              <p className="text-sm text-gray-600 mb-4">
                {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                ※ 詳細な予約作成は「会員管理」から行えます
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowBookingModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  閉じる
                </button>
                <button onClick={() => { setShowBookingModal(false); router.push('/members'); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  会員管理へ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
