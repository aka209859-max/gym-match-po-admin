/**
 * Automatic Report Generation Logic
 * 
 * Features:
 * - Generate monthly reports from Firestore data
 * - Calculate trainer performance metrics
 * - Aggregate daily revenue
 * - Prepare data for PDF/Excel export
 */

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { MonthlyReportData, SessionReportData } from './pdf-generator';

interface Session {
  id: string;
  date: Date;
  memberName: string;
  trainerName: string;
  trainerId: string;
  type: 'personal' | 'group' | 'trial' | 'consultation';
  price: number;
  status: 'completed' | 'cancelled' | 'scheduled';
}

interface Trainer {
  id: string;
  name: string;
  compensationModel: 'fixed' | 'percentage' | 'tiered';
  fixedRate?: number;
  percentageRate?: number;
  tieredRates?: Array<{ threshold: number; rate: number }>;
}

/**
 * Generate Monthly Report Data from Firestore
 */
export async function generateMonthlyReport(
  gymId: string,
  gymName: string,
  year: number,
  month: number
): Promise<MonthlyReportData> {
  // Calculate date range for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  console.log('📊 Generating monthly report:', { gymId, year, month, startDate, endDate });

  // Fetch completed sessions for the month
  const sessionsQuery = query(
    collection(db, COLLECTIONS.SESSIONS),
    where('gymId', '==', gymId),
    where('status', '==', 'completed')
  );

  const sessionsSnapshot = await getDocs(sessionsQuery);
  const allSessions: Session[] = sessionsSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      let sessionDate: Date;

      if (data.date instanceof Timestamp) {
        sessionDate = data.date.toDate();
      } else if (typeof data.date === 'string') {
        sessionDate = new Date(data.date);
      } else {
        sessionDate = new Date();
      }

      return {
        id: doc.id,
        date: sessionDate,
        memberName: data.memberName || 'Unknown',
        trainerName: data.trainerName || 'Unknown',
        trainerId: data.trainerId || '',
        type: data.type || 'personal',
        price: data.price || 0,
        status: data.status || 'completed',
      };
    })
    .filter((session) => {
      // Filter sessions within the month
      return session.date >= startDate && session.date <= endDate;
    });

  console.log(`✅ Fetched ${allSessions.length} completed sessions for ${year}-${month}`);

  // Calculate session type breakdown
  const sessionBreakdown = {
    personal: { count: 0, revenue: 0 },
    group: { count: 0, revenue: 0 },
    trial: { count: 0, revenue: 0 },
  };

  allSessions.forEach((session) => {
    if (session.type === 'personal') {
      sessionBreakdown.personal.count++;
      sessionBreakdown.personal.revenue += session.price;
    } else if (session.type === 'group') {
      sessionBreakdown.group.count++;
      sessionBreakdown.group.revenue += session.price;
    } else if (session.type === 'trial') {
      sessionBreakdown.trial.count++;
      sessionBreakdown.trial.revenue += session.price;
    }
  });

  // Calculate trainer breakdown
  const trainerMap = new Map<string, {
    trainerName: string;
    sessions: number;
    revenue: number;
  }>();

  allSessions.forEach((session) => {
    const key = session.trainerId || session.trainerName;
    if (!trainerMap.has(key)) {
      trainerMap.set(key, {
        trainerName: session.trainerName,
        sessions: 0,
        revenue: 0,
      });
    }
    const trainer = trainerMap.get(key)!;
    trainer.sessions++;
    trainer.revenue += session.price;
  });

  // Fetch trainer compensation models (simplified for now)
  const trainerBreakdown = Array.from(trainerMap.values()).map((trainer) => {
    // Default compensation: 40% of revenue
    const compensation = Math.round(trainer.revenue * 0.4);
    return {
      ...trainer,
      compensation,
    };
  });

  // Calculate daily revenue
  const dailyRevenueMap = new Map<string, { revenue: number; sessions: number }>();
  
  allSessions.forEach((session) => {
    const dateKey = session.date.toISOString().split('T')[0];
    if (!dailyRevenueMap.has(dateKey)) {
      dailyRevenueMap.set(dateKey, { revenue: 0, sessions: 0 });
    }
    const daily = dailyRevenueMap.get(dateKey)!;
    daily.revenue += session.price;
    daily.sessions++;
  });

  const dailyRevenue = Array.from(dailyRevenueMap.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      sessions: data.sessions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate total revenue
  const totalRevenue = allSessions.reduce((sum, session) => sum + session.price, 0);

  // Fetch member count (approximate)
  const membersQuery = query(
    collection(db, COLLECTIONS.MEMBERS),
    where('gymId', '==', gymId)
  );
  const membersSnapshot = await getDocs(membersQuery);
  const memberCount = membersSnapshot.size;

  // Trainer count
  const trainerCount = trainerMap.size;

  const reportData: MonthlyReportData = {
    gymName,
    reportMonth: `${year}-${String(month).padStart(2, '0')}`,
    totalRevenue,
    totalSessions: allSessions.length,
    memberCount,
    trainerCount,
    sessionBreakdown,
    trainerBreakdown,
    dailyRevenue,
  };

  console.log('✅ Monthly report generated:', reportData);

  return reportData;
}

