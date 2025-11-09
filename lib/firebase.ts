// Firebase Configuration for GYM MATCH PO Admin Panel
// Web-first admin application using Firebase SDK

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase Configuration (from firebase_options.dart - Web Platform)
const firebaseConfig = {
  apiKey: 'AIzaSyDYwD-_fz9m4vSQsbdXuQpKtbHguIl4LaM',
  appId: '1:506175392633:web:046d7c7a6a8ac7e606fda8',
  messagingSenderId: '506175392633',
  projectId: 'gym-match-e560d',
  authDomain: 'gym-match-e560d.firebaseapp.com',
  storageBucket: 'gym-match-e560d.firebasestorage.app',
  measurementId: 'G-DXGP9WX0Z8',
};

// Initialize Firebase App (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (typeof window !== 'undefined') {
  // Client-side initialization
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  // Server-side: Create placeholder objects
  app = null as any;
  auth = null as any;
  db = null as any;
  storage = null as any;
}

export { app, auth, db, storage };

// Firebase Collections
export const COLLECTIONS = {
  USERS: 'users',
  GYMS: 'gyms',
  MEMBERS: 'members',
  PO_OWNERS: 'poOwners',
  SESSIONS: 'sessions',
  BOOKINGS: 'bookings',
  WORKOUT_LOGS: 'workoutLogs',
} as const;

// Helper: Check if Firebase is initialized
export const isFirebaseInitialized = (): boolean => {
  return typeof window !== 'undefined' && getApps().length > 0;
};

// Export Firebase config for debugging
export { firebaseConfig };
