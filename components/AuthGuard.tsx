'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ログインページは認証不要
    if (pathname === '/') {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // 認証状態をチェック
    const authenticated = localStorage.getItem('gym_match_authenticated');
    const accessCode = localStorage.getItem('gym_match_access_code');

    if (authenticated === 'true' && accessCode) {
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      // 認証されていない場合、ログインページにリダイレクト
      router.push('/');
    }
  }, [pathname, router]);

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 認証されていない場合、何も表示しない（リダイレクト中）
  if (!isAuthenticated && pathname !== '/') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">ログインページへリダイレクト中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
