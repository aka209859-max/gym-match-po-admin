#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GYM MATCH Manager - デモデータ削除スクリプト
gym_demo_001ジムのサンプルデータを完全削除

使用方法:
  python3 scripts/delete_demo_data.py
"""

import sys
import os

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
        firebase_admin.get_app()
        print("✅ Firebase Admin SDK already initialized")
    except ValueError:
        admin_sdk_files = [
            f for f in os.listdir('/opt/flutter/') 
            if ('adminsdk' in f.lower() or 'firebase-admin' in f.lower()) and f.endswith('.json')
        ]
        
        if not admin_sdk_files:
            print("❌ Firebase Admin SDK keyファイルが見つかりません")
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

def delete_collection(collection_name, field_name='gymId'):
    """指定されたコレクションのgym_demo_001データを削除"""
    print(f"\n🗑️  {collection_name}コレクションを削除中...")
    
    # gymIdでフィルタ
    query = db.collection(collection_name).where(field_name, '==', GYM_ID)
    docs = query.stream()
    
    deleted_count = 0
    for doc in docs:
        doc.reference.delete()
        deleted_count += 1
    
    print(f"  ✅ {deleted_count}件のドキュメントを削除")
    return deleted_count

def main():
    """メイン処理"""
    print("=" * 60)
    print("🗑️  GYM MATCH Manager - デモデータ削除")
    print("=" * 60)
    print(f"📍 ジムID: {GYM_ID}")
    print()
    
    # 確認プロンプト
    response = input("⚠️  本当に削除しますか？ (yes/no): ")
    if response.lower() != 'yes':
        print("❌ キャンセルされました")
        sys.exit(0)
    
    try:
        # 1. ワークアウトログ削除
        deleted_logs = delete_collection('workoutLogs', 'gymId')
        
        # 2. セッション削除
        deleted_sessions = delete_collection('sessions', 'gymId')
        
        # 3. 会員削除
        deleted_users = delete_collection('users', 'gymId')
        
        print("\n" + "=" * 60)
        print("✅ デモデータ削除完了！")
        print("=" * 60)
        print(f"👥 会員: {deleted_users}名")
        print(f"📅 セッション: {deleted_sessions}件")
        print(f"🏋️ ワークアウトログ: {deleted_logs}件")
        print()
        print("🔗 Manager画面を更新して確認してください")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
