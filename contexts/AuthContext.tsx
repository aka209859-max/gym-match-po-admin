'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  gymId: string | null;
  gymName: string | null;
  login: (accessCode: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gymId, setGymId] = useState<string | null>(null);
  const [gymName, setGymName] = useState<string | null>(null);

  // 初回マウント時のみ認証状態を復元
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authenticated = localStorage.getItem('gym_match_authenticated');
        const accessCode = localStorage.getItem('gym_match_access_code');
        const storedGymId = localStorage.getItem('gym_match_gym_id');
        const storedGymName = localStorage.getItem('gym_match_gym_name');
        
        console.log('🔐 Auth Context: Restoring auth state', {
          authenticated,
          accessCode,
          gymId: storedGymId,
          gymName: storedGymName,
          valid: authenticated === 'true' && accessCode === 'GYMMATCH2024'
        });

        if (authenticated === 'true' && accessCode === 'GYMMATCH2024') {
          setIsAuthenticated(true);
          setGymId(storedGymId || 'gym_demo_001'); // デフォルトgymId
          setGymName(storedGymName || 'GYM MATCH デモジム');
        }
      } catch (error) {
        console.error('❌ Auth restore error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // 少し遅延させて確実にクライアントサイドで実行
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, []); // 空の依存配列 = 初回マウント時のみ実行

  const login = (accessCode: string): boolean => {
    if (accessCode === 'GYMMATCH2024') {
      console.log('✅ Auth Context: Login successful');
      
      // デモ用のgymId設定（本番では認証サーバーから取得）
      const demoGymId = 'gym_demo_001';
      const demoGymName = 'GYM MATCH デモジム';
      
      localStorage.setItem('gym_match_authenticated', 'true');
      localStorage.setItem('gym_match_access_code', accessCode);
      localStorage.setItem('gym_match_gym_id', demoGymId);
      localStorage.setItem('gym_match_gym_name', demoGymName);
      
      setIsAuthenticated(true);
      setGymId(demoGymId);
      setGymName(demoGymName);
      
      console.log('🏋️ Gym ID set:', demoGymId);
      return true;
    }
    console.log('❌ Auth Context: Login failed - invalid code');
    return false;
  };

  const logout = () => {
    console.log('🚪 Auth Context: Logout');
    localStorage.removeItem('gym_match_authenticated');
    localStorage.removeItem('gym_match_access_code');
    localStorage.removeItem('gym_match_gym_id');
    localStorage.removeItem('gym_match_gym_name');
    setIsAuthenticated(false);
    setGymId(null);
    setGymName(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, gymId, gymName, login, logout }}>
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
