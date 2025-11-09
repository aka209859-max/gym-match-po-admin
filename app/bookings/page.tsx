'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import BookingModal from '@/components/BookingModal';
import { getGymBookings, cancelBooking, completeBooking, type Booking } from '@/lib/booking';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function BookingsPage() {
  const { gymId, gymName } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gymId) loadBookings();
  }, [gymId]);

  useEffect(() => {
    filterBookings();
  }, [bookings, selectedDate, statusFilter]);

  const loadBookings = async () => {
    if (!gymId) return;
    setLoading(true);
    try {
      const all = await getGymBookings(gymId);
      setBookings(all);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;
    
    // Filter by date
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    filtered = filtered.filter(b => b.startTime >= dayStart && b.startTime <= dayEnd);
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }
    
    setFilteredBookings(filtered.sort((a, b) => a.startTime.getTime() - b.startTime.getTime()));
  };

  const handleCancel = async (id: string) => {
    if (!confirm('キャンセルしますか？')) return;
    try {
      await cancelBooking(id);
      loadBookings();
    } catch (error) {
      alert('エラー: ' + error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeBooking(id);
      loadBookings();
    } catch (error) {
      alert('エラー: ' + error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: '予約済' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: '完了' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'キャンセル' },
      'no-show': { bg: 'bg-gray-100', text: 'text-gray-700', label: '無断欠席' },
    };
    const badge = badges[status] || badges.scheduled;
    return <span className={`px-2 py-1 rounded text-xs ${badge.bg} ${badge.text}`}>{badge.label}</span>;
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">📅 予約管理</h1>
          <button onClick={loadBookings} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300">
            {loading ? '読込中...' : '更新'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar & Filters */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h2 className="font-semibold mb-4">日付選択</h2>
              <Calendar onChange={(value) => setSelectedDate(value as Date)} value={selectedDate} locale="ja-JP" />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h2 className="font-semibold mb-4">ステータス</h2>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                <option value="all">全て</option>
                <option value="scheduled">予約済</option>
                <option value="completed">完了</option>
                <option value="cancelled">キャンセル</option>
                <option value="no-show">無断欠席</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">本日の予約</h3>
              <p className="text-2xl font-bold text-blue-600">{filteredBookings.length}件</p>
            </div>
          </div>

          {/* Bookings List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 border">
            <h2 className="font-semibold mb-4">
              {selectedDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })} の予約
            </h2>

            {loading ? (
              <div className="text-center py-8">読込中...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">予約がありません</div>
            ) : (
              <div className="space-y-3 max-h-[700px] overflow-y-auto">
                {filteredBookings.map(booking => (
                  <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold">{booking.memberName}</div>
                        <div className="text-sm text-gray-600">トレーナー: {booking.trainerName}</div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span>⏰ {booking.startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} - {booking.endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>📋 {booking.sessionType}</span>
                      <span>💴 ¥{booking.price.toLocaleString()}</span>
                    </div>
                    {booking.notes && <p className="text-sm text-gray-600 mb-3">📝 {booking.notes}</p>}
                    {booking.status === 'scheduled' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleComplete(booking.id)} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                          完了
                        </button>
                        <button onClick={() => handleCancel(booking.id)} className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50">
                          キャンセル
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
