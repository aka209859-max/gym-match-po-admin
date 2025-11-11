'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  gymId: string | null;
  gymName: string | null;
  user: User | null;
  login: (accessCode: string) => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gymId, setGymId] = useState<string | null>(null);
  const [gymName, setGymName] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Firebase Auth状態監視（真実の情報源）
  useEffect(() => {
    console.log('🔐 AuthContext: Setting up Firebase Auth listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('✅ Firebase Auth: User authenticated', {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
          });

          // Get ID token and custom claims
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const customClaims = idTokenResult.claims;
          
          console.log('🎫 Custom claims:', customClaims);

          // Extract gymId and gymName from custom claims
          const userGymId = (customClaims.gymId as string) || 'gym_demo_001';
          const userGymName = (customClaims.gymName as string) || 'デモジム';

          // Update state
          setUser(firebaseUser);
          setIsAuthenticated(true);
          setGymId(userGymId);
          setGymName(userGymName);

          // Sync to localStorage for backward compatibility
          localStorage.setItem('gym_match_authenticated', 'true');
          localStorage.setItem('gym_match_access_code', 'FIREBASE_AUTH');
          localStorage.setItem('gym_match_gym_id', userGymId);
          localStorage.setItem('gym_match_gym_name', userGymName);

          console.log('🏋️ Gym context set:', {
            gymId: userGymId,
            gymName: userGymName,
          });
          
        } else {
          console.log('🚪 Firebase Auth: No user authenticated');
          
          // Clear all state
          setUser(null);
          setIsAuthenticated(false);
          setGymId(null);
          setGymName(null);
          
          // Clear localStorage
          localStorage.removeItem('gym_match_authenticated');
          localStorage.removeItem('gym_match_access_code');
          localStorage.removeItem('gym_match_gym_id');
          localStorage.removeItem('gym_match_gym_name');
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error);
      } finally {
        setIsLoading(false);
      }
    });

    // Cleanup listener on unmount
    return () => {
      console.log('🔌 AuthContext: Cleaning up Firebase Auth listener');
      unsubscribe();
    };
  }, []); // 空の依存配列 = 初回マウント時のみ実行

  // Legacy access code login (disabled in production)
  const login = (accessCode: string): boolean => {
    console.log('❌ Auth Context: Legacy access code login disabled');
    return false;
  };

  // Logout (supports both Firebase and legacy auth)
  const logout = async () => {
    console.log('🚪 Auth Context: Logout initiated');
    
    try {
      // If Firebase user is authenticated, sign out from Firebase
      if (user) {
        console.log('🔥 Signing out from Firebase...');
        await signOut(auth);
        console.log('✅ Firebase sign out successful');
      }
      
      // Clear localStorage (for both Firebase and legacy auth)
      localStorage.removeItem('gym_match_authenticated');
      localStorage.removeItem('gym_match_access_code');
      localStorage.removeItem('gym_match_gym_id');
      localStorage.removeItem('gym_match_gym_name');
      
      // Clear state (will be updated by onAuthStateChanged listener)
      setIsAuthenticated(false);
      setGymId(null);
      setGymName(null);
      setUser(null);
      
      console.log('✅ Logout complete');
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Force clear state even if Firebase signOut fails
      setIsAuthenticated(false);
      setGymId(null);
      setGymName(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, gymId, gymName, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
