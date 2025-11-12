'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface GymSettings {
  gymName: string;
  ownerEmail: string;
  phone: string;
  address: string;
  description: string;
  openingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  pricingPlans: {
    premium: { name: string; price: number; features: string[] };
    standard: { name: string; price: number; features: string[] };
    basic: { name: string; price: number; features: string[] };
    trial: { name: string; price: number; features: string[] };
  };
  notifications: {
    sessionReminder: boolean;
    paymentReminder: boolean;
    contractExpiry: boolean;
    emailNotifications: boolean;
  };
}

export default function SettingsPage() {
  const { isAuthenticated, gymId, user } = useAuth();
  const [settings, setSettings] = useState<GymSettings>({
    gymName: '',
    ownerEmail: '',
    phone: '',
    address: '',
    description: '',
    openingHours: {
      monday: { open: '09:00', close: '21:00', closed: false },
      tuesday: { open: '09:00', close: '21:00', closed: false },
      wednesday: { open: '09:00', close: '21:00', closed: false },
      thursday: { open: '09:00', close: '21:00', closed: false },
      friday: { open: '09:00', close: '21:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '10:00', close: '17:00', closed: false },
    },
    pricingPlans: {
      premium: { name: 'プレミアム会員', price: 50000, features: ['無制限セッション', '専属トレーナー', '栄養指導'] },
      standard: { name: 'スタンダード会員', price: 30000, features: ['月8回セッション', 'グループレッスン', '施設利用'] },
      basic: { name: 'ベーシック会員', price: 15000, features: ['月4回セッション', '施設利用'] },
      trial: { name: '体験会員', price: 5000, features: ['1回セッション', '施設見学'] },
    },
    notifications: {
      sessionReminder: true,
      paymentReminder: true,
      contractExpiry: true,
      emailNotifications: true,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'hours' | 'pricing' | 'notifications'>('basic');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && gymId) {
      loadGymSettings();
    }
  }, [isAuthenticated, gymId]);

  const loadGymSettings = async () => {
    if (!gymId) return;
    
    setIsLoading(true);
    try {
      const gymRef = doc(db, 'gyms', gymId);
      const gymDoc = await getDoc(gymRef);
      
      if (gymDoc.exists()) {
        const data = gymDoc.data();
        setSettings({
          gymName: data.gymName || '',
          ownerEmail: data.ownerEmail || user?.email || '',
          phone: data.phone || '',
          address: data.address || '',
          description: data.description || '',
          openingHours: data.openingHours || settings.openingHours,
          pricingPlans: data.pricingPlans || settings.pricingPlans,
          notifications: data.notifications || settings.notifications,
        });
      }
    } catch (error) {
      console.error('❌ ジム設定取得エラー:', error);
      setError('設定の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!gymId) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const gymRef = doc(db, 'gyms', gymId);
      await updateDoc(gymRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      });

      setSuccessMessage('✅ 設定を保存しました');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('❌ 設定保存エラー:', err);
      setError('設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const dayLabels: { [key: string]: string } = {
    monday: '月曜日',
    tuesday: '火曜日',
    wednesday: '水曜日',
    thursday: '木曜日',
    friday: '金曜日',
    saturday: '土曜日',
    sunday: '日曜日',
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6 pt-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">⚙️ ジム設定</h1>
          <p className="text-gray-600 mt-2">
            ジムの基本情報、営業時間、料金プランを管理します
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-800 font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'basic'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏢 基本情報
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'hours'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🕐 営業時間
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'pricing'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💰 料金プラン
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'notifications'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔔 通知設定
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-lg shadow-sm border p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">基本情報</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ジム名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.gymName}
                  onChange={(e) => setSettings({ ...settings, gymName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例: GYM MATCH 渋谷店"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  オーナーメールアドレス
                </label>
                <input
                  type="email"
                  value={settings.ownerEmail}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                <p className="text-sm text-gray-500 mt-1">※ オーナーメールは変更できません</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例: 03-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  住所
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例: 東京都渋谷区道玄坂1-2-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ジム説明
                </label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ジムの特徴や強みを記入してください"
                />
              </div>
            </div>
          )}

          {/* Opening Hours Tab */}
          {activeTab === 'hours' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">営業時間</h2>
              
              {Object.entries(settings.openingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-24 font-medium text-gray-900">
                    {dayLabels[day]}
                  </div>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hours.closed}
                      onChange={(e) => setSettings({
                        ...settings,
                        openingHours: {
                          ...settings.openingHours,
                          [day]: { ...hours, closed: e.target.checked },
                        },
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">定休日</span>
                  </label>

                  {!hours.closed && (
                    <>
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => setSettings({
                          ...settings,
                          openingHours: {
                            ...settings.openingHours,
                            [day]: { ...hours, open: e.target.value },
                          },
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-600">〜</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => setSettings({
                          ...settings,
                          openingHours: {
                            ...settings.openingHours,
                            [day]: { ...hours, close: e.target.value },
                          },
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">料金プラン</h2>
              
              {Object.entries(settings.pricingPlans).map(([key, plan]) => (
                <div key={key} className="border rounded-lg p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        プラン名
                      </label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => setSettings({
                          ...settings,
                          pricingPlans: {
                            ...settings.pricingPlans,
                            [key]: { ...plan, name: e.target.value },
                          },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        月額料金（円）
                      </label>
                      <input
                        type="number"
                        value={plan.price}
                        onChange={(e) => setSettings({
                          ...settings,
                          pricingPlans: {
                            ...settings.pricingPlans,
                            [key]: { ...plan, price: Number(e.target.value) },
                          },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      特典内容（1行に1つ）
                    </label>
                    <textarea
                      value={plan.features.join('\n')}
                      onChange={(e) => setSettings({
                        ...settings,
                        pricingPlans: {
                          ...settings.pricingPlans,
                          [key]: { ...plan, features: e.target.value.split('\n').filter(f => f.trim()) },
                        },
                      })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="例:\n無制限セッション\n専属トレーナー\n栄養指導"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">通知設定</h2>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={settings.notifications.sessionReminder}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, sessionReminder: e.target.checked },
                    })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">セッションリマインダー</div>
                    <div className="text-sm text-gray-600">セッション24時間前に会員へ通知</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={settings.notifications.paymentReminder}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, paymentReminder: e.target.checked },
                    })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">支払いリマインダー</div>
                    <div className="text-sm text-gray-600">会費支払い期限の3日前に通知</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={settings.notifications.contractExpiry}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, contractExpiry: e.target.checked },
                    })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">契約更新通知</div>
                    <div className="text-sm text-gray-600">契約期限の7日前に通知</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailNotifications: e.target.checked },
                    })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">メール通知</div>
                    <div className="text-sm text-gray-600">重要なお知らせをメールで送信</div>
                  </div>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 通知システムについて</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>通知は自動的に会員へ送信されます</li>
                  <li>メール通知には有効なメールアドレスが必要です</li>
                  <li>通知の送信履歴は後日追加予定です</li>
                </ul>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? '保存中...' : '✅ 設定を保存'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
