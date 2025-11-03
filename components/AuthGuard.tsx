'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // マウント後フラグ（Hydration Error回避）
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // クライアントサイドでマウント後のみ実行
    if (!mounted) return;

    // ログインページは認証不要
    if (pathname === '/') {
      setIsAuthenticated(true);
      return;
    }

    // 認証状態をチェック
    const authenticated = localStorage.getItem('gym_match_authenticated');
    const accessCode = localStorage.getItem('gym_match_access_code');

    console.log('🔐 Auth Check:', { pathname, authenticated, accessCode });

    if (authenticated === 'true' && accessCode) {
      console.log('✅ Authenticated');
      setIsAuthenticated(true);
    } else {
      console.log('❌ Not authenticated - redirecting');
      router.replace('/'); // push → replace に変更（履歴に残さない）
    }
  }, [mounted, pathname, router]);

  // SSR時は何も表示しない（Hydration Error回避）
  if (!mounted) {
    return null;
  }

  // ローディング中（認証チェック待ち）
  if (!isAuthenticated && pathname !== '/') {
    return null; // 空を返す（リダイレクト中）
  }

  return <>{children}</>;
}
