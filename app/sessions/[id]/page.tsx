'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSessionWorkoutLog,
  addWorkoutLog,
  shareWorkoutLogWithMember,
  type Exercise,
  type BodyMetrics,
  formatWorkoutDate,
  formatWorkoutTime,
} from '@/lib/workout-log';

export default function SessionDetailPage({ params }: { params: any }) {
  const router = useRouter();
  const { gymId } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const sessionId = params?.id || '';

  // トレーニング記録フォーム状態
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', weight: undefined, reps: undefined, sets: undefined },
  ]);
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetrics>({});
  const [trainerNotes, setTrainerNotes] = useState('');
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>(new Array(exercises.length).fill(''));

  // 部位別種目プリセット
  const exercisesByBodyPart: Record<string, string[]> = {
    '脚': [
      'スクワット',
      'レッグプレス',
      'レッグエクステンション',
      'レッグカール',
      'ランジ',
      'ブルガリアンスクワット',
      'レッグレイズ（脚）',
      'カーフレイズ',
    ],
    '胸': [
      'ベンチプレス',
      'インクラインベンチプレス',
      'デクラインベンチプレス',
      'ダンベルプレス',
      'ダンベルフライ',
      'ケーブルクロスオーバー',
      'プッシュアップ',
      'ディップス（胸）',
    ],
    '背中': [
      'デッドリフト',
      'ラットプルダウン',
      'チンニング（懸垂）',
      'ベントオーバーロウ',
      'ワンハンドロウ',
      'ケーブルロウ',
      'シーテッドロウ',
      'Tバーロウ',
    ],
    '肩': [
      'ショルダープレス',
      'ダンベルショルダープレス',
      'サイドレイズ',
      'フロントレイズ',
      'リアレイズ',
      'アップライトロウ',
      'フェイスプル',
    ],
    '腕': [
      'バーベルカール',
      'ダンベルカール',
      'ハンマーカール',
      'トライセプスエクステンション',
      'トライセプスプレスダウン',
      'フレンチプレス',
      'ディップス（腕）',
    ],
    '腹筋': [
      'クランチ',
      'レッグレイズ（腹筋）',
      'プランク',
      'サイドプランク',
      'バイシクルクランチ',
      'ロシアンツイスト',
      'アブローラー',
    ],
    '有酸素': [
      'ランニング',
      'トレッドミル',
      'エアロバイク',
      'ローイングマシン',
      'エリプティカル',
      'ステアマスター',
    ],
  };

  // 全種目フラットリスト（検索用）
  const allExercises = Object.values(exercisesByBodyPart).flat();

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    setLoading(true);
    try {
      const data = await getSessionWorkoutLog(sessionId);
      setSession(data);

      // 既存の記録がある場合はフォームに反映
      if (data?.workoutLog) {
        setExercises(data.workoutLog.exercises || [{ name: '', weight: undefined, reps: undefined, sets: undefined }]);
        setBodyMetrics(data.workoutLog.bodyMetrics || {});
        setTrainerNotes(data.workoutLog.trainerNotes || '');
        setIntensity(data.workoutLog.intensity || 'medium');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      alert(`セッション情報の読み込みに失敗しました\n\nエラー詳細:\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const addExercise = () => {
    setExercises([...exercises, { name: '', weight: undefined, reps: undefined, sets: undefined }]);
    setSelectedBodyParts([...selectedBodyParts, '']);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
    setSelectedBodyParts(selectedBodyParts.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSave = async (shareWithMember: boolean = false) => {
    if (!session) return;

    // バリデーション
    const validExercises = exercises.filter(ex => ex.name.trim() !== '');
    if (validExercises.length === 0) {
      alert('最低1つの種目を入力してください');
      return;
    }

    if (!trainerNotes.trim()) {
      alert('トレーナーメモを入力してください');
      return;
    }

    setSaving(true);
    try {
      await addWorkoutLog({
        sessionId: sessionId,
        exercises: validExercises,
        bodyMetrics: Object.keys(bodyMetrics).length > 0 ? bodyMetrics : undefined,
        trainerNotes,
        intensity,
        shareWithMember,
      });

      alert(shareWithMember ? '✅ 記録を保存して会員に共有しました！' : '✅ 記録を保存しました！');
      
      // データ再読み込み
      await loadSession();
    } catch (error) {
      console.error('Error saving workout log:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      alert(`記録の保存に失敗しました\n\nエラー詳細:\n${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!session) return;

    if (!session.workoutLog) {
      alert('記録が保存されていません。先に記録を保存してください。');
      return;
    }

    if (window.confirm('この記録を会員に共有しますか？')) {
      setSaving(true);
      try {
        await shareWorkoutLogWithMember(sessionId);
        alert('✅ 会員に共有しました！');
        await loadSession();
      } catch (error) {
        console.error('Error sharing workout log:', error);
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        alert(`共有に失敗しました\n\nエラー詳細:\n${errorMessage}`);
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!session) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">セッションが見つかりません</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            ← 戻る
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700 mb-2"
            >
              ← 戻る
            </button>
            <h1 className="text-3xl font-bold text-gray-900">セッション詳細</h1>
          </div>
        </div>

        {/* セッション情報カード */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">会員名</div>
              <div className="text-lg font-semibold text-gray-900">{session.memberName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">トレーナー</div>
              <div className="text-lg font-semibold text-gray-900">{session.trainerName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">日時</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatWorkoutDate(session.date)} {formatWorkoutTime(session.date)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">セッションタイプ</div>
              <div className="text-lg font-semibold text-gray-900">{session.sessionType}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">時間</div>
              <div className="text-lg font-semibold text-gray-900">{session.duration}分</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">ステータス</div>
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  session.status === 'completed' ? 'bg-green-100 text-green-800' :
                  session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {session.status === 'completed' ? '完了' :
                   session.status === 'scheduled' ? '予約済み' : session.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* トレーニング記録入力フォーム */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">📝 トレーニング記録</h2>

          {/* 実施メニュー */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              実施メニュー
            </label>
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <div key={index}>
                  {/* 部位・種目選択エリア */}
                  <div className="flex gap-3 items-center mb-2">
                    {/* 部位選択ドロップダウン */}
                    <select
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                      value={selectedBodyParts[index] || ''}
                      onChange={(e) => {
                        const newBodyParts = [...selectedBodyParts];
                        newBodyParts[index] = e.target.value;
                        setSelectedBodyParts(newBodyParts);
                        
                        if (e.target.value) {
                          // 部位が選択されたら、その部位の最初の種目をセット
                          const firstExercise = exercisesByBodyPart[e.target.value][0];
                          updateExercise(index, 'name', firstExercise);
                        }
                      }}
                    >
                      <option value="">部位を選択</option>
                      {Object.keys(exercisesByBodyPart).map((bodyPart) => (
                        <option key={bodyPart} value={bodyPart}>
                          {bodyPart}
                        </option>
                      ))}
                    </select>

                    {/* 種目名入力（データリスト付き） */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        list={`exercise-list-${index}`}
                        placeholder="種目名を入力または選択"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        value={exercise.name}
                        onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      />
                      <datalist id={`exercise-list-${index}`}>
                        {allExercises.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </div>
                    
                    <input
                      type="number"
                      placeholder="重量(kg)"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      value={exercise.weight || ''}
                      onChange={(e) => updateExercise(index, 'weight', parseFloat(e.target.value) || undefined)}
                    />
                    <input
                      type="number"
                      placeholder="回数"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      value={exercise.reps || ''}
                      onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || undefined)}
                    />
                    <input
                      type="number"
                      placeholder="セット"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      value={exercise.sets || ''}
                      onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || undefined)}
                    />
                    {exercises.length > 1 && (
                      <button
                        onClick={() => removeExercise(index)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        削除
                      </button>
                    )}
                  </div>

                  {/* 部位選択時の候補クイック選択 */}
                  {selectedBodyParts[index] && (
                    <div className="ml-36 mt-2 bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        {selectedBodyParts[index]}の種目:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {exercisesByBodyPart[selectedBodyParts[index]].map((exerciseName) => (
                          <button
                            key={exerciseName}
                            type="button"
                            onClick={() => updateExercise(index, 'name', exerciseName)}
                            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                              exercise.name === exerciseName
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-900 hover:bg-blue-50 border border-gray-300'
                            }`}
                          >
                            {exerciseName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {!selectedBodyParts[index] && !exercise.name && (
                    <div className="ml-36 text-xs text-gray-500 italic">
                      💡 まず部位を選択してください
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addExercise}
              className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              + 種目を追加
            </button>
          </div>

          {/* 体組成 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              体組成（任意）
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <input
                  type="number"
                  step="0.1"
                  placeholder="体重 (kg)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  value={bodyMetrics.weight || ''}
                  onChange={(e) => setBodyMetrics({...bodyMetrics, weight: parseFloat(e.target.value) || undefined})}
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.1"
                  placeholder="体脂肪率 (%)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  value={bodyMetrics.bodyFat || ''}
                  onChange={(e) => setBodyMetrics({...bodyMetrics, bodyFat: parseFloat(e.target.value) || undefined})}
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.1"
                  placeholder="筋肉量 (kg)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  value={bodyMetrics.muscleMass || ''}
                  onChange={(e) => setBodyMetrics({...bodyMetrics, muscleMass: parseFloat(e.target.value) || undefined})}
                />
              </div>
            </div>
          </div>

          {/* トレーニング強度 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              トレーニング強度
            </label>
            <div className="flex gap-4">
              {[
                { value: 'low', label: '軽め', color: 'bg-green-100 text-green-800' },
                { value: 'medium', label: '普通', color: 'bg-yellow-100 text-yellow-800' },
                { value: 'high', label: 'ハード', color: 'bg-red-100 text-red-800' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setIntensity(option.value as any)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    intensity === option.value
                      ? option.color + ' ring-2 ring-offset-2 ' + (option.value === 'low' ? 'ring-green-500' : option.value === 'medium' ? 'ring-yellow-500' : 'ring-red-500')
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* トレーナーメモ */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              トレーナーメモ（会員に表示されます）
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="会員さんへのメッセージやアドバイスを入力してください..."
              value={trainerNotes}
              onChange={(e) => setTrainerNotes(e.target.value)}
            />
          </div>

          {/* 保存ボタン */}
          <div className="flex gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              💾 記録を保存
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              📤 保存して会員に共有
            </button>
          </div>

          {/* 後から共有ボタン */}
          {session.workoutLog && !session.sharedWithMember && (
            <button
              onClick={handleShare}
              disabled={saving}
              className="w-full mt-3 bg-yellow-100 text-yellow-800 py-3 rounded-lg font-semibold hover:bg-yellow-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              📢 会員に共有する
            </button>
          )}

          {/* 共有状態表示 */}
          {session.sharedWithMember && (
            <div className="mt-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex items-center gap-2 text-green-800">
                <span className="text-xl">✅</span>
                <div>
                  <div className="font-semibold">会員に共有済み</div>
                  <div className="text-sm mt-1">
                    共有日時: {session.sharedAt ? formatWorkoutDate(session.sharedAt) + ' ' + formatWorkoutTime(session.sharedAt) : '不明'}
                  </div>
                  {session.memberViewed && session.memberViewedAt && (
                    <div className="text-sm text-green-600 mt-1">
                      ✓ 会員が閲覧しました ({formatWorkoutDate(session.memberViewedAt)} {formatWorkoutTime(session.memberViewedAt)})
                    </div>
                  )}
                  {!session.memberViewed && (
                    <div className="text-sm text-gray-600 mt-1">
                      📌 会員はまだ閲覧していません
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