/**
 * Generate Session Report Data from Firestore
 */
export async function generateSessionReport(
  gymId: string,
  gymName: string,
  startDate: Date,
  endDate: Date
): Promise<SessionReportData> {
  console.log('📋 Generating session report:', { gymId, startDate, endDate });

  // Fetch sessions in date range
  const sessionsQuery = query(
    collection(db, COLLECTIONS.SESSIONS),
    where('gymId', '==', gymId)
  );

  const sessionsSnapshot = await getDocs(sessionsQuery);
  const sessions = sessionsSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      let sessionDate: Date;

      if (data.date instanceof Timestamp) {
        sessionDate = data.date.toDate();
      } else if (typeof data.date === 'string') {
        sessionDate = new Date(data.date);
      } else {
        sessionDate = new Date();
      }

      return {
        id: doc.id,
        date: sessionDate.toISOString().split('T')[0],
        memberName: data.memberName || 'Unknown',
        trainerName: data.trainerName || 'Unknown',
        type: data.type || 'personal',
        price: data.price || 0,
        status: data.status || 'completed',
      };
    })
    .filter((session) => {
      const date = new Date(session.date);
      return date >= startDate && date <= endDate;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalRevenue = sessions.reduce((sum, session) => sum + session.price, 0);

  console.log(`✅ Generated session report with ${sessions.length} sessions`);

  return {
    gymName,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    sessions,
    totalRevenue,
  };
}

/**
 * Generate Trainer Performance Report
 */
export async function generateTrainerReport(
  gymId: string,
  trainerId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  trainerName: string;
  sessions: Array<{
    date: string;
    memberName: string;
    type: string;
    price: number;
    compensation: number;
  }>;
}> {
  console.log('👤 Generating trainer report:', { gymId, trainerId, startDate, endDate });

  // Fetch trainer sessions
  const sessionsQuery = query(
    collection(db, COLLECTIONS.SESSIONS),
    where('gymId', '==', gymId),
    where('trainerId', '==', trainerId),
    where('status', '==', 'completed')
  );

  const sessionsSnapshot = await getDocs(sessionsQuery);
  const sessions = sessionsSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      let sessionDate: Date;

      if (data.date instanceof Timestamp) {
        sessionDate = data.date.toDate();
      } else if (typeof data.date === 'string') {
        sessionDate = new Date(data.date);
      } else {
        sessionDate = new Date();
      }

      // Default compensation: 40% of price
      const compensation = Math.round(data.price * 0.4);

      return {
        date: sessionDate.toISOString().split('T')[0],
        memberName: data.memberName || 'Unknown',
        type: data.type || 'personal',
        price: data.price || 0,
        compensation,
        trainerName: data.trainerName || 'Unknown',
      };
    })
    .filter((session) => {
      const date = new Date(session.date);
      return date >= startDate && date <= endDate;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const trainerName = sessions.length > 0 ? sessions[0].trainerName : 'Unknown';

  console.log(`✅ Generated trainer report with ${sessions.length} sessions`);

  return {
    trainerName,
    sessions,
  };
}

/**
 * Get available report months (last 12 months)
 */
export function getAvailableMonths(): Array<{ year: number; month: number; label: string }> {
  const months: Array<{ year: number; month: number; label: string }> = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: `${date.getFullYear()}年${date.getMonth() + 1}月`,
    });
  }

  return months;
}

/**
 * Format currency (Japanese Yen)
 */
export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

/**
 * Format date (Japanese format)
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
