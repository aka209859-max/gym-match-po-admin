// Session Data Types for GYM MATCH Manager
// Sprint 2A: Session Management

export type SessionStatus = 
  | 'scheduled'    // 予約済み
  | 'confirmed'    // 確定
  | 'completed'    // 完了
  | 'cancelled'    // キャンセル
  | 'no-show';     // 無断欠席

export type SessionType = 
  | 'personal'     // パーソナルトレーニング
  | 'group'        // グループレッスン
  | 'trial'        // 体験セッション
  | 'consultation';// カウンセリング

export interface Session {
  id: string;
  memberId: string;
  memberName: string;
  trainerId: string;
  trainerName: string;
  type: SessionType;
  status: SessionStatus;
  scheduledDate: Date;
  startTime: string;        // "09:00" format
  endTime: string;          // "10:00" format
  duration: number;         // minutes
  price: number;            // JPY
  location: string;         // "久留米店" etc
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionFilter {
  status?: SessionStatus[];
  type?: SessionType[];
  trainerId?: string;
  memberId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

export interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  noShowSessions: number;
  totalRevenue: number;
  averageSessionPrice: number;
}

// Session Type Labels (Japanese)
export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  personal: 'パーソナルトレーニング',
  group: 'グループレッスン',
  trial: '体験セッション',
  consultation: 'カウンセリング',
};

// Session Status Labels (Japanese)
export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: '予約済み',
  confirmed: '確定',
  completed: '完了',
  cancelled: 'キャンセル',
  'no-show': '無断欠席',
};

// Session Status Colors (for UI)
export const SESSION_STATUS_COLORS: Record<SessionStatus, {
  bg: string;
  text: string;
  border: string;
}> = {
  scheduled: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  confirmed: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  completed: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
  cancelled: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  'no-show': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
};

// Session Type Colors (for UI)
export const SESSION_TYPE_COLORS: Record<SessionType, {
  bg: string;
  text: string;
}> = {
  personal: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
  },
  group: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
  },
  trial: {
    bg: 'bg-green-100',
    text: 'text-green-800',
  },
  consultation: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
  },
};

// Helper function: Format date for display
export function formatSessionDate(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

// Helper function: Format time range
export function formatSessionTime(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}

// Helper function: Calculate session duration
export function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
}

// Helper function: Check if session is today
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// Helper function: Check if session is upcoming
export function isUpcoming(date: Date): boolean {
  return date > new Date();
}

// Helper function: Check if session is past
export function isPast(date: Date): boolean {
  return date < new Date();
}
