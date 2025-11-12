'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import {
  Member,
  CONTRACT_TYPE_LABELS,
  MEMBER_STATUS_LABELS,
  MEMBER_STATUS_COLORS,
  formatMemberDate,
  membershipDurationMonths,
} from '@/types/member';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  onEdit: () => void;
}

interface SessionHistory {
  id: string;
  date: Date;
  type: string;
  duration: number;
  status: string;
}

interface PaymentHistory {
  id: string;
  date: Date;
  amount: number;
  type: string;
  status: string;
  description: string;
}

export default function MemberDetailModal({
  isOpen,
  onClose,
  member,
  onEdit,
}: MemberDetailModalProps) {
  const { gymId } = useAuth();
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'payments'>('overview');

  useEffect(() => {
    if (isOpen && member && gymId) {
      loadMemberHistory();
    }
  }, [isOpen, member, gymId]);

  const loadMemberHistory = async () => {
    setIsLoading(true);
    try {
      // Load sessions
      const sessionsRef = collection(db, 'sessions');
      const sessionsQuery = query(
        sessionsRef,
        where('gymId', '==', gymId),
        where('userId', '==', member.id)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      const sessionsData: SessionHistory[] = [];
      sessionsSnapshot.forEach((doc) => {
        const data = doc.data();
        sessionsData.push({
          id: doc.id,
          date: data.date?.toDate() || new Date(),
          type: data.type || 'general',
          duration: data.duration || 0,
          status: data.status || 'completed',
        });
      });
      
      // Sort by date (newest first)
      sessionsData.sort((a, b) => b.date.getTime() - a.date.getTime());
      setSessions(sessionsData);

      // Load payments
      const paymentsRef = collection(db, 'payments');
      const paymentsQuery = query(
        paymentsRef,
        where('gymId', '==', gymId),
        where('memberId', '==', member.id)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      const paymentsData: PaymentHistory[] = [];
      paymentsSnapshot.forEach((doc) => {
        const data = doc.data();
        paymentsData.push({
          id: doc.id,
          date: data.createdAt?.toDate() || new Date(),
          amount: data.amount || 0,
          type: data.type || 'other',
          status: data.status || 'succeeded',
          description: data.description || '',
        });
      });
      
      // Sort by date (newest first)
      paymentsData.sort((a, b) => b.date.getTime() - a.date.getTime());
      setPayments(paymentsData);

    } catch (error) {
      console.error('❌ 会員履歴取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const statusColor = MEMBER_STATUS_COLORS[member.status];
  const membershipMonths = membershipDurationMonths(member.joinDate);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{member.name}</h2>
              <p className="text-indigo-100 text-sm mt-1">{member.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'overview'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 概要
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'sessions'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏋️ セッション履歴 ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'payments'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💳 決済履歴 ({payments.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">読み込み中...</div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Status & Contract */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-2">ステータス</div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColor.bg} ${statusColor.text} ${statusColor.border} border`}>
                        {MEMBER_STATUS_LABELS[member.status]}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-2">契約プラン</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {CONTRACT_TYPE_LABELS[member.contractType]}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-white border rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 text-lg mb-3">連絡先情報</h3>
                    <div>
                      <div className="text-sm text-gray-600">メールアドレス</div>
                      <div className="text-gray-900">{member.email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">電話番号</div>
                      <div className="text-gray-900">{member.phone}</div>
                    </div>
                  </div>

                  {/* Membership Information */}
                  <div className="bg-white border rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 text-lg mb-3">会員情報</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">入会日</div>
                        <div className="text-gray-900">{formatMemberDate(member.joinDate)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">在籍期間</div>
                        <div className="text-gray-900">{membershipMonths}ヶ月</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">総セッション数</div>
                        <div className="text-gray-900">{member.totalSessions}回</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">累計売上</div>
                        <div className="text-gray-900">¥{member.totalRevenue.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {member.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-2">📝 メモ</h3>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{member.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Sessions Tab */}
              {activeTab === 'sessions' && (
                <div className="space-y-3">
                  {sessions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-2">🏋️</div>
                      <p>セッション履歴がありません</p>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {session.date.toLocaleDateString('ja-JP')} {session.date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              種類: {session.type} | 時間: {session.duration}分
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            session.status === 'completed' ? 'bg-green-100 text-green-700' :
                            session.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {session.status === 'completed' ? '完了' :
                             session.status === 'cancelled' ? 'キャンセル' :
                             '予定'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div className="space-y-3">
                  {payments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-2">💳</div>
                      <p>決済履歴がありません</p>
                    </div>
                  ) : (
                    payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              ¥{payment.amount.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {payment.date.toLocaleDateString('ja-JP')} | {payment.description}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            payment.status === 'succeeded' ? 'bg-green-100 text-green-700' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {payment.status === 'succeeded' ? '成功' :
                             payment.status === 'pending' ? '保留' :
                             payment.status === 'failed' ? '失敗' :
                             '返金済'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            閉じる
          </button>
          <button
            onClick={() => {
              onEdit();
              onClose();
            }}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
          >
            ✏️ 編集する
          </button>
        </div>
      </div>
    </div>
  );
}
