/**
 * Booking Management System
 * 
 * Features:
 * - Create, read, update, delete bookings
 * - Check trainer availability
 * - Calculate available time slots
 * - Handle booking conflicts
 * - Support multiple session types
 * - Automatic status management
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';

// Booking types
export type BookingStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';
export type SessionType = 'personal' | 'group' | 'trial' | 'consultation';

export interface Booking {
  id: string;
  gymId: string;
  memberId: string;
  memberName: string;
  trainerId: string;
  trainerName: string;
  sessionType: SessionType;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  status: BookingStatus;
  price: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
  trainerId?: string;
  trainerName?: string;
}

export interface BookingCreateInput {
  gymId: string;
  memberId: string;
  memberName: string;
  trainerId: string;
  trainerName: string;
  sessionType: SessionType;
  startTime: Date;
  duration: number; // minutes
  price: number;
  notes?: string;
}

export interface BookingUpdateInput {
  startTime?: Date;
  duration?: number;
  status?: BookingStatus;
  notes?: string;
  price?: number;
}

/**
 * Create a new booking
 */
export async function createBooking(input: BookingCreateInput): Promise<string> {
  try {
    // Calculate end time
    const endTime = new Date(input.startTime.getTime() + input.duration * 60000);

    // Check for conflicts
    const hasConflict = await checkBookingConflict(
      input.gymId,
      input.trainerId,
      input.startTime,
      endTime
    );

    if (hasConflict) {
      throw new Error('予約時間が既存の予約と重複しています');
    }

    // Create booking document
    const bookingData = {
      gymId: input.gymId,
      memberId: input.memberId,
      memberName: input.memberName,
      trainerId: input.trainerId,
      trainerName: input.trainerName,
      sessionType: input.sessionType,
      startTime: Timestamp.fromDate(input.startTime),
      endTime: Timestamp.fromDate(endTime),
      duration: input.duration,
      status: 'scheduled' as BookingStatus,
      price: input.price,
      notes: input.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.BOOKINGS), bookingData);

    console.log('✅ Booking created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    throw error;
  }
}

/**
 * Get booking by ID
 */
export async function getBooking(bookingId: string): Promise<Booking | null> {
  try {
    const docRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      gymId: data.gymId,
      memberId: data.memberId,
      memberName: data.memberName,
      trainerId: data.trainerId,
      trainerName: data.trainerName,
      sessionType: data.sessionType,
      startTime: data.startTime.toDate(),
      endTime: data.endTime.toDate(),
      duration: data.duration,
      status: data.status,
      price: data.price,
      notes: data.notes || '',
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('❌ Error getting booking:', error);
    throw error;
  }
}

/**
 * Get all bookings for a gym
 */
export async function getGymBookings(
  gymId: string,
  options?: {
    status?: BookingStatus;
    trainerId?: string;
    memberId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<Booking[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where('gymId', '==', gymId)
    );

    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }

    if (options?.trainerId) {
      q = query(q, where('trainerId', '==', options.trainerId));
    }

    if (options?.memberId) {
      q = query(q, where('memberId', '==', options.memberId));
    }

    const snapshot = await getDocs(q);
    let bookings: Booking[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        gymId: data.gymId,
        memberId: data.memberId,
        memberName: data.memberName,
        trainerId: data.trainerId,
        trainerName: data.trainerName,
        sessionType: data.sessionType,
        startTime: data.startTime.toDate(),
        endTime: data.endTime.toDate(),
        duration: data.duration,
        status: data.status,
        price: data.price,
        notes: data.notes || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    // Filter by date range if provided (memory filtering)
    if (options?.startDate || options?.endDate) {
      bookings = bookings.filter((booking) => {
        if (options.startDate && booking.startTime < options.startDate) {
          return false;
        }
        if (options.endDate && booking.startTime > options.endDate) {
          return false;
        }
        return true;
      });
    }

    // Sort by start time
    bookings.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    console.log(`✅ Retrieved ${bookings.length} bookings for gym ${gymId}`);
    return bookings;
  } catch (error) {
    console.error('❌ Error getting gym bookings:', error);
    throw error;
  }
}

/**
 * Update booking
 */
export async function updateBooking(
  bookingId: string,
  updates: BookingUpdateInput
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);

    // If updating time, check for conflicts
    if (updates.startTime || updates.duration) {
      const booking = await getBooking(bookingId);
      if (!booking) {
        throw new Error('予約が見つかりません');
      }

      const newStartTime = updates.startTime || booking.startTime;
      const newDuration = updates.duration || booking.duration;
      const newEndTime = new Date(newStartTime.getTime() + newDuration * 60000);

      const hasConflict = await checkBookingConflict(
        booking.gymId,
        booking.trainerId,
        newStartTime,
        newEndTime,
        bookingId // Exclude current booking from conflict check
      );

      if (hasConflict) {
        throw new Error('予約時間が既存の予約と重複しています');
      }

      await updateDoc(docRef, {
        startTime: Timestamp.fromDate(newStartTime),
        endTime: Timestamp.fromDate(newEndTime),
        duration: newDuration,
        updatedAt: serverTimestamp(),
      });
    }

    // Update other fields
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    if (updates.notes !== undefined) {
      updateData.notes = updates.notes;
    }
    if (updates.price !== undefined) {
      updateData.price = updates.price;
    }

    await updateDoc(docRef, updateData);

    console.log('✅ Booking updated:', bookingId);
  } catch (error) {
    console.error('❌ Error updating booking:', error);
    throw error;
  }
}

