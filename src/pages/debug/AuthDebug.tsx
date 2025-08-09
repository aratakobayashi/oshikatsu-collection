import React from 'react'
import { useAuth } from '../../components/AuthProvider'

export default function AuthDebug() {
  const { user, loading } = useAuth()
  
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">認証デバッグ情報</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">認証状態</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Loading: </span>
              <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
                {loading ? 'true' : 'false'}
              </span>
            </div>
            
            <div>
              <span className="font-medium">User: </span>
              <span className={user ? 'text-green-600' : 'text-red-600'}>
                {user ? 'Logged in' : 'Not logged in'}
              </span>
            </div>
            
            {user && (
              <>
                <div>
                  <span className="font-medium">Email: </span>
                  <span className="text-blue-600">{user.email}</span>
                </div>
                
                <div>
                  <span className="font-medium">User ID: </span>
                  <span className="text-gray-600 text-sm">{user.id}</span>
                </div>
                
                <div>
                  <span className="font-medium">Created At: </span>
                  <span className="text-gray-600">
                    {new Date(user.created_at).toLocaleString('ja-JP')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">環境変数</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">VITE_ADMIN_EMAIL: </span>
              <span className="text-blue-600">{import.meta.env.VITE_ADMIN_EMAIL}</span>
            </div>
            
            <div>
              <span className="font-medium">VITE_SUPABASE_URL: </span>
              <span className="text-blue-600 text-sm">{import.meta.env.VITE_SUPABASE_URL}</span>
            </div>
            
            <div>
              <span className="font-medium">VITE_ENVIRONMENT: </span>
              <span className="text-green-600">{import.meta.env.VITE_ENVIRONMENT}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">管理画面アクセス確認</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">管理者権限: </span>
              <span className={user?.email === import.meta.env.VITE_ADMIN_EMAIL ? 'text-green-600' : 'text-red-600'}>
                {user?.email === import.meta.env.VITE_ADMIN_EMAIL ? 'あり' : 'なし'}
              </span>
            </div>
            
            {user && user.email !== import.meta.env.VITE_ADMIN_EMAIL && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-yellow-800">
                  現在のユーザー ({user.email}) は管理者権限がありません。
                  管理画面にアクセスするには admin@test.com でログインしてください。
                </p>
              </div>
            )}
            
            <div className="pt-4">
              <a 
                href="/admin" 
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                管理画面へアクセス
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}