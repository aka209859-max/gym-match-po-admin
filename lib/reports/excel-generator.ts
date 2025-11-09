/**
 * Excel Generator for GYM MATCH Manager Reports
 * 
 * Features:
 * - Monthly revenue reports with multiple sheets
 * - Session detail exports
 * - Trainer performance analysis
 * - Formatted cells with colors and borders
 * - Auto-sized columns
 */

import * as XLSX from 'xlsx';

// Report data interfaces (same as PDF)
export interface MonthlyReportData {
  gymName: string;
  reportMonth: string;
  totalRevenue: number;
  totalSessions: number;
  memberCount: number;
  trainerCount: number;
  sessionBreakdown: {
    personal: { count: number; revenue: number };
    group: { count: number; revenue: number };
    trial: { count: number; revenue: number };
  };
  trainerBreakdown: Array<{
    trainerName: string;
    sessions: number;
    revenue: number;
    compensation: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    sessions: number;
  }>;
}

export interface SessionReportData {
  gymName: string;
  startDate: string;
  endDate: string;
  sessions: Array<{
    id: string;
    date: string;
    memberName: string;
    trainerName: string;
    type: string;
    price: number;
    status: string;
  }>;
  totalRevenue: number;
}

/**
 * Generate Monthly Revenue Report Excel
 */
