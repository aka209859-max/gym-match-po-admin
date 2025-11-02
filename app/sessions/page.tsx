'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { getPoSession, isAuthenticated } from '@/lib/auth';
import { fetchSessions, fetchMembers, Session, Member } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

type CalendarValue = Date | null | [Date | null, Date | null];

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [gymId, setGymId] = useState('');

  // 予約フォームデータ
  const [bookingForm, setBookingForm] = useState({
    userId: '',
    duration: '60',
    type: 'パーソナル',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const session = getPoSession();
      if (!session) {
        router.push('/');
        return;
      }

      setGymId(session.gymId);

      // セッションと会員データを並行取得
      const [sessionsData, membersData] = await Promise.all([
        fetchSessions(session.gymId, 100),
        fetchMembers(session.gymId),
      ]);

      setSessions(sessionsData);
      setMembers(membersData);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ データ取得エラー:', error);
      setIsLoading(false);
    }
  };

  // 選択された日のセッションを取得
  const getSessionsForDate = (date: Date) => {
    return sessions.filter((session) => {
      const sessionDate = session.date;
      return (
        sessionDate.getFullYear() === date.getFullYear() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getDate() === date.getDate()
      );
    });
  };

  const selectedDateSessions = getSessionsForDate(selectedDate);

  // セッション予約処理
  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const selectedMember = members.find((m) => m.id === bookingForm.userId);
      if (!selectedMember) return;

      // Firestoreにセッション作成
      await addDoc(collection(db, 'sessions'), {
        userId: bookingForm.userId,
        userName: selectedMember.name,
        gymId: gymId,
        date: Timestamp.fromDate(selectedDate),
        duration: parseInt(bookingForm.duration),
        type: bookingForm.type,
        status: 'upcoming',
      });

      console.log('✅ セッション予約成功');
      setIsBookingModalOpen(false);
      setBookingForm({ userId: '', duration: '60', type: 'パーソナル' });
      
      // データ再読み込み
      await loadData();
    } catch (error) {
      console.error('❌ セッション予約エラー:', error);
    }
  };

  // セッションキャンセル処理
  const handleCancelSession = async (sessionId: string) => {
    if (!confirm('このセッションをキャンセルしますか？')) return;

    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        status: 'cancelled',
      });

      console.log('✅ セッションキャンセル成功');
      await loadData();
    } catch (error) {
      console.error('❌ セッションキャンセルエラー:', error);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-gray-600 text-lg">読み込み中...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* ページヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">セッション管理</h1>
            <p className="text-gray-600 mt-2">
              予約済みセッション: {sessions.filter((s) => s.status === 'upcoming').length}件
            </p>
          </div>
          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>セッション予約</span>
          </button>
        </div>

        {/* 2カラムレイアウト */}
        <div className="grid grid-cols-2 gap-6">
          {/* カレンダー */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">カレンダー</h2>
            <Calendar
              onChange={(value) => {
                if (value instanceof Date) {
                  setSelectedDate(value);
                }
              }}
              value={selectedDate}
              locale="ja-JP"
              className="w-full border-0"
              tileClassName={({ date }) => {
                const sessionsForDate = getSessionsForDate(date);
                if (sessionsForDate.length > 0) {
                  return 'bg-blue-100 hover:bg-blue-200';
                }
                return '';
              }}
            />
          </div>

          {/* 選択日のセッション一覧 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {selectedDate.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
              のセッション
            </h2>

            {selectedDateSessions.length > 0 ? (
              <div className="space-y-4">
                {selectedDateSessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{session.userName}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          session.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : session.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {session.status === 'completed'
                          ? '完了'
                          : session.status === 'cancelled'
                          ? 'キャンセル'
                          : '予定'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>🏋️ {session.type}</span>
                      <span>⏱️ {session.duration}分</span>
                    </div>
                    {session.status === 'upcoming' && (
                      <button
                        onClick={() => handleCancelSession(session.id)}
                        className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        キャンセル
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p>この日のセッションはありません</p>
              </div>
            )}
          </div>
        </div>

        {/* 全セッション履歴 */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">最近のセッション</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    会員名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    タイプ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    所要時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sessions.slice(0, 10).map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {session.userName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {session.date.toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{session.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{session.duration}分</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          session.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : session.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {session.status === 'completed'
                          ? '完了'
                          : session.status === 'cancelled'
                          ? 'キャンセル'
                          : '予定'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* セッション予約モーダル */}
      {isBookingModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsBookingModalOpen(false)}
          ></div>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white rounded-t-2xl">
                  <h2 className="text-2xl font-bold">セッション予約</h2>
                </div>
                <form onSubmit={handleBookSession} className="p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      予約日
                    </label>
                    <input
                      type="text"
                      value={selectedDate.toLocaleDateString('ja-JP')}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      会員 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bookingForm.userId}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, userId: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    >
                      <option value="">会員を選択してください</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      セッションタイプ
                    </label>
                    <select
                      value={bookingForm.type}
                      onChange={(e) => setBookingForm({ ...bookingForm, type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="パーソナル">パーソナル</option>
                      <option value="グループ">グループ</option>
                      <option value="フリー">フリー</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      所要時間
                    </label>
                    <select
                      value={bookingForm.duration}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, duration: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="30">30分</option>
                      <option value="60">60分</option>
                      <option value="90">90分</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsBookingModalOpen(false)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                      予約する
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
