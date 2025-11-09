// Workout Log Management Library
// Phase 7: トレーニング記録管理（会員共有機能）

import { db } from './firebase';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// ============================================
// Types & Interfaces
// ============================================

export interface Exercise {
  name: string;          // 種目名（例: ベンチプレス）
  weight?: number;       // 重量（kg）
  reps?: number;         // 回数
  sets?: number;         // セット数
  duration?: number;     // 時間（分）- 有酸素運動など
  distance?: number;     // 距離（km）- ランニングなど
  notes?: string;        // メモ
}

export interface BodyMetrics {
  weight?: number;       // 体重（kg）
  bodyFat?: number;      // 体脂肪率（%）
  muscleMass?: number;   // 筋肉量（kg）
  bmi?: number;          // BMI
  visceralFat?: number;  // 内臓脂肪レベル
}

export interface WorkoutLog {
  exercises: Exercise[];              // 実施メニュー
  bodyMetrics?: BodyMetrics;          // 体組成データ
  trainerNotes: string;               // トレーナーメモ
  memberFeedback?: string;            // 会員フィードバック（後で追加可能）
  photos?: string[];                  // 記録写真URL
  intensity?: 'low' | 'medium' | 'high'; // トレーニング強度
  satisfaction?: 1 | 2 | 3 | 4 | 5;  // 会員満足度（1-5）
}

export interface SessionWithLog {
  id: string;
  gymId: string;
  memberId: string;
  memberName: string;
  memberEmail?: string;  // Phase 7: メールアドレス連携用
  trainerId: string;
  trainerName: string;
  date: Date;
  duration: number;
  sessionType: string;
  status: string;
  workoutLog?: WorkoutLog;
  sharedWithMember: boolean;
  sharedAt?: Date;
  memberViewed: boolean;
  memberViewedAt?: Date;
}

export interface WorkoutLogInput {
  sessionId: string;
  exercises: Exercise[];
  bodyMetrics?: BodyMetrics;
  trainerNotes: string;
  intensity?: 'low' | 'medium' | 'high';
  shareWithMember?: boolean;  // 即座に会員に共有するか
}

// ============================================
// Workout Log CRUD Operations
// ============================================

/**
 * セッションにトレーニング記録を追加
 * @param input - トレーニング記録入力
 * @returns 更新されたセッション
 */
export async function addWorkoutLog(
  input: WorkoutLogInput
): Promise<SessionWithLog> {
  const sessionRef = doc(db, 'sessions', input.sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) {
    throw new Error('セッションが見つかりません');
  }

  const sessionData = sessionSnap.data();
  const memberId = sessionData.memberId;

  // Phase 7: 会員のメールアドレスを取得
  let memberEmail = sessionData.memberEmail || '';
  
  // memberEmailが空の場合、usersコレクションから取得を試みる
  if (!memberEmail && memberId) {
    try {
      const memberRef = doc(db, 'users', memberId);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        memberEmail = memberSnap.data().email || '';
      }
    } catch (e) {
      console.warn('会員メールアドレス取得失敗:', e);
    }
  }

  // undefined を除外したworkoutLogを作成
  const workoutLog: any = {
    exercises: input.exercises,
    trainerNotes: input.trainerNotes,
  };

  // オプショナルフィールドは値がある場合のみ追加
  if (input.bodyMetrics && Object.keys(input.bodyMetrics).length > 0) {
    workoutLog.bodyMetrics = input.bodyMetrics;
  }
  if (input.intensity) {
    workoutLog.intensity = input.intensity;
  }

  const updateData: any = {
    workoutLog,
    updatedAt: serverTimestamp(),
  };

  // Phase 7: memberEmailを常に保存（トレーニング記録と同時に保存）
  if (memberEmail) {
    updateData.memberEmail = memberEmail;
  }

  // 会員に共有する場合
  if (input.shareWithMember) {
    updateData.sharedWithMember = true;
    updateData.sharedAt = serverTimestamp();
    updateData.memberViewed = false;
  }

  await updateDoc(sessionRef, updateData);

  // 更新後のデータを取得
  const updatedSnap = await getDoc(sessionRef);
  return convertSessionDoc(updatedSnap);
}

/**
 * トレーニング記録を更新
 * @param sessionId - セッションID
 * @param workoutLog - 更新するトレーニング記録
 */
export async function updateWorkoutLog(
  sessionId: string,
  workoutLog: Partial<WorkoutLog>
): Promise<void> {
  const sessionRef = doc(db, 'sessions', sessionId);
  
  await updateDoc(sessionRef, {
    workoutLog,
    updatedAt: serverTimestamp(),
  });
}

/**
 * トレーニング記録を会員に共有
 * @param sessionId - セッションID
 */
