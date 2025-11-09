/**
 * 既存セッションにmemberEmailを一括追加するスクリプト
 * 
 * 使用方法:
 * npx ts-node scripts/update-member-emails.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';

// Firebase Configuration (直接初期化)
const firebaseConfig = {
  apiKey: 'AIzaSyDYwD-_fz9m4vSQsbdXuQpKtbHguIl4LaM',
  appId: '1:506175392633:web:046d7c7a6a8ac7e606fda8',
  messagingSenderId: '506175392633',
  projectId: 'gym-match-e560d',
  authDomain: 'gym-match-e560d.firebaseapp.com',
  storageBucket: 'gym-match-e560d.firebasestorage.app',
  measurementId: 'G-DXGP9WX0Z8',
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateMemberEmails() {
  console.log('🚀 既存セッションのmemberEmail一括更新開始...\n');

  try {
    // 全セッションを取得
    const sessionsSnapshot = await getDocs(collection(db, 'sessions'));
    console.log(`📊 総セッション数: ${sessionsSnapshot.size}件\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // バッチ処理（Firestoreのバッチは最大500件）
    const batch = writeBatch(db);
    let batchCount = 0;
    const batchLimit = 500;

    for (const sessionDoc of sessionsSnapshot.docs) {
      const sessionData = sessionDoc.data();
      const sessionId = sessionDoc.id;

      // 既にmemberEmailがある場合はスキップ
      if (sessionData.memberEmail) {
        skippedCount++;
        continue;
      }

      // userIdから会員情報を取得（memberIdの代わりにuserIdを使用）
      const userId = sessionData.userId || sessionData.memberId;
      if (!userId) {
        console.warn(`⚠️ セッション ${sessionId}: userIdが存在しません`);
        skippedCount++;
        continue;
      }

      try {
        // 会員情報を取得
        const memberRef = doc(db, 'users', userId);
        const memberSnap = await getDoc(memberRef);

        if (!memberSnap.exists()) {
          console.warn(`⚠️ セッション ${sessionId}: 会員 ${userId} が見つかりません`);
          skippedCount++;
          continue;
        }

        const memberData = memberSnap.data();
        const memberEmail = memberData.email || '';

        if (!memberEmail) {
          console.warn(`⚠️ セッション ${sessionId}: 会員 ${userId} のメールアドレスが空です`);
          skippedCount++;
          continue;
        }

        // バッチに追加
        const sessionRef = doc(db, 'sessions', sessionId);
        batch.update(sessionRef, { memberEmail });
        batchCount++;
        updatedCount++;

        console.log(`✅ セッション ${sessionId}: ${memberEmail} を追加`);

        // バッチ上限に達したら一旦コミット
        if (batchCount >= batchLimit) {
          await batch.commit();
          console.log(`\n📦 バッチコミット: ${batchCount}件\n`);
          batchCount = 0;
        }
      } catch (error) {
        console.error(`❌ セッション ${sessionId} の更新エラー:`, error);
        errorCount++;
      }
    }

    // 残りのバッチをコミット
    if (batchCount > 0) {
      await batch.commit();
      console.log(`\n📦 最終バッチコミット: ${batchCount}件\n`);
    }

    console.log('\n✨ 一括更新完了！');
    console.log(`📊 結果:`);
    console.log(`   - 更新成功: ${updatedCount}件`);
    console.log(`   - スキップ: ${skippedCount}件`);
    console.log(`   - エラー: ${errorCount}件`);

  } catch (error) {
    console.error('❌ 一括更新エラー:', error);
    process.exit(1);
  }
}

// スクリプト実行
updateMemberEmails()
  .then(() => {
    console.log('\n🎉 スクリプト正常終了');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 スクリプト異常終了:', error);
    process.exit(1);
  });
