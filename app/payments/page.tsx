'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getGymPayments, getRevenueSummary, formatAmount, type Payment } from '@/lib/payment';

export default function PaymentsPage() {
  const { gymId } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gymId) {
      loadData();
    }
  }, [gymId]);

  const loadData = async () => {
    if (!gymId) return;
    setLoading(true);
    try {
      const allPayments = await getGymPayments(gymId);
      setPayments(allPayments);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const summaryData = await getRevenueSummary(gymId, monthStart, monthEnd);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => filter === 'all' || p.status === filter);

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '保留中' },
      succeeded: { bg: 'bg-green-100', text: 'text-green-700', label: '成功' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: '失敗' },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-700', label: '返金済' },
    };
    const badge = badges[status] || badges.pending;
    return <span className={`px-2 py-1 rounded text-xs ${badge.bg} ${badge.text}`}>{badge.label}</span>;
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-8 pt-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">💳 決済管理</h1>
          <button onClick={loadData} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300">
            {loading ? '読込中...' : '更新'}
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h3 className="text-sm text-gray-900 mb-2">総売上 (今月)</h3>
              <p className="text-2xl font-bold text-blue-600">{formatAmount(summary.totalRevenue)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h3 className="text-sm text-gray-900 mb-2">セッション売上</h3>
              <p className="text-2xl font-bold text-green-600">{formatAmount(summary.sessionRevenue)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h3 className="text-sm text-gray-900 mb-2">会費売上</h3>
              <p className="text-2xl font-bold text-purple-600">{formatAmount(summary.membershipRevenue)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h3 className="text-sm text-gray-900 mb-2">取引件数</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.transactionCount}件</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border">
          <div className="flex gap-2">
            {['all', 'succeeded', 'pending', 'failed', 'refunded'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  filter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? '全て' : status === 'succeeded' ? '成功' : status === 'pending' ? '保留' : status === 'failed' ? '失敗' : '返金'}
              </button>
            ))}
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 pt-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">決済履歴</h2>
            {loading ? (
              <div className="text-center py-8">読込中...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">決済履歴がありません</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-gray-900">日時</th>
                      <th className="text-left py-3 px-4 text-gray-900">会員名</th>
                      <th className="text-left py-3 px-4 text-gray-900">種類</th>
                      <th className="text-left py-3 px-4 text-gray-900">金額</th>
                      <th className="text-left py-3 px-4 text-gray-900">ステータス</th>
                      <th className="text-left py-3 px-4 text-gray-900">説明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(payment => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">
                          {payment.createdAt.toLocaleDateString('ja-JP')}
                          <br />
                          <span className="text-gray-500 text-xs">
                            {payment.createdAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3 px-4">{payment.memberName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {payment.type === 'session' ? 'セッション' : payment.type === 'membership' ? '会費' : 'その他'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold">{formatAmount(payment.amount)}</td>
                        <td className="py-3 px-4">{getStatusBadge(payment.status)}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{payment.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-2">💡 決済システムについて</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Stripe連携で安全な決済処理</li>
            <li>• セッション料金の自動徴収</li>
            <li>• 月額会費のサブスクリプション管理</li>
            <li>• 決済履歴の完全トラッキング</li>
            <li>• 自動請求書発行機能（準備中）</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