export async function shareWorkoutLogWithMember(
  sessionId: string
): Promise<void> {
  const sessionRef = doc(db, 'sessions', sessionId);
  
  await updateDoc(sessionRef, {
    sharedWithMember: true,
    sharedAt: serverTimestamp(),
    memberViewed: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 会員が記録を閲覧したことをマーク
 * @param sessionId - セッションID
 */
export async function markWorkoutLogAsViewed(
  sessionId: string
): Promise<void> {
  const sessionRef = doc(db, 'sessions', sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) return;

  const data = sessionSnap.data();
  
  // 初回閲覧のみ記録
  if (!data.memberViewed) {
    await updateDoc(sessionRef, {
      memberViewed: true,
      memberViewedAt: serverTimestamp(),
    });
  }
}

// ============================================
// Query Functions
// ============================================

/**
 * 会員のトレーニング履歴を取得（共有済みのみ）
 * @param memberId - 会員ID
 * @param gymId - ジムID
 * @returns トレーニング履歴リスト
 */
export async function getMemberWorkoutHistory(
  memberId: string,
  gymId: string
): Promise<SessionWithLog[]> {
  const q = query(
    collection(db, 'sessions'),
    where('gymId', '==', gymId),
    where('memberId', '==', memberId),
    where('sharedWithMember', '==', true),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(convertSessionDoc);
}

/**
 * メールアドレスで会員のトレーニング履歴を取得（Phase 7: GYM MATCH連携用）
 * @param memberEmail - 会員メールアドレス
 * @returns トレーニング履歴リスト
 */
export async function getMemberWorkoutHistoryByEmail(
  memberEmail: string
): Promise<SessionWithLog[]> {
  const q = query(
    collection(db, 'sessions'),
    where('memberEmail', '==', memberEmail),
    where('sharedWithMember', '==', true),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(convertSessionDoc);
}

/**
 * 特定セッションのトレーニング記録を取得
 * @param sessionId - セッションID
 * @returns セッション情報（トレーニング記録含む）
 */
export async function getSessionWorkoutLog(
  sessionId: string
): Promise<SessionWithLog | null> {
  const sessionRef = doc(db, 'sessions', sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) {
    return null;
  }

  return convertSessionDoc(sessionSnap);
}

/**
 * 未閲覧のトレーニング記録数を取得
 * @param memberId - 会員ID
 * @param gymId - ジムID
 * @returns 未閲覧件数
 */
export async function getUnviewedWorkoutCount(
  memberId: string,
  gymId: string
): Promise<number> {
  const q = query(
    collection(db, 'sessions'),
    where('gymId', '==', gymId),
    where('memberId', '==', memberId),
    where('sharedWithMember', '==', true),
    where('memberViewed', '==', false)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

// ============================================
// Analytics Functions
// ============================================

/**
 * 体組成の推移データを取得
 * @param sessions - セッションリスト
 * @returns 体組成推移データ
 */
export function getBodyMetricsTrends(
  sessions: SessionWithLog[]
): Array<{
  date: string;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
}> {
  return sessions
    .filter(s => s.workoutLog?.bodyMetrics)
    .map(s => ({
      date: s.date.toISOString().split('T')[0],
      weight: s.workoutLog?.bodyMetrics?.weight,
      bodyFat: s.workoutLog?.bodyMetrics?.bodyFat,
      muscleMass: s.workoutLog?.bodyMetrics?.muscleMass,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 種目別の最大重量を計算
 * @param sessions - セッションリスト
 * @returns 種目別最大重量マップ
 */
export function getPersonalRecords(
  sessions: SessionWithLog[]
): Map<string, { weight: number; date: Date }> {
  const records = new Map<string, { weight: number; date: Date }>();

  sessions.forEach(session => {
    if (!session.workoutLog?.exercises) return;

    session.workoutLog.exercises.forEach(exercise => {
      if (!exercise.weight) return;

      const existing = records.get(exercise.name);
      if (!existing || exercise.weight > existing.weight) {
        records.set(exercise.name, {
          weight: exercise.weight,
          date: session.date,
        });
      }
    });
  });

  return records;
}

/**
 * トレーニング統計を計算
 * @param sessions - セッションリスト
 * @returns 統計データ
 */
export function calculateWorkoutStats(
  sessions: SessionWithLog[]
): {
  totalSessions: number;
  totalDuration: number;
  averageDuration: number;
  thisMonthSessions: number;
  exerciseFrequency: Map<string, number>;
} {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthSessions = sessions.filter(
    s => s.date >= thisMonthStart
  ).length;

  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);

  const exerciseFrequency = new Map<string, number>();
  sessions.forEach(session => {
    session.workoutLog?.exercises.forEach(exercise => {
      const count = exerciseFrequency.get(exercise.name) || 0;
      exerciseFrequency.set(exercise.name, count + 1);
    });
  });

  return {
    totalSessions: sessions.length,
    totalDuration,
    averageDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
    thisMonthSessions,
    exerciseFrequency,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Firestoreドキュメントをセッションオブジェクトに変換
 */
function convertSessionDoc(doc: any): SessionWithLog {
  const data = doc.data();
  return {
    id: doc.id,
    gymId: data.gymId,
    memberId: data.memberId,
    memberName: data.memberName || '',
    memberEmail: data.memberEmail || '',  // Phase 7: メールアドレス連携
    trainerId: data.trainerId,
    trainerName: data.trainerName || '',
    date: data.date?.toDate() || new Date(),
    duration: data.duration || 0,
    sessionType: data.sessionType || '',
    status: data.status || 'scheduled',
    workoutLog: data.workoutLog,
    sharedWithMember: data.sharedWithMember || false,
    sharedAt: data.sharedAt?.toDate(),
    memberViewed: data.memberViewed || false,
    memberViewedAt: data.memberViewedAt?.toDate(),
  };
}

/**
 * BMI計算
 * @param weight - 体重（kg）
 * @param height - 身長（cm）
 * @returns BMI値
 */
export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

/**
 * 日付フォーマット
 * @param date - 日付
 * @returns フォーマット済み文字列（例: 2025年2月10日）
 */
export function formatWorkoutDate(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

/**
 * 時刻フォーマット
 * @param date - 日付
 * @returns フォーマット済み文字列（例: 14:00）
 */
export function formatWorkoutTime(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
