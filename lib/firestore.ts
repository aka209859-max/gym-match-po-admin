// Firestore data access functions for GYM MATCH PO Admin Panel

import { db, COLLECTIONS } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';

// ============================================
// KPI Data Types
// ============================================

export interface KPIData {
  totalMembers: number;
  activeMembers: number;
  dormantMembers: number;
  newMembersThisMonth: number;
  totalSessions: number;
  todaySessions: number;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  contractType: string;
  joinDate: Date;
  lastVisit: Date;
  totalSessions: number;
  isActive: boolean;
}

export interface Session {
  id: string;
  userId: string;
  userName: string;
  date: Date;
  duration: number; // minutes
  type: string;
  status: 'completed' | 'cancelled' | 'upcoming';
}

// ============================================
// KPI Functions
// ============================================

/**
 * Fetch KPI data for specific gym
 * @param gymId - Gym document ID
 * @returns KPI metrics
 */
export async function fetchKPIData(gymId: string): Promise<KPIData> {
  try {
    // Fetch all members for this gym
    const usersRef = collection(db, COLLECTIONS.USERS);
    const usersQuery = query(usersRef, where('gymId', '==', gymId));
    const usersSnapshot = await getDocs(usersQuery);

    const totalMembers = usersSnapshot.size;
    let activeMembers = 0;
    let dormantMembers = 0;
    let newMembersThisMonth = 0;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const lastVisitDate = userData.lastVisit?.toDate() || new Date(0);
      const joinDate = userData.joinDate?.toDate() || new Date();

      // Active: visited within last 30 days
      if (lastVisitDate >= thirtyDaysAgo) {
        activeMembers++;
      } else {
        dormantMembers++;
      }

      // New member: joined this month
      if (joinDate >= monthStart) {
        newMembersThisMonth++;
      }
    });

    // Fetch sessions count
    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    const sessionsQuery = query(sessionsRef, where('gymId', '==', gymId));
    const sessionsSnapshot = await getDocs(sessionsQuery);

    const totalSessions = sessionsSnapshot.size;

    // Today's sessions
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let todaySessions = 0;
    sessionsSnapshot.forEach((sessionDoc) => {
      const sessionData = sessionDoc.data();
      const sessionDate = sessionData.date?.toDate() || new Date(0);
      if (sessionDate >= todayStart) {
        todaySessions++;
      }
    });

    return {
      totalMembers,
      activeMembers,
      dormantMembers,
      newMembersThisMonth,
      totalSessions,
      todaySessions,
    };
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    // Return default values on error
    return {
      totalMembers: 0,
      activeMembers: 0,
      dormantMembers: 0,
      newMembersThisMonth: 0,
      totalSessions: 0,
      todaySessions: 0,
    };
  }
}

// ============================================
// Member Functions
// ============================================

/**
 * Fetch all members for specific gym
 * @param gymId - Gym document ID
 * @returns Array of member data
 */
export async function fetchMembers(gymId: string): Promise<Member[]> {
  try {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const usersQuery = query(usersRef, where('gymId', '==', gymId));
    const usersSnapshot = await getDocs(usersQuery);

    const members: Member[] = [];
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      members.push({
        id: userDoc.id,
        name: userData.name || 'Unknown',
        email: userData.email || '',
        phone: userData.phone || '',
        contractType: userData.contractType || 'regular',
        joinDate: userData.joinDate?.toDate() || new Date(),
        lastVisit: userData.lastVisit?.toDate() || new Date(),
        totalSessions: userData.totalSessions || 0,
        isActive: userData.isActive !== false, // Default to true
      });
    });

    // Sort by join date (newest first)
    members.sort((a, b) => b.joinDate.getTime() - a.joinDate.getTime());

    return members;
  } catch (error) {
    console.error('Error fetching members:', error);
    return [];
  }
}

/**
 * Fetch recent members (last 5)
 * @param gymId - Gym document ID
 * @returns Array of recent member data
 */
export async function fetchRecentMembers(gymId: string): Promise<Member[]> {
  try {
    const members = await fetchMembers(gymId);
    return members.slice(0, 5);
  } catch (error) {
    console.error('Error fetching recent members:', error);
    return [];
  }
}

// ============================================
// Session Functions
// ============================================

/**
 * Fetch sessions for specific gym
 * @param gymId - Gym document ID
 * @param limitCount - Maximum number of sessions to fetch
 * @returns Array of session data
 */
export async function fetchSessions(
  gymId: string,
  limitCount: number = 50
): Promise<Session[]> {
  try {
    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    // ✅ Simple query without orderBy (avoid composite index requirement)
    const sessionsQuery = query(
      sessionsRef,
      where('gymId', '==', gymId)
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);

    const sessions: Session[] = [];
    sessionsSnapshot.forEach((sessionDoc) => {
      const sessionData = sessionDoc.data();
      sessions.push({
        id: sessionDoc.id,
        userId: sessionData.userId || '',
        userName: sessionData.userName || 'Unknown',
        date: sessionData.date?.toDate() || new Date(),
        duration: sessionData.duration || 0,
        type: sessionData.type || 'general',
        status: sessionData.status || 'completed',
      });
    });

    // ✅ Sort in memory (newest first) - no index needed
    sessions.sort((a, b) => b.date.getTime() - a.date.getTime());

    // ✅ Apply limit after sorting
    return sessions.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

/**
 * Fetch sessions for specific user
 * @param userId - User document ID
 * @param limitCount - Maximum number of sessions to fetch
 * @returns Array of session data
 */
export async function fetchUserSessions(
  userId: string,
  limitCount: number = 20
): Promise<Session[]> {
  try {
    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    // ✅ Simple query without orderBy (avoid composite index requirement)
    const sessionsQuery = query(
      sessionsRef,
      where('userId', '==', userId)
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);

    const sessions: Session[] = [];
    sessionsSnapshot.forEach((sessionDoc) => {
      const sessionData = sessionDoc.data();
      sessions.push({
        id: sessionDoc.id,
        userId: sessionData.userId || '',
        userName: sessionData.userName || 'Unknown',
        date: sessionData.date?.toDate() || new Date(),
        duration: sessionData.duration || 0,
        type: sessionData.type || 'general',
        status: sessionData.status || 'completed',
      });
    });

    // ✅ Sort in memory (newest first) - no index needed
    sessions.sort((a, b) => b.date.getTime() - a.date.getTime());

    // ✅ Apply limit after sorting
    return sessions.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return [];
  }
}
