# Firebase メールテンプレート日本語化ガイド

## 🎯 目的
Firebase Authentication の確認メールとエラーページを日本語化する

## 📋 手順

### **ステップ1: Firebase Console にアクセス**
1. https://console.firebase.google.com/ を開く
2. プロジェクト `gym-match-e560d` を選択

### **ステップ2: Authentication 設定**
1. 左メニューから **Authentication** をクリック
2. 上部タブの **Templates** をクリック

### **ステップ3: メール確認テンプレートの編集**
1. **Email address verification** (メールアドレスの確認) を選択
2. 右上の **鉛筆アイコン（編集）** をクリック

### **ステップ4: 言語設定**
1. **Language** ドロップダウンで **Japanese (日本語)** を選択
2. 件名とメール本文が日本語に自動変換される

### **ステップ5: カスタマイズ（オプション）**
日本語テンプレートをカスタマイズできます：

**件名例:**
```
GYM MATCH - メールアドレスの確認
```

**本文例:**
```
こんにちは %DISPLAY_NAME% さん

GYM MATCH Manager へのご登録ありがとうございます。

以下のリンクをクリックして、メールアドレスを確認してください：

%LINK%

このリンクの有効期限は24時間です。

もしこのメールに心当たりがない場合は、無視してください。

---
GYM MATCH チーム
```

### **ステップ6: 変更を保存**
- 右上の **Save** ボタンをクリック

---

## 🌐 アクションハンドラーのカスタマイズ

Firebaseのデフォルトエラーページ（英語）をカスタムページ（日本語）に置き換える方法：

### **オプションA: カスタムアクションハンドラーページを作成**

#### 1. カスタムページの作成
`app/auth/action/page.tsx` を作成し、独自のエラーハンドリングを実装

#### 2. Firebase Console での設定
1. **Authentication** → **Settings** → **Authorized domains**
2. カスタムドメインを追加
3. **Action URL** を設定: `https://yourdomain.com/auth/action`

#### 3. カスタムページの例
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

      if (!oobCode) {
        setStatus('error');
        setMessage('無効なリンクです。');
        return;
      }

      try {
        switch (mode) {
          case 'verifyEmail':
            await applyActionCode(auth, oobCode);
            setStatus('success');
            setMessage('メールアドレスが確認されました！ログインしてください。');
            setTimeout(() => router.push('/'), 3000);
            break;
          
          default:
            setStatus('error');
            setMessage('無効な操作です。');
        }
      } catch (error: any) {
        setStatus('error');
        if (error.code === 'auth/expired-action-code') {
          setMessage('確認リンクの有効期限が切れています。再度確認メールを送信してください。');
        } else if (error.code === 'auth/invalid-action-code') {
          setMessage('このリンクは既に使用されているか、無効です。');
        } else {
          setMessage('エラーが発生しました。もう一度お試しください。');
        }
      }
    };

    handleAction();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">確認中...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">メール認証完了</h1>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">エラー</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <a href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              ログイン画面へ
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🎯 推奨アプローチ

### **即座に実施可能（5分）:**
1. Firebase Console で言語を日本語に変更
2. メールテンプレートを日本語化

### **中期的改善（30分）:**
1. カスタムアクションハンドラーページを作成
2. 完全に日本語化されたエラーハンドリング

---

## 📝 日本語エラーメッセージ一覧

| Firebase エラーコード | 日本語メッセージ |
|---------------------|----------------|
| `auth/expired-action-code` | 確認リンクの有効期限が切れています。再度確認メールを送信してください。 |
| `auth/invalid-action-code` | このリンクは既に使用されているか、無効です。 |
| `auth/user-disabled` | このアカウントは無効化されています。管理者にお問い合わせください。 |
| `auth/user-not-found` | このメールアドレスは登録されていません。 |
| `auth/weak-password` | パスワードが脆弱です。より強力なパスワードを設定してください。 |

---

## ✅ チェックリスト

- [ ] Firebase Console で言語を日本語に設定
- [ ] メール確認テンプレートを日本語化
- [ ] テストメール送信で確認
- [ ] （オプション）カスタムアクションハンドラーページ作成
- [ ] エラーメッセージの日本語化テスト

---

**作成日**: 2025年11月11日  
**プロジェクト**: GYM MATCH Manager
