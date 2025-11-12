# Firebase Console 日本語設定 完全ガイド

## 🎯 目標
1. メール本文を日本語化
2. 認証完了ページを日本語化（カスタムドメイン設定）

---

## 📧 ステップ1: メールテンプレートの日本語化（即座に実施可能）

### **1. Firebase Consoleにアクセス**
https://console.firebase.google.com/

### **2. プロジェクト選択**
`gym-match-e560d` を選択

### **3. Authentication 設定**
1. 左メニュー: **Build** → **Authentication**
2. 上部タブ: **Templates**

### **4. メール確認テンプレート編集**
1. **Email address verification** (メールアドレスの確認) を選択
2. 右上の **鉛筆アイコン（編集）** をクリック

### **5. 日本語テンプレートに変更**

**件名:**
```
GYM MATCH - メールアドレスの確認
```

**本文:**
```
こんにちは

GYM MATCH Manager へのご登録ありがとうございます。

以下のリンクをクリックして、メールアドレスを確認してください：

<a href="%LINK%">メールアドレスを確認する</a>

または、このリンクをブラウザにコピー&ペーストしてください：
%LINK%

認証が完了したら、ログイン画面からログインしてください：
https://3013-i1wzdi6c2urpgehncb6jg-8f57ffe2.sandbox.novita.ai

このリンクの有効期限は24時間です。

もしこのメールに心当たりがない場合は、無視してください。

---
GYM MATCH チーム
会員管理・売上分析をリアルタイム更新
```

### **6. 保存**
右上の **Save** ボタンをクリック

---

## 🌐 ステップ2: カスタム認証ページの設定（推奨）

### **オプションA: Firebase Hosting経由（推奨）**

#### **1. Firebase Hosting デプロイ**
現在のNext.jsアプリをFirebase Hostingにデプロイ

```bash
# Firebase CLI インストール（未インストールの場合）
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# Firebase初期化
firebase init hosting

# 設定:
# - Public directory: out
# - Single-page app: Yes
# - GitHub Actions: No

# Next.jsビルド（静的エクスポート）
npm run build
# next.config.ts に output: 'export' 追加が必要

# デプロイ
firebase deploy --only hosting
```

#### **2. カスタムドメイン設定**
1. Firebase Console: **Hosting** セクション
2. **Add custom domain**
3. デプロイされたURLを使用（例: `gym-match-e560d.web.app`）

#### **3. Authentication設定でカスタムドメイン指定**
1. **Authentication** → **Settings** → **Authorized domains**
2. Firebase HostingのドメインをAuthorized domainsに追加
3. **Templates** → **Email address verification** → 編集
4. **Customize action URL** にチェック
5. URL: `https://gym-match-e560d.web.app/auth/action`

---

## 🚀 ステップ3: より簡単な一時的解決策

カスタムドメイン設定なしで日本語メッセージを表示する方法：

### **メール本文を詳細な日本語に変更**

**件名:**
```
✅ GYM MATCH - メールアドレスの確認
```

**本文（HTML形式）:**
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f3f4f6;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 20px 0;
    }
    .info-box {
      background: #dbeafe;
      border-left: 4px solid #2563eb;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🏋️ GYM MATCH Manager</div>
      <p style="color: #6b7280;">ジムオーナー専用管理システム</p>
    </div>

    <h2 style="color: #1f2937;">メールアドレスの確認</h2>
    
    <p>こんにちは</p>
    
    <p>GYM MATCH Manager へのご登録ありがとうございます。</p>
    
    <p>以下のボタンをクリックして、メールアドレスを確認してください：</p>
    
    <div style="text-align: center;">
      <a href="%LINK%" class="button">メールアドレスを確認する</a>
    </div>
    
    <div class="info-box">
      <p style="margin: 0; font-weight: bold; color: #1e40af;">✅ 認証完了後の手順：</p>
      <ol style="margin: 10px 0; padding-left: 20px; color: #1e40af;">
        <li>認証が完了したら、ログイン画面に移動します</li>
        <li>登録したメールアドレスとパスワードでログイン</li>
        <li>ダッシュボードから管理を開始</li>
      </ol>
    </div>
    
    <p style="font-size: 14px; color: #6b7280;">
      ボタンが機能しない場合は、以下のリンクをコピーしてブラウザに貼り付けてください：<br>
      <span style="word-break: break-all; color: #2563eb;">%LINK%</span>
    </p>
    
    <p style="font-size: 14px; color: #ef4444; font-weight: bold;">
      ⚠️ このリンクの有効期限は24時間です
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #6b7280;">
      もしこのメールに心当たりがない場合は、無視してください。
    </p>
    
    <div class="footer">
      <p><strong>GYM MATCH チーム</strong></p>
      <p>会員管理・売上分析をリアルタイム更新</p>
    </div>
  </div>
</body>
</html>
```

このHTMLをFirebase Consoleの**Email body**に貼り付けてください。

---

## 📝 チェックリスト

### **即座に実施（5分）**
- [ ] Firebase Console にログイン
- [ ] Templates → Email address verification 選択
- [ ] 件名を日本語に変更
- [ ] 本文を上記HTMLに置き換え
- [ ] Save をクリック
- [ ] テストメール送信

### **中期的対応（30分）**
- [ ] Firebase Hosting セットアップ
- [ ] Next.js静的エクスポート設定
- [ ] カスタムドメイン設定
- [ ] Authentication設定でカスタムURLを指定

---

## 🎨 メールプレビュー

設定後、このようなメールが送信されます：

```
件名: ✅ GYM MATCH - メールアドレスの確認

[青いロゴ]
🏋️ GYM MATCH Manager
ジムオーナー専用管理システム

メールアドレスの確認

こんにちは

GYM MATCH Manager へのご登録ありがとうございます。

[青いボタン: メールアドレスを確認する]

✅ 認証完了後の手順：
1. 認証が完了したら、ログイン画面に移動します
2. 登録したメールアドレスとパスワードでログイン
3. ダッシュボードから管理を開始

⚠️ このリンクの有効期限は24時間です

---
GYM MATCH チーム
```

---

## 🚨 重要な注意事項

1. **HTMLメールのテスト**: 必ず自分のメールアドレスでテスト送信
2. **スパムフィルター**: HTMLメールはスパム判定される可能性がある
3. **モバイル対応**: 上記HTMLはモバイル対応済み
4. **本番環境**: 本番では必ずカスタムドメイン設定を推奨

---

**作成日**: 2025年11月11日  
**更新日**: 2025年11月11日  
**プロジェクト**: GYM MATCH Manager
