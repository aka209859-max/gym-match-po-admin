'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import TrainerAddModal from '@/components/TrainerAddModal';
import TrainerEditModal from '@/components/TrainerEditModal';
import TrainerDeleteConfirmation from '@/components/TrainerDeleteConfirmation';

interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  certifications: string[];
  experience: number; // years
  bio: string;
  isActive: boolean;
  joinDate: Date;
  createdAt: Date;
}

export default function TrainersPage() {
  const { isAuthenticated, gymId } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal states
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && gymId) {
      loadTrainers();
    }
  }, [isAuthenticated, gymId]);

  const loadTrainers = async () => {
    if (!gymId) return;
    
    setIsLoading(true);
    try {
      const trainersRef = collection(db, 'trainers');
      const trainersQuery = query(
        trainersRef,
        where('gymId', '==', gymId)
      );
      const trainersSnapshot = await getDocs(trainersQuery);
      
      const trainersData: Trainer[] = [];
      trainersSnapshot.forEach((doc) => {
        const data = doc.data();
        trainersData.push({
          id: doc.id,
          name: data.name || 'Unknown',
          email: data.email || '',
          phone: data.phone || '',
          specialties: data.specialties || [],
          certifications: data.certifications || [],
          experience: data.experience || 0,
          bio: data.bio || '',
          isActive: data.isActive !== false,
          joinDate: data.joinDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      
      // Sort by join date (newest first)
      trainersData.sort((a, b) => b.joinDate.getTime() - a.joinDate.getTime());
      setTrainers(trainersData);
      
      console.log('✅ トレーナーデータ取得完了:', trainersData.length, '件');
    } catch (error) {
      console.error('❌ トレーナーデータ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter trainers
  const filteredTrainers = trainers.filter((trainer) => {
    // Active filter
    if (filterActive === 'active' && !trainer.isActive) return false;
    if (filterActive === 'inactive' && trainer.isActive) return false;

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        trainer.name.toLowerCase().includes(query) ||
        trainer.email.toLowerCase().includes(query) ||
        trainer.specialties.some(s => s.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const stats = {
    total: trainers.length,
    active: trainers.filter(t => t.isActive).length,
    inactive: trainers.filter(t => !t.isActive).length,
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6 pt-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👤 トレーナー管理</h1>
            <p className="text-gray-600 mt-2">
              トレーナーの情報を管理します
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium"
          >
            ➕ トレーナー追加
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">全トレーナー</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">アクティブ</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">非アクティブ</p>
                <p className="text-3xl font-bold text-gray-600 mt-1">{stats.inactive}</p>
              </div>
              <div className="text-4xl">⏸️</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="トレーナー名、メール、専門分野で検索"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="active">アクティブ</option>
                <option value="inactive">非アクティブ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trainers List */}
        <div className="bg-white rounded-lg shadow-sm border">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">読み込み中...</div>
          ) : filteredTrainers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">👤</div>
              <p className="text-gray-900 text-lg">トレーナーが見つかりません</p>
              <p className="text-gray-500 text-sm mt-2">
                {trainers.length === 0 ? 'トレーナーを追加してください' : 'フィルター条件を変更してください'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTrainers.map((trainer) => (
                <div key={trainer.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    {/* Left: Trainer Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {trainer.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          trainer.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {trainer.isActive ? 'アクティブ' : '非アクティブ'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-600">{trainer.email}</p>
                          <p className="text-sm text-gray-600">{trainer.phone}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-900">専門分野</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {trainer.specialties.map((specialty, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-900">経験年数</p>
                          <p className="text-sm text-gray-600 mt-1">{trainer.experience}年</p>
                        </div>
                      </div>

                      {trainer.bio && (
                        <p className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                          {trainer.bio}
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedTrainer(trainer);
                          setIsEditModalOpen(true);
                        }}
                        className="px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
                      >
                        ✏️ 編集
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTrainer(trainer);
                          setIsDeleteModalOpen(true);
                        }}
                        className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap"
                      >
                        🗑️ 削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TrainerAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadTrainers}
      />
      
      {selectedTrainer && (
        <>
          <TrainerEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            trainer={selectedTrainer}
            onSuccess={loadTrainers}
          />
          
          <TrainerDeleteConfirmation
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            trainer={selectedTrainer}
            onSuccess={loadTrainers}
          />
        </>
      )}
    </AdminLayout>
  );
}
