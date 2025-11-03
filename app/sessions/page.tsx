'use client';

import { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  Session,
  SessionStatus,
  SessionType,
  SessionFilter,
  SESSION_STATUS_LABELS,
  SESSION_TYPE_LABELS,
  SESSION_STATUS_COLORS,
  formatSessionDate,
  formatSessionTime,
  isToday,
  isUpcoming,
} from '@/types/session';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>(getDemoSessions());
  const [filter, setFilter] = useState<SessionFilter>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<SessionStatus | 'all'>('all');
  const [selectedType, setSelectedType] = useState<SessionType | 'all'>('all');

  // Filter sessions based on criteria
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Status filter
      if (selectedStatus !== 'all' && session.status !== selectedStatus) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all' && session.type !== selectedType) {
        return false;
      }

      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          session.memberName.toLowerCase().includes(query) ||
          session.trainerName.toLowerCase().includes(query) ||
          session.location.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [sessions, selectedStatus, selectedType, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: filteredSessions.length,
      today: filteredSessions.filter((s) => isToday(s.scheduledDate)).length,
      upcoming: filteredSessions.filter((s) => isUpcoming(s.scheduledDate) && s.status !== 'cancelled').length,
      completed: filteredSessions.filter((s) => s.status === 'completed').length,
    };
  }, [filteredSessions]);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">セッション管理</h1>
          <p className="text-gray-600 mt-2">
            トレーニングセッションの予約・管理を行います
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">全セッション</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">本日</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.today}</p>
              </div>
              <div className="text-4xl">📍</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">今後の予定</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.upcoming}</p>
              </div>
              <div className="text-4xl">⏰</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">完了</p>
                <p className="text-3xl font-bold text-gray-600 mt-1">{stats.completed}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                検索
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="会員名、トレーナー名、店舗で検索"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                ステータス
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as SessionStatus | 'all')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                {Object.entries(SESSION_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                セッション種別
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as SessionType | 'all')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedStatus !== 'all' || selectedType !== 'all' || searchQuery) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">フィルター適用中:</span>
              {selectedStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {SESSION_STATUS_LABELS[selectedStatus]}
                  <button
                    onClick={() => setSelectedStatus('all')}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {SESSION_TYPE_LABELS[selectedType]}
                  <button
                    onClick={() => setSelectedType('all')}
                    className="hover:text-purple-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  検索: {searchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:text-gray-900"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedStatus('all');
                  setSelectedType('all');
                  setSearchQuery('');
                }}
                className="ml-auto text-sm text-blue-600 hover:text-blue-700"
              >
                すべてクリア
              </button>
            </div>
          )}
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-600 text-lg">セッションが見つかりません</p>
              <p className="text-gray-500 text-sm mt-2">
                フィルター条件を変更してください
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// Session Row Component
function SessionRow({ session }: { session: Session }) {
  const statusColor = SESSION_STATUS_COLORS[session.status];
  const isSessionToday = isToday(session.scheduledDate);

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        {/* Left: Session Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {isSessionToday && (
              <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                本日
              </span>
            )}
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor.bg} ${statusColor.text} ${statusColor.border} border`}
            >
              {SESSION_STATUS_LABELS[session.status]}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              {SESSION_TYPE_LABELS[session.type]}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                {session.memberName}
              </h3>
              <p className="text-gray-600 text-sm">
                トレーナー: {session.trainerName}
              </p>
            </div>

            <div>
              <p className="text-gray-900 font-medium">
                {formatSessionDate(session.scheduledDate)}
              </p>
              <p className="text-gray-600 text-sm">
                {formatSessionTime(session.startTime, session.endTime)} ({session.duration}分)
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              📍 {session.location}
            </span>
            <span className="flex items-center gap-1">
              💰 ¥{session.price.toLocaleString()}
            </span>
          </div>

          {session.notes && (
            <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
              メモ: {session.notes}
            </p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="ml-4 flex flex-col gap-2">
          <button className="px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
            詳細
          </button>
          <button className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            編集
          </button>
        </div>
      </div>
    </div>
  );
}

// Demo Data Generator
function getDemoSessions(): Session[] {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return [
    {
      id: 'session_001',
      memberId: 'member_001',
      memberName: '山田太郎',
      trainerId: 'trainer_001',
      trainerName: '佐藤コーチ',
      type: 'personal',
      status: 'confirmed',
      scheduledDate: today,
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      price: 8000,
      location: '久留米店',
      notes: '初回トレーニング。基礎的な動作確認を重点的に。',
      createdAt: new Date('2024-10-01'),
      updatedAt: new Date('2024-10-15'),
    },
    {
      id: 'session_002',
      memberId: 'member_002',
      memberName: '鈴木花子',
      trainerId: 'trainer_002',
      trainerName: '田中コーチ',
      type: 'group',
      status: 'scheduled',
      scheduledDate: today,
      startTime: '14:00',
      endTime: '15:00',
      duration: 60,
      price: 5000,
      location: '久留米店',
      createdAt: new Date('2024-10-05'),
      updatedAt: new Date('2024-10-20'),
    },
    {
      id: 'session_003',
      memberId: 'member_003',
      memberName: '高橋健一',
      trainerId: 'trainer_001',
      trainerName: '佐藤コーチ',
      type: 'personal',
      status: 'completed',
      scheduledDate: yesterday,
      startTime: '10:00',
      endTime: '11:00',
      duration: 60,
      price: 8000,
      location: '久留米店',
      notes: '前回より体幹トレーニングの強度を上げた。',
      createdAt: new Date('2024-09-20'),
      updatedAt: new Date('2024-11-01'),
    },
    {
      id: 'session_004',
      memberId: 'member_004',
      memberName: '伊藤美咲',
      trainerId: 'trainer_003',
      trainerName: '山本コーチ',
      type: 'trial',
      status: 'scheduled',
      scheduledDate: tomorrow,
      startTime: '11:00',
      endTime: '12:00',
      duration: 60,
      price: 3000,
      location: '久留米店',
      notes: '体験トレーニング。ジム設備の案内も含める。',
      createdAt: new Date('2024-11-01'),
      updatedAt: new Date('2024-11-01'),
    },
    {
      id: 'session_005',
      memberId: 'member_005',
      memberName: '渡辺翔太',
      trainerId: 'trainer_002',
      trainerName: '田中コーチ',
      type: 'personal',
      status: 'cancelled',
      scheduledDate: tomorrow,
      startTime: '16:00',
      endTime: '17:00',
      duration: 60,
      price: 8000,
      location: '久留米店',
      notes: '会員都合によりキャンセル。',
      createdAt: new Date('2024-10-25'),
      updatedAt: new Date('2024-11-01'),
    },
    {
      id: 'session_006',
      memberId: 'member_006',
      memberName: '中村さくら',
      trainerId: 'trainer_001',
      trainerName: '佐藤コーチ',
      type: 'consultation',
      status: 'scheduled',
      scheduledDate: nextWeek,
      startTime: '13:00',
      endTime: '14:00',
      duration: 60,
      price: 0,
      location: '久留米店',
      notes: 'トレーニングプラン見直しのためのカウンセリング。',
      createdAt: new Date('2024-11-01'),
      updatedAt: new Date('2024-11-01'),
    },
    {
      id: 'session_007',
      memberId: 'member_007',
      memberName: '小林大輔',
      trainerId: 'trainer_003',
      trainerName: '山本コーチ',
      type: 'group',
      status: 'confirmed',
      scheduledDate: tomorrow,
      startTime: '18:00',
      endTime: '19:00',
      duration: 60,
      price: 5000,
      location: '久留米店',
      createdAt: new Date('2024-10-28'),
      updatedAt: new Date('2024-10-30'),
    },
    {
      id: 'session_008',
      memberId: 'member_008',
      memberName: '加藤麻衣',
      trainerId: 'trainer_002',
      trainerName: '田中コーチ',
      type: 'personal',
      status: 'no-show',
      scheduledDate: yesterday,
      startTime: '15:00',
      endTime: '16:00',
      duration: 60,
      price: 8000,
      location: '久留米店',
      notes: '連絡なしの無断欠席。後日フォロー連絡が必要。',
      createdAt: new Date('2024-10-20'),
      updatedAt: new Date('2024-11-01'),
    },
  ];
}
