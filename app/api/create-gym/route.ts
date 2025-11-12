// API Route: Create Gym on First Login
// ========================================
// Purpose: Automatically create gym document in Firestore when user logs in for the first time
// Trigger: Called from login page after successful Firebase authentication

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK (server-side)
if (!getApps().length) {
  const serviceAccount = require('/opt/flutter/firebase-admin-sdk.json');
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const adminAuth = getAuth();
const adminDb = getFirestore();

// Generate unique gymId
function generateGymId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `gym_${timestamp}_${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, gymName } = body;

    // Validation
    if (!uid || !email || !gymName) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, email, gymName' },
        { status: 400 }
      );
    }

    console.log('🏋️ Creating gym for user:', { uid, email, gymName });

    // Check if user already has a gym
    const existingGyms = await adminDb
      .collection('gyms')
      .where('ownerId', '==', uid)
      .limit(1)
      .get();

    if (!existingGyms.empty) {
      const existingGym = existingGyms.docs[0].data();
      console.log('⚠️  User already has a gym:', existingGym.gymId);

      // Update Custom Claims with existing gym
      await adminAuth.setCustomUserClaims(uid, {
        gymId: existingGym.gymId,
        gymName: existingGym.gymName,
      });

      return NextResponse.json({
        success: true,
        message: 'Gym already exists',
        gymId: existingGym.gymId,
        gymName: existingGym.gymName,
      });
    }

    // Generate new gymId
    const gymId = generateGymId();

    // Create gym document in Firestore
    const gymData = {
      gymId,
      gymName,
      ownerId: uid,
      ownerEmail: email,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isActive: true,
      // Optional fields (can be updated later)
      contactPhone: null,
      address: null,
      businessHours: null,
    };

    await adminDb.collection('gyms').add(gymData);
    console.log('✅ Gym created in Firestore:', gymId);

    // Set Firebase Custom Claims (available in ID token)
    await adminAuth.setCustomUserClaims(uid, {
      gymId,
      gymName,
    });
    console.log('✅ Custom claims set:', { gymId, gymName });

    return NextResponse.json({
      success: true,
      message: 'Gym created successfully',
      gymId,
      gymName,
    });

  } catch (error: any) {
    console.error('❌ Create gym error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create gym',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
