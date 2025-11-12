'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  certifications: string[];
  experience: number;
  bio: string;
  isActive: boolean;
}

interface TrainerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trainer: Trainer;
}

export default function TrainerEditModal({ isOpen, onClose, onSuccess, trainer }: TrainerEditModalProps) {
  const [name, setName] = useState(trainer.name);
  const [email, setEmail] = useState(trainer.email);
  const [phone, setPhone] = useState(trainer.phone);
  const [specialties, setSpecialties] = useState(trainer.specialties.join('\n'));
  const [certifications, setCertifications] = useState(trainer.certifications.join('\n'));
  const [experience, setExperience] = useState(trainer.experience.toString());
  const [bio, setBio] = useState(trainer.bio);
  const [isActive, setIsActive] = useState(trainer.isActive);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trainer) {
      setName(trainer.name);
      setEmail(trainer.email);
      setPhone(trainer.phone);
      setSpecialties(trainer.specialties.join('\n'));
      setCertifications(trainer.certifications.join('\n'));
      setExperience(trainer.experience.toString());
      setBio(trainer.bio);
      setIsActive(trainer.isActive);
    }
  }, [trainer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('必須項目を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const trainerRef = doc(db, 'trainers', trainer.id);
      await updateDoc(trainerRef, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        specialties: specialties.split('\n').filter(s => s.trim()).map(s => s.trim()),
        certifications: certifications.split('\n').filter(c => c.trim()).map(c => c.trim()),
        experience: Number(experience),
        bio: bio.trim(),
        isActive: isActive,
        updatedAt: serverTimestamp(),
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('❌ トレーナー更新エラー:', err);
      setError('更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">✏️ トレーナー編集</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <span className="text-red-800 font-medium">⚠️ {error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              トレーナー名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              電話番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">経験年数</label>
            <input
              type="number"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">専門分野（1行に1つ）</label>
            <textarea
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">資格・認定（1行に1つ）</label>
            <textarea
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">自己紹介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">アクティブ</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 font-medium"
            >
              {isSubmitting ? '更新中...' : '✅ 更新する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
