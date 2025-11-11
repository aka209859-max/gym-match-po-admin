'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // 認証不要ページ（公開ページ）
    const publicPages = ['/', '/reset-password', '/register', '/verify-email'];
    if (publicPages.includes(pathname)) {
      return;
    }

    // 認証状態の読み込みが完了してから判定
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('🚫 Auth Guard: Not authenticated, redirecting to login');
        router.replace('/');
      } else {
        console.log('✅ Auth Guard: Authenticated, showing page:', pathname);
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // 認証不要ページは常に表示
  const publicPages = ['/', '/reset-password', '/register', '/verify-email'];
  if (publicPages.includes(pathname)) {
    return <>{children}</>;
  }

  // 認証状態の読み込み中はローディング表示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 認証されていない場合は何も表示しない（リダイレクト処理中）
  if (!isAuthenticated) {
    return null;
  }

  // 認証OKならコンテンツ表示
  return <>{children}</>;
}
