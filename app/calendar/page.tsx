'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import SessionEditModal from '@/components/SessionEditModal';
import SessionCancelModal from '@/components/SessionCancelModal';

interface Session {
  id: string;
  userId: string;
  userName: string;
  date: Date;
  duration: number;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  trainerId?: string;
  trainerName?: string;
}

export default function CalendarPage() {
  const { isAuthenticated, gymId } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && gymId) {
      loadSessions();
    }
  }, [isAuthenticated, gymId]);

  const loadSessions = async () => {
    if (!gymId) return;
    
    setIsLoading(true);
    try {
      const sessionsRef = collection(db, 'sessions');
      const sessionsQuery = query(
        sessionsRef,
        where('gymId', '==', gymId)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      const sessionsData: Session[] = [];
      sessionsSnapshot.forEach((doc) => {
        const data = doc.data();
        sessionsData.push({
          id: doc.id,
          userId: data.userId || '',
          userName: data.userName || 'Unknown',
          date: data.date?.toDate() || new Date(),
          duration: data.duration || 0,
          type: data.type || 'general',
          status: data.status || 'scheduled',
          trainerId: data.trainerId,
          trainerName: data.trainerName,
        });
      });
      
      // Sort by date (newest first)
      sessionsData.sort((a, b) => b.date.getTime() - a.date.getTime());
      setSessions(sessionsData);
      
      console.log('✅ セッションデータ取得完了:', sessionsData.length, '件');
    } catch (error) {
      console.error('❌ セッションデータ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get sessions for selected date
  const getSessionsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return sessions.filter(session => {
      const sessionDateString = session.date.toISOString().split('T')[0];
      return sessionDateString === dateString;
    });
  };

  // Get dates with sessions for calendar highlighting
  const getDatesWithSessions = () => {
    const dates: string[] = [];
    sessions.forEach(session => {
      const dateString = session.date.toISOString().split('T')[0];
      if (!dates.includes(dateString)) {
        dates.push(dateString);
      }
    });
    return dates;
  };

  const tileClassName = ({ date, view }: any) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0];
      const datesWithSessions = getDatesWithSessions();
      if (datesWithSessions.includes(dateString)) {
        return 'has-sessions';
      }
    }
    return null;
  };

  const selectedDateSessions = getSessionsForDate(selectedDate);

  const getStatusBadge = (status: string) => {
    const badges: any = {
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: '予定' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: '完了' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'キャンセル' },
    };
    const badge = badges[status] || badges.scheduled;
    return <span className={`px-2 py-1 rounded text-xs ${badge.bg} ${badge.text}`}>{badge.label}</span>;
  };

  const handleEdit = (session: Session) => {
    setSelectedSession(session);
    setIsEditModalOpen(true);
  };

  const handleCancel = (session: Session) => {
    setSelectedSession(session);
    setIsCancelModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6 pt-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📅 カレンダー & 予約管理</h1>
          <p className="text-gray-600 mt-2">
            セッションの予約状況を確認・管理できます
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">全セッション</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{sessions.length}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">予定</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {sessions.filter(s => s.status === 'scheduled').length}
                </p>
              </div>
              <div className="text-4xl">⏰</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">完了</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {sessions.filter(s => s.status === 'completed').length}
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">キャンセル</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {sessions.filter(s => s.status === 'cancelled').length}
                </p>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">カレンダー</h2>
              <style jsx global>{`
                .react-calendar {
                  width: 100%;
                  border: none;
                  font-family: inherit;
                }
                .react-calendar__tile--active {
                  background: #3b82f6 !important;
                  color: white !important;
                }
                .react-calendar__tile--now {
                  background: #dbeafe;
                }
                .has-sessions {
                  background: #fef3c7;
                  font-weight: 600;
                }
                .react-calendar__tile:enabled:hover {
                  background: #f3f4f6;
                }
              `}</style>
              <Calendar
                value={selectedDate}
                onChange={(date) => setSelectedDate(date as Date)}
                tileClassName={tileClassName}
                locale="ja-JP"
              />
            </div>
          </div>

          {/* Sessions List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedDate.toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  のセッション ({selectedDateSessions.length}件)
                </h2>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-12 text-gray-500">読み込み中...</div>
                ) : selectedDateSessions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">📅</div>
                    <p>この日のセッションはありません</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDateSessions.map((session) => (
                      <div
                        key={session.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(session.status)}
                              <span className="text-sm text-gray-600">
                                {session.date.toLocaleTimeString('ja-JP', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <h3 className="font-semibold text-gray-900 text-lg">
                              {session.userName}
                            </h3>

                            <div className="mt-2 space-y-1 text-sm text-gray-600">
                              <p>📋 種類: {session.type}</p>
                              <p>⏱️ 時間: {session.duration}分</p>
                              {session.trainerName && (
                                <p>👤 トレーナー: {session.trainerName}</p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {session.status === 'scheduled' && (
                            <div className="flex flex-col gap-2 ml-4">
                              <button
                                onClick={() => handleEdit(session)}
                                className="px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
                              >
                                ✏️ 編集
                              </button>
                              <button
                                onClick={() => handleCancel(session)}
                                className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap"
                              >
                                ❌ キャンセル
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedSession && (
        <>
          <SessionEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            session={selectedSession}
            onSuccess={loadSessions}
          />
          
          <SessionCancelModal
            isOpen={isCancelModalOpen}
            onClose={() => setIsCancelModalOpen(false)}
            session={selectedSession}
            onSuccess={loadSessions}
          />
        </>
      )}
    </AdminLayout>
  );
}
