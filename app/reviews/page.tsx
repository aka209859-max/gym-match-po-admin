'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface Review {
  id: string;
  memberId: string;
  memberName: string;
  trainerId: string;
  trainerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  reply?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTrainer, setSelectedTrainer] = useState<string>('all');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [showReplyModal, setShowReplyModal] = useState<string | null>(null);

  // サンプルデータ生成
  useEffect(() => {
    const sampleReviews: Review[] = [
      {
        id: 'rev001',
        memberId: 'mem001',
        memberName: '山田 太郎',
        trainerId: 'trainer001',
        trainerName: '田中 健太',
        rating: 5,
        comment: '非常に丁寧な指導で、3ヶ月で体重が5kg減りました！トレーニングメニューも私のレベルに合わせてくれて、無理なく続けられています。',
        status: 'approved',
        reply: 'ご利用ありがとうございます！今後も目標達成に向けてサポートさせていただきます。',
        createdAt: new Date('2025-01-08'),
        updatedAt: new Date('2025-01-08'),
      },
      {
        id: 'rev002',
        memberId: 'mem002',
        memberName: '佐藤 花子',
        trainerId: 'trainer002',
        trainerName: '佐藤 美咲',
        rating: 4,
        comment: 'トレーナーさんが明るくて楽しく続けられています。もう少し予約が取りやすいと嬉しいです。',
        status: 'approved',
        createdAt: new Date('2025-01-07'),
        updatedAt: new Date('2025-01-07'),
      },
      {
        id: 'rev003',
        memberId: 'mem003',
        memberName: '鈴木 一郎',
        trainerId: 'trainer001',
        trainerName: '田中 健太',
        rating: 5,
        comment: '筋力が明らかに向上しました。専門的な知識が豊富で信頼できます。',
        status: 'pending',
        createdAt: new Date('2025-01-09'),
        updatedAt: new Date('2025-01-09'),
      },
      {
        id: 'rev004',
        memberId: 'mem004',
        memberName: '田中 次郎',
        trainerId: 'trainer003',
        trainerName: '鈴木 大輔',
        rating: 3,
        comment: '指導内容は良いですが、時間通りに始まらないことが多いのが気になります。',
        status: 'pending',
        createdAt: new Date('2025-01-09'),
        updatedAt: new Date('2025-01-09'),
      },
      {
        id: 'rev005',
        memberId: 'mem005',
        memberName: '伊藤 美紀',
        trainerId: 'trainer002',
        trainerName: '佐藤 美咲',
        rating: 5,
        comment: '女性トレーナーで安心して通えます。食事指導も具体的で実践しやすいです！',
        status: 'approved',
        reply: 'ありがとうございます！引き続き一緒に頑張りましょう！',
        createdAt: new Date('2025-01-06'),
        updatedAt: new Date('2025-01-06'),
      },
      {
        id: 'rev006',
        memberId: 'mem006',
        memberName: '高橋 健',
        trainerId: 'trainer003',
        trainerName: '鈴木 大輔',
        rating: 4,
        comment: 'トレーニング効果は実感していますが、もう少し料金が安いと助かります。',
        status: 'approved',
        createdAt: new Date('2025-01-05'),
        updatedAt: new Date('2025-01-05'),
      },
      {
        id: 'rev007',
        memberId: 'mem007',
        memberName: '渡辺 真由美',
        trainerId: 'trainer004',
        trainerName: '山本 愛',
        rating: 5,
        comment: '姿勢改善プログラムで肩こりが解消されました！本当に感謝しています。',
        status: 'approved',
        createdAt: new Date('2025-01-04'),
        updatedAt: new Date('2025-01-04'),
      },
      {
        id: 'rev008',
        memberId: 'mem008',
        memberName: '中村 誠',
        trainerId: 'trainer001',
        trainerName: '田中 健太',
        rating: 2,
        comment: 'トレーニング内容が私には少しハードすぎました。もっと初心者向けのメニューが欲しいです。',
        status: 'pending',
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-10'),
      },
    ];

    setReviews(sampleReviews);
  }, []);

  // 統計計算
  const stats = {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0',
    approvedCount: reviews.filter(r => r.status === 'approved').length,
    pendingCount: reviews.filter(r => r.status === 'pending').length,
    rejectedCount: reviews.filter(r => r.status === 'rejected').length,
    ratingDistribution: {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    },
  };

  // フィルタリング
  const filteredReviews = reviews.filter(review => {
    const matchRating = filterRating === 'all' || review.rating === filterRating;
    const matchStatus = filterStatus === 'all' || review.status === filterStatus;
    const matchTrainer = selectedTrainer === 'all' || review.trainerId === selectedTrainer;
    return matchRating && matchStatus && matchTrainer;
  });

  // トレーナーリスト抽出
  const trainers = Array.from(new Set(reviews.map(r => r.trainerName)))
    .map(name => ({
      id: reviews.find(r => r.trainerName === name)?.trainerId || '',
      name,
    }));

  // 星評価表示コンポーネント
  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-2 text-sm font-semibold text-gray-700">{rating}.0</span>
    </div>
  );

  // ステータスバッジ
  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const labels = {
      approved: '承認済み',
      pending: '未承認',
      rejected: '非承認',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  // レビュー承認
  const handleApprove = (reviewId: string) => {
    setReviews(prev => 
      prev.map(r => r.id === reviewId ? { ...r, status: 'approved' as const, updatedAt: new Date() } : r)
    );
  };

  // レビュー非承認
  const handleReject = (reviewId: string) => {
    setReviews(prev => 
      prev.map(r => r.id === reviewId ? { ...r, status: 'rejected' as const, updatedAt: new Date() } : r)
    );
  };

  // レビュー削除
  const handleDelete = (reviewId: string) => {
    if (confirm('このレビューを削除してもよろしいですか？')) {
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    }
  };

  // 返信送信
  const handleReply = (reviewId: string) => {
    const reply = replyText[reviewId];
    if (!reply || reply.trim() === '') {
      alert('返信内容を入力してください');
      return;
    }

    setReviews(prev => 
      prev.map(r => r.id === reviewId ? { ...r, reply, updatedAt: new Date() } : r)
    );
    setReplyText(prev => ({ ...prev, [reviewId]: '' }));
    setShowReplyModal(null);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">レビュー管理</h1>
          <p className="text-gray-600">会員からのレビューを管理し、返信を行います。</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">総レビュー数</h3>
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">平均評価</h3>
              <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.averageRating}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">承認済み</h3>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.approvedCount}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">未承認</h3>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingCount}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">非承認</h3>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.rejectedCount}</p>
          </div>
        </div>

        {/* 評価分布グラフ */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">評価分布</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 w-24">
                    <span className="text-sm font-semibold text-gray-700">{rating}</span>
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 10 && (
                          <span className="text-xs font-semibold text-white">{count}件</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-16 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">フィルター</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">評価</label>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">すべて</option>
                <option value="5">⭐⭐⭐⭐⭐ (5つ星)</option>
                <option value="4">⭐⭐⭐⭐ (4つ星)</option>
                <option value="3">⭐⭐⭐ (3つ星)</option>
                <option value="2">⭐⭐ (2つ星)</option>
                <option value="1">⭐ (1つ星)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">すべて</option>
                <option value="approved">承認済み</option>
                <option value="pending">未承認</option>
                <option value="rejected">非承認</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">トレーナー</label>
              <select
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">すべて</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* レビューリスト */}
        <div className="space-y-6">
          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">レビューが見つかりません</h3>
              <p className="text-gray-600">フィルター条件を変更してお試しください。</p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* レビューヘッダー */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {review.memberName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{review.memberName}</h3>
                        <p className="text-sm text-gray-600">担当: {review.trainerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <StatusBadge status={review.status} />
                      <span className="text-sm text-gray-500">
                        {review.createdAt.toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>

                {/* レビュー内容 */}
                <div className="p-6">
                  <p className="text-gray-700 leading-relaxed mb-6">{review.comment}</p>

                  {/* 返信表示 */}
                  {review.reply && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-900 mb-1">ジムからの返信</p>
                          <p className="text-sm text-gray-700">{review.reply}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 返信入力フォーム */}
                  {showReplyModal === review.id && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">返信内容</label>
                      <textarea
                        value={replyText[review.id] || ''}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder="会員への返信を入力してください..."
                      />
                      <div className="flex items-center space-x-3 mt-3">
                        <button
                          onClick={() => handleReply(review.id)}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                        >
                          返信を送信
                        </button>
                        <button
                          onClick={() => setShowReplyModal(null)}
                          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  )}

                  {/* アクションボタン */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      {review.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>承認</span>
                          </button>
                          <button
                            onClick={() => handleReject(review.id)}
                            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>非承認</span>
                          </button>
                        </>
                      )}
                      {!review.reply && review.status === 'approved' && (
                        <button
                          onClick={() => setShowReplyModal(review.id)}
                          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          <span>返信する</span>
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>削除</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 表示件数 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {filteredReviews.length} 件のレビューを表示中
            {(filterRating !== 'all' || filterStatus !== 'all' || selectedTrainer !== 'all') && (
              <span className="ml-2">
                (全 {reviews.length} 件中)
              </span>
            )}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
