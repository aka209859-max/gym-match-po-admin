'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  getCurrentProvider,
  setCurrentProvider,
  getConfiguredProviders,
  checkAllProvidersHealth,
  getFinancialSummary,
  detectDiscrepancies,
  getProviderDisplayName,
  getProviderIcon,
  type AccountingProvider,
} from '@/lib/unified-accounting';
// Report generation temporarily disabled
type AccountingReportData = any;

export default function AccountingPage() {
  const [currentProvider, setCurrentProviderState] = useState<AccountingProvider>('freee');
  const [configuredProviders, setConfiguredProviders] = useState<AccountingProvider[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [discrepancies, setDiscrepancies] = useState<any>(null);
  const [reportData, setReportData] = useState<AccountingReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Get current provider
      const provider = getCurrentProvider();
      setCurrentProviderState(provider);

      // Get configured providers - handle gracefully if fails
      try {
        const providers = await getConfiguredProviders();
        setConfiguredProviders(providers);
      } catch (error) {
        console.log('ℹ️ Could not load configured providers:', error);
        setConfiguredProviders([]);
      }

      // Check health status - handle gracefully if fails
      try {
        const health = await checkAllProvidersHealth();
        setHealthStatus(health);
      } catch (error) {
        console.log('ℹ️ Could not check health status:', error);
        setHealthStatus(null);
      }

      // Load financial data - handle gracefully if fails
      try {
        await loadFinancialData();
      } catch (error) {
        console.log('ℹ️ Could not load financial data:', error);
      }
    } catch (error) {
      console.log('ℹ️ Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialData = async () => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Get financial summary - handle gracefully if fails
      try {
        const summary = await getFinancialSummary(start, end);
        setFinancialData(summary.data);
      } catch (error) {
        console.log('ℹ️ Could not load financial summary:', error);
        setFinancialData(null);
      }

      // Check for discrepancies if both providers are configured
      if (configuredProviders.length >= 2) {
        try {
          const discrepancyResult = await detectDiscrepancies(start, end);
          setDiscrepancies(discrepancyResult);
        } catch (error) {
          console.log('ℹ️ Could not detect discrepancies:', error);
          setDiscrepancies(null);
        }
      }

      // Collect report data - temporarily disabled
      setReportData(null);
    } catch (error) {
      console.log('ℹ️ Error loading financial data:', error);
    }
  };

  const switchProvider = (provider: AccountingProvider) => {
    setCurrentProvider(provider);
    setCurrentProviderState(provider);
    loadFinancialData();
  };

  const handleGenerateExcelReport = () => {
    alert('レポート生成機能は一時的に無効化されています。');
  };

  const handleGeneratePDFReport = () => {
    alert('レポート生成機能は一時的に無効化されています。');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 px-8 pt-12">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">会計統合ダッシュボード</h1>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateExcelReport}
              disabled={!reportData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              📊 Excelレポート
            </button>
            <button
              onClick={handleGeneratePDFReport}
              disabled={!reportData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              📄 PDFレポート
            </button>
          </div>
        </div>

        {/* Provider Selector */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">会計サービス選択</h2>
          <div className="flex gap-4">
            {(['freee', 'mfcloud'] as AccountingProvider[]).map((provider) => {
              const isConfigured = configuredProviders.includes(provider);
              const isCurrent = provider === currentProvider;
              const health = healthStatus?.[provider];

              return (
                <button
                  key={provider}
                  onClick={() => switchProvider(provider)}
                  disabled={!isConfigured}
                  className={`
                    flex-1 p-4 rounded-lg border-2 transition-all
                    ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                    ${!isConfigured ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}
                  `}
                >
                  <div className="text-2xl mb-2">{getProviderIcon(provider)}</div>
                  <div className="font-semibold text-gray-900">{getProviderDisplayName(provider)}</div>
                  {isConfigured ? (
                    <div className={`text-sm mt-2 ${health?.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                      {health?.isHealthy ? '✅ 接続済み' : '⚠️ エラー'}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 mt-2">未設定</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">期間選択</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <button
              onClick={loadFinancialData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              更新
            </button>
          </div>
        </div>

        {/* Financial Summary */}
        {financialData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-900 mb-2">総収益</div>
              <div className="text-3xl font-bold text-green-600">
                ¥{financialData.totalRevenue.toLocaleString()}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-900 mb-2">総経費</div>
              <div className="text-3xl font-bold text-red-600">
                ¥{financialData.totalExpense.toLocaleString()}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-900 mb-2">純利益</div>
              <div className={`text-3xl font-bold ${financialData.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ¥{financialData.netProfit.toLocaleString()}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-900 mb-2">取引件数</div>
              <div className="text-3xl font-bold text-gray-800">
                {(financialData.revenueCount + financialData.expenseCount).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Discrepancy Alert */}
        {discrepancies && discrepancies.hasDiscrepancies && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">⚠️</span>
              <h3 className="text-lg font-semibold text-yellow-800">
                データ差異検知
              </h3>
            </div>
            <p className="text-sm text-yellow-700 mb-4">
              freeeとMFクラウド間でデータの差異が検出されました。
            </p>
            <div className="space-y-2">
              {discrepancies.discrepancies.map((disc: any, index: number) => (
                <div key={index} className="bg-white rounded p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {disc.type === 'revenue' ? '収益' : disc.type === 'expense' ? '経費' : '利益'}
                    </span>
                    <span className="text-red-600 font-semibold">
                      差額: ¥{Math.abs(disc.difference).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-900 mt-2 flex justify-between">
                    <span>freee: ¥{disc.freeeValue.toLocaleString()}</span>
                    <span>MF: ¥{disc.mfcloudValue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Data Preview */}
        {reportData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">レポートプレビュー</h2>
            
            {/* Monthly Trends */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">月次推移</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">月</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">収益</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">経費</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">利益</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthlyTrends.map((trend, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {trend.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                          ¥{trend.revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                          ¥{trend.expense.toLocaleString()}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${trend.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          ¥{trend.profit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Revenue Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-3">カテゴリ別収益</h3>
                <div className="space-y-2">
                  {reportData.revenueByCategory.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">{item.category}</span>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          ¥{item.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-3">カテゴリ別経費</h3>
                <div className="space-y-2">
                  {reportData.expenseByCategory.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">{item.category}</span>
                      <div className="text-right">
                        <div className="font-semibold text-red-600">
                          ¥{item.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
