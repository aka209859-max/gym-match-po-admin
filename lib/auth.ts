// Authentication utilities for GYM MATCH PO Admin Panel

import { db, COLLECTIONS } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Access Code Validation
export interface AccessCodeValidationResult {
  isValid: boolean;
  poOwnerId?: string;
  gymId?: string;
  gymName?: string;
  errorMessage?: string;
}

/**
 * Validate PO Access Code against Firestore
 * @param accessCode - The access code entered by PO owner
 * @returns Validation result with PO owner and gym information
 */
export async function validateAccessCode(
  accessCode: string
): Promise<AccessCodeValidationResult> {
  try {
    // Normalize access code (uppercase, trim whitespace)
    const normalizedCode = accessCode.trim().toUpperCase();

    // Query poOwners collection for matching access code
    const poOwnersRef = collection(db, COLLECTIONS.PO_OWNERS);
    const q = query(poOwnersRef, where('accessCode', '==', normalizedCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        isValid: false,
        errorMessage: '無効なアクセスコードです',
      };
    }

    // Get first matching PO owner (access codes should be unique)
    const poOwnerDoc = querySnapshot.docs[0];
    const poOwnerData = poOwnerDoc.data();

    return {
      isValid: true,
      poOwnerId: poOwnerDoc.id,
      gymId: poOwnerData.gymId,
      gymName: poOwnerData.gymName,
    };
  } catch (error) {
    console.error('Access code validation error:', error);
    return {
      isValid: false,
      errorMessage: 'アクセスコード検証中にエラーが発生しました',
    };
  }
}

/**
 * Store authenticated PO owner session in localStorage
 * @param poOwnerId - PO owner document ID
 * @param gymId - Associated gym ID
 * @param gymName - Associated gym name
 * @param accessCode - Validated access code
 */
export function storePoSession(
  poOwnerId: string,
  gymId: string,
  gymName: string,
  accessCode: string
): void {
  if (typeof window !== 'undefined') {
    const sessionData = {
      poOwnerId,
      gymId,
      gymName,
      accessCode,
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem('po_session', JSON.stringify(sessionData));
  }
}

/**
 * Retrieve PO owner session from localStorage
 * @returns Session data or null if not found
 */
export function getPoSession(): {
  poOwnerId: string;
  gymId: string;
  gymName: string;
  accessCode: string;
  loginTime: string;
} | null {
  if (typeof window !== 'undefined') {
    const sessionStr = localStorage.getItem('po_session');
    if (sessionStr) {
      try {
        return JSON.parse(sessionStr);
      } catch (error) {
        console.error('Failed to parse PO session:', error);
        return null;
      }
    }
  }
  return null;
}

/**
 * Clear PO owner session (logout)
 */
export function clearPoSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('po_session');
  }
}

/**
 * Check if user is authenticated
 * @returns true if valid session exists
 */
export function isAuthenticated(): boolean {
  const session = getPoSession();
  return session !== null && session.poOwnerId !== undefined;
}
