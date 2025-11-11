# 🚀 GYM MATCH Manager - Vercelデプロイガイド

## 📋 事前準備

### 必要なアカウント
- ✅ GitHub アカウント
- ✅ Vercel アカウント (https://vercel.com/signup)
- ✅ Firebase プロジェクト
- ✅ Stripe アカウント (決済機能を使う場合)

---

## 🚀 デプロイ手順 (5分で完了)

### Step 1: Vercelにログイン

1. **Vercelにアクセス**: https://vercel.com/login
2. **GitHubでサインイン**をクリック
3. GitHubアカウントで認証

### Step 2: プロジェクトをインポート

1. Vercelダッシュボードで **"Add New..."** → **"Project"** をクリック
2. **"Import Git Repository"** セクションで `gym-match-po-admin` を検索
3. **"Import"** をクリック

### Step 3: プロジェクト設定

#### 基本設定
- **Project Name**: `gym-match-manager` (お好みで変更可能)
- **Framework Preset**: Next.js (自動検出されます)
- **Root Directory**: `./` (デフォルト)
- **Build Command**: `npm run build` (自動設定)
- **Output Directory**: `.next` (自動設定)
- **Install Command**: `npm install` (自動設定)

#### リージョン設定
- **Function Region**: Tokyo, Japan (hnd1) ← 日本向けに最適化

### Step 4: 環境変数の設定

**重要**: デプロイ前に必ず設定してください!

#### Environment Variables セクションで以下を追加:

```bash
# Firebase設定
NEXT_PUBLIC_FIREBASE_API_KEY=あなたのAPIキー
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=プロジェクト.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=プロジェクトID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=プロジェクト.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=センダーID
NEXT_PUBLIC_FIREBASE_APP_ID=アプリID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Stripe設定 (決済機能を使う場合)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx

# アプリケーション設定
NEXT_PUBLIC_APP_URL=https://あなたのドメイン.vercel.app
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

**環境変数の追加方法**:
1. 各変数を **Key** と **Value** に入力
2. **Add** をクリック
3. 全ての変数を追加したら次へ

### Step 5: デプロイ開始

1. **"Deploy"** ボタンをクリック
2. ビルドプロセスを待つ (約2-3分)
3. ✅ デプロイ完了!

---

## 🌐 独自ドメインの設定

### Step 1: ドメイン取得 (未取得の場合)

推奨レジストラ:
- お名前.com (https://www.onamae.com/)
- ムームードメイン (https://muumuu-domain.com/)
- Google Domains (https://domains.google/)

例: `gym-match.jp` を取得

### Step 2: Vercelでドメイン設定

1. Vercelプロジェクトダッシュボード → **"Settings"** → **"Domains"**
2. **"Add Domain"** をクリック
3. ドメインを入力: `manager.gym-match.jp`
4. **"Add"** をクリック

### Step 3: DNSレコード設定

#### CNAMEレコードを追加:

```
Type: CNAME
Name: manager
Value: cname.vercel-dns.com
TTL: 3600
```

**お名前.comの場合**:
1. ログイン → ドメイン一覧
2. 対象ドメインの「DNS設定」をクリック
3. 「DNSレコード設定」を選択
4. 上記のCNAMEレコードを追加
5. 保存

**ムームードメインの場合**:
1. コントロールパネル → ドメイン操作 → ムームーDNS
2. カスタム設定
3. CNAMEレコードを追加
4. 保存

### Step 4: SSL証明書の自動発行

- Vercelが自動的にSSL証明書を発行します (Let's Encrypt)
- DNS設定後、5-10分で有効化されます
- ✅ `https://manager.gym-match.jp` でアクセス可能になります

---

## 🔒 セキュリティチェックリスト

デプロイ後、以下を確認してください:

- [ ] HTTPSでアクセスできる
- [ ] 環境変数が正しく設定されている
- [ ] Firebase認証が動作する
- [ ] 管理者ログインができる
- [ ] 全ページが正常に表示される
- [ ] APIエンドポイントが動作する
- [ ] robots.txtで検索エンジンをブロックしている

---

## ⚡ パフォーマンスチェック

デプロイ後、以下のツールで確認:

### Google PageSpeed Insights
https://pagespeed.web.dev/

**目標スコア**:
- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- SEO: 90+

### Lighthouse (Chrome DevTools)
1. Chrome DevToolsを開く (F12)
2. "Lighthouse" タブ
3. "Analyze page load" をクリック

---

## 🔄 自動デプロイ設定

Vercelは **GitHubと自動連携** されています:

- ✅ `main` ブランチにpush → 本番環境に自動デプロイ
- ✅ 他のブランチにpush → プレビュー環境を自動生成
- ✅ Pull Request → プレビューURLが自動生成

**自動デプロイの流れ**:
```bash
git add .
git commit -m "Update: 新機能追加"
git push origin main

# Vercelが自動的に:
# 1. ビルド開始
# 2. テスト実行
# 3. デプロイ
# 4. 完了通知
```

---

## 🐛 トラブルシューティング

### ビルドエラーが発生した場合

#### エラー: "Module not found"
```bash
# 解決策: 依存関係を再インストール
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

#### エラー: "Environment variable not defined"
- Vercelの Environment Variables を確認
- 必要な変数が全て設定されているか確認
- プレフィックス `NEXT_PUBLIC_` が正しいか確認

### デプロイは成功したが動作しない

#### Firebase接続エラー
1. Firebase Console → プロジェクト設定 → General
2. Web アプリの設定を確認
3. Vercelの環境変数と一致しているか確認

#### 404エラーが出る
1. `vercel.json` の rewrites 設定を確認
2. Next.js のルーティングが正しいか確認

---

## 📊 監視とメンテナンス

### Vercelダッシュボードで確認できる項目

- **Deployments**: デプロイ履歴
- **Analytics**: アクセス解析
- **Speed Insights**: パフォーマンス分析
- **Logs**: エラーログ・アクセスログ
- **Usage**: 帯域幅・ビルド時間

### アラート設定

1. Vercel Settings → Notifications
2. メール通知を有効化:
   - Deployment Success/Failure
   - Domain Configuration Changes
   - Performance Alerts

---

## 💰 料金プラン

### Hobby (無料プラン)
- ✅ 100GB 帯域幅/月
- ✅ 無制限のデプロイ
- ✅ 自動SSL
- ✅ プレビューデプロイ
- ⚠️ 商用利用は Pro プラン推奨

### Pro ($20/月)
- ✅ 1TB 帯域幅/月
- ✅ パスワード保護
- ✅ 高度な分析
- ✅ チームコラボレーション
- ✅ カスタムドメイン無制限

---

## 🎯 次のステップ

デプロイが完了したら:

1. **📱 モバイルアプリとの連携**
   - API URLを更新
   - Firebaseプロジェクトを統一

2. **👥 チームメンバーの追加**
   - Vercel Settings → Team
   - GitHubコラボレーター追加

3. **📊 分析ツールの統合**
   - Google Analytics
   - Hotjar (ユーザー行動分析)

4. **🔔 通知システムの構築**
   - Firebase Cloud Messaging
   - メール通知

---

## 📞 サポート

問題が発生した場合:

- **Vercel サポート**: https://vercel.com/support
- **Firebase サポート**: https://firebase.google.com/support
- **GitHub Issues**: プロジェクトのIssuesセクション

---

**デプロイ成功を祈っています! 🚀**
