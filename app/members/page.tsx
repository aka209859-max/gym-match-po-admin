'use client';

import { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
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
  const [members, setMembers] = useState<Member[]>(getDemoMembers());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<MemberStatus | 'all'>('all');
  const [selectedContractType, setSelectedContractType] = useState<ContractType | 'all'>('all');

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
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">会員管理</h1>
          <p className="text-gray-600 mt-2">
            会員情報の閲覧・管理を行います
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">全会員</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">有効会員</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">休会中</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.inactive}</p>
              </div>
              <div className="text-4xl">⏸️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">体験会員</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.trial}</p>
              </div>
              <div className="text-4xl">🆕</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">期限間近</p>
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
              <span className="text-sm text-gray-600">フィルター適用中:</span>
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
              <p className="text-gray-600 text-lg">会員が見つかりません</p>
              <p className="text-gray-500 text-sm mt-2">
                フィルター条件を変更してください
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// Member Row Component
function MemberRow({ member }: { member: Member }) {
  const statusColor = MEMBER_STATUS_COLORS[member.status];
  const contractTypeColor = CONTRACT_TYPE_COLORS[member.contractType];
  const activityStatus = getMemberActivityStatus(member.lastVisit);
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
              <p className="text-gray-600 text-sm">
                {member.email}
              </p>
              <p className="text-gray-600 text-sm">
                {member.phone}
              </p>
            </div>

            <div>
              <p className="text-gray-900 font-medium mb-1">
                入会日: {formatMemberDate(member.joinDate)}
              </p>
              <p className="text-gray-600 text-sm">
                在籍期間: {membershipMonths}ヶ月
              </p>
              {member.expiryDate && (
                <p className="text-gray-600 text-sm">
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
              <p className="text-gray-600 text-sm">
                総セッション数: {member.totalSessions}回
              </p>
              <p className="text-gray-600 text-sm">
                累計売上: ¥{member.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>

          {member.notes && (
            <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
              メモ: {member.notes}
            </p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="ml-4 flex flex-col gap-2">
          <button className="px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
            詳細
          </button>
          <button className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            編集
          </button>
        </div>
      </div>
    </div>
  );
}

// Demo Data Generator
function getDemoMembers(): Member[] {
  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const oneWeekFromNow = new Date(today);
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
  const oneMonthFromNow = new Date(today);
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
  const threeMonthsFromNow = new Date(today);
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  return [
    {
      id: 'member_001',
      name: '山田太郎',
      nameKana: 'ヤマダタロウ',
      email: 'yamada@example.com',
      phone: '090-1234-5678',
      contractType: 'premium',
      status: 'active',
      joinDate: oneYearAgo,
      expiryDate: threeMonthsFromNow,
      lastVisit: today,
      totalSessions: 48,
      totalRevenue: 384000,
      notes: '筋力トレーニング重点。プロテイン購入希望あり。',
      createdAt: oneYearAgo,
      updatedAt: today,
    },
    {
      id: 'member_002',
      name: '鈴木花子',
      nameKana: 'スズキハナコ',
      email: 'suzuki@example.com',
      phone: '080-2345-6789',
      contractType: 'standard',
      status: 'active',
      joinDate: sixMonthsAgo,
      expiryDate: oneWeekFromNow,
      lastVisit: threeMonthsAgo,
      totalSessions: 24,
      totalRevenue: 144000,
      notes: '有酸素運動メイン。更新案内送付済み。',
      createdAt: sixMonthsAgo,
      updatedAt: today,
    },
    {
      id: 'member_003',
      name: '高橋健一',
      nameKana: 'タカハシケンイチ',
      email: 'takahashi@example.com',
      phone: '090-3456-7890',
      contractType: 'basic',
      status: 'active',
      joinDate: threeMonthsAgo,
      expiryDate: oneMonthFromNow,
      lastVisit: oneMonthAgo,
      totalSessions: 12,
      totalRevenue: 60000,
      createdAt: threeMonthsAgo,
      updatedAt: today,
    },
    {
      id: 'member_004',
      name: '伊藤美咲',
      nameKana: 'イトウミサキ',
      email: 'ito@example.com',
      phone: '080-4567-8901',
      contractType: 'trial',
      status: 'trial',
      joinDate: oneMonthAgo,
      lastVisit: oneMonthAgo,
      totalSessions: 2,
      totalRevenue: 6000,
      notes: '体験トレーニング実施済み。入会検討中。',
      createdAt: oneMonthAgo,
      updatedAt: today,
    },
    {
      id: 'member_005',
      name: '渡辺翔太',
      nameKana: 'ワタナベショウタ',
      email: 'watanabe@example.com',
      phone: '090-5678-9012',
      contractType: 'premium',
      status: 'inactive',
      joinDate: oneYearAgo,
      expiryDate: threeMonthsFromNow,
      lastVisit: sixMonthsAgo,
      totalSessions: 30,
      totalRevenue: 240000,
      notes: '休会申請済み（仕事都合）。3ヶ月後復帰予定。',
      createdAt: oneYearAgo,
      updatedAt: sixMonthsAgo,
    },
    {
      id: 'member_006',
      name: '中村さくら',
      nameKana: 'ナカムラサクラ',
      email: 'nakamura@example.com',
      phone: '080-6789-0123',
      contractType: 'standard',
      status: 'active',
      joinDate: oneYearAgo,
      expiryDate: threeMonthsFromNow,
      lastVisit: today,
      totalSessions: 52,
      totalRevenue: 312000,
      notes: 'ヨガクラス参加希望。次回更新時にプレミアムへ変更検討。',
      createdAt: oneYearAgo,
      updatedAt: today,
    },
    {
      id: 'member_007',
      name: '小林大輔',
      nameKana: 'コバヤシダイスケ',
      email: 'kobayashi@example.com',
      phone: '090-7890-1234',
      contractType: 'basic',
      status: 'active',
      joinDate: threeMonthsAgo,
      expiryDate: oneMonthFromNow,
      lastVisit: oneMonthAgo,
      totalSessions: 10,
      totalRevenue: 50000,
      createdAt: threeMonthsAgo,
      updatedAt: today,
    },
    {
      id: 'member_008',
      name: '加藤麻衣',
      nameKana: 'カトウマイ',
      email: 'kato@example.com',
      phone: '080-8901-2345',
      contractType: 'premium',
      status: 'expired',
      joinDate: oneYearAgo,
      expiryDate: oneMonthAgo,
      lastVisit: threeMonthsAgo,
      totalSessions: 36,
      totalRevenue: 288000,
      notes: '期限切れ。更新案内未返答。再入会キャンペーン案内予定。',
      createdAt: oneYearAgo,
      updatedAt: oneMonthAgo,
    },
    {
      id: 'member_009',
      name: '佐々木優',
      nameKana: 'ササキユウ',
      email: 'sasaki@example.com',
      phone: '090-9012-3456',
      contractType: 'standard',
      status: 'active',
      joinDate: sixMonthsAgo,
      expiryDate: threeMonthsFromNow,
      lastVisit: today,
      totalSessions: 28,
      totalRevenue: 168000,
      createdAt: sixMonthsAgo,
      updatedAt: today,
    },
    {
      id: 'member_010',
      name: '田中誠',
      nameKana: 'タナカマコト',
      email: 'tanaka@example.com',
      phone: '080-0123-4567',
      contractType: 'basic',
      status: 'active',
      joinDate: oneMonthAgo,
      expiryDate: oneMonthFromNow,
      lastVisit: oneMonthAgo,
      totalSessions: 4,
      totalRevenue: 20000,
      notes: '新規入会。トレーニングメニュー作成済み。',
      createdAt: oneMonthAgo,
      updatedAt: today,
    },
  ];
}
