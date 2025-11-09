const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, limit } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyDYwD-_fz9m4vSQsbdXuQpKtbHguIl4LaM',
  appId: '1:506175392633:web:046d7c7a6a8ac7e606fda8',
  messagingSenderId: '506175392633',
  projectId: 'gym-match-e560d',
  authDomain: 'gym-match-e560d.firebaseapp.com',
  storageBucket: 'gym-match-e560d.firebasestorage.app',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkSessions() {
  console.log('🔍 セッションデータ確認開始...\n');

  // memberEmailがあり、sharedWithMember=trueのセッションを取得
  const q = query(
    collection(db, 'sessions'),
    where('sharedWithMember', '==', true),
    limit(5)
  );

  const snapshot = await getDocs(q);
  
  console.log(`📊 共有済みセッション数: ${snapshot.size}件\n`);

  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`✅ セッションID: ${doc.id}`);
    console.log(`   会員Email: ${data.memberEmail || '未設定'}`);
    console.log(`   日付: ${data.date?.toDate?.()?.toLocaleDateString() || data.date}`);
    console.log(`   記録: ${data.workoutLog ? 'あり' : 'なし'}`);
    console.log(`   種目数: ${data.workoutLog?.exercises?.length || 0}件`);
    console.log('');
  });

  process.exit(0);
}

checkSessions().catch(console.error);
