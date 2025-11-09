/**
 * Payment Management System with Stripe
 * 
 * Features:
 * - One-time payments (session fees)
 * - Subscription management (monthly memberships)
 * - Payment history tracking
 * - Invoice generation
 * - Automatic payment recording in Firestore
 */

import { collection, addDoc, updateDoc, doc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type PaymentType = 'session' | 'membership' | 'product' | 'other';

export interface Payment {
  id: string;
  gymId: string;
  memberId: string;
  memberName: string;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  description: string;
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  gymId: string;
  memberId: string;
  memberName: string;
  planName: string;
  amount: number;
  interval: 'month' | 'year';
  status: 'active' | 'cancelled' | 'past_due' | 'paused';
  stripeSubscriptionId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create payment record in Firestore
 */
export async function createPaymentRecord(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const paymentData = {
      ...payment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'payments'), paymentData);
    console.log('✅ Payment record created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating payment record:', error);
    throw error;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(paymentId: string, status: PaymentStatus, metadata?: Record<string, any>): Promise<void> {
  try {
    const docRef = doc(db, 'payments', paymentId);
    await updateDoc(docRef, {
      status,
      metadata: metadata || {},
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Payment status updated:', paymentId, status);
  } catch (error) {
    console.error('❌ Error updating payment status:', error);
    throw error;
  }
}

/**
 * Get payment history for a member
 */
export async function getMemberPayments(gymId: string, memberId: string): Promise<Payment[]> {
  try {
    const q = query(
      collection(db, 'payments'),
      where('gymId', '==', gymId),
      where('memberId', '==', memberId)
    );

    const snapshot = await getDocs(q);
    const payments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        gymId: data.gymId,
        memberId: data.memberId,
        memberName: data.memberName,
        amount: data.amount,
        currency: data.currency || 'jpy',
        type: data.type,
        status: data.status,
        description: data.description,
        stripePaymentIntentId: data.stripePaymentIntentId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        metadata: data.metadata || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    return payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('❌ Error getting member payments:', error);
    throw error;
  }
}

/**
 * Get all payments for a gym
 */
export async function getGymPayments(gymId: string, options?: { status?: PaymentStatus; type?: PaymentType }): Promise<Payment[]> {
  try {
    let q = query(collection(db, 'payments'), where('gymId', '==', gymId));

    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }
    if (options?.type) {
      q = query(q, where('type', '==', options.type));
    }

    const snapshot = await getDocs(q);
    const payments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        gymId: data.gymId,
        memberId: data.memberId,
        memberName: data.memberName,
        amount: data.amount,
        currency: data.currency || 'jpy',
        type: data.type,
        status: data.status,
        description: data.description,
        stripePaymentIntentId: data.stripePaymentIntentId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        metadata: data.metadata || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    return payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('❌ Error getting gym payments:', error);
    throw error;
  }
}

/**
 * Create subscription record
 */
export async function createSubscriptionRecord(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const subscriptionData = {
      ...subscription,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'subscriptions'), subscriptionData);
    console.log('✅ Subscription record created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating subscription record:', error);
    throw error;
  }
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: Subscription['status'],
  updates?: Partial<Subscription>
): Promise<void> {
  try {
    const docRef = doc(db, 'subscriptions', subscriptionId);
    await updateDoc(docRef, {
      status,
      ...updates,
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Subscription status updated:', subscriptionId, status);
  } catch (error) {
    console.error('❌ Error updating subscription status:', error);
    throw error;
  }
}

/**
 * Get active subscriptions for a member
 */
export async function getMemberSubscriptions(gymId: string, memberId: string): Promise<Subscription[]> {
  try {
    const q = query(
      collection(db, 'subscriptions'),
      where('gymId', '==', gymId),
      where('memberId', '==', memberId)
    );

    const snapshot = await getDocs(q);
    const subscriptions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        gymId: data.gymId,
        memberId: data.memberId,
        memberName: data.memberName,
        planName: data.planName,
        amount: data.amount,
        interval: data.interval,
        status: data.status,
        stripeSubscriptionId: data.stripeSubscriptionId,
        currentPeriodStart: data.currentPeriodStart?.toDate() || new Date(),
        currentPeriodEnd: data.currentPeriodEnd?.toDate() || new Date(),
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    return subscriptions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('❌ Error getting member subscriptions:', error);
    throw error;
  }
}

/**
 * Calculate revenue summary
 */
export async function getRevenueSummary(gymId: string, startDate: Date, endDate: Date) {
  try {
    const payments = await getGymPayments(gymId, { status: 'succeeded' });
    
    const filtered = payments.filter(p => {
      const paymentDate = p.createdAt;
      return paymentDate >= startDate && paymentDate <= endDate;
    });

    const totalRevenue = filtered.reduce((sum, p) => sum + p.amount, 0);
    const sessionRevenue = filtered.filter(p => p.type === 'session').reduce((sum, p) => sum + p.amount, 0);
    const membershipRevenue = filtered.filter(p => p.type === 'membership').reduce((sum, p) => sum + p.amount, 0);

    return {
      totalRevenue,
      sessionRevenue,
      membershipRevenue,
      transactionCount: filtered.length,
      averageTransaction: totalRevenue / filtered.length || 0,
    };
  } catch (error) {
    console.error('❌ Error calculating revenue summary:', error);
    throw error;
  }
}

/**
 * Get pending payments (not yet paid)
 */
export async function getPendingPayments(gymId: string): Promise<Payment[]> {
  return getGymPayments(gymId, { status: 'pending' });
}

/**
 * Get failed payments
 */
export async function getFailedPayments(gymId: string): Promise<Payment[]> {
  return getGymPayments(gymId, { status: 'failed' });
}

/**
 * Format amount for display (Japanese Yen)
 */
export function formatAmount(amount: number, currency: string = 'JPY'): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Calculate payment processing fee (approximate)
 */
export function calculateProcessingFee(amount: number): number {
  // Stripe fee: 3.6% + ¥15
  return Math.round(amount * 0.036 + 15);
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: number): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: '金額は0円より大きい必要があります' };
  }
  if (amount < 50) {
    return { valid: false, error: '最小決済額は50円です' };
  }
  if (amount > 9999999) {
    return { valid: false, error: '最大決済額は9,999,999円です' };
  }
  return { valid: true };
}
