'use client';

import { useState, useMemo, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMembers } from '@/lib/firestore';
import MemberEditModal from '@/components/MemberEditModal';
import MemberDetailModal from '@/components/MemberDetailModal';
import MemberDeleteConfirmation from '@/components/MemberDeleteConfirmation';
import {
  Member,
  MemberStatus,
  ContractType,
  MemberFilter,
  MEMBER_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  MEMBER_STATUS_COLORS,
  CONTRACT_TYPE_COLORS,
  formatMemberDate,
  isExpiringSoon,
  getMemberActivityStatus,
  membershipDurationMonths,
} from '@/types/member';

export default function MembersPage() {
  const { isAuthenticated, gymId } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<MemberStatus | 'all'>('all');
  const [selectedContractType, setSelectedContractType] = useState<ContractType | 'all'>('all');
  
  // Modal states
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ✅ 実データ取得
  useEffect(() => {
    if (isAuthenticated && gymId) {
      const loadMembers = async () => {
        try {
          console.log('👥 会員データ取得開始 - gymId:', gymId);
          setIsLoading(true);
          const membersData = await fetchMembers(gymId);
          
          console.log('📊 Firestoreから取得したデータ件数:', membersData.length);
          if (membersData.length > 0) {
            console.log('📊 最初の会員データサンプル:', membersData[0]);
          }
          
          // Firestore Member型をUI Member型に変換
          const uiMembers: Member[] = membersData.map(m => {
            // 安全なcontractType変換
            const contractType = (['premium', 'standard', 'basic', 'trial'].includes(m.contractType)) 
              ? m.contractType as ContractType 
              : 'basic' as ContractType;
            
            // 安全なstatus変換
            const status = m.isActive ? 'active' as MemberStatus : 'inactive' as MemberStatus;
            
            console.log('🔍 Member変換:', {
              id: m.id,
              name: m.name,
              status,
              contractType,
              isActive: m.isActive,
              rawContractType: m.contractType,
            });
            
            return {
              id: m.id,
              name: m.name,
              email: m.email,
              phone: m.phone,
              status: status,
              contractType: contractType,
              joinDate: m.joinDate,  // Date型のまま保持
              lastVisit: m.lastVisit || m.joinDate,  // lastVisitがない場合はjoinDateを使用
              totalSessions: m.totalSessions || 0,
              totalRevenue: 0,  // デフォルト値
              createdAt: m.joinDate,  // createdAtとして使用
              updatedAt: new Date(),  // 現在時刻
            };
          });
          
          setMembers(uiMembers);
          console.log('✅ 会員データ取得完了:', uiMembers.length, '件');
        } catch (error) {
          console.error('❌ 会員データ取得エラー:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadMembers();
    }
  }, [isAuthenticated, gymId]);

  // Reload members after CRUD operations
  const reloadMembers = async () => {
    if (isAuthenticated && gymId) {
      try {
        setIsLoading(true);
        const membersData = await fetchMembers(gymId);
        const uiMembers: Member[] = membersData.map(m => {
          const contractType = (['premium', 'standard', 'basic', 'trial'].includes(m.contractType)) 
            ? m.contractType as ContractType 
            : 'basic' as ContractType;
          const status = m.isActive ? 'active' as MemberStatus : 'inactive' as MemberStatus;
          return {
            id: m.id,
            name: m.name,
            email: m.email,
            phone: m.phone,
            status: status,
            contractType: contractType,
            joinDate: m.joinDate,
            lastVisit: m.lastVisit || m.joinDate,
            totalSessions: m.totalSessions || 0,
            totalRevenue: 0,
            createdAt: m.joinDate,
            updatedAt: new Date(),
          };
        });
        setMembers(uiMembers);
      } catch (error) {
        console.error('❌ 会員データ再取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Modal handlers
  const handleViewDetail = (member: Member) => {
    setSelectedMember(member);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleDelete = (member: Member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  // Filter members based on criteria
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Status filter
      if (selectedStatus !== 'all' && member.status !== selectedStatus) {
        return false;
      }

      // Contract type filter
      if (selectedContractType !== 'all' && member.contractType !== selectedContractType) {
        return false;
      }

      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          member.name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          member.phone.includes(query)
        );
      }

      return true;
    });
  }, [members, selectedStatus, selectedContractType, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: members.length,
      active: members.filter((m) => m.status === 'active').length,
      inactive: members.filter((m) => m.status === 'inactive').length,
      trial: members.filter((m) => m.status === 'trial').length,
      expiringSoon: members.filter((m) => m.expiryDate && isExpiringSoon(m.expiryDate)).length,
    };
  }, [members]);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6 pt-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">会員管理</h1>
          <p className="text-gray-900 mt-2">
            会員情報の閲覧・管理を行います
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">全会員</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">有効会員</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">休会中</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.inactive}</p>
              </div>
              <div className="text-4xl">⏸️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">体験会員</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.trial}</p>
              </div>
              <div className="text-4xl">🆕</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">期限間近</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats.expiringSoon}</p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                検索
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="会員名、メール、電話番号で検索"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                ステータス
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as MemberStatus | 'all')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                {Object.entries(MEMBER_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Contract Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                契約プラン
              </label>
              <select
                value={selectedContractType}
                onChange={(e) => setSelectedContractType(e.target.value as ContractType | 'all')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedStatus !== 'all' || selectedContractType !== 'all' || searchQuery) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-900">フィルター適用中:</span>
              {selectedStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {MEMBER_STATUS_LABELS[selectedStatus]}
                  <button
                    onClick={() => setSelectedStatus('all')}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedContractType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {CONTRACT_TYPE_LABELS[selectedContractType]}
                  <button
                    onClick={() => setSelectedContractType('all')}
                    className="hover:text-purple-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  検索: {searchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:text-gray-900"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedStatus('all');
                  setSelectedContractType('all');
                  setSearchQuery('');
                }}
                className="ml-auto text-sm text-blue-600 hover:text-blue-700"
              >
                すべてクリア
              </button>
            </div>
          )}
        </div>

        {/* Members List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredMembers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-900 text-lg">会員が見つかりません</p>
              <p className="text-gray-500 text-sm mt-2">
                フィルター条件を変更してください
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <MemberRow 
                  key={member.id} 
                  member={member}
                  onViewDetail={handleViewDetail}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedMember && (
        <>
          <MemberDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            member={selectedMember}
            onEdit={() => {
              setIsDetailModalOpen(false);
              setIsEditModalOpen(true);
            }}
          />
          
          <MemberEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            member={selectedMember}
            onSuccess={reloadMembers}
          />
          
          <MemberDeleteConfirmation
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            member={selectedMember}
            onSuccess={reloadMembers}
          />
        </>
      )}
    </AdminLayout>
  );
}

// Member Row Component
function MemberRow({ 
  member,
  onViewDetail,
  onEdit,
  onDelete,
}: { 
  member: Member;
  onViewDetail: (member: Member) => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}) {
  // 安全なカラー取得（デフォルト値付き）
  const statusColor = MEMBER_STATUS_COLORS[member.status] || { 
    bg: 'bg-gray-100', 
    text: 'text-gray-800', 
    border: 'border-gray-300' 
  };
  const contractTypeColor = CONTRACT_TYPE_COLORS[member.contractType] || { 
    bg: 'bg-blue-100', 
    text: 'text-blue-800' 
  };
  const activityStatus = member.lastVisit ? getMemberActivityStatus(member.lastVisit) : { text: '不明', color: 'text-gray-500' };
  const membershipMonths = membershipDurationMonths(member.joinDate);

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        {/* Left: Member Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor.bg} ${statusColor.text} ${statusColor.border} border`}
            >
              {MEMBER_STATUS_LABELS[member.status]}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${contractTypeColor.bg} ${contractTypeColor.text}`}>
              {CONTRACT_TYPE_LABELS[member.contractType]}
            </span>
            {member.expiryDate && isExpiringSoon(member.expiryDate) && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                期限間近
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                {member.name}
              </h3>
              <p className="text-gray-900 text-sm">
                {member.email}
              </p>
              <p className="text-gray-900 text-sm">
                {member.phone}
              </p>
            </div>

            <div>
              <p className="text-gray-900 font-medium mb-1">
                入会日: {formatMemberDate(member.joinDate)}
              </p>
              <p className="text-gray-900 text-sm">
                在籍期間: {membershipMonths}ヶ月
              </p>
              {member.expiryDate && (
                <p className="text-gray-900 text-sm">
                  有効期限: {formatMemberDate(member.expiryDate)}
                </p>
              )}
            </div>

            <div>
              <p className="text-gray-900 font-medium mb-1">
                利用状況
              </p>
              <p className={`text-sm ${activityStatus.color}`}>
                {activityStatus.text}
              </p>
              <p className="text-gray-900 text-sm">
                総セッション数: {member.totalSessions}回
              </p>
              <p className="text-gray-900 text-sm">
                累計売上: ¥{member.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>

          {member.notes && (
            <p className="mt-3 text-sm text-gray-900 bg-gray-50 p-3 rounded">
              メモ: {member.notes}
            </p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="ml-4 flex flex-col gap-2">
          <button 
            onClick={() => onViewDetail(member)}
            className="px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            📊 詳細
          </button>
          <button 
            onClick={() => onEdit(member)}
            className="px-4 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ✏️ 編集
          </button>
          <button 
            onClick={() => onDelete(member)}
            className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            🗑️ 削除
          </button>
        </div>
      </div>
    </div>
  );
}

// Demo Data Generator