export function generateMonthlyReportExcel(
  data: MonthlyReportData,
  filename?: string
): Blob {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ['GYM MATCH Manager - 月次売上レポート'],
    [],
    ['ジム名', data.gymName],
    ['対象月', data.reportMonth],
    ['レポート作成日', new Date().toLocaleDateString('ja-JP')],
    [],
    ['📊 サマリー'],
    ['総売上', `¥${data.totalRevenue.toLocaleString()}`],
    ['総セッション数', `${data.totalSessions}回`],
    ['会員数', `${data.memberCount}名`],
    ['トレーナー数', `${data.trainerCount}名`],
    [],
    ['📋 セッションタイプ別内訳'],
    ['タイプ', 'セッション数', '売上'],
    ['パーソナル', data.sessionBreakdown.personal.count, data.sessionBreakdown.personal.revenue],
    ['グループ', data.sessionBreakdown.group.count, data.sessionBreakdown.group.revenue],
    ['体験', data.sessionBreakdown.trial.count, data.sessionBreakdown.trial.revenue],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths
  summarySheet['!cols'] = [
    { wch: 20 },
    { wch: 30 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'サマリー');

  // Sheet 2: Trainer Breakdown
  const trainerData = [
    ['👤 トレーナー別実績'],
    [],
    ['トレーナー名', 'セッション数', '売上', '報酬', '売上構成比'],
  ];

  data.trainerBreakdown.forEach((trainer) => {
    const percentage = ((trainer.revenue / data.totalRevenue) * 100).toFixed(1);
    trainerData.push([
      trainer.trainerName,
      trainer.sessions,
      trainer.revenue,
      trainer.compensation,
      `${percentage}%`,
    ]);
  });

  // Add total row
  trainerData.push([
    '合計',
    data.trainerBreakdown.reduce((sum, t) => sum + t.sessions, 0),
    data.trainerBreakdown.reduce((sum, t) => sum + t.revenue, 0),
    data.trainerBreakdown.reduce((sum, t) => sum + t.compensation, 0),
    '100%',
  ]);

  const trainerSheet = XLSX.utils.aoa_to_sheet(trainerData);
  
  trainerSheet['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, trainerSheet, 'トレーナー別');

  // Sheet 3: Daily Revenue
  const dailyData = [
    ['📅 日別売上'],
    [],
    ['日付', '売上', 'セッション数'],
  ];

  data.dailyRevenue.forEach((day) => {
    dailyData.push([
      day.date,
      day.revenue,
      day.sessions,
    ]);
  });

  // Add total row
  dailyData.push([
    '合計',
    data.dailyRevenue.reduce((sum, d) => sum + d.revenue, 0),
    data.dailyRevenue.reduce((sum, d) => sum + d.sessions, 0),
  ]);

  const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
  
  dailySheet['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, dailySheet, '日別売上');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  if (filename) {
    downloadBlob(blob, filename);
  }

  return blob;
}

/**
 * Generate Session List Report Excel
 */
export function generateSessionReportExcel(
  data: SessionReportData,
  filename?: string
): Blob {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Session List
  const sessionData = [
    ['GYM MATCH Manager - セッション一覧レポート'],
    [],
    ['ジム名', data.gymName],
    ['期間', `${data.startDate} 〜 ${data.endDate}`],
    ['総売上', `¥${data.totalRevenue.toLocaleString()}`],
    ['総セッション数', `${data.sessions.length}回`],
    [],
    ['日付', '会員名', 'トレーナー名', 'タイプ', '金額', 'ステータス'],
  ];

  data.sessions.forEach((session) => {
    sessionData.push([
      session.date,
      session.memberName,
      session.trainerName,
      session.type,
      session.price,
      session.status,
    ]);
  });

  const sessionSheet = XLSX.utils.aoa_to_sheet(sessionData);
  
  sessionSheet['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, sessionSheet, 'セッション一覧');

  // Sheet 2: Summary by Type
  const typeCount: Record<string, { count: number; revenue: number }> = {};
  
  data.sessions.forEach((session) => {
    if (!typeCount[session.type]) {
      typeCount[session.type] = { count: 0, revenue: 0 };
    }
    typeCount[session.type].count++;
    typeCount[session.type].revenue += session.price;
  });

  const typeData = [
    ['タイプ別サマリー'],
    [],
    ['タイプ', 'セッション数', '売上', '平均単価'],
  ];

  Object.entries(typeCount).forEach(([type, stats]) => {
    const avgPrice = stats.revenue / stats.count;
    typeData.push([
      type,
      stats.count,
      stats.revenue,
      Math.round(avgPrice),
    ]);
  });

  const typeSheet = XLSX.utils.aoa_to_sheet(typeData);
  
  typeSheet['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, typeSheet, 'タイプ別');

  // Sheet 3: Summary by Trainer
  const trainerCount: Record<string, { count: number; revenue: number }> = {};
  
  data.sessions.forEach((session) => {
    if (!trainerCount[session.trainerName]) {
      trainerCount[session.trainerName] = { count: 0, revenue: 0 };
    }
    trainerCount[session.trainerName].count++;
    trainerCount[session.trainerName].revenue += session.price;
  });

  const trainerData = [
    ['トレーナー別サマリー'],
    [],
    ['トレーナー名', 'セッション数', '売上', '平均単価'],
  ];

  Object.entries(trainerCount).forEach(([trainer, stats]) => {
    const avgPrice = stats.revenue / stats.count;
    trainerData.push([
      trainer,
      stats.count,
      stats.revenue,
      Math.round(avgPrice),
    ]);
  });

  const trainerSheet = XLSX.utils.aoa_to_sheet(trainerData);
  
  trainerSheet['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, trainerSheet, 'トレーナー別');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  if (filename) {
    downloadBlob(blob, filename);
  }

  return blob;
}

/**
 * Generate Trainer Performance Report Excel
 */
export function generateTrainerPerformanceExcel(
  trainerName: string,
  startDate: string,
  endDate: string,
  sessions: Array<{
    date: string;
    memberName: string;
    type: string;
    price: number;
    compensation: number;
  }>,
  filename?: string
): Blob {
  const workbook = XLSX.utils.book_new();

  const totalRevenue = sessions.reduce((sum, s) => sum + s.price, 0);
  const totalCompensation = sessions.reduce((sum, s) => sum + s.compensation, 0);

  // Sheet 1: Summary
  const summaryData = [
    ['GYM MATCH Manager - トレーナーパフォーマンスレポート'],
    [],
    ['トレーナー名', trainerName],
    ['期間', `${startDate} 〜 ${endDate}`],
    ['レポート作成日', new Date().toLocaleDateString('ja-JP')],
    [],
    ['📊 実績サマリー'],
    ['総セッション数', `${sessions.length}回`],
    ['総売上', `¥${totalRevenue.toLocaleString()}`],
    ['総報酬', `¥${totalCompensation.toLocaleString()}`],
    ['平均単価', `¥${Math.round(totalRevenue / sessions.length).toLocaleString()}`],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'サマリー');

  // Sheet 2: Session Details
  const sessionData = [
    ['セッション詳細'],
    [],
    ['日付', '会員名', 'タイプ', '売上', '報酬'],
  ];

  sessions.forEach((session) => {
    sessionData.push([
      session.date,
      session.memberName,
      session.type,
      session.price,
      session.compensation,
    ]);
  });

  // Add total row
  sessionData.push([
    '合計',
    '',
    '',
    totalRevenue,
    totalCompensation,
  ]);

  const sessionSheet = XLSX.utils.aoa_to_sheet(sessionData);
  sessionSheet['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(workbook, sessionSheet, 'セッション詳細');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  if (filename) {
    downloadBlob(blob, filename);
  }

  return blob;
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export session data to CSV (simple format)
 */
export function exportSessionsToCSV(
  sessions: Array<{
    id: string;
    date: string;
    memberName: string;
    trainerName: string;
    type: string;
    price: number;
    status: string;
  }>,
  filename?: string
): Blob {
  const headers = ['ID', '日付', '会員名', 'トレーナー名', 'タイプ', '金額', 'ステータス'];
  const rows = sessions.map((s) => [
    s.id,
    s.date,
    s.memberName,
    s.trainerName,
    s.type,
    s.price.toString(),
    s.status,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });

  if (filename) {
    downloadBlob(blob, filename);
  }

  return blob;
}
