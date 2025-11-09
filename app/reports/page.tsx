'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  generateMonthlyReport,
  generateSessionReport,
  getAvailableMonths,
} from '@/lib/reports/report-generator';
import {
  generateMonthlyReportPDF,
  generateSessionReportPDF,
} from '@/lib/reports/pdf-generator';
import {
  generateMonthlyReportExcel,
  generateSessionReportExcel,
} from '@/lib/reports/excel-generator';

type ReportType = 'monthly' | 'session' | 'trainer';

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated, gymId, gymName } = useAuth();
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number } | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const availableMonths = getAvailableMonths();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Set default month to current month
    const now = new Date();
    setSelectedMonth({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });

    // Set default date range to current month
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const handleGeneratePDF = async () => {
    if (!gymId || !gymName) {
      setError('ジム情報が取得できません');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      if (selectedReportType === 'monthly') {
        if (!selectedMonth) {
          setError('対象月を選択してください');
          return;
        }

        // Generate report data
        const reportData = await generateMonthlyReport(
          gymId,
          gymName,
          selectedMonth.year,
          selectedMonth.month
        );

        // Generate PDF
        const filename = `月次レポート_${reportData.reportMonth}.pdf`;
        await generateMonthlyReportPDF(reportData, filename);

        setSuccess(`✅ PDF生成成功: ${filename}`);
      } else if (selectedReportType === 'session') {
        if (!startDate || !endDate) {
          setError('期間を選択してください');
          return;
        }

        // Generate session report
        const reportData = await generateSessionReport(
          gymId,
          gymName,
          new Date(startDate),
          new Date(endDate)
        );

        // Generate PDF
        const filename = `セッション一覧_${startDate}_${endDate}.pdf`;
        await generateSessionReportPDF(reportData, filename);

        setSuccess(`✅ PDF生成成功: ${filename}`);
      }
    } catch (err) {
      console.error('❌ PDF generation error:', err);
      setError(`PDF生成エラー: ${err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateExcel = async () => {
    if (!gymId || !gymName) {
      setError('ジム情報が取得できません');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      if (selectedReportType === 'monthly') {
        if (!selectedMonth) {
          setError('対象月を選択してください');
          return;
        }

        // Generate report data
        const reportData = await generateMonthlyReport(
          gymId,
          gymName,
          selectedMonth.year,
          selectedMonth.month
        );

        // Generate Excel
        const filename = `月次レポート_${reportData.reportMonth}.xlsx`;
        generateMonthlyReportExcel(reportData, filename);

        setSuccess(`✅ Excel生成成功: ${filename}`);
      } else if (selectedReportType === 'session') {
        if (!startDate || !endDate) {
          setError('期間を選択してください');
          return;
        }

        // Generate session report
        const reportData = await generateSessionReport(
          gymId,
          gymName,
          new Date(startDate),
          new Date(endDate)
        );

        // Generate Excel
        const filename = `セッション一覧_${startDate}_${endDate}.xlsx`;
        generateSessionReportExcel(reportData, filename);

        setSuccess(`✅ Excel生成成功: ${filename}`);
      }
    } catch (err) {
      console.error('❌ Excel generation error:', err);
      setError(`Excel生成エラー: ${err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📄 レポート生成</h1>
          <p className="text-gray-600 mt-2">
            月次レポートやセッション一覧をPDF・Excelで出力できます
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Report Type Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">レポートタイプ</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedReportType('monthly')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedReportType === 'monthly'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedReportType === 'monthly' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <svg className={`w-6 h-6 ${
                    selectedReportType === 'monthly' ? 'text-blue-600' : 'text-gray-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">月次レポート</h3>
                  <p className="text-sm text-gray-600">売上サマリー・トレーナー別実績</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedReportType('session')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedReportType === 'session'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedReportType === 'session' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <svg className={`w-6 h-6 ${
                    selectedReportType === 'session' ? 'text-blue-600' : 'text-gray-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">セッション一覧</h3>
                  <p className="text-sm text-gray-600">期間指定でセッション詳細出力</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">レポート設定</h2>

          {selectedReportType === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">対象月</label>
              <select
                value={selectedMonth ? `${selectedMonth.year}-${selectedMonth.month}` : ''}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-').map(Number);
                  setSelectedMonth({ year, month });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableMonths.map((month) => (
                  <option key={`${month.year}-${month.month}`} value={`${month.year}-${month.month}`}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedReportType === 'session' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">開始日</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">終了日</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">出力形式</h2>
          
          <div className="flex gap-4">
            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="flex-1 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {isGenerating ? '生成中...' : 'PDF出力'}
            </button>

            <button
              onClick={handleGenerateExcel}
              disabled={isGenerating}
              className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isGenerating ? '生成中...' : 'Excel出力'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">レポート生成について</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>月次レポート:</strong> 売上サマリー、セッションタイプ別内訳、トレーナー別実績、日別売上を含む包括的なレポート</li>
                <li>• <strong>セッション一覧:</strong> 指定期間内の全セッション詳細とタイプ別・トレーナー別サマリー</li>
                <li>• <strong>PDF:</strong> 印刷・プレゼンテーション向け。プロフェッショナルなレイアウト</li>
                <li>• <strong>Excel:</strong> データ分析向け。複数シート、フィルタリング・集計が可能</li>
                <li>• レポートはFirestoreから最新データを自動取得して生成されます</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
