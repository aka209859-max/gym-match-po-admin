'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface EmailSenderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Member {
  id: string;
  name: string;
  email: string;
}

export default function EmailSender({ isOpen, onClose }: EmailSenderProps) {
  const { gymId, gymName } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [emailType, setEmailType] = useState<'all' | 'selected'>('all');

  // Load members when modal opens
  useEffect(() => {
    if (isOpen && gymId) {
      loadMembers();
    }
  }, [isOpen, gymId]);

  const loadMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const membersRef = collection(db, 'members');
      const q = query(membersRef, where('gymId', '==', gymId), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      
      const membersList: Member[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        membersList.push({
          id: doc.id,
          name: data.name,
          email: data.email,
        });
      });
      
      setMembers(membersList);
      console.log(`✅ Loaded ${membersList.length} members for email`);
    } catch (error) {
      console.error('❌ Error loading members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleSend = () => {
    if (!subject || !message) {
      alert('件名と本文を入力してください。');
      return;
    }

    const recipientEmails = members.map(m => m.email).join(',');
    const mailtoLink = `mailto:${recipientEmails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

    // Open email client
    window.location.href = mailtoLink;

    console.log('✅ Email client opened with pre-filled content');
    
    // Reset and close
    setSubject('');
    setMessage('');
    onClose();
  };

  const handleClose = () => {
    if (!isLoading) {
      setSubject('');
      setMessage('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              メール送信
            </h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-white hover:text-gray-200 transition disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {isLoadingMembers ? (
            <div className="p-4 text-center text-gray-500">
              <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-orange-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              会員リスト読み込み中...
            </div>
          ) : members.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              ⚠️ 登録済みの会員がいません。先に会員を登録してください。
            </div>
          ) : (
            <>
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  メール送信について
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 全アクティブ会員（{members.length}名）にメールを送信します</li>
                  <li>• ご利用のメールクライアント（Outlook, Gmail等）が起動します</li>
                  <li>• 件名と本文は事前に入力されます</li>
                  <li>• 送信前に内容を確認・編集できます</li>
                </ul>
              </div>

              {/* Subject */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  件名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                  placeholder="例: 【{gymName || 'ジム名'}】重要なお知らせ"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Message */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  本文 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                  placeholder={`会員の皆様へ\n\nいつも${gymName || 'ジム名'}をご利用いただきありがとうございます。\n\n[ここにメッセージを入力してください]\n\n今後ともよろしくお願いいたします。\n\n${gymName || 'ジム名'}\n担当者名`}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Template Suggestions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  テンプレート候補（クリックでコピー）
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubject(`【${gymName || 'ジム名'}】営業時間変更のお知らせ`);
                      setMessage(`会員の皆様へ\n\nいつも${gymName || 'ジム名'}をご利用いただきありがとうございます。\n\n営業時間を以下の通り変更させていただきます。\n\n【変更前】平日 10:00-22:00\n【変更後】平日 9:00-23:00\n\nより多くの皆様にご利用いただけるよう、営業時間を拡大いたしました。\n\n今後ともよろしくお願いいたします。`);
                    }}
                    className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-900 transition"
                  >
                    📢 営業時間変更のお知らせ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubject(`【${gymName || 'ジム名'}】新プログラムのご案内`);
                      setMessage(`会員の皆様へ\n\nいつも${gymName || 'ジム名'}をご利用いただきありがとうございます。\n\n新しいトレーニングプログラムを開始いたしました！\n\n【プログラム名】[プログラム名]\n【開始日】[開始日]\n【内容】[内容説明]\n\nぜひご参加ください。\n\n今後ともよろしくお願いいたします。`);
                    }}
                    className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-900 transition"
                  >
                    🎉 新プログラムのご案内
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSend}
                  disabled={isLoading || !subject || !message}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  メール作成
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
