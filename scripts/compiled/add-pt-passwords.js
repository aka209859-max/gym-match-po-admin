"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
const firebaseConfig = {
    apiKey: 'AIzaSyDYwD-_fz9m4vSQsbdXuQpKtbHguIl4LaM',
    appId: '1:506175392633:web:046d7c7a6a8ac7e606fda8',
    messagingSenderId: '506175392633',
    projectId: 'gym-match-e560d',
    authDomain: 'gym-match-e560d.firebaseapp.com',
    storageBucket: 'gym-match-e560d.firebasestorage.app',
};
const app = (0, app_1.initializeApp)(firebaseConfig);
const db = (0, firestore_1.getFirestore)(app);
async function addPTPasswords() {
    console.log('🔐 パーソナルトレーニングパスワード追加開始...\n');
    try {
        // 1. gymsコレクションに店舗共通パスワード追加
        const gymsSnapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(db, 'gyms'));
        console.log(`📊 ジム数: ${gymsSnapshot.size}件\n`);
        for (const gymDoc of gymsSnapshot.docs) {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(db, 'gyms', gymDoc.id), {
                personalTrainingCommonPassword: 'pt2024', // デフォルト共通パスワード
                ptPasswordType: 'common', // デフォルトは共通パスワード
            });
            console.log(`✅ ジム ${gymDoc.id}: 共通パスワード設定完了`);
        }
        // 2. usersコレクションに個別パスワードフラグ追加
        const usersSnapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(db, 'users'));
        console.log(`\n📊 ユーザー数: ${usersSnapshot.size}件\n`);
        for (const userDoc of usersSnapshot.docs) {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(db, 'users', userDoc.id), {
                useGymCommonPassword: true, // デフォルトは店舗共通パスワード使用
            });
            console.log(`✅ ユーザー ${userDoc.id}: フラグ設定完了`);
        }
        console.log('\n✨ パスワード設定完了！');
        console.log('📋 設定内容:');
        console.log('   - 店舗共通パスワード: pt2024');
        console.log('   - パスワード種別: 共通パスワード');
        console.log('   - 全ユーザー: 共通パスワード使用');
    }
    catch (error) {
        console.error('❌ エラー:', error);
        process.exit(1);
    }
    process.exit(0);
}
addPTPasswords();
