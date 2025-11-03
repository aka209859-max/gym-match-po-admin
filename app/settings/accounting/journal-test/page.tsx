'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Session {
  id: string;
  memberName: string;
  trainerName: string;
  type: 'personal' | 'group' | 'trial' | 'consultation';
  price: number;
  date: Date;
  status: 'completed';
}

interface JournalEntry {
  session_id: string;
  issue_date: string;
  type: 'income';
  company_id: number;
  details: Array<{
    account_item_id: number;
    account_item_name: string;
    tax_code: number;
    amount: number;
    entry_side: 'debit' | 'credit';
    description: string;
  }>;
}

export default function JournalTestPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [testResult, setTestResult] = useState<{
    success: number;
    failed: number;
    details: Array<{ session_id: string; status: 'success' | 'failed'; message: string }>;
  } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      checkConnection();
      loadCompletedSessions();
    }
  }, [isAuthenticated]);

  const checkConnection = () => {
    // Check if freee is connected
    const demoMode = localStorage.getItem('freee_demo_mode');
    const company = localStorage.getItem('freee_company_name');
    
    if (demoMode === 'true') {
      setIsConnected(true);
      setCompanyName(company || 'デモ会社');
    } else {
      setIsConnected(false);
    }
  };

  const loadCompletedSessions = () => {
    // Load completed sessions (demo data)
    const demoSessions: Session[] = [
      {
        id: 'ses_001',
        memberName: '山田太郎',
        trainerName: '田中健太',
        type: 'personal',
        price: 18000,
        date: new Date('2024-01-15'),
        status: 'completed',
      },
      {
        id: 'ses_002',
        memberName: '佐藤花子',
        trainerName: '佐藤美咲',
        type: 'personal',
        price: 18000,
        date: new Date('2024-01-15'),
        status: 'completed',
      },
      {
        id: 'ses_003',
        memberName: '鈴木一郎',
        trainerName: '鈴木大輔',
        type: 'group',
        price: 8000,
        date: new Date('2024-01-16'),
        status: 'completed',
      },
      {
        id: 'ses_004',
        memberName: '田中美咲',
        trainerName: '高橋愛',
        type: 'trial',
        price: 5000,
        date: new Date('2024-01-16'),
        status: 'completed',
      },
      {
        id: 'ses_005',
        memberName: '高橋健太',
        trainerName: '渡辺翔太',
        type: 'personal',
        price: 18000,
        date: new Date('2024-01-17'),
        status: 'completed',
      },
    ];

    setSessions(demoSessions);
  };

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const selectAllSessions = () => {
    setSelectedSessions(sessions.map((s) => s.id));
  };

  const deselectAllSessions = () => {
    setSelectedSessions([]);
  };

  const generateJournalEntry = (session: Session): JournalEntry => {
    const typeNames = {
      personal: 'パーソナルトレーニング',
      group: 'グループトレーニング',
      trial: '体験トレーニング',
      consultation: 'カウンセリング',
    };

    return {
      session_id: session.id,
      issue_date: session.date.toISOString().split('T')[0],
      type: 'income',
      company_id: 1, // Demo company ID
      details: [
        {
          account_item_id: 1,
          account_item_name: '現金',
          tax_code: 1,
          amount: session.price,
          entry_side: 'debit',
          description: `${typeNames[session.type]}売上（${session.memberName}）`,
        },
        {
          account_item_id: 2,
          account_item_name: '売上高',
          tax_code: 1,
          amount: session.price,
          entry_side: 'credit',
          description: `${typeNames[session.type]}売上（${session.memberName}）`,
        },
      ],
    };
  };

  const handleTestJournal = async () => {
    if (selectedSessions.length === 0) {
      alert('仕訳対象のセッションを選択してください');
      return;
    }

    if (!confirm(`${selectedSessions.length}件のセッションをfreeeに仕訳登録します。よろしいですか？`)) {
      return;
    }

    setIsProcessing(true);
    setProcessProgress(0);
    setTestResult(null);

    const selectedSessionData = sessions.filter((s) => selectedSessions.includes(s.id));
    const results: Array<{ session_id: string; status: 'success' | 'failed'; message: string }> = [];

    for (let i = 0; i < selectedSessionData.length; i++) {
      const session = selectedSessionData[i];
      
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        const journalEntry = generateJournalEntry(session);
        
        console.log('📝 Generated Journal Entry:', journalEntry);

        // Simulate freee API call (demo mode)
        const success = Math.random() > 0.1; // 90% success rate for demo

        if (success) {
          results.push({
            session_id: session.id,
            status: 'success',
            message: `仕訳登録成功: ${session.memberName} - ¥${session.price.toLocaleString()}`,
          });
        } else {
          results.push({
            session_id: session.id,
            status: 'failed',
            message: `仕訳登録失敗: ${session.memberName} - エラー: 勘定科目が見つかりません`,
          });
        }
      } catch (error) {
        results.push({
          session_id: session.id,
          status: 'failed',
          message: `仕訳登録失敗: ${session.memberName} - エラー: ${error}`,
        });
      }

      setProcessProgress(((i + 1) / selectedSessionData.length) * 100);
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;

    setTestResult({
      success: successCount,
      failed: failedCount,
      details: results,
    });

    setIsProcessing(false);
    setSelectedSessions([]);
  };

  const getSessionTypeLabel = (type: Session['type']) => {
    const labels = {
      personal: 'パーソナル',
      group: 'グループ',
      trial: '体験',
      consultation: 'カウンセリング',
    };
    return labels[type];
  };

  const getSessionTypeBadge = (type: Session['type']) => {
    const colors = {
      personal: 'bg-blue-100 text-blue-700',
      group: 'bg-purple-100 text-purple-700',
      trial: 'bg-orange-100 text-orange-700',
      consultation: 'bg-green-100 text-green-700',
    };
    return colors[type];
  };

  if (!isConnected) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">freee連携が必要です</h2>
            </div>
            <p className="text-gray-700 mb-4">
              自動仕訳テストを行うには、freee会計との連携が必要です。
            </p>
            <button
              onClick={() => router.push('/settings/accounting')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              会計連携設定に移動
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => router.push('/settings/accounting')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 戻る
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">💰 自動仕訳テスト</h1>
          <p className="text-gray-600 mt-2">
            完了済みセッションをfreee会計に自動で仕訳登録します
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-900">
              freee会計と連携中: {companyName}
            </span>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 処理結果</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">処理件数</p>
                <p className="text-2xl font-bold text-gray-900">{testResult.success + testResult.failed}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 mb-1">成功</p>
                <p className="text-2xl font-bold text-green-700">{testResult.success}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-600 mb-1">失敗</p>
                <p className="text-2xl font-bold text-red-700">{testResult.failed}</p>
              </div>
            </div>

            <div className="space-y-2">
              {testResult.details.map((detail, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    detail.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {detail.status === 'success' ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <p className={`text-sm ${detail.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                      {detail.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">完了済みセッション一覧</h2>
            <div className="flex gap-2">
              <button
                onClick={selectAllSessions}
                className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
              >
                全て選択
              </button>
              <button
                onClick={deselectAllSessions}
                className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                選択解除
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedSessions.includes(session.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => toggleSessionSelection(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedSessions.includes(session.id)}
                      onChange={() => toggleSessionSelection(session.id)}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{session.memberName}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getSessionTypeBadge(session.type)}`}>
                          {getSessionTypeLabel(session.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        トレーナー: {session.trainerName} | 日付: {session.date.toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">¥{session.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedSessions.length > 0 && (
                <span>
                  {selectedSessions.length}件選択中 - 合計: ¥
                  {sessions
                    .filter((s) => selectedSessions.includes(s.id))
                    .reduce((sum, s) => sum + s.price, 0)
                    .toLocaleString()}
                </span>
              )}
            </div>
            <button
              onClick={handleTestJournal}
              disabled={selectedSessions.length === 0 || isProcessing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isProcessing ? '処理中...' : 'freeeに仕訳登録'}
            </button>
          </div>
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">処理中...</h3>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${processProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">{Math.round(processProgress)}%</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">仕訳登録について</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• 選択したセッションの売上がfreee会計に自動登録されます</li>
                <li>• 借方：現金 / 貸方：売上高 の形式で仕訳されます</li>
                <li>• 摘要にはセッションタイプと会員名が記載されます</li>
                <li>• デモモードでは実際のAPIは呼ばれません（シミュレーション）</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