/**
 * Cancel booking
 */
export async function cancelBooking(bookingId: string): Promise<void> {
  try {
    await updateBooking(bookingId, { status: 'cancelled' });
    console.log('✅ Booking cancelled:', bookingId);
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    throw error;
  }
}

/**
 * Delete booking (hard delete)
 */
export async function deleteBooking(bookingId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
    await deleteDoc(docRef);
    console.log('✅ Booking deleted:', bookingId);
  } catch (error) {
    console.error('❌ Error deleting booking:', error);
    throw error;
  }
}

/**
 * Check if a time slot conflicts with existing bookings
 */
export async function checkBookingConflict(
  gymId: string,
  trainerId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<boolean> {
  try {
    // Get all scheduled bookings for this trainer
    const bookings = await getGymBookings(gymId, {
      trainerId,
      status: 'scheduled',
    });

    // Check for overlaps
    for (const booking of bookings) {
      // Skip the booking we're updating
      if (excludeBookingId && booking.id === excludeBookingId) {
        continue;
      }

      // Check if time ranges overlap
      const bookingStart = booking.startTime.getTime();
      const bookingEnd = booking.endTime.getTime();
      const newStart = startTime.getTime();
      const newEnd = endTime.getTime();

      // Overlap detection
      if (
        (newStart >= bookingStart && newStart < bookingEnd) ||
        (newEnd > bookingStart && newEnd <= bookingEnd) ||
        (newStart <= bookingStart && newEnd >= bookingEnd)
      ) {
        console.log('⚠️ Booking conflict detected');
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('❌ Error checking booking conflict:', error);
    throw error;
  }
}

/**
 * Get available time slots for a trainer on a specific date
 */
export async function getAvailableTimeSlots(
  gymId: string,
  trainerId: string,
  date: Date,
  sessionDuration: number = 60, // minutes
  workingHours: { start: number; end: number } = { start: 9, end: 21 } // 9 AM - 9 PM
): Promise<TimeSlot[]> {
  try {
    // Get all scheduled bookings for this trainer on this date
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const bookings = await getGymBookings(gymId, {
      trainerId,
      status: 'scheduled',
      startDate: dayStart,
      endDate: dayEnd,
    });

    // Generate all possible time slots
    const slots: TimeSlot[] = [];
    const slotStart = new Date(date);
    slotStart.setHours(workingHours.start, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(workingHours.end, 0, 0, 0);

    let currentTime = new Date(slotStart);

    while (currentTime < slotEnd) {
      const slotEndTime = new Date(currentTime.getTime() + sessionDuration * 60000);

      // Check if this slot conflicts with any booking
      let available = true;
      for (const booking of bookings) {
        const bookingStart = booking.startTime.getTime();
        const bookingEnd = booking.endTime.getTime();
        const slotStartTime = currentTime.getTime();
        const slotEndTimeValue = slotEndTime.getTime();

        if (
          (slotStartTime >= bookingStart && slotStartTime < bookingEnd) ||
          (slotEndTimeValue > bookingStart && slotEndTimeValue <= bookingEnd) ||
          (slotStartTime <= bookingStart && slotEndTimeValue >= bookingEnd)
        ) {
          available = false;
          break;
        }
      }

      slots.push({
        startTime: new Date(currentTime),
        endTime: new Date(slotEndTime),
        available,
      });

      // Move to next slot (30 minute intervals)
      currentTime = new Date(currentTime.getTime() + 30 * 60000);
    }

    console.log(`✅ Generated ${slots.length} time slots (${slots.filter(s => s.available).length} available)`);
    return slots;
  } catch (error) {
    console.error('❌ Error getting available time slots:', error);
    throw error;
  }
}

/**
 * Get member booking history
 */
export async function getMemberBookings(
  gymId: string,
  memberId: string
): Promise<Booking[]> {
  return getGymBookings(gymId, { memberId });
}

/**
 * Get trainer schedule
 */
export async function getTrainerSchedule(
  gymId: string,
  trainerId: string,
  startDate: Date,
  endDate: Date
): Promise<Booking[]> {
  return getGymBookings(gymId, {
    trainerId,
    status: 'scheduled',
    startDate,
    endDate,
  });
}

/**
 * Get upcoming bookings (next 7 days)
 */
export async function getUpcomingBookings(gymId: string): Promise<Booking[]> {
  const now = new Date();
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return getGymBookings(gymId, {
    status: 'scheduled',
    startDate: now,
    endDate: oneWeekLater,
  });
}

/**
 * Mark booking as completed
 */
export async function completeBooking(bookingId: string): Promise<void> {
  await updateBooking(bookingId, { status: 'completed' });
}

/**
 * Mark booking as no-show
 */
export async function markNoShow(bookingId: string): Promise<void> {
  await updateBooking(bookingId, { status: 'no-show' });
}
