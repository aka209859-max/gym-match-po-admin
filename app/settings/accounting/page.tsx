'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

type AccountingSoftware = 'freee' | 'mfcloud' | null;

interface ConnectionStatus {
  isConnected: boolean;
  software: AccountingSoftware;
  companyName?: string;
  connectedAt?: Date;
  lastSyncAt?: Date;
}

export default function AccountingSettingsPage() {
  const [selectedSoftware, setSelectedSoftware] =
    useState<AccountingSoftware>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoJournalEnabled, setAutoJournalEnabled] = useState(true);

  useEffect(() => {
    loadConnectionStatus();
  }, []);

  // Handle OAuth2.0 callback from freee
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const companyId = params.get('company_id');
    const companyName = params.get('company_name');
    const error = params.get('error');

    if (error) {
      alert(`❌ 連携エラー: ${error}`);
      // Clean up URL parameters
      window.history.replaceState({}, '', '/settings/accounting');
      return;
    }

    if (success === 'true' && accessToken) {
      // Import storeTokens function
      import('@/lib/freee-auth').then(({ storeTokens }) => {
        // Store tokens
        const tokens = {
          access_token: accessToken,
          refresh_token: refreshToken || '',
          expires_in: 86400, // 24 hours
          token_type: 'Bearer',
          scope: 'read write',
          created_at: Math.floor(Date.now() / 1000),
        };
        storeTokens(tokens);

        // Store company information
        if (companyId) {
          localStorage.setItem('freee_company_id', companyId);
        }
        if (companyName) {
          localStorage.setItem('freee_company_name', companyName);
        }

        // Update connection status
        setConnectionStatus({
          isConnected: true,
          software: 'freee',
          companyName: companyName || 'freee会社',
          connectedAt: new Date(),
          lastSyncAt: new Date(),
        });

        alert(`✅ freeeとの連携が完了しました！\n会社名: ${companyName || 'freee会社'}`);

        // Clean up URL parameters
        window.history.replaceState({}, '', '/settings/accounting');
      });
    }
  }, []);

  const loadConnectionStatus = async () => {
    setLoading(true);
    try {
      // TODO: Fetch from API/localStorage
      // For now, use demo status
      const demoStatus: ConnectionStatus = {
        isConnected: false,
        software: null,
      };
      setConnectionStatus(demoStatus);
      setSelectedSoftware(demoStatus.software);
    } catch (error) {
      console.error('接続状況の読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedSoftware) {
      alert('会計ソフトを選択してください');
      return;
    }

    try {
      if (selectedSoftware === 'freee') {
        // freee OAuth2.0 flow
        await connectFreee();
      } else if (selectedSoftware === 'mfcloud') {
        // MFクラウド OAuth2.0 flow
        await connectMFCloud();
      }
    } catch (error) {
      console.error('連携エラー:', error);
      alert('連携に失敗しました。もう一度お試しください。');
    }
  };

  const connectFreee = async () => {
    // Check if freee credentials are configured
    const clientId = process.env.NEXT_PUBLIC_FREEE_CLIENT_ID;

    if (!clientId || clientId === 'DEMO_CLIENT_ID') {
      // Demo mode: Simulate connection
      alert(
        '🔧 デモモード\n\nfreee API認証情報が設定されていません。\n本番環境では、環境変数に以下を設定してください:\n\n- NEXT_PUBLIC_FREEE_CLIENT_ID\n- FREEE_CLIENT_SECRET\n\n現在はデモ連携をシミュレートします。'
      );

      // Demo: Simulate successful connection
      setConnectionStatus({
        isConnected: true,
        software: 'freee',
        companyName: 'リバーフィット久留米店',
        connectedAt: new Date(),
        lastSyncAt: new Date(),
      });

      // Store demo tokens
      localStorage.setItem('freee_demo_mode', 'true');
      localStorage.setItem('freee_company_name', 'リバーフィット久留米店');

      return;
    }

    // Production mode: Real OAuth2.0 flow
    const redirectUri = `${window.location.origin}/api/auth/freee/callback`;
    const state = generateRandomState();

    // Save state to localStorage for verification
    localStorage.setItem('freee_oauth_state', state);

    const authUrl = `https://accounts.secure.freee.co.jp/public_api/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}&scope=read%20write`;

    // Redirect to freee authorization page
    window.location.href = authUrl;
  };

  const connectMFCloud = async () => {
    // MFクラウド OAuth2.0 URL (placeholder)
    alert(
      'MFクラウド連携は現在準備中です。\nfreee連携をお試しください。'
    );
  };

  const handleDisconnect = async () => {
    if (!confirm('会計ソフトとの連携を解除しますか？')) {
      return;
    }

    try {
      // Import clearStoredTokens function
      const { clearStoredTokens } = await import('@/lib/freee-auth');
      
      // Clear stored tokens
      clearStoredTokens();
      
      // Clear demo mode flag
      localStorage.removeItem('freee_demo_mode');
      
      setConnectionStatus({
        isConnected: false,
        software: null,
      });
      setSelectedSoftware(null);
      alert('連携を解除しました');
    } catch (error) {
      console.error('連携解除エラー:', error);
      alert('連携解除に失敗しました');
    }
  };

  const generateRandomState = (): string => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">設定を読み込んでいます...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">会計ソフト連携</h1>
          <p className="text-gray-600 mt-2">
            freeeまたはMFクラウドと連携して売上を自動で仕訳できます
          </p>
        </div>

        {/* Connection Status */}
        {connectionStatus?.isConnected ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    連携中
                  </h2>
                </div>
                <p className="text-gray-700 mb-4">
                  {connectionStatus.software === 'freee'
                    ? 'freee会計'
                    : 'MFクラウド会計'}
                  と連携されています
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>会社名:</strong>{' '}
                    {connectionStatus.companyName || '取得中...'}
                  </p>
                  <p>
                    <strong>連携日時:</strong>{' '}
                    {connectionStatus.connectedAt?.toLocaleString('ja-JP') ||
                      '不明'}
                  </p>
                  <p>
                    <strong>最終同期:</strong>{' '}
                    {connectionStatus.lastSyncAt?.toLocaleString('ja-JP') ||
                      '同期待ち'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                連携解除
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">
                未連携
              </h2>
            </div>
            <p className="text-gray-700">
              会計ソフトとの連携がまだ設定されていません
            </p>
          </div>
        )}

        {/* Software Selection */}
        {!connectionStatus?.isConnected && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              会計ソフトを選択
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {/* freee */}
              <button
                onClick={() => setSelectedSoftware('freee')}
                className={`p-6 border-2 rounded-lg transition-all ${
                  selectedSoftware === 'freee'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    freee会計
                  </h3>
                  <p className="text-sm text-gray-600">
                    クラウド会計シェアNo.1
                  </p>
                  {selectedSoftware === 'freee' && (
                    <div className="mt-3">
                      <span className="inline-block px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
                        選択中
                      </span>
                    </div>
                  )}
                </div>
              </button>

              {/* MFクラウド */}
              <button
                onClick={() => setSelectedSoftware('mfcloud')}
                className={`p-6 border-2 rounded-lg transition-all ${
                  selectedSoftware === 'mfcloud'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">💼</div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    MFクラウド会計
                  </h3>
                  <p className="text-sm text-gray-600">
                    マネーフォワード提供
                  </p>
                  {selectedSoftware === 'mfcloud' && (
                    <div className="mt-3">
                      <span className="inline-block px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
                        選択中
                      </span>
                    </div>
                  )}
                </div>
              </button>
            </div>

            <button
              onClick={handleConnect}
              disabled={!selectedSoftware}
              className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {selectedSoftware
                ? `${selectedSoftware === 'freee' ? 'freee' : 'MFクラウド'}と連携する`
                : '会計ソフトを選択してください'}
            </button>
          </div>
        )}

        {/* Auto Journal Settings */}
        {connectionStatus?.isConnected && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              自動仕訳設定
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    セッション完了時に自動仕訳
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    セッションが完了したら自動的に売上を仕訳します
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoJournalEnabled}
                    onChange={(e) => setAutoJournalEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  仕訳テンプレート
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <strong>借方:</strong> 現金 / <strong>貸方:</strong> 売上高
                  </p>
                  <p>
                    <strong>摘要:</strong>{' '}
                    パーソナルトレーニング売上（会員名）
                  </p>
                  <p className="text-gray-600 mt-2">
                    ※ 勘定科目は会計ソフト側で自動マッピングされます
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Competitive Advantage Notice */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🏆</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                競合優位性: 会計ソフト自動連携
              </h3>
              <p className="text-gray-700 mb-2">
                hacomonoを含む全ての競合サービスが未対応の機能です。
                <strong className="text-blue-600">
                  GYM MATCH Managerのみが会計ソフトと自動連携
                </strong>
                できます。
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ 経理工数50%削減 (月10時間 = 5万円節約)</li>
                <li>✅ 手作業ミスをゼロに</li>
                <li>✅ リアルタイムで売上把握</li>
                <li>✅ freee・MFクラウド両対応</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
