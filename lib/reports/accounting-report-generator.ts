// Accounting Report Generator
// Phase 6-2: 自動経理レポート生成（freee + MF両対応）
// Generate Excel and PDF reports with financial analytics

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import {
  getCurrentProvider,
  getFinancialSummary,
  getExpenses,
  getRevenues,
  getProviderDisplayName,
  type AccountingProvider,
} from '../unified-accounting';

// ============================================
// Types & Interfaces
// ============================================

export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
  label: string; // e.g., "2024年1月", "2024年Q1"
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string; // YYYY-MM
  revenue: number;
  expense: number;
  profit: number;
}

export interface AccountingReportData {
  provider: AccountingProvider;
  period: ReportPeriod;
  summary: {
    totalRevenue: number;
    totalExpense: number;
    netProfit: number;
    profitMargin: number; // percentage
  };
  revenueByCategory: CategoryBreakdown[];
  expenseByCategory: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
  generatedAt: Date;
}

// ============================================
// Data Collection
// ============================================

/**
 * Collect accounting data for report
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Report data
 */
export async function collectAccountingData(
  startDate: Date,
  endDate: Date
): Promise<AccountingReportData | null> {
  try {
    const provider = getCurrentProvider();

    // Get financial summary
    const summaryResult = await getFinancialSummary(startDate, endDate);
    if (!summaryResult.success || !summaryResult.data) {
      console.error('Failed to get financial summary:', summaryResult.error);
      return null;
    }

    // Get expenses and revenues
    const [expensesResult, revenuesResult] = await Promise.all([
      getExpenses(startDate, endDate),
      getRevenues(startDate, endDate),
    ]);

    // Calculate profit margin
    const profitMargin = summaryResult.data.totalRevenue > 0
      ? (summaryResult.data.netProfit / summaryResult.data.totalRevenue) * 100
      : 0;

    // Categorize expenses
    const expenseByCategory = calculateCategoryBreakdown(
      expensesResult.data || [],
      summaryResult.data.totalExpense
    );

    // Categorize revenues
    const revenueByCategory = calculateCategoryBreakdown(
      revenuesResult.data || [],
      summaryResult.data.totalRevenue
    );

    // Calculate monthly trends
    const monthlyTrends = calculateMonthlyTrends(
      revenuesResult.data || [],
      expensesResult.data || []
    );

    return {
      provider,
      period: {
        startDate,
        endDate,
        label: formatPeriodLabel(startDate, endDate),
      },
      summary: {
        totalRevenue: summaryResult.data.totalRevenue,
        totalExpense: summaryResult.data.totalExpense,
        netProfit: summaryResult.data.netProfit,
        profitMargin,
      },
      revenueByCategory,
      expenseByCategory,
      monthlyTrends,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error collecting accounting data:', error);
    return null;
  }
}

/**
 * Calculate category breakdown
 * @param items - Revenue or expense items
 * @param total - Total amount
 * @returns Category breakdown
 */
function calculateCategoryBreakdown(
  items: any[],
  total: number
): CategoryBreakdown[] {
  const categoryMap = new Map<string, { amount: number; count: number }>();

  items.forEach((item) => {
    const category = item.category || '未分類';
    const amount = item.amount || 0;

    const existing = categoryMap.get(category) || { amount: 0, count: 0 };
    categoryMap.set(category, {
      amount: existing.amount + amount,
      count: existing.count + 1,
    });
  });

  const breakdown: CategoryBreakdown[] = [];
  categoryMap.forEach((data, category) => {
    breakdown.push({
      category,
      amount: data.amount,
      count: data.count,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
    });
  });

  // Sort by amount descending
  breakdown.sort((a, b) => b.amount - a.amount);

  return breakdown;
}

/**
 * Calculate monthly trends
 * @param revenues - Revenue items
 * @param expenses - Expense items
 * @returns Monthly trends
 */
function calculateMonthlyTrends(
  revenues: any[],
  expenses: any[]
): MonthlyTrend[] {
  const monthMap = new Map<string, { revenue: number; expense: number }>();

  // Process revenues
  revenues.forEach((item) => {
    const month = item.date.substring(0, 7); // YYYY-MM
    const existing = monthMap.get(month) || { revenue: 0, expense: 0 };
    existing.revenue += item.amount || 0;
    monthMap.set(month, existing);
  });

  // Process expenses
  expenses.forEach((item) => {
    const month = item.date.substring(0, 7); // YYYY-MM
    const existing = monthMap.get(month) || { revenue: 0, expense: 0 };
    existing.expense += item.amount || 0;
    monthMap.set(month, existing);
  });

  // Convert to array and calculate profit
  const trends: MonthlyTrend[] = [];
  monthMap.forEach((data, month) => {
    trends.push({
      month,
      revenue: data.revenue,
      expense: data.expense,
      profit: data.revenue - data.expense,
    });
  });

  // Sort by month
  trends.sort((a, b) => a.month.localeCompare(b.month));

  return trends;
}

/**
 * Format period label
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted label
 */
function formatPeriodLabel(startDate: Date, endDate: Date): string {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1;
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth() + 1;

  if (startYear === endYear && startMonth === endMonth) {
    return `${startYear}年${startMonth}月`;
  }

  return `${startYear}年${startMonth}月 - ${endYear}年${endMonth}月`;
}

// ============================================
// Excel Report Generation
// ============================================

/**
 * Generate Excel report
 * @param data - Report data
 * @returns Blob containing Excel file
 */
export function generateExcelReport(data: AccountingReportData): Blob {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['経理レポート'],
    ['期間', data.period.label],
    ['会計サービス', getProviderDisplayName(data.provider)],
    ['生成日時', data.generatedAt.toLocaleString('ja-JP')],
    [],
    ['サマリー'],
    ['総収益', data.summary.totalRevenue, '円'],
    ['総経費', data.summary.totalExpense, '円'],
    ['純利益', data.summary.netProfit, '円'],
    ['利益率', data.summary.profitMargin.toFixed(2), '%'],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'サマリー');

  // Revenue breakdown sheet
  const revenueData = [
    ['カテゴリ別収益'],
    ['カテゴリ', '金額', '件数', '割合(%)'],
    ...data.revenueByCategory.map((item) => [
      item.category,
      item.amount,
      item.count,
      item.percentage.toFixed(2),
    ]),
  ];
  const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
  XLSX.utils.book_append_sheet(workbook, revenueSheet, '収益内訳');

  // Expense breakdown sheet
  const expenseData = [
    ['カテゴリ別経費'],
    ['カテゴリ', '金額', '件数', '割合(%)'],
    ...data.expenseByCategory.map((item) => [
      item.category,
      item.amount,
      item.count,
      item.percentage.toFixed(2),
    ]),
  ];
  const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData);
  XLSX.utils.book_append_sheet(workbook, expenseSheet, '経費内訳');

  // Monthly trends sheet
  const trendsData = [
    ['月次推移'],
    ['月', '収益', '経費', '利益'],
    ...data.monthlyTrends.map((item) => [
      item.month,
      item.revenue,
      item.expense,
      item.profit,
    ]),
  ];
  const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
  XLSX.utils.book_append_sheet(workbook, trendsSheet, '月次推移');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ============================================
