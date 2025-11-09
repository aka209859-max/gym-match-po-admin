#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GYM MATCH Manager - Firestoreデモデータ投入スクリプト
gym_demo_001ジムのリアルなサンプルデータを作成

削除方法:
  python3 scripts/delete_demo_data.py
"""

import sys
import os
from datetime import datetime, timedelta
import random

# Firebase Admin SDK
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    print("❌ firebase-admin パッケージがインストールされていません")
    print("📦 インストールコマンド: pip install firebase-admin==7.1.0")
    sys.exit(1)

# Firebase Admin SDK初期化
def initialize_firebase():
    """Firebase Admin SDKを初期化"""
    try:
        # 既に初期化されている場合はスキップ
        firebase_admin.get_app()
        print("✅ Firebase Admin SDK already initialized")
    except ValueError:
        # /opt/flutter/配下のFirebase Admin SDKファイルを探す
        admin_sdk_files = [
            f for f in os.listdir('/opt/flutter/') 
            if ('adminsdk' in f.lower() or 'firebase-admin' in f.lower()) and f.endswith('.json')
        ]
        
        if not admin_sdk_files:
            print("❌ Firebase Admin SDK keyファイルが見つかりません")
            print("📍 場所: /opt/flutter/")
            sys.exit(1)
        
        admin_sdk_path = f"/opt/flutter/{admin_sdk_files[0]}"
        cred = credentials.Certificate(admin_sdk_path)
        firebase_admin.initialize_app(cred)
        print(f"✅ Firebase Admin SDK initialized: {admin_sdk_path}")

# Firestore client取得
initialize_firebase()
db = firestore.client()

# 定数
GYM_ID = 'gym_demo_001'
GYM_NAME = 'GYM MATCH デモジム'

# 日本人の名前リスト（プレゼン用にリアルに）
NAMES = [
    {'name': '山田太郎', 'email': 'yamada.taro@example.com', 'phone': '090-1234-5678'},
    {'name': '佐藤花子', 'email': 'sato.hanako@example.com', 'phone': '090-2345-6789'},
    {'name': '鈴木一郎', 'email': 'suzuki.ichiro@example.com', 'phone': '080-3456-7890'},
    {'name': '田中美咲', 'email': 'tanaka.misaki@example.com', 'phone': '080-4567-8901'},
    {'name': '高橋健太', 'email': 'takahashi.kenta@example.com', 'phone': '090-5678-9012'},
    {'name': '渡辺由美', 'email': 'watanabe.yumi@example.com', 'phone': '080-6789-0123'},
    {'name': '伊藤大輔', 'email': 'ito.daisuke@example.com', 'phone': '090-7890-1234'},
    {'name': '中村麻衣', 'email': 'nakamura.mai@example.com', 'phone': '080-8901-2345'},
    {'name': '小林修平', 'email': 'kobayashi.shuhei@example.com', 'phone': '090-9012-3456'},
    {'name': '加藤愛', 'email': 'kato.ai@example.com', 'phone': '080-0123-4567'},
]

# 契約タイプ分布
CONTRACT_TYPES = ['premium', 'premium', 'premium', 'standard', 'standard', 'standard', 'standard', 'basic', 'basic', 'basic']

def create_members():
    """会員データを作成"""
    print("\n👥 会員データ作成中...")
    
    members = []
    now = datetime.now()
    
    for i, name_data in enumerate(NAMES):
        # 入会日（過去6ヶ月以内）
        join_date = now - timedelta(days=random.randint(30, 180))
        
        # 最終来店日（入会日から今日まで）
        last_visit_days = random.randint(0, 30)
        last_visit = now - timedelta(days=last_visit_days)
        
        # アクティブ判定（30日以内に来店）
        is_active = last_visit_days <= 30
        
        # セッション数（リアルな範囲）
        total_sessions = random.randint(5, 50)
        
        member_data = {
            'gymId': GYM_ID,
            'name': name_data['name'],
            'email': name_data['email'],
            'phone': name_data['phone'],
            'contractType': CONTRACT_TYPES[i],
            'isActive': is_active,
            'joinDate': join_date,
            'lastVisit': last_visit,
            'totalSessions': total_sessions,
            'createdAt': join_date,
            'updatedAt': now,
        }
        
        # Firestoreに追加
        doc_ref = db.collection('users').add(member_data)
        member_id = doc_ref[1].id
        members.append({'id': member_id, **member_data})
        
        print(f"  ✅ {name_data['name']} ({CONTRACT_TYPES[i]}, {total_sessions}回)")
    
    print(f"✅ 会員データ作成完了: {len(members)}名")
    return members

def create_sessions(members):
    """セッションデータを作成"""
    print("\n📅 セッションデータ作成中...")
    
    sessions = []
    now = datetime.now()
    
    session_types = ['personal', 'group', 'trial']
    session_statuses = ['completed', 'completed', 'completed', 'completed', 'scheduled']
    
    # 過去30日分のセッション
    for _ in range(30):
        member = random.choice(members)
        
        # セッション日時（過去30日間 + 未来7日間）
        days_offset = random.randint(-30, 7)
        session_date = now + timedelta(days=days_offset)
        
        # ステータス決定（過去=completed, 未来=scheduled）
        if days_offset < 0:
            status = 'completed'
        else:
            status = 'scheduled'
        
        session_data = {
            'gymId': GYM_ID,
            'userId': member['id'],
            'userName': member['name'],
            'date': session_date,
            'duration': random.choice([30, 45, 60, 90]),
            'type': random.choice(session_types),
            'status': status,
            'createdAt': session_date - timedelta(days=1),
            'updatedAt': now,
        }
        
        # Firestoreに追加
        db.collection('sessions').add(session_data)
        sessions.append(session_data)
    
    print(f"✅ セッションデータ作成完了: {len(sessions)}件")
    return sessions

def create_workout_logs(members):
    """ワークアウトログデータを作成"""
    print("\n🏋️ ワークアウトログデータ作成中...")
    
    workout_logs = []
    now = datetime.now()
    
    # 筋トレ種目
    muscle_groups = ['胸', '背中', '脚', '肩', '腕', '腹筋']
    exercises = ['ベンチプレス', 'スクワット', 'デッドリフト', 'ショルダープレス', 'ラットプルダウン']
    
    # 各会員に対してワークアウトログを作成
    for member in members:
        # 会員のセッション数に応じてログ作成
        num_logs = min(member['totalSessions'], 10)
        
        for i in range(num_logs):
            # ワークアウト日（過去60日間）
            workout_date = now - timedelta(days=random.randint(1, 60))
            
            # 筋トレまたは有酸素
            is_cardio = random.random() < 0.3  # 30%の確率で有酸素
            
            if is_cardio:
                # 有酸素運動
                workout_data = {
                    'userId': member['id'],
                    'gymId': GYM_ID,
                    'date': workout_date,
                    'muscle_group': '有酸素',
                    'exercises': [
                        {
                            'name': 'ランニング',
                            'sets': [
                                {'reps': 1, 'weight': random.randint(20, 60)}  # 分数
                            ]
                        }
                    ],
                    'notes': '有酸素運動',
                    'createdAt': workout_date,
                }
            else:
                # 筋トレ
                muscle_group = random.choice(muscle_groups)
                exercise_name = random.choice(exercises)
                
                workout_data = {
                    'userId': member['id'],
                    'gymId': GYM_ID,
                    'date': workout_date,
                    'muscle_group': muscle_group,
                    'exercises': [
                        {
                            'name': exercise_name,
                            'sets': [
                                {'reps': random.randint(8, 12), 'weight': random.randint(20, 100)}
                                for _ in range(3)
                            ]
                        }
                    ],
                    'notes': f'{muscle_group}トレーニング',
                    'createdAt': workout_date,
                }
            
            # Firestoreに追加
            db.collection('workoutLogs').add(workout_data)
            workout_logs.append(workout_data)
    
    print(f"✅ ワークアウトログデータ作成完了: {len(workout_logs)}件")
    return workout_logs

def main():
    """メイン処理"""
    print("=" * 60)
    print("🏋️ GYM MATCH Manager - デモデータ投入")
    print("=" * 60)
    print(f"📍 ジムID: {GYM_ID}")
    print(f"🏢 ジム名: {GYM_NAME}")
    print()
    
    try:
        # 1. 会員データ作成
        members = create_members()
        
        # 2. セッションデータ作成
        sessions = create_sessions(members)
        
        # 3. ワークアウトログデータ作成
        workout_logs = create_workout_logs(members)
        
        print("\n" + "=" * 60)
        print("✅ デモデータ投入完了！")
        print("=" * 60)
        print(f"👥 会員: {len(members)}名")
        print(f"📅 セッション: {len(sessions)}件")
        print(f"🏋️ ワークアウトログ: {len(workout_logs)}件")
        print()
        print("🔗 Manager画面で確認してください:")
        print("   https://3000-i1wzdi6c2urpgehncb6jg-b32ec7bb.sandbox.novita.ai")
        print()
        print("🗑️ データ削除方法:")
        print("   python3 scripts/delete_demo_data.py")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
