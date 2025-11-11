'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { applyActionCode } from 'firebase/auth';

export default function AuthActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAction = async () => {
      const mode = searchParams.get('mode');
      const oobCode = searchParams.get('oobCode');

      console.log('🔐 Auth Action:', { mode, oobCode: oobCode ? 'present' : 'missing' });

      if (!oobCode) {
        setStatus('error');
        setMessage('無効な確認リンクです。');
        return;
      }

      try {
        switch (mode) {
          case 'verifyEmail':
            console.log('📧 Verifying email with code...');
            await applyActionCode(auth, oobCode);
            console.log('✅ Email verified successfully');
            setStatus('success');
            setMessage('メールアドレスが確認されました！3秒後にログイン画面へ移動します。');
            setTimeout(() => router.push('/'), 3000);
            break;
          
          case 'resetPassword':
            // パスワードリセット処理（将来実装）
            router.push(`/reset-password?oobCode=${oobCode}`);
            break;
          
          default:
            console.log('❌ Invalid mode:', mode);
            setStatus('error');
            setMessage('無効な操作です。');
        }
      } catch (error: any) {
        console.error('❌ Auth action error:', error);
        setStatus('error');
        
        // エラーコードに応じた日本語メッセージ
        if (error.code === 'auth/expired-action-code') {
          setMessage('確認リンクの有効期限が切れています。登録画面から再度確認メールを送信してください。');
        } else if (error.code === 'auth/invalid-action-code') {
          setMessage('このリンクは既に使用されているか、無効です。既に認証が完了している場合は、ログイン画面からログインしてください。');
        } else if (error.code === 'auth/user-disabled') {
          setMessage('このアカウントは無効化されています。管理者にお問い合わせください。');
        } else if (error.code === 'auth/user-not-found') {
          setMessage('ユーザーが見つかりません。再度登録してください。');
        } else {
          setMessage(`エラーが発生しました: ${error.message}`);
        }
      }
    };

    handleAction();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-6"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              確認中...
            </h1>
            <p className="text-gray-600">
              メールアドレスを確認しています
            </p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              メール認証完了！
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <Link
              href="/"
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
            >
              ログイン画面へ
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <svg
                className="w-12 h-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              エラーが発生しました
            </h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                {message}
              </p>
            </div>
            
            <div className="space-y-3">
              <Link
                href="/"
                className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                ログイン画面へ
              </Link>
              <Link
                href="/register"
                className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                新規登録画面へ
              </Link>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">トラブルシューティング</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>リンクは1回のみ有効です</li>
                    <li>24時間以内にクリックしてください</li>
                    <li>既に認証済みの場合はログインしてください</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