// PDF Report Generation
// ============================================

/**
 * Generate PDF report
 * @param data - Report data
 * @returns Blob containing PDF file
 */
export function generatePDFReport(data: AccountingReportData): Blob {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('経理レポート', 20, 25);

  doc.setFontSize(12);
  doc.text(`${data.period.label}`, 20, 33);

  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPosition = 50;

  // Provider and date info
  doc.setFontSize(10);
  doc.text(`会計サービス: ${getProviderDisplayName(data.provider)}`, 20, yPosition);
  yPosition += 7;
  doc.text(`生成日時: ${data.generatedAt.toLocaleString('ja-JP')}`, 20, yPosition);
  yPosition += 15;

  // Summary section
  doc.setFontSize(16);
  doc.text('財務サマリー', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  const summaryItems = [
    ['総収益', `¥${data.summary.totalRevenue.toLocaleString()}`],
    ['総経費', `¥${data.summary.totalExpense.toLocaleString()}`],
    ['純利益', `¥${data.summary.netProfit.toLocaleString()}`],
    ['利益率', `${data.summary.profitMargin.toFixed(2)}%`],
  ];

  summaryItems.forEach(([label, value]) => {
    doc.text(`${label}:`, 30, yPosition);
    doc.text(value, 100, yPosition);
    yPosition += 8;
  });

  yPosition += 10;

  // Revenue breakdown
  doc.setFontSize(16);
  doc.text('カテゴリ別収益', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  data.revenueByCategory.slice(0, 5).forEach((item) => {
    doc.text(item.category, 30, yPosition);
    doc.text(`¥${item.amount.toLocaleString()}`, 100, yPosition);
    doc.text(`${item.percentage.toFixed(1)}%`, 150, yPosition);
    yPosition += 7;
  });

  yPosition += 10;

  // Expense breakdown
  doc.setFontSize(16);
  doc.text('カテゴリ別経費', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  data.expenseByCategory.slice(0, 5).forEach((item) => {
    doc.text(item.category, 30, yPosition);
    doc.text(`¥${item.amount.toLocaleString()}`, 100, yPosition);
    doc.text(`${item.percentage.toFixed(1)}%`, 150, yPosition);
    yPosition += 7;
  });

  // Add new page if needed for monthly trends
  if (yPosition > 240) {
    doc.addPage();
    yPosition = 20;
  }

  yPosition += 10;

  // Monthly trends
  doc.setFontSize(16);
  doc.text('月次推移', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(9);
  doc.text('月', 30, yPosition);
  doc.text('収益', 60, yPosition);
  doc.text('経費', 100, yPosition);
  doc.text('利益', 140, yPosition);
  yPosition += 7;

  data.monthlyTrends.forEach((item) => {
    doc.text(item.month, 30, yPosition);
    doc.text(`¥${(item.revenue / 1000).toFixed(0)}k`, 60, yPosition);
    doc.text(`¥${(item.expense / 1000).toFixed(0)}k`, 100, yPosition);
    
    // Color code profit (green positive, red negative)
    if (item.profit >= 0) {
      doc.setTextColor(0, 128, 0);
    } else {
      doc.setTextColor(255, 0, 0);
    }
    doc.text(`¥${(item.profit / 1000).toFixed(0)}k`, 140, yPosition);
    doc.setTextColor(0, 0, 0);
    
    yPosition += 6;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    'Generated by GYM MATCH Manager - Powered by NexaJP',
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  return doc.output('blob');
}

// ============================================
// Download Utilities
// ============================================

/**
 * Download Excel report
 * @param data - Report data
 * @param filename - Optional filename
 */
export function downloadExcelReport(
  data: AccountingReportData,
  filename?: string
): void {
  const blob = generateExcelReport(data);
  const defaultFilename = `accounting-report-${data.period.startDate.toISOString().split('T')[0]}.xlsx`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultFilename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Download PDF report
 * @param data - Report data
 * @param filename - Optional filename
 */
export function downloadPDFReport(
  data: AccountingReportData,
  filename?: string
): void {
  const blob = generatePDFReport(data);
  const defaultFilename = `accounting-report-${data.period.startDate.toISOString().split('T')[0]}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultFilename;
  link.click();
  URL.revokeObjectURL(url);
}
