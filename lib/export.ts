// Data Export Functions for GYM MATCH Manager
// Supports CSV, Excel, and JSON formats

import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Member, Session } from './firestore';

// ============================================
// Export Types
// ============================================

export type ExportFormat = 'csv' | 'excel' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// ============================================
// Member Export Functions
// ============================================

/**
 * Export members data to specified format
 * @param members - Array of member data
 * @param options - Export configuration
 */
export function exportMembers(members: Member[], options: ExportOptions): void {
  const { format, filename } = options;

  // Prepare data for export
  const exportData = members.map((member) => ({
    ID: member.id,
    名前: member.name,
    メールアドレス: member.email,
    電話番号: member.phone,
    契約タイプ: member.contractType,
    入会日: formatDate(member.joinDate),
    最終来店日: formatDate(member.lastVisit),
    総セッション数: member.totalSessions,
    ステータス: member.isActive ? 'アクティブ' : '休眠',
  }));

  switch (format) {
    case 'csv':
      exportToCSV(exportData, filename);
      break;
    case 'excel':
      exportToExcel(exportData, filename, '会員データ');
      break;
    case 'json':
      exportToJSON(exportData, filename);
      break;
  }
}

// ============================================
// Session Export Functions
// ============================================

/**
 * Export sessions data to specified format
 * @param sessions - Array of session data
 * @param options - Export configuration
 */
export function exportSessions(
  sessions: Session[],
  options: ExportOptions
): void {
  const { format, filename, dateRange } = options;

  // Filter by date range if specified
  let filteredSessions = sessions;
  if (dateRange) {
    filteredSessions = sessions.filter((session) => {
      const sessionDate = session.date;
      return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
    });
  }

  // Prepare data for export
  const exportData = filteredSessions.map((session) => ({
    ID: session.id,
    会員名: session.userName,
    会員ID: session.userId,
    日時: formatDateTime(session.date),
    時間: `${session.duration}分`,
    タイプ: session.type,
    ステータス: getStatusLabel(session.status),
  }));

  switch (format) {
    case 'csv':
      exportToCSV(exportData, filename);
      break;
    case 'excel':
      exportToExcel(exportData, filename, 'セッションデータ');
      break;
    case 'json':
      exportToJSON(exportData, filename);
      break;
  }
}

// ============================================
// Revenue Export Functions
// ============================================

export interface RevenueData {
  month: string;
  totalRevenue: number;
  sessionsCount: number;
  averagePerSession: number;
}

/**
 * Export revenue data to specified format
 * @param revenueData - Array of revenue data
 * @param options - Export configuration
 */
export function exportRevenue(
  revenueData: RevenueData[],
  options: ExportOptions
): void {
  const { format, filename } = options;

  // Prepare data for export
  const exportData = revenueData.map((item) => ({
    月: item.month,
    総売上: `¥${item.totalRevenue.toLocaleString()}`,
    セッション数: item.sessionsCount,
    平均単価: `¥${item.averagePerSession.toLocaleString()}`,
  }));

  switch (format) {
    case 'csv':
      exportToCSV(exportData, filename);
      break;
    case 'excel':
      exportToExcel(exportData, filename, '売上データ');
      break;
    case 'json':
      exportToJSON(exportData, filename);
      break;
  }
}

// ============================================
// Core Export Functions
// ============================================

/**
 * Export data to CSV format
 */
function exportToCSV(data: any[], filename: string): void {
  const csv = Papa.unparse(data, {
    header: true,
    encoding: 'utf-8',
  });

  // Add BOM for proper Japanese character encoding in Excel
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${filename}.csv`);
}

/**
 * Export data to Excel format
 */
function exportToExcel(
  data: any[],
  filename: string,
  sheetName: string
): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadFile(blob, `${filename}.xlsx`);
}

/**
 * Export data to JSON format
 */
function exportToJSON(data: any[], filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  downloadFile(blob, `${filename}.json`);
}

/**
 * Trigger file download in browser
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date and time to YYYY-MM-DD HH:MM
 */
function formatDateTime(date: Date): string {
  const dateStr = formatDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Get Japanese label for session status
 */
function getStatusLabel(
  status: 'completed' | 'cancelled' | 'upcoming'
): string {
  const labels = {
    completed: '完了',
    cancelled: 'キャンセル',
    upcoming: '予定',
  };
  return labels[status] || status;
}
