#!/usr/bin/env python3
"""
Firebase Authentication テストユーザー作成スクリプト

このスクリプトは以下を実行します:
1. Firebase Authenticationにテストユーザーを作成
2. Custom Claimsを設定（gymId, gymName, role）
3. 作成したユーザー情報を表示
"""

import firebase_admin
from firebase_admin import credentials, auth
import sys

def create_test_user():
    """テストユーザーを作成"""
    
    print("🔥 Firebase Admin SDK初期化中...")
    
    try:
        # Firebase Admin SDK初期化
        cred = credentials.Certificate('/opt/flutter/firebase-admin-sdk.json')
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK初期化成功")
    except Exception as e:
        print(f"❌ Firebase Admin SDK初期化エラー: {e}")
        sys.exit(1)
    
    # テストユーザー情報
    test_users = [
        {
            'email': 'owner@gymmatch.com',
            'password': 'GymMatch2024!',
            'display_name': 'オーナー太郎',
            'custom_claims': {
                'gymId': 'gym_demo_001',
                'gymName': 'GYM MATCH デモジム',
                'role': 'owner'
            }
        },
        {
            'email': 'manager@gymmatch.com',
            'password': 'GymMatch2024!',
            'display_name': 'マネージャー花子',
            'custom_claims': {
                'gymId': 'gym_demo_001',
                'gymName': 'GYM MATCH デモジム',
                'role': 'manager'
            }
        },
        {
            'email': 'test@gymmatch.com',
            'password': 'GymMatch2024!',
            'display_name': 'テストユーザー',
            'custom_claims': {
                'gymId': 'gym_demo_001',
                'gymName': 'GYM MATCH デモジム',
                'role': 'staff'
            }
        }
    ]
    
    print("\n👤 テストユーザー作成開始...\n")
    
    created_users = []
    
    for user_data in test_users:
        try:
            # ユーザー作成
            user = auth.create_user(
                email=user_data['email'],
                password=user_data['password'],
                display_name=user_data['display_name'],
                email_verified=True  # メール認証済みとして作成
            )
            
            print(f"✅ ユーザー作成成功: {user_data['email']}")
            print(f"   UID: {user.uid}")
            print(f"   表示名: {user_data['display_name']}")
            
            # Custom Claims設定
            auth.set_custom_user_claims(user.uid, user_data['custom_claims'])
            print(f"   Custom Claims設定完了:")
            print(f"     - gymId: {user_data['custom_claims']['gymId']}")
            print(f"     - gymName: {user_data['custom_claims']['gymName']}")
            print(f"     - role: {user_data['custom_claims']['role']}")
            print()
            
            created_users.append({
                'uid': user.uid,
                'email': user_data['email'],
                'password': user_data['password'],
                'display_name': user_data['display_name'],
                'custom_claims': user_data['custom_claims']
            })
            
        except auth.EmailAlreadyExistsError:
            print(f"⚠️  ユーザーは既に存在します: {user_data['email']}")
            print(f"   既存ユーザーのCustom Claimsを更新します...")
            
            try:
                # 既存ユーザーを取得
                existing_user = auth.get_user_by_email(user_data['email'])
                
                # Custom Claimsを更新
                auth.set_custom_user_claims(existing_user.uid, user_data['custom_claims'])
                print(f"   ✅ Custom Claims更新完了: {user_data['email']}")
                print()
                
                created_users.append({
                    'uid': existing_user.uid,
                    'email': user_data['email'],
                    'password': user_data['password'],
                    'display_name': existing_user.display_name,
                    'custom_claims': user_data['custom_claims']
                })
            except Exception as e:
                print(f"   ❌ エラー: {e}")
                print()
                
        except Exception as e:
            print(f"❌ ユーザー作成エラー: {user_data['email']}")
            print(f"   エラー詳細: {e}")
            print()
    
    # 作成結果サマリー
    print("=" * 60)
    print("🎉 テストユーザー作成完了！")
    print("=" * 60)
    print()
    print("📋 ログイン情報:")
    print()
    
    for user in created_users:
        print(f"👤 {user['display_name']}")
        print(f"   Email: {user['email']}")
        print(f"   Password: {user['password']}")
        print(f"   Role: {user['custom_claims']['role']}")
        print(f"   Gym: {user['custom_claims']['gymName']}")
        print()
    
    print("=" * 60)
    print("🚀 次のステップ:")
    print("=" * 60)
    print("1. GYM MATCH Managerログイン画面にアクセス")
    print("2. 「メールログイン」タブを選択")
    print("3. 上記のEmailとPasswordでログイン")
    print("4. 会員管理画面が表示されることを確認")
    print()
    print("📝 注意:")
    print("- 初回ログイン時、Custom Claimsの反映に数秒かかる場合があります")
    print("- ログイン後、ブラウザをリロードしてCustom Claimsを確認できます")
    print()

if __name__ == '__main__':
    create_test_user()
